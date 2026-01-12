-- ============================================================================
-- CRITICAL SCHEMA FIX: DECIMAL to BIGINT Migration
-- ============================================================================
-- 
-- PROBLEM: Price columns were defined as DECIMAL(12,2) expecting values like
-- 1336.99, but all application logic treats prices as INTEGER centavos like
-- 133699. This caused "numeric field overflow" errors.
--
-- SOLUTION: Change all price columns to BIGINT to store centavos as integers.
--
-- IMPACT: This is a breaking change. All existing price data will be 
-- multiplied by 100 to convert from pesos to centavos.
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Backup existing data (optional but recommended)
-- ============================================================================
-- CREATE TABLE bids_backup AS SELECT * FROM bids;
-- CREATE TABLE asks_backup AS SELECT * FROM asks;
-- CREATE TABLE transactions_backup AS SELECT * FROM transactions;

-- ============================================================================
-- STEP 2: Update BIDS table
-- ============================================================================

-- Convert existing data from pesos to centavos (multiply by 100)
UPDATE bids SET 
  price_ars = price_ars * 100,
  price_usd = price_usd * 100
WHERE price_ars < 1000000; -- Only convert if not already in centavos

-- Change column types
ALTER TABLE bids 
  ALTER COLUMN price_ars TYPE BIGINT,
  ALTER COLUMN price_usd TYPE BIGINT,
  ALTER COLUMN usd_ars_rate TYPE DECIMAL(10, 4);

COMMENT ON COLUMN bids.price_ars IS 'Price in centavos (e.g., 10000000 = 100,000.00 ARS)';
COMMENT ON COLUMN bids.price_usd IS 'USD equivalent in cents';
COMMENT ON COLUMN bids.usd_ars_rate IS 'Exchange rate used (e.g., 1350.5000 ARS/USD)';

-- ============================================================================
-- STEP 3: Update ASKS table
-- ============================================================================

-- Convert existing data from pesos to centavos
UPDATE asks SET 
  price_ars = price_ars * 100,
  price_usd = price_usd * 100
WHERE price_ars < 1000000;

-- Change column types
ALTER TABLE asks 
  ALTER COLUMN price_ars TYPE BIGINT,
  ALTER COLUMN price_usd TYPE BIGINT,
  ALTER COLUMN usd_ars_rate TYPE DECIMAL(10, 4);

COMMENT ON COLUMN asks.price_ars IS 'Price in centavos (e.g., 10000000 = 100,000.00 ARS)';
COMMENT ON COLUMN asks.price_usd IS 'USD equivalent in cents';
COMMENT ON COLUMN asks.usd_ars_rate IS 'Exchange rate used (e.g., 1350.5000 ARS/USD)';

-- ============================================================================
-- STEP 4: Update TRANSACTIONS table
-- ============================================================================

-- Convert existing data from pesos to centavos
UPDATE transactions SET 
  sale_price_ars = sale_price_ars * 100,
  sale_price_usd = sale_price_usd * 100,
  platform_fee_ars = platform_fee_ars * 100,
  authentication_fee_ars = authentication_fee_ars * 100,
  shipping_fee_ars = shipping_fee_ars * 100,
  total_buyer_payment_ars = total_buyer_payment_ars * 100,
  seller_payout_ars = seller_payout_ars * 100
WHERE sale_price_ars < 1000000;

-- Change column types
ALTER TABLE transactions 
  ALTER COLUMN sale_price_ars TYPE BIGINT,
  ALTER COLUMN sale_price_usd TYPE BIGINT,
  ALTER COLUMN usd_ars_rate TYPE DECIMAL(10, 4),
  ALTER COLUMN platform_fee_ars TYPE BIGINT,
  ALTER COLUMN authentication_fee_ars TYPE BIGINT,
  ALTER COLUMN shipping_fee_ars TYPE BIGINT,
  ALTER COLUMN total_buyer_payment_ars TYPE BIGINT,
  ALTER COLUMN seller_payout_ars TYPE BIGINT;

COMMENT ON COLUMN transactions.sale_price_ars IS 'Sale price in centavos';
COMMENT ON COLUMN transactions.sale_price_usd IS 'USD equivalent in cents';

-- ============================================================================
-- STEP 5: Update PAYOUTS table
-- ============================================================================

-- Convert existing data from pesos to centavos
UPDATE payouts SET 
  amount_ars = amount_ars * 100
