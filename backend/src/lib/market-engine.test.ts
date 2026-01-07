import { describe, it, expect } from 'vitest';
import {
  findMatchingAsk,
  findMatchingBid,
  executeMatch,
  validatePrice,
  convertUsdToArs,
  convertArsToUsd,
  type Bid,
  type Ask,
} from './market-engine';

describe('Market Engine - Price Validation', () => {
  it('should validate positive integers', () => {
    expect(validatePrice(100)).toBe(true);
    expect(validatePrice(1)).toBe(true);
    expect(validatePrice(999999)).toBe(true);
  });

  it('should reject zero and negative numbers', () => {
    expect(validatePrice(0)).toBe(false);
    expect(validatePrice(-1)).toBe(false);
    expect(validatePrice(-100)).toBe(false);
  });

  it('should reject decimal numbers', () => {
    expect(validatePrice(100.5)).toBe(false);
    expect(validatePrice(99.99)).toBe(false);
  });
});

describe('Market Engine - Currency Conversion', () => {
  it('should convert USD to ARS correctly', () => {
    // Example: $100 USD at rate 1350.50 ARS/USD
    // Rate stored as: 1350.50 * 10000 = 13505000
    const usdCents = 10000; // $100.00
    const rate = 13505000; // 1350.50 ARS/USD
    const expected = 13505000; // 135050.00 ARS = 13505000 centavos

    expect(convertUsdToArs(usdCents, rate)).toBe(expected);
  });

  it('should convert ARS to USD correctly', () => {
    // Reverse conversion
    const arsCentavos = 13505000; // 135050.00 ARS
    const rate = 13505000; // 1350.50 ARS/USD
    const expected = 10000; // $100.00

    expect(convertArsToUsd(arsCentavos, rate)).toBe(expected);
  });

  it('should handle rounding correctly', () => {
    const usdCents = 9999; // $99.99
    const rate = 13505000; // 1350.50 ARS/USD
    const arsResult = convertUsdToArs(usdCents, rate);
    
    // Should be an integer
    expect(Number.isInteger(arsResult)).toBe(true);
    
    // Should be close to expected value
    expect(arsResult).toBeGreaterThan(13500000);
    expect(arsResult).toBeLessThan(13510000);
  });

  it('should throw error for invalid inputs', () => {
    expect(() => convertUsdToArs(-100, 13505000)).toThrow();
    expect(() => convertUsdToArs(100, -13505000)).toThrow();
    expect(() => convertUsdToArs(100.5, 13505000)).toThrow();
  });
});

describe('Market Engine - Find Matching Ask', () => {
  const createBid = (overrides: Partial<Bid> = {}): Bid => ({
    id: 'bid-1',
    variant_id: 'variant-1',
    user_id: 'user-buyer',
    price_ars: 10000000, // 100000.00 ARS
    price_usd: 10000, // $100.00
    usd_ars_rate: 10000000, // 1000.00 ARS/USD
    status: 'active',
    expires_at: new Date(Date.now() + 86400000), // Tomorrow
    created_at: new Date(),
    ...overrides,
  });

  const createAsk = (overrides: Partial<Ask> = {}): Ask => ({
    id: 'ask-1',
    variant_id: 'variant-1',
    user_id: 'user-seller',
    price_ars: 9500000, // 95000.00 ARS
    price_usd: 9500, // $95.00
    usd_ars_rate: 10000000, // 1000.00 ARS/USD
    status: 'active',
    expires_at: new Date(Date.now() + 86400000), // Tomorrow
    created_at: new Date(),
    ...overrides,
  });

  it('should find matching ask when price is lower than bid', () => {
    const bid = createBid({ price_ars: 10000000 });
    const asks = [createAsk({ price_ars: 9500000 })];

    const match = findMatchingAsk(bid, asks);
    expect(match).not.toBeNull();
    expect(match?.id).toBe('ask-1');
  });

  it('should not find match when ask price is higher than bid', () => {
    const bid = createBid({ price_ars: 9000000 });
    const asks = [createAsk({ price_ars: 9500000 })];

    const match = findMatchingAsk(bid, asks);
    expect(match).toBeNull();
  });

  it('should find match when prices are equal', () => {
    const bid = createBid({ price_ars: 9500000 });
    const asks = [createAsk({ price_ars: 9500000 })];

    const match = findMatchingAsk(bid, asks);
    expect(match).not.toBeNull();
  });

  it('should not match with same user', () => {
    const bid = createBid({ user_id: 'user-1', price_ars: 10000000 });
    const asks = [createAsk({ user_id: 'user-1', price_ars: 9500000 })];

    const match = findMatchingAsk(bid, asks);
    expect(match).toBeNull();
  });

  it('should not match expired asks', () => {
    const bid = createBid({ price_ars: 10000000 });
    const asks = [
      createAsk({
        price_ars: 9500000,
        expires_at: new Date(Date.now() - 1000), // Expired
      }),
    ];

    const match = findMatchingAsk(bid, asks);
    expect(match).toBeNull();
  });

  it('should select lowest priced ask when multiple matches', () => {
    const bid = createBid({ price_ars: 10000000 });
    const asks = [
      createAsk({ id: 'ask-1', price_ars: 9500000 }),
      createAsk({ id: 'ask-2', price_ars: 9000000 }), // Lowest
      createAsk({ id: 'ask-3', price_ars: 9800000 }),
    ];

    const match = findMatchingAsk(bid, asks);
    expect(match?.id).toBe('ask-2');
    expect(match?.price_ars).toBe(9000000);
  });

  it('should select oldest ask when prices are equal', () => {
    const now = Date.now();
    const bid = createBid({ price_ars: 10000000 });
    const asks = [
      createAsk({ id: 'ask-1', price_ars: 9500000, created_at: new Date(now - 2000) }), // Oldest
      createAsk({ id: 'ask-2', price_ars: 9500000, created_at: new Date(now - 1000) }),
      createAsk({ id: 'ask-3', price_ars: 9500000, created_at: new Date(now) }),
    ];

    const match = findMatchingAsk(bid, asks);
    expect(match?.id).toBe('ask-1');
  });
});

