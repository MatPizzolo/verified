import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXCHANGE_RATE = 13505000; // 1350.50 ARS/USD * 10000

describe('Integration: Matching Engine', () => {
  let testVariantId: string;
  let buyerUserId: string;
  let sellerUserId: string;

  beforeAll(async () => {
    // Create test users
    const { data: buyer } = await supabase.auth.admin.createUser({
      email: `test-buyer-${Date.now()}@test.com`,
      password: 'Test1234!',
      email_confirm: true,
    });

    const { data: seller } = await supabase.auth.admin.createUser({
      email: `test-seller-${Date.now()}@test.com`,
      password: 'Test1234!',
      email_confirm: true,
    });

    if (!buyer?.user || !seller?.user) {
      throw new Error('Failed to create test users');
    }

    buyerUserId = buyer.user.id;
    sellerUserId = seller.user.id;

    // Get a test variant
    const { data: variant } = await supabase
      .from('variants')
      .select('id')
      .limit(1)
      .single();

    if (!variant) {
      throw new Error('No variants found. Run seed script first.');
    }

    testVariantId = variant.id;
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await supabase.from('bids').delete().eq('user_id', buyerUserId);
    await supabase.from('asks').delete().eq('user_id', sellerUserId);
    await supabase.from('transactions').delete().or(`buyer_id.eq.${buyerUserId},seller_id.eq.${sellerUserId}`);
  });

  afterAll(async () => {
    // Cleanup test users
    if (buyerUserId) {
      await supabase.auth.admin.deleteUser(buyerUserId);
    }
    if (sellerUserId) {
      await supabase.auth.admin.deleteUser(sellerUserId);
    }
  });

  describe('Bid Insertion Triggers Matching', () => {
    it('should match bid with existing lower ask', async () => {
      // Create an ask at 95000 ARS
      const askPrice = 9500000;
      const { data: ask } = await supabase
        .from('asks')
        .insert({
          variant_id: testVariantId,
          user_id: sellerUserId,
          price_ars: askPrice,
          price_usd: Math.round((askPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      expect(ask).toBeTruthy();

      // Create a bid at 100000 ARS (higher than ask)
      const bidPrice = 10000000;
      const { data: bid } = await supabase
        .from('bids')
        .insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: bidPrice,
          price_usd: Math.round((bidPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      expect(bid).toBeTruthy();

      // Wait for trigger to process
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if bid status changed to 'matched'
      const { data: updatedBid } = await supabase
        .from('bids')
        .select('status')
        .eq('id', bid!.id)
        .single();

      // Check if ask status changed to 'matched'
      const { data: updatedAsk } = await supabase
        .from('asks')
        .select('status')
        .eq('id', ask!.id)
        .single();

      // Check if transaction was created
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('bid_id', bid!.id)
        .eq('ask_id', ask!.id)
        .single();

      expect(updatedBid?.status).toBe('matched');
      expect(updatedAsk?.status).toBe('matched');
      expect(transaction).toBeTruthy();
      expect(transaction?.matched_price_ars).toBe(askPrice); // Should match at ask price
    });

    it('should NOT match bid with higher ask', async () => {
      // Create an ask at 105000 ARS
      const askPrice = 10500000;
      await supabase.from('asks').insert({
        variant_id: testVariantId,
        user_id: sellerUserId,
        price_ars: askPrice,
        price_usd: Math.round((askPrice * 10000) / EXCHANGE_RATE),
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

      // Create a bid at 100000 ARS (lower than ask)
      const bidPrice = 10000000;
      const { data: bid } = await supabase
        .from('bids')
        .insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: bidPrice,
          price_usd: Math.round((bidPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      // Wait for potential trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check bid status should still be 'active'
      const { data: updatedBid } = await supabase
        .from('bids')
        .select('status')
        .eq('id', bid!.id)
        .single();

      expect(updatedBid?.status).toBe('active');
    });
  });

  describe('Ask Insertion Triggers Matching', () => {
    it('should match ask with existing higher bid', async () => {
      // Create a bid at 100000 ARS
      const bidPrice = 10000000;
      const { data: bid } = await supabase
        .from('bids')
        .insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: bidPrice,
          price_usd: Math.round((bidPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      expect(bid).toBeTruthy();

      // Create an ask at 95000 ARS (lower than bid)
      const askPrice = 9500000;
      const { data: ask } = await supabase
        .from('asks')
        .insert({
          variant_id: testVariantId,
          user_id: sellerUserId,
          price_ars: askPrice,
          price_usd: Math.round((askPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      expect(ask).toBeTruthy();

      // Wait for trigger to process
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if transaction was created
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('bid_id', bid!.id)
        .eq('ask_id', ask!.id)
        .single();

      expect(transaction).toBeTruthy();
      expect(transaction?.matched_price_ars).toBe(askPrice);
    });
  });

  describe('Transaction Creation', () => {
    it('should create transaction with correct exchange rate', async () => {
      const askPrice = 9500000;
      const { data: ask } = await supabase
        .from('asks')
        .insert({
          variant_id: testVariantId,
          user_id: sellerUserId,
          price_ars: askPrice,
          price_usd: Math.round((askPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      const bidPrice = 10000000;
      const { data: bid } = await supabase
        .from('bids')
        .insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: bidPrice,
          price_usd: Math.round((bidPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('bid_id', bid!.id)
        .single();

      expect(transaction).toBeTruthy();
      expect(transaction?.exchange_rate).toBe(EXCHANGE_RATE);
      expect(transaction?.matched_price_ars).toBe(askPrice);
      expect(transaction?.buyer_id).toBe(buyerUserId);
      expect(transaction?.seller_id).toBe(sellerUserId);
      expect(transaction?.status).toBe('pending_payment');
    });
  });

  describe('Market Stats Update', () => {
    it('should update market stats after match', async () => {
      // Get initial stats
      const { data: initialStats } = await supabase
        .from('market_stats')
        .select('*')
        .eq('variant_id', testVariantId)
        .single();

      const initialTotalSales = initialStats?.total_sales || 0;

      // Create matching bid and ask
      const askPrice = 9500000;
      await supabase.from('asks').insert({
        variant_id: testVariantId,
        user_id: sellerUserId,
        price_ars: askPrice,
        price_usd: Math.round((askPrice * 10000) / EXCHANGE_RATE),
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

      const bidPrice = 10000000;
      await supabase.from('bids').insert({
        variant_id: testVariantId,
        user_id: buyerUserId,
        price_ars: bidPrice,
        price_usd: Math.round((bidPrice * 10000) / EXCHANGE_RATE),
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

      // Wait for trigger and stats update
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check updated stats
      const { data: updatedStats } = await supabase
        .from('market_stats')
        .select('*')
        .eq('variant_id', testVariantId)
        .single();

      expect(updatedStats?.total_sales).toBeGreaterThan(initialTotalSales);
      expect(updatedStats?.last_sale_price_ars).toBe(askPrice);
    });
  });

  describe('Edge Cases & Data Integrity', () => {
    it('should NOT match bid with same user as seller', async () => {
      // Create ask from buyer (same user)
      const askPrice = 9500000;
      await supabase.from('asks').insert({
        variant_id: testVariantId,
        user_id: buyerUserId, // Same as bid user
        price_ars: askPrice,
        price_usd: Math.round((askPrice * 10000) / EXCHANGE_RATE),
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

      // Create bid at higher price
      const bidPrice = 10000000;
      const { data: bid } = await supabase
        .from('bids')
        .insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: bidPrice,
          price_usd: Math.round((bidPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify no match occurred
      const { data: updatedBid } = await supabase
        .from('bids')
        .select('status')
        .eq('id', bid!.id)
        .single();

      expect(updatedBid?.status).toBe('active');

      // Verify no transaction created
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('bid_id', bid!.id)
        .maybeSingle();

      expect(transaction).toBeNull();
    });

    it('should NOT match with expired ask', async () => {
      // Create expired ask
      const askPrice = 9500000;
      await supabase.from('asks').insert({
        variant_id: testVariantId,
        user_id: sellerUserId,
        price_ars: askPrice,
        price_usd: Math.round((askPrice * 10000) / EXCHANGE_RATE),
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
        status: 'active',
      });

      // Create bid at higher price
      const bidPrice = 10000000;
      const { data: bid } = await supabase
        .from('bids')
        .insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: bidPrice,
          price_usd: Math.round((bidPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify no match occurred
      const { data: updatedBid } = await supabase
        .from('bids')
        .select('status')
        .eq('id', bid!.id)
        .single();

      expect(updatedBid?.status).toBe('active');
    });

    it('should NOT match with cancelled ask', async () => {
      // Create cancelled ask
      const askPrice = 9500000;
      await supabase.from('asks').insert({
        variant_id: testVariantId,
        user_id: sellerUserId,
        price_ars: askPrice,
        price_usd: Math.round((askPrice * 10000) / EXCHANGE_RATE),
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'cancelled',
      });

      // Create bid at higher price
      const bidPrice = 10000000;
      const { data: bid } = await supabase
        .from('bids')
        .insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: bidPrice,
          price_usd: Math.round((bidPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify no match occurred
      const { data: updatedBid } = await supabase
        .from('bids')
        .select('status')
        .eq('id', bid!.id)
        .single();

      expect(updatedBid?.status).toBe('active');
    });

    it('should match with lowest ask when multiple asks exist', async () => {
      // Create multiple asks at different prices
      const ask1Price = 10000000; // 100k
      const ask2Price = 9500000;  // 95k (lowest)
      const ask3Price = 10500000; // 105k

      await supabase.from('asks').insert([
        {
          variant_id: testVariantId,
          user_id: sellerUserId,
          price_ars: ask1Price,
          price_usd: Math.round((ask1Price * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        },
        {
          variant_id: testVariantId,
          user_id: sellerUserId,
          price_ars: ask2Price,
          price_usd: Math.round((ask2Price * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        },
        {
          variant_id: testVariantId,
          user_id: sellerUserId,
          price_ars: ask3Price,
          price_usd: Math.round((ask3Price * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        },
      ]);

      // Create bid at 110k (should match lowest ask at 95k)
      const bidPrice = 11000000;
      const { data: bid } = await supabase
        .from('bids')
        .insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: bidPrice,
          price_usd: Math.round((bidPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify transaction matched at lowest ask price
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('bid_id', bid!.id)
        .single();

      expect(transaction).toBeTruthy();
      expect(transaction?.matched_price_ars).toBe(ask2Price); // Should match lowest
    });

    it('should match with highest bid when multiple bids exist', async () => {
      // Create multiple bids at different prices
      const bid1Price = 9000000;  // 90k
      const bid2Price = 10500000; // 105k (highest)
      const bid3Price = 9500000;  // 95k

      await supabase.from('bids').insert([
        {
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: bid1Price,
          price_usd: Math.round((bid1Price * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        },
        {
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: bid2Price,
          price_usd: Math.round((bid2Price * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        },
        {
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: bid3Price,
          price_usd: Math.round((bid3Price * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        },
      ]);

      // Create ask at 100k (should match highest bid at 105k)
      const askPrice = 10000000;
      const { data: ask } = await supabase
        .from('asks')
        .insert({
          variant_id: testVariantId,
          user_id: sellerUserId,
          price_ars: askPrice,
          price_usd: Math.round((askPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify transaction matched at ask price with highest bid
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('ask_id', ask!.id)
        .single();

      expect(transaction).toBeTruthy();
      expect(transaction?.matched_price_ars).toBe(askPrice); // Match at ask price
      expect(transaction?.bid_id).toBeTruthy();

      // Verify the matched bid was the highest one
      const { data: matchedBid } = await supabase
        .from('bids')
        .select('price_ars')
        .eq('id', transaction!.bid_id)
        .single();

      expect(matchedBid?.price_ars).toBe(bid2Price); // Highest bid
    });

    it('should handle exact price match correctly', async () => {
      const exactPrice = 10000000;

      // Create ask at exact price
      const { data: ask } = await supabase
        .from('asks')
        .insert({
          variant_id: testVariantId,
          user_id: sellerUserId,
          price_ars: exactPrice,
          price_usd: Math.round((exactPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      // Create bid at exact same price
      const { data: bid } = await supabase
        .from('bids')
        .insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: exactPrice,
          price_usd: Math.round((exactPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify match occurred
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('bid_id', bid!.id)
        .eq('ask_id', ask!.id)
        .single();

      expect(transaction).toBeTruthy();
      expect(transaction?.matched_price_ars).toBe(exactPrice);
    });

    it('should preserve exchange rate from ask in transaction', async () => {
      const differentRate = 14000000; // Different rate for testing
      const askPrice = 9500000;

      // Create ask with different exchange rate
      const { data: ask } = await supabase
        .from('asks')
        .insert({
          variant_id: testVariantId,
          user_id: sellerUserId,
          price_ars: askPrice,
          price_usd: Math.round((askPrice * 10000) / differentRate),
          usd_ars_rate: differentRate,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      // Create bid with standard rate
      const bidPrice = 10000000;
      const { data: bid } = await supabase
        .from('bids')
        .insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: bidPrice,
          price_usd: Math.round((bidPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify transaction uses ask's exchange rate
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('bid_id', bid!.id)
        .single();

      expect(transaction).toBeTruthy();
      expect(transaction?.exchange_rate).toBe(differentRate);
    });

    it('should NOT create duplicate transactions (idempotency)', async () => {
      const askPrice = 9500000;
      const { data: ask } = await supabase
        .from('asks')
        .insert({
          variant_id: testVariantId,
          user_id: sellerUserId,
          price_ars: askPrice,
          price_usd: Math.round((askPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      const bidPrice = 10000000;
      const { data: bid } = await supabase
        .from('bids')
        .insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: bidPrice,
          price_usd: Math.round((bidPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Count transactions for this bid/ask pair
      const { data: transactions, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('bid_id', bid!.id)
        .eq('ask_id', ask!.id);

      expect(count).toBe(1); // Should only have one transaction
      expect(transactions).toHaveLength(1);
    });

    it('should validate price is stored as integer (no decimals)', async () => {
      const askPrice = 9500000;
      const { data: ask } = await supabase
        .from('asks')
        .insert({
          variant_id: testVariantId,
          user_id: sellerUserId,
          price_ars: askPrice,
          price_usd: Math.round((askPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      const bidPrice = 10000000;
      const { data: bid } = await supabase
        .from('bids')
        .insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: bidPrice,
          price_usd: Math.round((bidPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('bid_id', bid!.id)
        .single();

      // Verify all prices are integers
      expect(Number.isInteger(transaction?.matched_price_ars)).toBe(true);
      expect(Number.isInteger(transaction?.exchange_rate)).toBe(true);
      expect(transaction?.matched_price_ars! % 1).toBe(0);
    });
  });

  describe('Concurrent Matching Scenarios', () => {
    it('should handle multiple bids trying to match same ask', async () => {
      // Create one ask
      const askPrice = 9500000;
      const { data: ask } = await supabase
        .from('asks')
        .insert({
          variant_id: testVariantId,
          user_id: sellerUserId,
          price_ars: askPrice,
          price_usd: Math.round((askPrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      // Create two bids simultaneously
      const bid1Price = 10000000;
      const bid2Price = 10500000;

      const [bid1Result, bid2Result] = await Promise.all([
        supabase.from('bids').insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: bid1Price,
          price_usd: Math.round((bid1Price * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        }).select().single(),
        supabase.from('bids').insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: bid2Price,
          price_usd: Math.round((bid2Price * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        }).select().single(),
      ]);

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verify only one transaction was created (ask can only match once)
      const { data: transactions, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('ask_id', ask!.id);

      expect(count).toBeLessThanOrEqual(1); // Should be 0 or 1, not 2

      // Verify ask is matched only once
      const { data: updatedAsk } = await supabase
        .from('asks')
        .select('status')
        .eq('id', ask!.id)
        .single();

      expect(updatedAsk?.status).toBe('matched');
    });
  });
});
