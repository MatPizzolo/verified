/**
 * Market Engine - Core matching logic for Bid/Ask marketplace
 * 
 * This module contains the core business logic for matching bids and asks.
 * All prices are stored as integers (centavos) to avoid floating-point errors.
 */

export interface Bid {
  id: string;
  variant_id: string;
  user_id: string;
  price_ars: number; // Integer: centavos
  price_usd: number; // Integer: cents
  usd_ars_rate: number; // Integer: rate * 10000 (e.g., 1350.50 = 13505000)
  status: 'active' | 'filled' | 'cancelled' | 'expired';
  expires_at: Date;
  created_at: Date;
}

export interface Ask {
  id: string;
  variant_id: string;
  user_id: string;
  price_ars: number; // Integer: centavos
  price_usd: number; // Integer: cents
  usd_ars_rate: number; // Integer: rate * 10000
  status: 'active' | 'filled' | 'cancelled' | 'expired';
  expires_at: Date;
  created_at: Date;
}

export interface MatchResult {
  bid_id: string;
  ask_id: string;
  matched_price_ars: number; // Integer: centavos
  exchange_rate: number; // Integer: rate * 10000
  rate_version: Date;
}

/**
 * Find the best matching ask for a given bid
 * Returns the lowest-priced active ask that is <= bid price
 */
export function findMatchingAsk(
  bid: Bid,
  availableAsks: Ask[]
): Ask | null {
  // Filter active asks for the same variant
  const validAsks = availableAsks.filter(
    (ask) =>
      ask.variant_id === bid.variant_id &&
      ask.status === 'active' &&
      ask.expires_at > new Date() &&
      ask.user_id !== bid.user_id && // Can't match with yourself
      ask.price_ars <= bid.price_ars // Ask price must be <= bid price
  );

  if (validAsks.length === 0) {
    return null;
  }

  // Sort by price (lowest first), then by created_at (oldest first)
  validAsks.sort((a, b) => {
    if (a.price_ars !== b.price_ars) {
      return a.price_ars - b.price_ars;
    }
    return a.created_at.getTime() - b.created_at.getTime();
  });

  return validAsks[0];
}

/**
 * Find the best matching bid for a given ask
 * Returns the highest-priced active bid that is >= ask price
 */
export function findMatchingBid(
  ask: Ask,
  availableBids: Bid[]
): Bid | null {
  // Filter active bids for the same variant
  const validBids = availableBids.filter(
    (bid) =>
      bid.variant_id === ask.variant_id &&
      bid.status === 'active' &&
      bid.expires_at > new Date() &&
      bid.user_id !== ask.user_id && // Can't match with yourself
      bid.price_ars >= ask.price_ars // Bid price must be >= ask price
  );

  if (validBids.length === 0) {
    return null;
  }

  // Sort by price (highest first), then by created_at (oldest first)
  validBids.sort((a, b) => {
    if (b.price_ars !== a.price_ars) {
      return b.price_ars - a.price_ars;
    }
    return a.created_at.getTime() - b.created_at.getTime();
  });

  return validBids[0];
}

/**
 * Execute a match between a bid and an ask
 * Returns the match result with the agreed-upon price
 */
export function executeMatch(bid: Bid, ask: Ask): MatchResult {
  // The matched price is the ask price (seller sets the price)
  const matchedPrice = ask.price_ars;

  // Use the exchange rate from the time of matching (ask's rate)
  const exchangeRate = ask.usd_ars_rate;

  return {
    bid_id: bid.id,
    ask_id: ask.id,
    matched_price_ars: matchedPrice,
    exchange_rate: exchangeRate,
    rate_version: new Date(),
  };
}

/**
 * Validate that a price is a positive integer (no decimals)
 */
export function validatePrice(price: number): boolean {
  return Number.isInteger(price) && price > 0;
}

/**
 * Convert USD cents to ARS centavos using exchange rate
 * @param usdCents - Price in USD cents (integer)
 * @param rate - Exchange rate * 10000 (integer)
 * @returns Price in ARS centavos (integer)
 */
export function convertUsdToArs(usdCents: number, rate: number): number {
  if (!validatePrice(usdCents) || !Number.isInteger(rate) || rate <= 0) {
    throw new Error('Invalid price or exchange rate');
  }

  // rate is stored as rate * 10000, so we need to divide by 10000
  // Then multiply by 100 to convert dollars to centavos
  // Formula: (usdCents / 100) * (rate / 10000) * 100
  // Simplified: (usdCents * rate) / 10000
  return Math.round((usdCents * rate) / 10000);
}

/**
 * Convert ARS centavos to USD cents using exchange rate
 * @param arsCentavos - Price in ARS centavos (integer)
 * @param rate - Exchange rate * 10000 (integer)
 * @returns Price in USD cents (integer)
 */
export function convertArsToUsd(arsCentavos: number, rate: number): number {
  if (!validatePrice(arsCentavos) || !Number.isInteger(rate) || rate <= 0) {
    throw new Error('Invalid price or exchange rate');
  }

  // Reverse of convertUsdToArs
  // Formula: (arsCentavos * 10000) / rate
  return Math.round((arsCentavos * 10000) / rate);
}