describe('Market Engine - Find Matching Bid', () => {
  const createBid = (overrides: Partial<Bid> = {}): Bid => ({
    id: 'bid-1',
    variant_id: 'variant-1',
    user_id: 'user-buyer',
    price_ars: 10000000, // 100000.00 ARS
    price_usd: 10000, // $100.00
    usd_ars_rate: 10000000, // 1000.00 ARS/USD
    status: 'active',
    expires_at: new Date(Date.now() + 86400000),
    created_at: new Date(),
    ...overrides,
  });

  const createAsk = (overrides: Partial<Ask> = {}): Ask => ({
    id: 'ask-1',
    variant_id: 'variant-1',
    user_id: 'user-seller',
    price_ars: 9500000, // 95000.00 ARS
    price_usd: 9500, // $95.00
    usd_ars_rate: 10000000, // 1000.00 ARS/USD
    status: 'active',
    expires_at: new Date(Date.now() + 86400000),
    created_at: new Date(),
    ...overrides,
  });

  it('should find matching bid when price is higher than ask', () => {
    const ask = createAsk({ price_ars: 9500000 });
    const bids = [createBid({ price_ars: 10000000 })];

    const match = findMatchingBid(ask, bids);
    expect(match).not.toBeNull();
    expect(match?.id).toBe('bid-1');
  });

  it('should not find match when bid price is lower than ask', () => {
    const ask = createAsk({ price_ars: 10500000 });
    const bids = [createBid({ price_ars: 10000000 })];

    const match = findMatchingBid(ask, bids);
    expect(match).toBeNull();
  });

  it('should select highest priced bid when multiple matches', () => {
    const ask = createAsk({ price_ars: 9000000 });
    const bids = [
      createBid({ id: 'bid-1', price_ars: 9500000 }),
      createBid({ id: 'bid-2', price_ars: 10000000 }), // Highest
      createBid({ id: 'bid-3', price_ars: 9200000 }),
    ];

    const match = findMatchingBid(ask, bids);
    expect(match?.id).toBe('bid-2');
    expect(match?.price_ars).toBe(10000000);
  });
});

describe('Market Engine - Execute Match', () => {
  it('should create match result with ask price', () => {
    const bid: Bid = {
      id: 'bid-1',
      variant_id: 'variant-1',
      user_id: 'user-buyer',
      price_ars: 10000000,
      price_usd: 10000,
      usd_ars_rate: 10000000,
      status: 'active',
      expires_at: new Date(),
      created_at: new Date(),
    };

    const ask: Ask = {
      id: 'ask-1',
      variant_id: 'variant-1',
      user_id: 'user-seller',
      price_ars: 9500000, // This should be the matched price
      price_usd: 9500,
      usd_ars_rate: 10000000,
      status: 'active',
      expires_at: new Date(),
      created_at: new Date(),
    };

    const result = executeMatch(bid, ask);

    expect(result.bid_id).toBe('bid-1');
    expect(result.ask_id).toBe('ask-1');
    expect(result.matched_price_ars).toBe(9500000); // Ask price wins
    expect(result.exchange_rate).toBe(10000000);
    expect(result.rate_version).toBeInstanceOf(Date);
  });
});
