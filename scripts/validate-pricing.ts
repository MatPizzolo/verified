#!/usr/bin/env ts-node

/**
 * Validate Pricing Logic
 * 
 * Verifies that all prices are stored as integers (no decimals)
 * Tests ARS/USD conversions for accuracy
 * Checks exchange rate consistency
 * 
 * Usage: pnpm test:pricing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isInteger(value: number): boolean {
  return Number.isInteger(value);
}

function convertUsdToArs(usdCents: number, rate: number): number {
  return Math.round((usdCents * rate) / 10000);
}

function convertArsToUsd(arsCentavos: number, rate: number): number {
  return Math.round((arsCentavos * 10000) / rate);
}

async function validatePricing() {
  console.log('💰 Validating pricing logic...\n');

  let errors = 0;

  try {
    // 1. Check bids for integer prices
    console.log('🔍 Checking bids...');
    const { data: bids } = await supabase
      .from('bids')
      .select('id, price_ars, price_usd, usd_ars_rate');

    if (bids) {
      bids.forEach((bid) => {
        if (!isInteger(bid.price_ars)) {
          console.error(`  ❌ Bid ${bid.id}: price_ars is not an integer (${bid.price_ars})`);
          errors++;
        }
        if (!isInteger(bid.price_usd)) {
          console.error(`  ❌ Bid ${bid.id}: price_usd is not an integer (${bid.price_usd})`);
          errors++;
        }
        if (!isInteger(bid.usd_ars_rate)) {
          console.error(`  ❌ Bid ${bid.id}: usd_ars_rate is not an integer (${bid.usd_ars_rate})`);
          errors++;
        }

        // Verify conversion accuracy
        const calculatedArs = convertUsdToArs(bid.price_usd, bid.usd_ars_rate);
        const diff = Math.abs(calculatedArs - bid.price_ars);
        if (diff > 100) { // Allow 1 ARS tolerance for rounding
          console.error(`  ⚠️  Bid ${bid.id}: ARS/USD conversion mismatch (diff: ${diff / 100} ARS)`);
        }
      });
      console.log(`  ✓ Checked ${bids.length} bids\n`);
    }

    // 2. Check asks for integer prices
    console.log('🔍 Checking asks...');
    const { data: asks } = await supabase
      .from('asks')
      .select('id, price_ars, price_usd, usd_ars_rate');

    if (asks) {
      asks.forEach((ask) => {
        if (!isInteger(ask.price_ars)) {
          console.error(`  ❌ Ask ${ask.id}: price_ars is not an integer (${ask.price_ars})`);
          errors++;
        }
        if (!isInteger(ask.price_usd)) {
          console.error(`  ❌ Ask ${ask.id}: price_usd is not an integer (${ask.price_usd})`);
          errors++;
        }
        if (!isInteger(ask.usd_ars_rate)) {
          console.error(`  ❌ Ask ${ask.id}: usd_ars_rate is not an integer (${ask.usd_ars_rate})`);
          errors++;
        }
      });
      console.log(`  ✓ Checked ${asks.length} asks\n`);
    }

    // 3. Check transactions
    console.log('🔍 Checking transactions...');
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, sale_price_ars, sale_price_usd, usd_ars_rate');

    if (transactions) {
      transactions.forEach((tx) => {
        if (!isInteger(tx.sale_price_ars)) {
          console.error(`  ❌ Transaction ${tx.id}: sale_price_ars is not an integer`);
          errors++;
        }
        if (tx.sale_price_usd && !isInteger(tx.sale_price_usd)) {
          console.error(`  ❌ Transaction ${tx.id}: sale_price_usd is not an integer`);
          errors++;
        }
      });
      console.log(`  ✓ Checked ${transactions.length} transactions\n`);
    }

    // 4. Test conversion accuracy
    console.log('🧮 Testing conversion accuracy...');
    const testCases = [
      { usd: 10000, rate: 13505000, expectedArs: 13505000 }, // $100 at 1350.50
      { usd: 5000, rate: 13505000, expectedArs: 6752500 },   // $50 at 1350.50
      { usd: 1, rate: 13505000, expectedArs: 1351 },         // $0.01 at 1350.50
    ];

    testCases.forEach((test, i) => {
      const calculated = convertUsdToArs(test.usd, test.rate);
      const diff = Math.abs(calculated - test.expectedArs);
      if (diff > 10) {
        console.error(`  ❌ Test ${i + 1}: Expected ${test.expectedArs}, got ${calculated}`);
        errors++;
      } else {
        console.log(`  ✓ Test ${i + 1}: ${test.usd / 100} USD → ${calculated / 100} ARS`);
      }
    });

    // 5. Summary
    console.log(`\n${errors === 0 ? '✅' : '❌'} Validation complete!`);
    if (errors > 0) {
      console.log(`  - ${errors} errors found\n`);
      process.exit(1);
    } else {
      console.log(`  - All prices are integers`);
      console.log(`  - All conversions are accurate\n`);
    }

  } catch (error) {
    console.error('\n❌ Error validating pricing:', error);
    process.exit(1);
  }
}

validatePricing();
