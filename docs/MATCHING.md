# Bid/Ask Matching Engine

## Overview

The Verified AR marketplace uses an **automatic matching engine** that executes trades when bid and ask prices cross. This document explains how the matching logic works, how to deploy it, and how to test it.

---

## How Matching Works

### **Basic Concept**

- **Bid** = Buy order (user wants to buy at X price or higher)
- **Ask** = Sell order (user wants to sell at X price or lower)
- **Match** occurs when: `bid_price >= ask_price`

### **Price Priority**

When multiple matches are possible:

1. **For Bids**: Match with the **lowest ask** first (best deal for buyer)
2. **For Asks**: Match with the **highest bid** first (best deal for seller)

### **Time Priority**

When prices are equal:

1. Match with the **oldest** listing first (FIFO - First In, First Out)

### **Matched Price**

- The **ask price** is always used as the matched price
- This means the **seller sets the final price**
- Example: Bid at 105k ARS matches Ask at 100k ARS → Transaction at 100k ARS

---

## Architecture

### **Components**

1. **PostgreSQL Trigger Functions** (`schema-triggers.sql`)
   - `attempt_match_bid()` - Fires when new bid inserted
   - `attempt_match_ask()` - Fires when new ask inserted

2. **Helper Functions** (`schema.sql`)
   - `find_matching_ask()` - Finds best ask for a bid
   - `find_matching_bid()` - Finds best bid for an ask
   - `update_market_stats()` - Updates lowest ask, highest bid

3. **TypeScript Matching Engine** (`backend/src/lib/market-engine.ts`)
   - Used for unit testing and validation
   - Not used in production (triggers handle matching)

### **Flow Diagram**

```
User places Bid
    ↓
Bid inserted into database
    ↓
trigger_match_bid fires
    ↓
attempt_match_bid() function executes
    ↓
Finds matching Ask (if any)
    ↓
Creates Transaction record
    ↓
Updates Bid status to 'filled'
    ↓
Updates Ask status to 'filled'
    ↓
Updates market_stats table
    ↓
Returns success
```

---

## Deployment

### **Prerequisites**

1. ✅ `schema.sql` deployed to Supabase
2. ✅ Tables created: `bids`, `asks`, `transactions`, `market_stats`
3. ✅ Helper functions exist: `find_matching_ask()`, `find_matching_bid()`, `update_market_stats()`

### **Step 1: Deploy Triggers**

```bash
# 1. Open Supabase SQL Editor
# 2. Copy contents of docs/schema-triggers.sql
# 3. Run the script
# 4. Verify triggers created (see verification queries at bottom)
```

### **Step 2: Verify Deployment**

Run these queries in Supabase SQL Editor:

```sql
-- Check if triggers exist
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('trigger_match_bid', 'trigger_match_ask');

-- Expected output:
-- trigger_match_bid | bids | EXECUTE FUNCTION attempt_match_bid()
-- trigger_match_ask | asks | EXECUTE FUNCTION attempt_match_ask()
```

### **Step 3: Test Matching**

