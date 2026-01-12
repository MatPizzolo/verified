#!/usr/bin/env ts-node

/**
 * Enhanced MVP Demo Data Seeding Script
 * Creates 3 featured users with rich activity:
 * - Saved/favorited products
 * - Transaction history (completed purchases)
 * - Active bids and asks
 * - Price variation over time
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

const EXCHANGE_RATE = 1350.5000; // Exchange rate: 1350.50 ARS/USD
const EXCHANGE_RATE_SCALED = 13505000; // For integer math: 1350.50 * 10000

// ============================================================================
// FEATURED DEMO USERS - 3 Distinct Personas
// ============================================================================

const FEATURED_USERS = [
  {
    email: 'mateo.collector@demo.com',
    password: 'Demo1234!',
    full_name: 'Mateo Coleccionista',
    role: 'buyer' as const,
    city: 'Buenos Aires',
    province: 'CABA',
    persona: 'Active Collector',
    description: 'Serious sneaker collector with multiple completed purchases, active bids, and extensive saved items'
  },
  {
    email: 'sofia.reseller@demo.com',
    password: 'Demo1234!',
    full_name: 'Sofía Revendedora',
    role: 'seller' as const,
    city: 'Córdoba',
    province: 'Córdoba',
    persona: 'Power Seller',
    description: 'High-volume seller with completed sales, multiple active asks, and competitive pricing'
  },
  {
    email: 'lucas.casual@demo.com',
    password: 'Demo1234!',
    full_name: 'Lucas Casual',
    role: 'buyer' as const,
    city: 'Rosario',
    province: 'Santa Fe',
    persona: 'Casual Buyer',
    description: 'Occasional buyer browsing for deals, has saved items and a few bids'
  }
];

// Additional background users for marketplace depth
const BACKGROUND_USERS = [
  { email: 'buyer1@demo.com', password: 'Demo1234!', full_name: 'Comprador Uno', role: 'buyer' as const, city: 'Mendoza', province: 'Mendoza' },
  { email: 'buyer2@demo.com', password: 'Demo1234!', full_name: 'Comprador Dos', role: 'buyer' as const, city: 'La Plata', province: 'Buenos Aires' },
  { email: 'seller1@demo.com', password: 'Demo1234!', full_name: 'Vendedor Uno', role: 'seller' as const, city: 'Tucumán', province: 'Tucumán' },
  { email: 'seller2@demo.com', password: 'Demo1234!', full_name: 'Vendedor Dos', role: 'seller' as const, city: 'Salta', province: 'Salta' },
];

const ALL_USERS = [...FEATURED_USERS, ...BACKGROUND_USERS];

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedEnhancedDemo() {
  console.log('🚀 Seeding Enhanced MVP Demo Data...\n');
  console.log('This creates 3 featured users with rich marketplace activity:\n');
  
  FEATURED_USERS.forEach(user => {
    console.log(`  👤 ${user.full_name} (${user.persona})`);
    console.log(`     ${user.description}\n`);
  });

  const userIds: Record<string, string> = {};

  try {
    // ========================================================================
    // 1. CREATE USERS
    // ========================================================================
    console.log('\n👥 Creating demo users...');
    
    for (const demoUser of ALL_USERS) {
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
        // User might already exist, try to find them
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const found = existingUser.users.find((u: any) => u.email === demoUser.email);
        if (found) {
          userId = found.id;
          userIds[demoUser.email] = found.id;
          console.log(`  ✓ Found existing ${demoUser.full_name}`);
        }
      } else if (data.user) {
        userId = data.user.id;
        userIds[demoUser.email] = data.user.id;
        console.log(`  ✓ Created ${demoUser.full_name}`);
      }

      // Always upsert user profile (service role bypasses RLS)
      if (userId) {
        const { error: upsertError } = await supabase.from('users').upsert({
          auth_id: userId,
          email: demoUser.email,
          full_name: demoUser.full_name,
          role: demoUser.role,
          city: demoUser.city,
          province: demoUser.province,
          verified_email: true,
        }, {
          onConflict: 'auth_id'
        });
        
        if (upsertError) {
          console.error(`  ❌ Failed to create user profile for ${demoUser.email}:`, upsertError);
        }
      }
    }

    console.log(`\n  📊 Total users: ${Object.keys(userIds).length}`);

    // ========================================================================
    // 2. GET PRODUCT DATA
    // ========================================================================
    console.log('\n📦 Loading products and variants...');
    
    const { data: products } = await supabase
      .from('products')
      .select('id, name, slug, retail_price_usd')
      .limit(20);

    if (!products || products.length === 0) {
      console.error('❌ No products found. Run product seed first: pnpm seed');
      process.exit(1);
    }

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
      .limit(30);

    if (!variants || variants.length === 0) {
      console.error('❌ No variants found. Run product seed first: pnpm seed');
      process.exit(1);
    }

    console.log(`  ✓ Found ${products.length} products with ${variants.length} variants`);

    // ========================================================================
    // 3. CREATE SAVED PRODUCTS (FAVORITES)
    // ========================================================================
    console.log('\n⭐ Creating saved/favorited products...');
    
    // Mateo (collector) - saves 8-10 products
    const mateoId = userIds['mateo.collector@demo.com'];
    if (mateoId) {
      const mateoSaves = products.slice(0, 10).map(p => ({
        user_id: mateoId,
        product_id: p.id,
        notes: Math.random() > 0.5 ? 'Waiting for price drop' : null
      }));
      
      const { error } = await supabase.from('saved_products').upsert(mateoSaves);
      if (!error) {
        console.log(`  ✓ Mateo saved ${mateoSaves.length} products`);
      }
    }

    // Lucas (casual) - saves 3-5 products
    const lucasId = userIds['lucas.casual@demo.com'];
    if (lucasId) {
      const lucasSaves = products.slice(5, 9).map(p => ({
        user_id: lucasId,
        product_id: p.id,
      }));
      
      const { error } = await supabase.from('saved_products').upsert(lucasSaves);
      if (!error) {
        console.log(`  ✓ Lucas saved ${lucasSaves.length} products`);
      }
    }

    // ========================================================================
    // 4. CREATE COMPLETED TRANSACTIONS (PURCHASE HISTORY)
    // ========================================================================
    console.log('\n💳 Creating completed transactions (purchase history)...');
    
    // Get user IDs from users table (not auth IDs)
    const { data: usersData, error: usersQueryError } = await supabase
      .from('users')
      .select('id, email')
      .in('email', Object.keys(userIds));

    console.log(`  📋 Querying users table for ${Object.keys(userIds).length} emails...`);
    
    if (usersQueryError) {
      console.error('  ❌ Error querying users table:', usersQueryError);
    }
    
    console.log(`  ✓ Found ${usersData?.length || 0} user records in users table`);

    const userDbIds: Record<string, string> = {};
    usersData?.forEach((u: any) => {
      userDbIds[u.email] = u.id;
      console.log(`    - ${u.email}: ${u.id}`);
    });

    let completedCount = 0;
    const mateoUserId = userDbIds['mateo.collector@demo.com'];
    const sofiaUserId = userDbIds['sofia.reseller@demo.com'];
    const seller1Id = userDbIds['seller1@demo.com'];
    const seller2Id = userDbIds['seller2@demo.com'];

    console.log(`\n  🔍 User ID lookup:`);
    console.log(`    Mateo: ${mateoUserId || 'NOT FOUND'}`);
    console.log(`    Sofia: ${sofiaUserId || 'NOT FOUND'}`);
    console.log(`    Seller1: ${seller1Id || 'NOT FOUND'}`);
    console.log(`    Seller2: ${seller2Id || 'NOT FOUND'}`);

    // Mateo has bought 3 sneakers in the past
    if (mateoUserId && seller1Id && seller2Id) {
      console.log(`\n  💰 Creating Mateo's purchase history...`);
      for (let i = 0; i < 3; i++) {
        const variant = variants[i];
        const product = Array.isArray(variant.product) ? variant.product[0] : variant.product;
        const retailPriceUSD = product?.retail_price_usd || 100;
        const salePriceUSD = Math.round(retailPriceUSD * 1.15); // 15% above retail in USD
        const salePriceUSDCents = Math.round(salePriceUSD * 100); // Convert to cents
        const salePriceARSCentavos = Math.round((salePriceUSDCents * EXCHANGE_RATE_SCALED) / 10000); // Convert to centavos
        const sellerId = i % 2 === 0 ? seller1Id : seller2Id;

        // Create historical ask (filled)
        const { data: ask, error: askError } = await supabase.from('asks').insert({
          variant_id: variant.id,
          user_id: sellerId,
          price_ars: salePriceARSCentavos,
          price_usd: salePriceUSDCents,
          usd_ars_rate: EXCHANGE_RATE,
          status: 'filled',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }).select().single();

        if (askError) {
          console.error(`  ❌ Error creating ask for variant ${variant.id}:`, askError);
        }

        // Create historical bid (filled)
        const { data: bid, error: bidError } = await supabase.from('bids').insert({
          variant_id: variant.id,
          user_id: mateoUserId,
          price_ars: salePriceARSCentavos,
          price_usd: salePriceUSDCents,
          usd_ars_rate: EXCHANGE_RATE,
          status: 'filled',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          matched_ask_id: ask?.id,
        }).select().single();

        if (bidError) {
          console.error(`  ❌ Error creating bid for variant ${variant.id}:`, bidError);
        }

        // Create completed transaction
        if (ask && bid) {
          const platformFee = Math.round(salePriceARSCentavos * 0.10); // 10% fee
          const totalBuyerPayment = salePriceARSCentavos + platformFee;
          
          const { data: transaction, error: txError } = await supabase.from('transactions').insert({
            bid_id: bid.id,
            ask_id: ask.id,
            variant_id: variant.id,
            buyer_id: mateoUserId,
            seller_id: sellerId,
            sale_price_ars: salePriceARSCentavos,
            sale_price_usd: salePriceUSDCents,
            usd_ars_rate: EXCHANGE_RATE,
            platform_fee_ars: platformFee,
            total_buyer_payment_ars: totalBuyerPayment,
            status: 'completed',
          }).select().single();
          
          if (txError) {
            console.error(`  ❌ Error creating transaction:`, txError);
          } else if (transaction) {
            completedCount++;
            console.log(`  ✓ Mateo purchased ${product?.name || 'Unknown'} for $${(salePriceARSCentavos / 100).toFixed(2)} ARS`);
          }
        } else {
          console.error(`  ❌ Missing ask or bid for variant ${variant.id}`);
        }
      }
    }

    // Sofia has sold 2 sneakers
    if (sofiaUserId && userDbIds['buyer1@demo.com'] && userDbIds['buyer2@demo.com']) {
      for (let i = 3; i < 5; i++) {
        const variant = variants[i];
        const product = Array.isArray(variant.product) ? variant.product[0] : variant.product;
        const retailPriceUSD = product?.retail_price_usd || 120;
        const salePriceUSD = Math.round(retailPriceUSD * 1.10); // 10% above retail
        const salePriceUSDCents = Math.round(salePriceUSD * 100); // Convert to cents
        const salePriceARSCentavos = Math.round((salePriceUSDCents * EXCHANGE_RATE_SCALED) / 10000); // Convert to centavos
        const buyerId = i === 3 ? userDbIds['buyer1@demo.com'] : userDbIds['buyer2@demo.com'];

        const { data: ask, error: askError } = await supabase.from('asks').insert({
          variant_id: variant.id,
          user_id: sofiaUserId,
          price_ars: salePriceARSCentavos,
          price_usd: salePriceUSDCents,
          usd_ars_rate: EXCHANGE_RATE,
          status: 'filled',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }).select().single();

        if (askError) {
          console.error(`  ❌ Error creating Sofia's ask for variant ${variant.id}:`, askError);
        }

        const { data: bid, error: bidError } = await supabase.from('bids').insert({
          variant_id: variant.id,
          user_id: buyerId,
          price_ars: salePriceARSCentavos,
          price_usd: salePriceUSDCents,
          usd_ars_rate: EXCHANGE_RATE,
          status: 'filled',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          matched_ask_id: ask?.id,
        }).select().single();

        if (bidError) {
          console.error(`  ❌ Error creating buyer's bid for variant ${variant.id}:`, bidError);
        }

        if (ask && bid) {
          const platformFee = Math.round(salePriceARSCentavos * 0.10); // 10% fee
          const totalBuyerPayment = salePriceARSCentavos + platformFee;
          
          const { data: transaction, error: txError } = await supabase.from('transactions').insert({
            bid_id: bid.id,
            ask_id: ask.id,
            variant_id: variant.id,
            buyer_id: buyerId,
            seller_id: sofiaUserId,
            sale_price_ars: salePriceARSCentavos,
            sale_price_usd: salePriceUSDCents,
            usd_ars_rate: EXCHANGE_RATE,
            platform_fee_ars: platformFee,
            total_buyer_payment_ars: totalBuyerPayment,
            status: 'completed',
          }).select().single();
          
          if (txError) {
            console.error(`  ❌ Error creating Sofia's transaction:`, txError);
          } else if (transaction) {
            completedCount++;
            console.log(`  ✓ Sofia sold to buyer for $${(salePriceARSCentavos / 100).toFixed(2)} ARS`);
          }
        } else {
          console.error(`  ❌ Missing ask or bid for Sofia's sale`);
        }
      }
    }

    console.log(`\n  📊 Total completed transactions: ${completedCount}\n`);

    // ========================================================================
    // 5. CREATE ACTIVE BIDS
    // ========================================================================
    console.log('\n💰 Creating active bids...');
    
    let bidCount = 0;

    // Mateo - 5 active bids at various price points
    if (mateoUserId) {
      for (let i = 5; i < 10; i++) {
        const variant = variants[i];
        const product = Array.isArray(variant.product) ? variant.product[0] : variant.product;
        const basePrice = (product?.retail_price_usd || 100) * 100;
        const bidMultiplier = [0.90, 0.95, 1.00, 1.05, 1.10][i - 5]; // Varied pricing
        const priceARS = Math.round((basePrice * EXCHANGE_RATE * bidMultiplier) / 10000);
        const priceUSD = Math.round((priceARS * 10000) / EXCHANGE_RATE);

        const { error } = await supabase.from('bids').insert({
          variant_id: variant.id,
          user_id: mateoUserId,
          price_ars: priceARS,
          price_usd: priceUSD,
          usd_ars_rate: EXCHANGE_RATE,
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        if (!error) {
          bidCount++;
          console.log(`  ✓ Mateo bid $${(priceARS / 100).toFixed(2)} ARS for ${product?.name || 'Unknown'}`);
        }
      }
    }

    // Lucas - 2 active bids (casual buyer)
    if (lucasId) {
      for (let i = 10; i < 12; i++) {
        const variant = variants[i];
        const product = Array.isArray(variant.product) ? variant.product[0] : variant.product;
        const basePrice = (product?.retail_price_usd || 100) * 100;
        const priceARS = Math.round((basePrice * EXCHANGE_RATE * 0.85) / 10000); // Looking for deals
        const priceUSD = Math.round((priceARS * 10000) / EXCHANGE_RATE);

        const { error } = await supabase.from('bids').insert({
          variant_id: variant.id,
          user_id: lucasId,
          price_ars: priceARS,
          price_usd: priceUSD,
          usd_ars_rate: EXCHANGE_RATE,
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        if (!error) {
          bidCount++;
          console.log(`  ✓ Lucas bid $${(priceARS / 100).toFixed(2)} ARS for ${product?.name || 'Unknown'}`);
        }
      }
    }

    // Background buyers - add market depth
    const backgroundBuyers = [userDbIds['buyer1@demo.com'], userDbIds['buyer2@demo.com']];
    for (let i = 12; i < 17; i++) {
      const variant = variants[i];
      const product = Array.isArray(variant.product) ? variant.product[0] : variant.product;
      const basePrice = (product?.retail_price_usd || 100) * 100;
      const priceARS = Math.round((basePrice * EXCHANGE_RATE * 0.95) / 10000);
      const priceUSD = Math.round((priceARS * 10000) / EXCHANGE_RATE);
      const buyerId = backgroundBuyers[i % 2];

      if (buyerId) {
        await supabase.from('bids').insert({
          variant_id: variant.id,
          user_id: buyerId,
          price_ars: priceARS,
          price_usd: priceUSD,
          usd_ars_rate: EXCHANGE_RATE,
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        bidCount++;
      }
    }

    console.log(`\n  📊 Total active bids: ${bidCount}`);

    // ========================================================================
    // 6. CREATE ACTIVE ASKS
    // ========================================================================
    console.log('\n🏷️  Creating active asks...');
    
    let askCount = 0;

    // Sofia - 6 active asks (power seller)
    if (sofiaUserId) {
      for (let i = 17; i < 23; i++) {
        const variant = variants[i];
        const product = Array.isArray(variant.product) ? variant.product[0] : variant.product;
        const basePrice = (product?.retail_price_usd || 100) * 100;
        const askMultiplier = [1.15, 1.20, 1.25, 1.30, 1.35, 1.40][i - 17]; // Competitive pricing
        const priceARS = Math.round((basePrice * EXCHANGE_RATE * askMultiplier) / 10000);
        const priceUSD = Math.round((priceARS * 10000) / EXCHANGE_RATE);

        const { error } = await supabase.from('asks').insert({
          variant_id: variant.id,
          user_id: sofiaUserId,
          price_ars: priceARS,
          price_usd: priceUSD,
          usd_ars_rate: EXCHANGE_RATE,
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

        if (!error) {
          askCount++;
          console.log(`  ✓ Sofia listed ${product?.name || 'Unknown'} for $${(priceARS / 100).toFixed(2)} ARS`);
        }
      }
    }

    // Background sellers - add market depth
    const backgroundSellers = [userDbIds['seller1@demo.com'], userDbIds['seller2@demo.com']];
    for (let i = 23; i < 28; i++) {
      const variant = variants[i];
      const product = Array.isArray(variant.product) ? variant.product[0] : variant.product;
      const basePrice = (product?.retail_price_usd || 100) * 100;
      const priceARS = Math.round((basePrice * EXCHANGE_RATE * 1.25) / 10000);
      const priceUSD = Math.round((priceARS * 10000) / EXCHANGE_RATE);
      const sellerId = backgroundSellers[i % 2];

      if (sellerId) {
        await supabase.from('asks').insert({
          variant_id: variant.id,
          user_id: sellerId,
          price_ars: priceARS,
          price_usd: priceUSD,
          usd_ars_rate: EXCHANGE_RATE,
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        askCount++;
      }
    }

    console.log(`\n  📊 Total active asks: ${askCount}`);

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n✅ Enhanced MVP Demo Data Seeded Successfully!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 Enhanced Demo Environment Summary:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  👥 Total Users: ${Object.keys(userIds).length}`);
    console.log(`  ⭐ Featured Users: ${FEATURED_USERS.length}`);
    console.log(`  💳 Completed Transactions: ${completedCount}`);
    console.log(`  💰 Active Bids: ${bidCount}`);
    console.log(`  🏷️  Active Asks: ${askCount}`);
    console.log(`  💱 Exchange Rate: 1350.50 ARS/USD`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('🎯 Featured Demo Users (password: Demo1234!):\n');
    FEATURED_USERS.forEach(user => {
      const userId = userIds[user.email];
      console.log(`  👤 ${user.full_name} (${user.persona})`);
      console.log(`     📧 ${user.email}`);
      console.log(`     📍 ${user.city}, ${user.province}`);
      console.log(`     ${user.description}\n`);
    });

    console.log('🚀 Your enhanced MVP is ready to present!');
    console.log('   Visit http://localhost:3000 to see the marketplace in action.\n');

  } catch (error: any) {
    console.error('\n❌ Seeding failed:', error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

seedEnhancedDemo().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
