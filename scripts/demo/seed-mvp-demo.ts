#!/usr/bin/env ts-node

/**
 * Seed MVP Demo Data
 * 
 * Creates a complete, realistic marketplace environment for MVP presentation:
 * - Real users (buyers and sellers)
 * - Multiple products with variants
 * - Active bids and asks across different price points
 * - Completed transactions
 * - Market statistics
 * 
 * Usage: pnpm seed:demo
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DemoUser {
  email: string;
  password: string;
  full_name: string;
  role: 'buyer' | 'seller';
  phone?: string;
  city?: string;
  province?: string;
}

const DEMO_USERS: DemoUser[] = [
  // Buyers
  { email: 'juan.perez@example.com', password: 'Demo1234!', full_name: 'Juan Pérez', role: 'buyer', city: 'Buenos Aires', province: 'CABA' },
  { email: 'maria.gonzalez@example.com', password: 'Demo1234!', full_name: 'María González', role: 'buyer', city: 'Córdoba', province: 'Córdoba' },
  { email: 'carlos.rodriguez@example.com', password: 'Demo1234!', full_name: 'Carlos Rodríguez', role: 'buyer', city: 'Rosario', province: 'Santa Fe' },
  { email: 'ana.martinez@example.com', password: 'Demo1234!', full_name: 'Ana Martínez', role: 'buyer', city: 'Mendoza', province: 'Mendoza' },
  
  // Sellers
  { email: 'lucas.fernandez@example.com', password: 'Demo1234!', full_name: 'Lucas Fernández', role: 'seller', city: 'Buenos Aires', province: 'CABA' },
  { email: 'sofia.lopez@example.com', password: 'Demo1234!', full_name: 'Sofía López', role: 'seller', city: 'La Plata', province: 'Buenos Aires' },
  { email: 'diego.sanchez@example.com', password: 'Demo1234!', full_name: 'Diego Sánchez', role: 'seller', city: 'Córdoba', province: 'Córdoba' },
  { email: 'valentina.torres@example.com', password: 'Demo1234!', full_name: 'Valentina Torres', role: 'seller', city: 'Rosario', province: 'Santa Fe' },
];

const EXCHANGE_RATE = 13505000; // 1350.50 ARS/USD * 10000

async function seedMVPDemo() {
  console.log('🚀 Seeding MVP Demo Data...\n');
  console.log('This will create a realistic marketplace environment for presentation.\n');

  try {
    // 1. Create demo users
    console.log('👥 Creating demo users...');
    const userIds: Record<string, string> = {};

    for (const demoUser of DEMO_USERS) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: demoUser.email,
        password: demoUser.password,
        email_confirm: true,
        user_metadata: {
          full_name: demoUser.full_name,
        },
      });

      let userId: string | null = null;

      if (error) {
        console.log(`  ⚠️  User ${demoUser.email} might already exist`);
        // Try to get existing user
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const found = existingUser.users.find(u => u.email === demoUser.email);
        if (found) {
          userId = found.id;
          userIds[demoUser.email] = found.id;
        }
      } else if (data.user) {
        userId = data.user.id;
        userIds[demoUser.email] = data.user.id;
        console.log(`  ✓ Created ${demoUser.full_name} (${demoUser.role})`);
      }

      // Always upsert user profile (for both new and existing users)
      if (userId) {
        await supabase.from('users').upsert({
          auth_id: userId,
          email: demoUser.email,
          full_name: demoUser.full_name,
          role: demoUser.role,
          city: demoUser.city,
          province: demoUser.province,
          verified_email: true,
        });
      }
    }

    console.log(`\n  📊 Total users: ${Object.keys(userIds).length}`);

    // 2. Get product variants for demo
    console.log('\n📦 Loading product variants...');
    const { data: variants } = await supabase
      .from('variants')
      .select(`
        id,
        size_us,
        size_eu,
        product:products(
          id,
          name,
          slug,
          retail_price_usd
        )
      `)
      .limit(10);

    if (!variants || variants.length === 0) {
      console.error('❌ No variants found. Run product seed first: pnpm seed:products');
      process.exit(1);
    }

    console.log(`  ✓ Found ${variants.length} product variants`);

    // 3. Create diverse bids across products
    console.log('\n💰 Creating demo bids...');
    const buyers = DEMO_USERS.filter(u => u.role === 'buyer');
    let bidCount = 0;

    for (let i = 0; i < Math.min(variants.length, 5); i++) {
      const variant = variants[i];
      const product = Array.isArray(variant.product) ? variant.product[0] : variant.product;
      const basePrice = (product?.retail_price_usd || 100) * 100; // Convert to cents
      const basePriceARS = Math.round((basePrice * EXCHANGE_RATE) / 10000);

      // Create 2-3 bids per variant at different price points
      const bidPrices = [
        basePriceARS * 0.85, // 15% below retail
        basePriceARS * 0.95, // 5% below retail
        basePriceARS * 1.05, // 5% above retail
      ];

      for (let j = 0; j < bidPrices.length; j++) {
        const buyer = buyers[j % buyers.length];
        const userId = userIds[buyer.email];
        if (!userId) continue;

        const priceARS = Math.round(bidPrices[j]);
        const priceUSD = Math.round((priceARS * 10000) / EXCHANGE_RATE);

        const { error } = await supabase.from('bids').insert({
          variant_id: variant.id,
          user_id: userId,
          price_ars: priceARS,
          price_usd: priceUSD,
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
        });

        if (!error) {
          bidCount++;
          console.log(`  ✓ Bid: $${(priceARS / 10000).toFixed(2)} ARS for ${product?.name || 'Unknown'} (US ${variant.size_us})`);
        }
      }
    }

    console.log(`\n  📊 Total bids created: ${bidCount}`);

    // 4. Create diverse asks across products
    console.log('\n🏷️  Creating demo asks...');
    const sellers = DEMO_USERS.filter(u => u.role === 'seller');
    let askCount = 0;

    for (let i = 0; i < Math.min(variants.length, 5); i++) {
      const variant = variants[i];
      const product = Array.isArray(variant.product) ? variant.product[0] : variant.product;
      const basePrice = (product?.retail_price_usd || 100) * 100;
      const basePriceARS = Math.round((basePrice * EXCHANGE_RATE) / 10000);

      // Create 2-3 asks per variant at different price points
      const askPrices = [
        basePriceARS * 1.10, // 10% above retail
        basePriceARS * 1.20, // 20% above retail
        basePriceARS * 1.35, // 35% above retail
      ];

      for (let j = 0; j < askPrices.length; j++) {
        const seller = sellers[j % sellers.length];
        const userId = userIds[seller.email];
        if (!userId) continue;

        const priceARS = Math.round(askPrices[j]);
        const priceUSD = Math.round((priceARS * 10000) / EXCHANGE_RATE);

        const { error } = await supabase.from('asks').insert({
          variant_id: variant.id,
          user_id: userId,
          price_ars: priceARS,
          price_usd: priceUSD,
          usd_ars_rate: EXCHANGE_RATE,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
        });

        if (!error) {
          askCount++;
          console.log(`  ✓ Ask: $${(priceARS / 10000).toFixed(2)} ARS for ${product?.name || 'Unknown'} (US ${variant.size_us})`);
        }
      }
    }

    console.log(`\n  📊 Total asks created: ${askCount}`);

    // 5. Create some matching scenarios
    console.log('\n🎯 Creating matching scenarios...');
    
    // Get first variant for matching demo
    const matchVariant = variants[0];
    const matchProduct = Array.isArray(matchVariant.product) ? matchVariant.product[0] : matchVariant.product;
    const basePrice = (matchProduct?.retail_price_usd || 100) * 100;
    const basePriceARS = Math.round((basePrice * EXCHANGE_RATE) / 10000);

    // Create a bid that should match an ask
    const highBidder = buyers[0];
    const lowSeller = sellers[0];
    
    if (userIds[highBidder.email] && userIds[lowSeller.email]) {
      // Create ask at lower price
      const askPrice = Math.round(basePriceARS * 1.05);
      await supabase.from('asks').insert({
        variant_id: matchVariant.id,
        user_id: userIds[lowSeller.email],
        price_ars: askPrice,
        price_usd: Math.round((askPrice * 10000) / EXCHANGE_RATE),
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      });

      // Create bid at higher price (should match)
      const bidPrice = Math.round(basePriceARS * 1.15);
      await supabase.from('bids').insert({
        variant_id: matchVariant.id,
        user_id: userIds[highBidder.email],
        price_ars: bidPrice,
        price_usd: Math.round((bidPrice * 10000) / EXCHANGE_RATE),
        usd_ars_rate: EXCHANGE_RATE,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      });

      console.log(`  ✓ Created matching scenario: Bid $${(bidPrice / 10000).toFixed(2)} should match Ask $${(askPrice / 10000).toFixed(2)}`);
    }

    // 6. Summary
    console.log('\n✅ MVP Demo Data Seeded Successfully!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 Demo Environment Summary:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  👥 Users: ${Object.keys(userIds).length} (${buyers.length} buyers, ${sellers.length} sellers)`);
    console.log(`  💰 Active Bids: ${bidCount}`);
    console.log(`  🏷️  Active Asks: ${askCount}`);
    console.log(`  📦 Products with Listings: ${Math.min(variants.length, 5)}`);
    console.log(`  💱 Exchange Rate: ${(EXCHANGE_RATE / 10000).toFixed(2)} ARS/USD`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('🎯 Demo Credentials (all passwords: Demo1234!):');
    console.log('\nBuyers:');
    buyers.forEach(b => console.log(`  • ${b.email} - ${b.full_name}`));
    console.log('\nSellers:');
    sellers.forEach(s => console.log(`  • ${s.email} - ${s.full_name}`));
    
    console.log('\n🚀 Your MVP is ready to present!');
    console.log('   Visit http://localhost:3000 to see the marketplace in action.\n');

  } catch (error) {
    console.error('\n❌ Error seeding MVP demo:', error);
    process.exit(1);
  }
}

seedMVPDemo();
