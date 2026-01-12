import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXCHANGE_RATE = 13505000; // 1350.50 ARS/USD * 10000

describe('Integration: Purchasing & Bidding Flow', () => {
  let testVariantId: string;
  let buyerUserId: string;
  let sellerUserId: string;
  let buyerAuthToken: string;
  let sellerAuthToken: string;

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

    // Get auth tokens for API calls
    const buyerSession = await supabase.auth.signInWithPassword({
      email: `test-buyer-${Date.now()}@test.com`,
      password: 'Test1234!',
    });
    const sellerSession = await supabase.auth.signInWithPassword({
      email: `test-seller-${Date.now()}@test.com`,
      password: 'Test1234!',
    });

    buyerAuthToken = buyerSession.data.session?.access_token || '';
    sellerAuthToken = sellerSession.data.session?.access_token || '';

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
    await supabase.from('transactions').delete().or(`buyer_id.eq.${buyerUserId},seller_id.eq.${sellerUserId}`);
    await supabase.from('bids').delete().eq('user_id', buyerUserId);
    await supabase.from('asks').delete().eq('user_id', sellerUserId);
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

  describe('Price Validation & Data Integrity', () => {
    it('should reject decimal prices (must be integers)', async () => {
      const decimalPrice = 9500000.50; // Invalid: has decimals

      const { error } = await supabase.from('bids').insert({
        variant_id: testVariantId,
        user_id: buyerUserId,
        price_ars: decimalPrice,
        price_usd: Math.round((decimalPrice * 10000) / EXCHANGE_RATE),
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

      // Database should enforce integer constraint or validation should reject
      expect(error).toBeTruthy();
    });

    it('should reject negative prices', async () => {
      const negativePrice = -1000000;

      const { error } = await supabase.from('bids').insert({
        variant_id: testVariantId,
        user_id: buyerUserId,
        price_ars: negativePrice,
        price_usd: 0,
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

      expect(error).toBeTruthy();
    });

    it('should reject zero prices', async () => {
      const zeroPrice = 0;

      const { error } = await supabase.from('bids').insert({
        variant_id: testVariantId,
        user_id: buyerUserId,
        price_ars: zeroPrice,
        price_usd: 0,
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

      expect(error).toBeTruthy();
    });

    it('should validate exchange rate is positive integer', async () => {
      const invalidRate = -13505000;

      const { error } = await supabase.from('bids').insert({
        variant_id: testVariantId,
        user_id: buyerUserId,
        price_ars: 10000000,
        price_usd: 7407,
        usd_ars_rate: invalidRate,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

      expect(error).toBeTruthy();
    });

    it('should store prices without rounding errors', async () => {
      const exactPrice = 9543210; // Specific integer value

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

      expect(bid?.price_ars).toBe(exactPrice);
      expect(Number.isInteger(bid?.price_ars)).toBe(true);
    });
  });

  describe('Race Condition Tests', () => {
    it('should handle two bids placed simultaneously for same ask', async () => {
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

      expect(ask).toBeTruthy();

      // Create second buyer for race condition
      const { data: buyer2 } = await supabase.auth.admin.createUser({
        email: `test-buyer2-${Date.now()}@test.com`,
        password: 'Test1234!',
        email_confirm: true,
      });

      const buyer2UserId = buyer2?.user?.id;

      // Insert two bids at the exact same time
      const bid1Price = 10000000;
      const bid2Price = 10500000;

      const [result1, result2] = await Promise.all([
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
          user_id: buyer2UserId!,
          price_ars: bid2Price,
          price_usd: Math.round((bid2Price * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        }).select().single(),
      ]);

      // Wait for triggers to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify only ONE transaction was created
      const { data: transactions, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('ask_id', ask!.id);

      expect(count).toBe(1);
      expect(transactions).toHaveLength(1);

      // Verify ask is filled
      const { data: updatedAsk } = await supabase
        .from('asks')
        .select('status')
        .eq('id', ask!.id)
        .single();

      expect(updatedAsk?.status).toBe('filled');

      // Verify one bid is filled, one is still active
      const { data: allBids } = await supabase
        .from('bids')
        .select('status')
        .in('id', [result1.data!.id, result2.data!.id]);

      const filledCount = allBids?.filter(b => b.status === 'filled').length;
      const activeCount = allBids?.filter(b => b.status === 'active').length;

      expect(filledCount).toBe(1);
      expect(activeCount).toBe(1);

      // Cleanup
      if (buyer2UserId) {
        await supabase.auth.admin.deleteUser(buyer2UserId);
      }
    });

    it('should handle two asks placed simultaneously for same bid', async () => {
      // Create one bid
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

      // Create second seller for race condition
      const { data: seller2 } = await supabase.auth.admin.createUser({
        email: `test-seller2-${Date.now()}@test.com`,
        password: 'Test1234!',
        email_confirm: true,
      });

      const seller2UserId = seller2?.user?.id;

      // Insert two asks at the exact same time
      const ask1Price = 9500000;
      const ask2Price = 9000000;

      const [result1, result2] = await Promise.all([
        supabase.from('asks').insert({
          variant_id: testVariantId,
          user_id: sellerUserId,
          price_ars: ask1Price,
          price_usd: Math.round((ask1Price * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        }).select().single(),
        supabase.from('asks').insert({
          variant_id: testVariantId,
          user_id: seller2UserId!,
          price_ars: ask2Price,
          price_usd: Math.round((ask2Price * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        }).select().single(),
      ]);

      // Wait for triggers to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify only ONE transaction was created
      const { data: transactions, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('bid_id', bid!.id);

      expect(count).toBe(1);
      expect(transactions).toHaveLength(1);

      // Verify bid is filled
      const { data: updatedBid } = await supabase
        .from('bids')
        .select('status')
        .eq('id', bid!.id)
        .single();

      expect(updatedBid?.status).toBe('filled');

      // Cleanup
      if (seller2UserId) {
        await supabase.auth.admin.deleteUser(seller2UserId);
      }
    });

    it('should prevent double-matching through unique constraints', async () => {
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

      // Try to manually create a duplicate transaction (should fail)
      const { error } = await supabase.from('transactions').insert({
        variant_id: testVariantId,
        buyer_id: buyerUserId,
        seller_id: sellerUserId,
        bid_id: bid!.id,
        ask_id: ask!.id,
        sale_price_ars: askPrice,
        sale_price_usd: Math.round((askPrice * 10000) / EXCHANGE_RATE),
        usd_ars_rate: EXCHANGE_RATE,
        status: 'pending_payment',
      });

      // Should fail due to unique constraint on bid_id
      expect(error).toBeTruthy();
      expect(error?.message).toContain('duplicate');
    });
  });

  describe('Authentication & Authorization', () => {
    it('should reject bid creation without authentication', async () => {
      // Create unauthenticated client
      const unauthClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await unauthClient.from('bids').insert({
        variant_id: testVariantId,
        user_id: buyerUserId,
        price_ars: 10000000,
        price_usd: 7407,
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

      expect(error).toBeTruthy();
    });

    it('should reject ask creation without authentication', async () => {
      const unauthClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await unauthClient.from('asks').insert({
        variant_id: testVariantId,
        user_id: sellerUserId,
        price_ars: 10000000,
        price_usd: 7407,
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

      expect(error).toBeTruthy();
    });

    it('should prevent user from cancelling another users bid', async () => {
      // Create bid as buyer
      const { data: bid } = await supabase
        .from('bids')
        .insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: 10000000,
          price_usd: 7407,
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      // Try to update as different user (seller)
      const sellerClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${sellerAuthToken}`,
            },
          },
        }
      );

      const { error } = await sellerClient
        .from('bids')
        .update({ status: 'cancelled' })
        .eq('id', bid!.id);

      // Should fail due to RLS policy
      expect(error).toBeTruthy();
    });
  });

  describe('Transaction Status Flow', () => {
    it('should create transaction with pending_payment status', async () => {
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

      expect(transaction?.status).toBe('pending_payment');
      expect(transaction?.payment_status).toBe('pending');
    });

    it('should validate transaction has all required fields', async () => {
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

      // Validate all critical fields are present
      expect(transaction?.variant_id).toBe(testVariantId);
      expect(transaction?.buyer_id).toBe(buyerUserId);
      expect(transaction?.seller_id).toBe(sellerUserId);
      expect(transaction?.bid_id).toBe(bid!.id);
      expect(transaction?.ask_id).toBeTruthy();
      expect(transaction?.sale_price_ars).toBe(askPrice);
      expect(transaction?.usd_ars_rate).toBe(EXCHANGE_RATE);
      expect(transaction?.created_at).toBeTruthy();
      expect(transaction?.updated_at).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle bid with invalid variant_id', async () => {
      const invalidVariantId = '00000000-0000-0000-0000-000000000000';

      const { error } = await supabase.from('bids').insert({
        variant_id: invalidVariantId,
        user_id: buyerUserId,
        price_ars: 10000000,
        price_usd: 7407,
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

      expect(error).toBeTruthy();
    });

    it('should handle extremely large prices without overflow', async () => {
      const largePrice = 999999999999; // 9,999,999,999.99 ARS

      const { data: bid, error } = await supabase
        .from('bids')
        .insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: largePrice,
          price_usd: Math.round((largePrice * 10000) / EXCHANGE_RATE),
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
          status: 'active',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(bid?.price_ars).toBe(largePrice);
    });

    it('should handle bid expiration correctly', async () => {
      // Create expired bid
      const { data: expiredBid } = await supabase
        .from('bids')
        .insert({
          variant_id: testVariantId,
          user_id: buyerUserId,
          price_ars: 10000000,
          price_usd: 7407,
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() - 1000).toISOString(), // Already expired
          status: 'active',
        })
        .select()
        .single();

      // Create matching ask
      await supabase.from('asks').insert({
        variant_id: testVariantId,
        user_id: sellerUserId,
        price_ars: 9500000,
        price_usd: Math.round((9500000 * 10000) / EXCHANGE_RATE),
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'active',
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify no match occurred
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('bid_id', expiredBid!.id)
        .maybeSingle();

      expect(transaction).toBeNull();
    });
  });
});
