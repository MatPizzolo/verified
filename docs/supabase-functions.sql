-- ============================================================================
-- CONSOLIDATED SUPABASE FUNCTIONS
-- ============================================================================
-- Purpose: Eliminate duplicate logic from backend routes
-- Move all bid/ask creation logic to database layer
-- ============================================================================

-- ============================================================================
-- FUNCTION: create_bid_or_ask
-- ============================================================================
-- Single function to handle both bid and ask creation
-- Consolidates all validation, price conversion, and insertion logic

CREATE OR REPLACE FUNCTION create_bid_or_ask(
  p_listing_type TEXT,  -- 'bid' or 'ask'
  p_variant_id UUID,
  p_user_id UUID,
  p_price_ars INTEGER,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_variant_exists BOOLEAN;
  v_exchange_rate DECIMAL;
  v_price_usd INTEGER;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_result JSON;
BEGIN
  -- Validate listing type
  IF p_listing_type NOT IN ('bid', 'ask') THEN
    RAISE EXCEPTION 'Invalid listing type. Must be "bid" or "ask"'
      USING ERRCODE = 'P0001';
  END IF;

  -- Validate price is positive integer
  IF p_price_ars IS NULL OR p_price_ars <= 0 THEN
    RAISE EXCEPTION 'Price must be a positive integer (centavos)'
      USING ERRCODE = '23514';
  END IF;

  -- Validate variant exists and is active
  SELECT EXISTS(
    SELECT 1 FROM variants 
    WHERE id = p_variant_id AND active = true
  ) INTO v_variant_exists;
  
  IF NOT v_variant_exists THEN
    RAISE EXCEPTION 'Variant not found or inactive'
      USING ERRCODE = 'P0002';
  END IF;
  
  -- Get latest exchange rate (blue rate for market pricing)
  SELECT usd_to_ars INTO v_exchange_rate
  FROM exchange_rates
  WHERE rate_type = 'blue'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Default to 1350.00 if no rate found
  IF v_exchange_rate IS NULL THEN
    v_exchange_rate := 1350.00;
  END IF;
  
  -- Convert ARS centavos to USD cents using integer math
  -- Formula: (arsCentavos * 10000) / (rate * 10000)
  v_price_usd := ROUND((p_price_ars * 10000.0) / (v_exchange_rate * 10000));
  
  -- Set expiration (default 30 days from now)
  v_expires_at := COALESCE(p_expires_at, NOW() + INTERVAL '30 days');
  
  -- Insert based on type
  IF p_listing_type = 'bid' THEN
    INSERT INTO bids (
      variant_id, 
      user_id, 
      price_ars, 
      price_usd, 
      usd_ars_rate, 
      expires_at, 
      status,
      created_at,
      updated_at
    ) VALUES (
      p_variant_id, 
      p_user_id, 
      p_price_ars, 
      v_price_usd,
      v_exchange_rate, 
      v_expires_at, 
      'active',
      NOW(),
      NOW()
    )
    RETURNING json_build_object(
      'id', id,
      'variant_id', variant_id,
      'user_id', user_id,
      'price_ars', price_ars,
      'price_usd', price_usd,
      'usd_ars_rate', usd_ars_rate,
      'status', status,
      'expires_at', expires_at,
      'created_at', created_at
    ) INTO v_result;
  ELSE
    INSERT INTO asks (
      variant_id, 
      user_id, 
      price_ars, 
      price_usd, 
      usd_ars_rate, 
      expires_at, 
      status,
      created_at,
      updated_at
    ) VALUES (
      p_variant_id, 
      p_user_id, 
      p_price_ars, 
      v_price_usd,
      v_exchange_rate, 
      v_expires_at, 
      'active',
      NOW(),
      NOW()
    )
    RETURNING json_build_object(
      'id', id,
      'variant_id', variant_id,
      'user_id', user_id,
      'price_ars', price_ars,
      'price_usd', price_usd,
      'usd_ars_rate', usd_ars_rate,
      'status', status,
      'expires_at', expires_at,
      'created_at', created_at
    ) INTO v_result;
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_bid_or_ask TO authenticated;

-- ============================================================================
-- TRIGGER: validate_listing_price
-- ============================================================================
-- Ensures all prices are positive integers (no decimals, no negatives)

CREATE OR REPLACE FUNCTION validate_listing_price()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure price is positive
  IF NEW.price_ars <= 0 THEN
    RAISE EXCEPTION 'Price must be greater than 0'
      USING ERRCODE = '23514';
  END IF;
  
  -- Ensure price is integer (no decimals)
  -- PostgreSQL DECIMAL can have decimals, so we check
  IF NEW.price_ars != FLOOR(NEW.price_ars) THEN
    RAISE EXCEPTION 'Price must be an integer (centavos)'
      USING ERRCODE = '23514';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to bids table
DROP TRIGGER IF EXISTS validate_bid_price ON bids;
CREATE TRIGGER validate_bid_price
  BEFORE INSERT OR UPDATE ON bids
  FOR EACH ROW
  EXECUTE FUNCTION validate_listing_price();

-- Apply trigger to asks table
DROP TRIGGER IF EXISTS validate_ask_price ON asks;
CREATE TRIGGER validate_ask_price
  BEFORE INSERT OR UPDATE ON asks
  FOR EACH ROW
  EXECUTE FUNCTION validate_listing_price();

-- ============================================================================
-- FUNCTION: cancel_listing
-- ============================================================================
-- Unified function to cancel bids or asks

CREATE OR REPLACE FUNCTION cancel_listing(
  p_listing_type TEXT,  -- 'bid' or 'ask'
  p_listing_id UUID,
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_listing_user_id UUID;
  v_listing_status TEXT;
  v_result JSON;
BEGIN
  -- Validate listing type
  IF p_listing_type NOT IN ('bid', 'ask') THEN
    RAISE EXCEPTION 'Invalid listing type. Must be "bid" or "ask"'
      USING ERRCODE = 'P0001';
  END IF;

  -- Get listing details and verify ownership
  IF p_listing_type = 'bid' THEN
    SELECT user_id, status INTO v_listing_user_id, v_listing_status
    FROM bids
    WHERE id = p_listing_id;
  ELSE
    SELECT user_id, status INTO v_listing_user_id, v_listing_status
    FROM asks
    WHERE id = p_listing_id;
  END IF;

  -- Check if listing exists
  IF v_listing_user_id IS NULL THEN
    RAISE EXCEPTION 'Listing not found'
      USING ERRCODE = 'P0002';
  END IF;

  -- Check ownership
  IF v_listing_user_id != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only cancel your own listings'
      USING ERRCODE = '42501';
  END IF;

  -- Check if listing can be cancelled
  IF v_listing_status != 'active' THEN
    RAISE EXCEPTION 'Listing cannot be cancelled. Current status: %', v_listing_status
      USING ERRCODE = 'P0003';
  END IF;

  -- Cancel the listing
  IF p_listing_type = 'bid' THEN
    UPDATE bids
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = p_listing_id
    RETURNING json_build_object(
      'id', id,
      'status', status,
      'updated_at', updated_at
    ) INTO v_result;
  ELSE
    UPDATE asks
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = p_listing_id
    RETURNING json_build_object(
      'id', id,
      'status', status,
      'updated_at', updated_at
    ) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cancel_listing TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if functions exist
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('create_bid_or_ask', 'validate_listing_price', 'cancel_listing');

-- Check if triggers exist
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('validate_bid_price', 'validate_ask_price');

-- ============================================================================
-- TESTING QUERIES
-- ============================================================================

-- Test create_bid_or_ask (replace with actual IDs)
/*
-- Create a bid
SELECT create_bid_or_ask(
  'bid',
  'YOUR_VARIANT_ID'::UUID,
  'YOUR_USER_ID'::UUID,
  10000000,  -- 100,000.00 ARS
  NULL
);

-- Create an ask
SELECT create_bid_or_ask(
  'ask',
  'YOUR_VARIANT_ID'::UUID,
  'YOUR_USER_ID'::UUID,
  9500000,  -- 95,000.00 ARS
  NULL
);

-- Test invalid price (should fail)
SELECT create_bid_or_ask(
  'bid',
  'YOUR_VARIANT_ID'::UUID,
  'YOUR_USER_ID'::UUID,
  -1000,  -- Invalid: negative
  NULL
);

-- Test cancel_listing
SELECT cancel_listing(
  'bid',
  'YOUR_BID_ID'::UUID,
  'YOUR_USER_ID'::UUID
);
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
/*
DROP FUNCTION IF EXISTS create_bid_or_ask;
DROP FUNCTION IF EXISTS cancel_listing;
DROP TRIGGER IF EXISTS validate_bid_price ON bids;
DROP TRIGGER IF EXISTS validate_ask_price ON asks;
DROP FUNCTION IF EXISTS validate_listing_price;
*/