WHERE amount_ars < 1000000;

-- Change column types
ALTER TABLE payouts 
  ALTER COLUMN amount_ars TYPE BIGINT;

COMMENT ON COLUMN payouts.amount_ars IS 'Payout amount in centavos';

-- ============================================================================
-- STEP 6: Update PRICE_HISTORY table
-- ============================================================================

-- Convert existing data from pesos to centavos
UPDATE price_history SET 
  price_ars = price_ars * 100,
  price_usd = price_usd * 100
WHERE price_ars < 1000000;

-- Change column types
ALTER TABLE price_history 
  ALTER COLUMN price_ars TYPE BIGINT,
  ALTER COLUMN price_usd TYPE BIGINT;

COMMENT ON COLUMN price_history.price_ars IS 'Historical price in centavos';
COMMENT ON COLUMN price_history.price_usd IS 'Historical USD price in cents';

-- ============================================================================
-- STEP 7: Update MARKET_STATS table
-- ============================================================================

-- Convert existing data from pesos to centavos
UPDATE market_stats SET 
  lowest_ask_ars = lowest_ask_ars * 100,
  highest_bid_ars = highest_bid_ars * 100,
  last_sale_price_ars = last_sale_price_ars * 100,
  avg_sale_price_ars = avg_sale_price_ars * 100
WHERE lowest_ask_ars IS NOT NULL AND lowest_ask_ars < 1000000;

-- Change column types
ALTER TABLE market_stats 
  ALTER COLUMN lowest_ask_ars TYPE BIGINT,
  ALTER COLUMN highest_bid_ars TYPE BIGINT,
  ALTER COLUMN last_sale_price_ars TYPE BIGINT,
  ALTER COLUMN avg_sale_price_ars TYPE BIGINT;

COMMENT ON COLUMN market_stats.lowest_ask_ars IS 'Lowest ask price in centavos';
COMMENT ON COLUMN market_stats.highest_bid_ars IS 'Highest bid price in centavos';
COMMENT ON COLUMN market_stats.last_sale_price_ars IS 'Last sale price in centavos';
COMMENT ON COLUMN market_stats.avg_sale_price_ars IS 'Average sale price in centavos';

-- ============================================================================
-- STEP 8: Update EXCHANGE_RATES table
-- ============================================================================

-- Exchange rates should use more precision (4 decimals instead of 2)
ALTER TABLE exchange_rates 
  ALTER COLUMN usd_to_ars TYPE DECIMAL(10, 4);

COMMENT ON COLUMN exchange_rates.usd_to_ars IS 'Exchange rate with 4 decimal precision (e.g., 1350.5000)';

-- ============================================================================
-- STEP 9: Recreate functions with correct types
-- ============================================================================

-- Drop and recreate find_matching_ask
DROP FUNCTION IF EXISTS find_matching_ask(UUID, DECIMAL);
CREATE OR REPLACE FUNCTION find_matching_ask(p_variant_id UUID, p_bid_price BIGINT)
RETURNS UUID AS $$
DECLARE
  v_ask_id UUID;
BEGIN
  SELECT id INTO v_ask_id
  FROM asks
  WHERE variant_id = p_variant_id
    AND status = 'active'
    AND price_ars <= p_bid_price
    AND expires_at > NOW()
  ORDER BY price_ars ASC, created_at ASC
  LIMIT 1;
  
  RETURN v_ask_id;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate find_matching_bid
DROP FUNCTION IF EXISTS find_matching_bid(UUID, DECIMAL);
CREATE OR REPLACE FUNCTION find_matching_bid(p_variant_id UUID, p_ask_price BIGINT)
RETURNS UUID AS $$
DECLARE
  v_bid_id UUID;
BEGIN
  SELECT id INTO v_bid_id
  FROM bids
  WHERE variant_id = p_variant_id
    AND status = 'active'
    AND price_ars >= p_ask_price
    AND expires_at > NOW()
  ORDER BY price_ars DESC, created_at ASC
  LIMIT 1;
  
  RETURN v_bid_id;
END;
$$ LANGUAGE plpgsql;

-- Recreate update_market_stats with BIGINT
DROP FUNCTION IF EXISTS update_market_stats(UUID);
CREATE OR REPLACE FUNCTION update_market_stats(p_variant_id UUID)
RETURNS VOID AS $$
DECLARE
  v_lowest_ask BIGINT;
  v_lowest_ask_id UUID;
  v_highest_bid BIGINT;
  v_highest_bid_id UUID;
  v_last_sale_price BIGINT;
  v_last_sale_at TIMESTAMP;
  v_total_asks INTEGER;
  v_total_bids INTEGER;
  v_total_sales INTEGER;
  v_avg_sale_price BIGINT;
