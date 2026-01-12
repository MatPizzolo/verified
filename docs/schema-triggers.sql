-- ============================================================================
-- MATCHING ENGINE TRIGGERS
-- ============================================================================
-- 
-- This file contains PostgreSQL trigger functions for automatic bid/ask matching.
-- These triggers fire when new bids or asks are inserted and automatically
-- create transactions when prices cross.
--
-- IMPORTANT: Run this AFTER schema.sql is deployed to Supabase
--
-- Features:
-- - Automatic matching when bid price >= ask price
-- - Idempotency: prevents double-matching
-- - Transaction creation with proper foreign keys
-- - Status updates for matched bids/asks
-- - Market stats update after match
--
-- ============================================================================

-- ============================================================================
-- TRIGGER FUNCTION: Match Bid with Ask
-- ============================================================================
-- Fires when a new bid is inserted
-- Finds the lowest matching ask and creates a transaction

CREATE OR REPLACE FUNCTION attempt_match_bid()
RETURNS TRIGGER AS $$
DECLARE
  v_matching_ask_id UUID;
  v_ask_price_ars BIGINT;
  v_ask_price_usd BIGINT;
  v_ask_usd_ars_rate DECIMAL(10, 4);
  v_seller_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Only process active bids
  IF NEW.status != 'active' THEN
    RETURN NEW;
  END IF;

  -- Find the best matching ask (lowest price <= bid price)
  SELECT 
    id,
    price_ars,
    price_usd,
    usd_ars_rate,
    user_id
  INTO 
    v_matching_ask_id,
    v_ask_price_ars,
    v_ask_price_usd,
    v_ask_usd_ars_rate,
    v_seller_id
  FROM asks
  WHERE variant_id = NEW.variant_id
    AND status = 'active'
    AND price_ars <= NEW.price_ars  -- Ask price must be <= bid price
    AND expires_at > NOW()
    AND user_id != NEW.user_id  -- Can't match with yourself
    -- Idempotency: ensure not already matched
    AND NOT EXISTS (
      SELECT 1 FROM transactions
      WHERE ask_id = asks.id
    )
  ORDER BY price_ars ASC, created_at ASC  -- Lowest price first, then oldest
  LIMIT 1
  FOR UPDATE SKIP LOCKED;  -- Prevent race conditions

  -- If match found, create transaction
  IF v_matching_ask_id IS NOT NULL THEN
    
    -- Double-check bid hasn't been matched already (race condition protection)
    IF EXISTS (SELECT 1 FROM transactions WHERE bid_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    -- Create transaction record
    INSERT INTO transactions (
      variant_id,
      buyer_id,
      seller_id,
      bid_id,
      ask_id,
      sale_price_ars,
      sale_price_usd,
      usd_ars_rate,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.variant_id,
      NEW.user_id,  -- Buyer is the bid creator
      v_seller_id,  -- Seller is the ask creator
      NEW.id,
      v_matching_ask_id,
      v_ask_price_ars,  -- Matched price is the ask price (seller sets price)
      v_ask_price_usd,
      v_ask_usd_ars_rate,  -- Use ask's exchange rate
      'pending_payment',
      NOW(),
      NOW()
    )
    RETURNING id INTO v_transaction_id;

    -- Update bid status to filled
    UPDATE bids
    SET 
      status = 'filled',
      matched_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.id;

    -- Update ask status to filled
    UPDATE asks
    SET 
      status = 'filled',
      matched_at = NOW(),
      updated_at = NOW()
    WHERE id = v_matching_ask_id;

    -- Update market stats for this variant
    PERFORM update_market_stats(NEW.variant_id);

    -- Log match for debugging (optional)
    RAISE NOTICE 'Match created: Bid % matched with Ask % for variant % at % ARS',
      NEW.id, v_matching_ask_id, NEW.variant_id, v_ask_price_ars;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER FUNCTION: Match Ask with Bid
-- ============================================================================
-- Fires when a new ask is inserted
-- Finds the highest matching bid and creates a transaction

CREATE OR REPLACE FUNCTION attempt_match_ask()
RETURNS TRIGGER AS $$
DECLARE
  v_matching_bid_id UUID;
  v_bid_price_ars BIGINT;
  v_bid_price_usd BIGINT;
  v_bid_usd_ars_rate DECIMAL(10, 4);
  v_buyer_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Only process active asks
  IF NEW.status != 'active' THEN
    RETURN NEW;
  END IF;

  -- Find the best matching bid (highest price >= ask price)
  SELECT 
    id,
    price_ars,
    price_usd,
    usd_ars_rate,
    user_id
  INTO 
    v_matching_bid_id,
    v_bid_price_ars,
    v_bid_price_usd,
    v_bid_usd_ars_rate,
    v_buyer_id
  FROM bids
  WHERE variant_id = NEW.variant_id
    AND status = 'active'
    AND price_ars >= NEW.price_ars  -- Bid price must be >= ask price
    AND expires_at > NOW()
    AND user_id != NEW.user_id  -- Can't match with yourself
    -- Idempotency: ensure not already matched
    AND NOT EXISTS (
      SELECT 1 FROM transactions
      WHERE bid_id = bids.id
    )
  ORDER BY price_ars DESC, created_at ASC  -- Highest price first, then oldest
  LIMIT 1
  FOR UPDATE SKIP LOCKED;  -- Prevent race conditions

  -- If match found, create transaction
  IF v_matching_bid_id IS NOT NULL THEN
    
    -- Double-check ask hasn't been matched already (race condition protection)
    IF EXISTS (SELECT 1 FROM transactions WHERE ask_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    -- Create transaction record
    INSERT INTO transactions (
      variant_id,
      buyer_id,
      seller_id,
      bid_id,
      ask_id,
      sale_price_ars,
      sale_price_usd,
      usd_ars_rate,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.variant_id,
      v_buyer_id,  -- Buyer is the bid creator
      NEW.user_id,  -- Seller is the ask creator
      v_matching_bid_id,
      NEW.id,
      NEW.price_ars,  -- Matched price is the ask price (seller sets price)
      NEW.price_usd,
      NEW.usd_ars_rate,  -- Use ask's exchange rate
      'pending_payment',
      NOW(),
      NOW()
    )
    RETURNING id INTO v_transaction_id;

    -- Update bid status to filled
    UPDATE bids
    SET 
      status = 'filled',
      matched_at = NOW(),
      updated_at = NOW()
    WHERE id = v_matching_bid_id;

    -- Update ask status to filled
    UPDATE asks
    SET 
      status = 'filled',
      matched_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.id;

    -- Update market stats for this variant
    PERFORM update_market_stats(NEW.variant_id);

    -- Log match for debugging (optional)
    RAISE NOTICE 'Match created: Ask % matched with Bid % for variant % at % ARS',
      NEW.id, v_matching_bid_id, NEW.variant_id, NEW.price_ars;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Drop existing triggers if they exist (for re-running this script)
DROP TRIGGER IF EXISTS trigger_match_bid ON bids;
DROP TRIGGER IF EXISTS trigger_match_ask ON asks;

-- Trigger for bid matching
-- Fires AFTER INSERT to ensure bid is committed before matching
CREATE TRIGGER trigger_match_bid
  AFTER INSERT ON bids
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION attempt_match_bid();

-- Trigger for ask matching
-- Fires AFTER INSERT to ensure ask is committed before matching
CREATE TRIGGER trigger_match_ask
  AFTER INSERT ON asks
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION attempt_match_ask();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after deploying to verify triggers are active

-- Check if triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('trigger_match_bid', 'trigger_match_ask');

-- Check if functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('attempt_match_bid', 'attempt_match_ask');

-- ============================================================================
-- TESTING QUERIES
-- ============================================================================
-- Use these to manually test matching logic

-- Example: Create a test bid and ask that should match
/*
-- 1. Get a variant ID
SELECT id, product_id, size_eu FROM variants LIMIT 1;

-- 2. Create an ask (seller wants 100,000 ARS)
INSERT INTO asks (variant_id, user_id, price_ars, price_usd, usd_ars_rate, status, expires_at)
VALUES (
  'YOUR_VARIANT_ID',
  'YOUR_SELLER_USER_ID',
  10000000,  -- 100,000.00 ARS (stored as centavos)
  7407,      -- ~$74.07 USD (at 1350.50 rate)
  13505000,  -- 1350.50 rate * 10000
  'active',
  NOW() + INTERVAL '30 days'
);

-- 3. Create a bid (buyer willing to pay 105,000 ARS)
INSERT INTO bids (variant_id, user_id, price_ars, price_usd, usd_ars_rate, status, expires_at)
VALUES (
  'YOUR_VARIANT_ID',
  'YOUR_BUYER_USER_ID',
  10500000,  -- 105,000.00 ARS (stored as centavos)
  7777,      -- ~$77.77 USD (at 1350.50 rate)
  13505000,  -- 1350.50 rate * 10000
  'active',
  NOW() + INTERVAL '30 days'
);

-- 4. Check if transaction was created
SELECT * FROM transactions
WHERE variant_id = 'YOUR_VARIANT_ID'
ORDER BY created_at DESC
LIMIT 1;

-- 5. Check if bid and ask were marked as filled
SELECT id, status, matched_at FROM bids WHERE variant_id = 'YOUR_VARIANT_ID';
SELECT id, status, matched_at FROM asks WHERE variant_id = 'YOUR_VARIANT_ID';
*/

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- Uncomment to remove triggers and functions

/*
DROP TRIGGER IF EXISTS trigger_match_bid ON bids;
DROP TRIGGER IF EXISTS trigger_match_ask ON asks;
DROP FUNCTION IF EXISTS attempt_match_bid();
DROP FUNCTION IF EXISTS attempt_match_ask();
*/

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Idempotency Guarantees:
-- 1. FOR UPDATE SKIP LOCKED prevents concurrent transactions from matching same bid/ask
-- 2. NOT EXISTS check ensures bid/ask hasn't been matched already
-- 3. Double-check before INSERT prevents race conditions
--
-- Price Logic:
-- - Matched price is ALWAYS the ask price (seller sets the price)
-- - Bid price must be >= ask price for match to occur
-- - Exchange rate from ask is used for transaction
--
-- Status Flow:
-- - Bid/Ask: active → filled (when matched)
-- - Transaction: pending_payment → authenticating → completed
--
-- Performance:
-- - Indexes on (variant_id, status, price_ars, created_at) are critical
-- - FOR UPDATE SKIP LOCKED prevents lock contention
-- - LIMIT 1 ensures only one match per trigger execution
--
-- Testing:
-- - Always test with different users (can't match with yourself)
-- - Test expired bids/asks (should not match)
-- - Test concurrent inserts (idempotency)
-- - Test price boundaries (bid = ask, bid > ask, bid < ask)
--
-- ============================================================================
