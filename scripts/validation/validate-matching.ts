#!/usr/bin/env ts-node

/**
 * Validate Matching Logic
 * 
 * Tests the bid/ask matching logic against the database
 * Verifies that matches occur correctly and prices are accurate
 * 
 * Usage: pnpm test:matching
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function validateMatching() {
  console.log('🔍 Validating matching logic...\n');

  try {
    // 1. Get all active bids and asks
    const { data: bids } = await supabase
      .from('bids')
      .select('*')
      .eq('status', 'active')
      .order('price_ars', { ascending: false });

    const { data: asks } = await supabase
      .from('asks')
      .select('*')
      .eq('status', 'active')
      .order('price_ars', { ascending: true });

    console.log(`📊 Found ${bids?.length || 0} active bids`);
    console.log(`📊 Found ${asks?.length || 0} active asks\n`);

    if (!bids || !asks || bids.length === 0 || asks.length === 0) {
      console.log('⚠️  No active bids or asks found. Run `pnpm test:market` first.\n');
      return;
    }

    // 2. Check for potential matches
    console.log('🔎 Checking for potential matches...\n');
    let matchCount = 0;

    for (const bid of bids) {
      const matchingAsks = asks.filter(
        (ask) =>
          ask.variant_id === bid.variant_id &&
          ask.user_id !== bid.user_id &&
          ask.price_ars <= bid.price_ars
      );

      if (matchingAsks.length > 0) {
        const bestAsk = matchingAsks[0]; // Already sorted by price
        matchCount++;

        console.log(`✓ Match found:`);
        console.log(`  Bid:  ${(bid.price_ars / 10000).toFixed(2)} ARS (${bid.id.slice(0, 8)}...)`);
        console.log(`  Ask:  ${(bestAsk.price_ars / 10000).toFixed(2)} ARS (${bestAsk.id.slice(0, 8)}...)`);
        console.log(`  Matched Price: ${(bestAsk.price_ars / 10000).toFixed(2)} ARS`);
        console.log(`  Spread: ${((bid.price_ars - bestAsk.price_ars) / 10000).toFixed(2)} ARS\n`);
      }
    }

    // 3. Check for transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log(`\n📝 Recent transactions: ${transactions?.length || 0}`);
    if (transactions && transactions.length > 0) {
      transactions.forEach((tx) => {
        console.log(`  - ${(tx.sale_price_ars / 10000).toFixed(2)} ARS at ${new Date(tx.created_at).toLocaleString()}`);
      });
    }

    // 4. Summary
    console.log(`\n✅ Validation complete!`);
    console.log(`  - ${matchCount} potential matches found`);
    console.log(`  - ${transactions?.length || 0} transactions recorded\n`);

    if (matchCount > 0 && (!transactions || transactions.length === 0)) {
      console.log('⚠️  WARNING: Matches found but no transactions created.');
      console.log('   This indicates triggers are not set up correctly.\n');
    }

  } catch (error) {
    console.error('\n❌ Error validating matching:', error);
    process.exit(1);
  }
}

validateMatching();