BEGIN
  -- Get lowest ask
  SELECT price_ars, id INTO v_lowest_ask, v_lowest_ask_id
  FROM asks
  WHERE variant_id = p_variant_id AND status = 'active' AND expires_at > NOW()
  ORDER BY price_ars ASC
  LIMIT 1;
  
  -- Get highest bid
  SELECT price_ars, id INTO v_highest_bid, v_highest_bid_id
  FROM bids
  WHERE variant_id = p_variant_id AND status = 'active' AND expires_at > NOW()
  ORDER BY price_ars DESC
  LIMIT 1;
  
  -- Get last sale
  SELECT sale_price_ars, completed_at INTO v_last_sale_price, v_last_sale_at
  FROM transactions
  WHERE variant_id = p_variant_id AND status = 'completed'
  ORDER BY completed_at DESC
  LIMIT 1;
  
  -- Get counts
  SELECT COUNT(*) INTO v_total_asks FROM asks WHERE variant_id = p_variant_id AND status = 'active';
  SELECT COUNT(*) INTO v_total_bids FROM bids WHERE variant_id = p_variant_id AND status = 'active';
  SELECT COUNT(*) INTO v_total_sales FROM transactions WHERE variant_id = p_variant_id AND status = 'completed';
  
  -- Get average sale price
  SELECT AVG(sale_price_ars)::BIGINT INTO v_avg_sale_price
  FROM transactions
  WHERE variant_id = p_variant_id AND status = 'completed';
  
  -- Upsert market stats
  INSERT INTO market_stats (
    variant_id, lowest_ask_ars, lowest_ask_id, highest_bid_ars, highest_bid_id,
    last_sale_price_ars, last_sale_at, total_asks, total_bids, total_sales, avg_sale_price_ars
  ) VALUES (
    p_variant_id, v_lowest_ask, v_lowest_ask_id, v_highest_bid, v_highest_bid_id,
    v_last_sale_price, v_last_sale_at, v_total_asks, v_total_bids, v_total_sales, v_avg_sale_price
  )
  ON CONFLICT (variant_id) DO UPDATE SET
    lowest_ask_ars = EXCLUDED.lowest_ask_ars,
    lowest_ask_id = EXCLUDED.lowest_ask_id,
    highest_bid_ars = EXCLUDED.highest_bid_ars,
    highest_bid_id = EXCLUDED.highest_bid_id,
    last_sale_price_ars = EXCLUDED.last_sale_price_ars,
    last_sale_at = EXCLUDED.last_sale_at,
    total_asks = EXCLUDED.total_asks,
    total_bids = EXCLUDED.total_bids,
    total_sales = EXCLUDED.total_sales,
    avg_sale_price_ars = EXCLUDED.avg_sale_price_ars,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 10: Recreate triggers with correct types
-- ============================================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_match_bid ON bids;
DROP TRIGGER IF EXISTS trigger_match_ask ON asks;
DROP FUNCTION IF EXISTS attempt_match_bid();
DROP FUNCTION IF EXISTS attempt_match_ask();

-- Recreate with BIGINT types (from schema-triggers.sql)
-- Note: Run the full schema-triggers.sql file after this migration

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check column types
SELECT 
  table_name,
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%price%'
  OR column_name LIKE '%fee%'
  OR column_name LIKE '%amount%'
ORDER BY table_name, column_name;

-- Check sample data (should be in centavos now)
SELECT 'bids' as table_name, MIN(price_ars) as min_price, MAX(price_ars) as max_price FROM bids
UNION ALL
SELECT 'asks', MIN(price_ars), MAX(price_ars) FROM asks
UNION ALL
SELECT 'transactions', MIN(sale_price_ars), MAX(sale_price_ars) FROM transactions;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
/*
ROLLBACK;

-- Restore from backup
DROP TABLE IF EXISTS bids;
DROP TABLE IF EXISTS asks;
DROP TABLE IF EXISTS transactions;
ALTER TABLE bids_backup RENAME TO bids;
ALTER TABLE asks_backup RENAME TO asks;
ALTER TABLE transactions_backup RENAME TO transactions;
*/
