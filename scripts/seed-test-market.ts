#!/usr/bin/env ts-node

/**
 * Seed Test Market
 * 
 * Creates a controlled test environment with:
 * - Test users (buyers and sellers)
 * - Test products with variants
 * - Sample bids and asks at various price points
 * - Exchange rate data
 * 
 * Usage: pnpm test:market
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TestUser {
  email: string;
  password: string;
  role: 'buyer' | 'seller';
  full_name: string;
}

const TEST_USERS: TestUser[] = [
  { email: 'buyer1@test.com', password: 'Test1234!', role: 'buyer', full_name: 'Test Buyer 1' },
  { email: 'buyer2@test.com', password: 'Test1234!', role: 'buyer', full_name: 'Test Buyer 2' },
  { email: 'seller1@test.com', password: 'Test1234!', role: 'seller', full_name: 'Test Seller 1' },
  { email: 'seller2@test.com', password: 'Test1234!', role: 'seller', full_name: 'Test Seller 2' },
];

const EXCHANGE_RATE = 13505000; // 1350.50 ARS/USD * 10000

async function seedTestMarket() {
  console.log('🌱 Seeding test market...\n');

  try {
    // 1. Create test users
    console.log('👥 Creating test users...');
    const userIds: Record<string, string> = {};

    for (const testUser of TEST_USERS) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
      });

      if (error) {
        console.log(`  ⚠️  User ${testUser.email} might already exist`);
        continue;
      }

      if (data.user) {
        userIds[testUser.email] = data.user.id;
        console.log(`  ✓ Created ${testUser.email}`);
      }
    }

    // 2. Get a test product variant
    console.log('\n📦 Finding test product variant...');
    const { data: variant } = await supabase
      .from('variants')
      .select('id, product:products(name)')
      .limit(1)
      .single();

    if (!variant) {
      console.error('❌ No variants found. Run `pnpm seed` first.');
      process.exit(1);
    }

    console.log(`  ✓ Using variant: ${variant.id}`);

    // 3. Create test bids
    console.log('\n💰 Creating test bids...');
    const testBids = [
      { price_ars: 10000000, user: 'buyer1@test.com' }, // 100000.00 ARS
      { price_ars: 9500000, user: 'buyer2@test.com' },  // 95000.00 ARS
      { price_ars: 9000000, user: 'buyer1@test.com' },  // 90000.00 ARS
    ];

    for (const bid of testBids) {
      const userId = userIds[bid.user];
      if (!userId) continue;

      const { error } = await supabase.from('bids').insert({
        variant_id: variant.id,
        user_id: userId,
        price_ars: bid.price_ars,
        price_usd: Math.round((bid.price_ars * 10000) / EXCHANGE_RATE),
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      });

      if (!error) {
        console.log(`  ✓ Bid: ${bid.price_ars / 10000} ARS by ${bid.user}`);
      }
    }

    // 4. Create test asks
    console.log('\n🏷️  Creating test asks...');
    const testAsks = [
      { price_ars: 9800000, user: 'seller1@test.com' }, // 98000.00 ARS
      { price_ars: 10200000, user: 'seller2@test.com' }, // 102000.00 ARS
      { price_ars: 10500000, user: 'seller1@test.com' }, // 105000.00 ARS
    ];

    for (const ask of testAsks) {
      const userId = userIds[ask.user];
      if (!userId) continue;

      const { error } = await supabase.from('asks').insert({
        variant_id: variant.id,
        user_id: userId,
        price_ars: ask.price_ars,
        price_usd: Math.round((ask.price_ars * 10000) / EXCHANGE_RATE),
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      });

      if (!error) {
        console.log(`  ✓ Ask: ${ask.price_ars / 10000} ARS by ${ask.user}`);
      }
    }

    // 5. Summary
    console.log('\n✅ Test market seeded successfully!\n');
    console.log('Test Market Summary:');
    console.log('  - 4 test users created');
    console.log('  - 3 bids placed (90k, 95k, 100k ARS)');
    console.log('  - 3 asks placed (98k, 102k, 105k ARS)');
    console.log('  - Exchange rate: 1350.50 ARS/USD\n');
    console.log('Expected behavior:');
    console.log('  - Bid at 100k should match Ask at 98k');
    console.log('  - Bid at 95k should NOT match (no ask <= 95k)');
    console.log('  - Ask at 102k should NOT match (no bid >= 102k)\n');

  } catch (error) {
    console.error('\n❌ Error seeding test market:', error);
    process.exit(1);
  }
}

seedTestMarket();