See [Testing](#testing) section below.

---

## Idempotency Guarantees

The matching engine prevents double-matching through multiple mechanisms:

### **1. Database Locks**

```sql
FOR UPDATE SKIP LOCKED
```

- Locks the selected bid/ask row
- Other concurrent transactions skip locked rows
- Prevents two transactions from matching the same bid/ask

### **2. Existence Checks**

```sql
AND NOT EXISTS (
  SELECT 1 FROM transactions
  WHERE bid_id = bids.id
)
```

- Checks if bid/ask already has a transaction
- Prevents matching already-matched listings

### **3. Double-Check Before Insert**

```sql
IF EXISTS (SELECT 1 FROM transactions WHERE bid_id = NEW.id) THEN
  RETURN NEW;
END IF;
```

- Final check before creating transaction
- Handles race conditions where check and insert are separate

### **4. Unique Constraints**

```sql
-- In schema.sql
CREATE UNIQUE INDEX idx_transactions_bid_id ON transactions(bid_id) WHERE bid_id IS NOT NULL;
CREATE UNIQUE INDEX idx_transactions_ask_id ON transactions(ask_id) WHERE ask_id IS NOT NULL;
```

- Database-level guarantee
- Prevents duplicate transactions even if all checks fail

---

## Testing

### **Manual Test (Supabase SQL Editor)**

```sql
-- 1. Get a variant and two users
SELECT id FROM variants LIMIT 1;  -- Copy variant_id
SELECT id FROM users LIMIT 2;     -- Copy buyer_id and seller_id

-- 2. Create an ask (seller wants 100,000 ARS)
INSERT INTO asks (variant_id, user_id, price_ars, price_usd, usd_ars_rate, status, expires_at)
VALUES (
  'VARIANT_ID_HERE',
  'SELLER_USER_ID_HERE',
  10000000,  -- 100,000.00 ARS
  7407,      -- ~$74.07 USD
  13505000,  -- 1350.50 rate
  'active',
  NOW() + INTERVAL '30 days'
);

-- 3. Create a bid (buyer willing to pay 105,000 ARS)
INSERT INTO bids (variant_id, user_id, price_ars, price_usd, usd_ars_rate, status, expires_at)
VALUES (
  'VARIANT_ID_HERE',
  'BUYER_USER_ID_HERE',
  10500000,  -- 105,000.00 ARS
  7777,      -- ~$77.77 USD
  13505000,  -- 1350.50 rate
  'active',
  NOW() + INTERVAL '30 days'
);

-- 4. Verify transaction created
SELECT 
  id,
  sale_price_ars,
  status,
  created_at
FROM transactions
WHERE variant_id = 'VARIANT_ID_HERE'
ORDER BY created_at DESC
LIMIT 1;

-- Expected: One transaction at 100,000 ARS (ask price)

-- 5. Verify bid and ask marked as filled
SELECT id, status, matched_at FROM bids WHERE variant_id = 'VARIANT_ID_HERE';
SELECT id, status, matched_at FROM asks WHERE variant_id = 'VARIANT_ID_HERE';

-- Expected: Both status = 'filled', matched_at = recent timestamp
```

### **Integration Test (Automated)**

```typescript
// backend/tests/integration/matching.test.ts
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Matching Engine Integration', () => {
  it('should match bid with ask when prices cross', async () => {
    const supabase = createClient(/* ... */);
    
    // 1. Create ask
    const { data: ask } = await supabase
      .from('asks')
      .insert({
        variant_id: 'test-variant',
        user_id: 'seller-id',
        price_ars: 10000000,
        status: 'active',
      })
      .select()
      .single();
    
    // 2. Create bid (should trigger match)
    const { data: bid } = await supabase
      .from('bids')
      .insert({
        variant_id: 'test-variant',
        user_id: 'buyer-id',
        price_ars: 10500000,
        status: 'active',
      })
      .select()
      .single();
    
    // 3. Wait for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Verify transaction created
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('bid_id', bid.id)
      .single();
    
    expect(transaction).toBeDefined();
    expect(transaction.sale_price_ars).toBe(10000000); // Ask price
    expect(transaction.status).toBe('pending_payment');
    
    // 5. Verify statuses updated
    const { data: updatedBid } = await supabase
      .from('bids')
      .select('status')
      .eq('id', bid.id)
      .single();
    
    expect(updatedBid.status).toBe('filled');
  });
});
```

### **E2E Test (Playwright)**

```typescript
// Test user flow: Place bid → Place ask → Verify match
test('user can place bid and ask that match automatically', async ({ page }) => {
  // 1. Login as buyer
  await page.goto('/login');
  await page.fill('[name="email"]', 'buyer@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // 2. Place bid
  await page.goto('/products/air-jordan-1-chicago');
  await page.click('button:has-text("Place Bid")');
  await page.fill('[name="price"]', '105000');
  await page.click('button:has-text("Submit")');
  
  // 3. Login as seller
  await page.goto('/logout');
  await page.goto('/login');
  await page.fill('[name="email"]', 'seller@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // 4. Place ask (should match)
  await page.goto('/products/air-jordan-1-chicago');
  await page.click('button:has-text("Place Ask")');
  await page.fill('[name="price"]', '100000');
  await page.click('button:has-text("Submit")');
  
  // 5. Verify match notification
  await expect(page.locator('text=Match found!')).toBeVisible();
  
  // 6. Check transaction created
  await page.goto('/orders');
  await expect(page.locator('text=Pending Payment')).toBeVisible();
});
```

---

## Edge Cases

### **1. Same User**

**Scenario**: User tries to match their own bid/ask  
**Handling**: `user_id != NEW.user_id` check prevents this  
**Result**: No match created

### **2. Expired Listings**

**Scenario**: Bid/ask has `expires_at < NOW()`  
**Handling**: `expires_at > NOW()` check excludes expired listings  
**Result**: No match with expired listings

### **3. Concurrent Inserts**

**Scenario**: Two bids inserted simultaneously for same ask  
**Handling**: `FOR UPDATE SKIP LOCKED` + idempotency checks  
**Result**: Only one match created, other bid remains active

### **4. Price Boundaries**

| Bid Price | Ask Price | Match? | Matched Price |
|-----------|-----------|--------|---------------|
| 100k      | 100k      | ✅ Yes | 100k (ask)    |
| 105k      | 100k      | ✅ Yes | 100k (ask)    |
| 95k       | 100k      | ❌ No  | N/A           |

### **5. Multiple Matches**

**Scenario**: One bid could match multiple asks  
**Handling**: `LIMIT 1` ensures only one match per trigger  
**Result**: Matches with lowest ask, others remain active

---

## Performance Considerations

### **Indexes Required**

```sql
-- In schema.sql
CREATE INDEX idx_bids_variant_status_price ON bids(variant_id, status, price_ars DESC, created_at);
CREATE INDEX idx_asks_variant_status_price ON asks(variant_id, status, price_ars ASC, created_at);
```

### **Lock Contention**

- `FOR UPDATE SKIP LOCKED` prevents lock waits
- High-volume trading may require connection pooling
- Consider read replicas for market stats queries

### **Trigger Overhead**

- Each bid/ask insert executes trigger function
- Typical execution time: 5-20ms
- Monitor with: `EXPLAIN ANALYZE` on trigger queries

---

## Monitoring

### **Check Match Rate**

```sql
-- Percentage of bids that matched
SELECT 
  COUNT(*) FILTER (WHERE status = 'filled') * 100.0 / COUNT(*) as match_rate
FROM bids
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### **Average Time to Match**

```sql
-- Time between bid creation and match
SELECT 
  AVG(EXTRACT(EPOCH FROM (matched_at - created_at))) as avg_seconds_to_match
FROM bids
WHERE status = 'filled'
  AND matched_at IS NOT NULL;
```

### **Failed Matches**

```sql
-- Bids that should have matched but didn't
SELECT b.id, b.price_ars, b.created_at
FROM bids b
WHERE b.status = 'active'
  AND EXISTS (
    SELECT 1 FROM asks a
    WHERE a.variant_id = b.variant_id
      AND a.status = 'active'
      AND a.price_ars <= b.price_ars
      AND a.user_id != b.user_id
  );
```

---

## Troubleshooting

### **Matches Not Happening**

1. **Check triggers exist**:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name IN ('trigger_match_bid', 'trigger_match_ask');
   ```

2. **Check function exists**:
   ```sql
   SELECT * FROM information_schema.routines 
   WHERE routine_name IN ('attempt_match_bid', 'attempt_match_ask');
   ```

3. **Check for errors in logs**:
   - Supabase Dashboard → Database → Logs
   - Look for `RAISE NOTICE` messages

4. **Verify prices are integers**:
   ```sql
   SELECT id, price_ars FROM bids WHERE price_ars::text LIKE '%.%';
   ```

### **Duplicate Matches**

1. **Check unique indexes**:
   ```sql
   SELECT * FROM pg_indexes 
   WHERE tablename = 'transactions' 
     AND indexdef LIKE '%UNIQUE%';
   ```

2. **Check for race conditions**:
   - Review transaction isolation level
   - Ensure `FOR UPDATE SKIP LOCKED` is present

### **Performance Issues**

1. **Check index usage**:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM asks
   WHERE variant_id = 'test-id'
     AND status = 'active'
     AND price_ars <= 10000000
   ORDER BY price_ars ASC
   LIMIT 1;
   ```

2. **Monitor trigger execution time**:
   - Enable `track_functions` in PostgreSQL
   - Check `pg_stat_user_functions`

---

## Future Improvements

### **V2 Features**

- [ ] Partial matching (match multiple bids with one ask)
- [ ] Market orders (match at any price)
- [ ] Limit orders with stop-loss
- [ ] Batch matching (process multiple matches in one transaction)
- [ ] Real-time notifications via Supabase Realtime

### **Performance Optimizations**

- [ ] Materialized view for active listings
- [ ] Denormalized match candidates table
- [ ] Async matching via queue (for high volume)
- [ ] Sharding by product category

---

## References

- **Schema**: `docs/schema.sql`
- **Triggers**: `docs/schema-triggers.sql`
- **TypeScript Engine**: `backend/src/lib/market-engine.ts`
- **Unit Tests**: `backend/src/lib/market-engine.test.ts`
- **Roadmap**: `docs/roadmap-mvp.md` (Week 5-6)

---

**Last Updated**: January 7, 2026  
**Status**: ✅ Ready for deployment  
**Next**: Deploy to Supabase and run integration tests
