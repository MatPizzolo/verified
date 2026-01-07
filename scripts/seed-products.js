#!/usr/bin/env node

/**
 * Product Database Seeding Script
 * Seeds brands, products, and variants for MVP
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Seed data
const BRANDS = [
  { name: 'Nike', slug: 'nike', logo_url: 'https://logo.clearbit.com/nike.com' },
  { name: 'Adidas', slug: 'adidas', logo_url: 'https://logo.clearbit.com/adidas.com' },
  { name: 'Jordan', slug: 'jordan', logo_url: 'https://logo.clearbit.com/nike.com' },
  { name: 'New Balance', slug: 'new-balance', logo_url: 'https://logo.clearbit.com/newbalance.com' }
];

const PRODUCTS = [
  // Nike
  { brand_slug: 'nike', name: 'Air Force 1 Low White', colorway: 'White/White', sku: 'CW2288-111', retail_price_usd: 110, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800' },
  { brand_slug: 'nike', name: 'Dunk Low Panda', colorway: 'White/Black', sku: 'DD1391-100', retail_price_usd: 110, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800' },
  { brand_slug: 'nike', name: 'Air Max 90 Infrared', colorway: 'White/Infrared', sku: 'CT1685-100', retail_price_usd: 130, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800' },
  { brand_slug: 'nike', name: 'Blazer Mid 77 Vintage', colorway: 'White/Black', sku: 'BQ6806-100', retail_price_usd: 100, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800' },
  { brand_slug: 'nike', name: 'Air Jordan 1 Low', colorway: 'Black Toe', sku: '553558-116', retail_price_usd: 110, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800' },
  
  // Jordan
  { brand_slug: 'jordan', name: 'Air Jordan 1 High OG', colorway: 'Chicago', sku: '555088-101', retail_price_usd: 170, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800' },
  { brand_slug: 'jordan', name: 'Air Jordan 1 High OG', colorway: 'Bred Toe', sku: '555088-610', retail_price_usd: 160, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800' },
  { brand_slug: 'jordan', name: 'Air Jordan 4 Retro', colorway: 'White Cement', sku: '840606-192', retail_price_usd: 200, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1612902376601-5bc7e8c91e5a?w=800' },
  { brand_slug: 'jordan', name: 'Air Jordan 11 Retro', colorway: 'Concord', sku: '378037-100', retail_price_usd: 220, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1611464908639-6dd6d1c0e0b6?w=800' },
  { brand_slug: 'jordan', name: 'Air Jordan 3 Retro', colorway: 'Black Cement', sku: '854262-001', retail_price_usd: 200, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800' },
  
  // Adidas
  { brand_slug: 'adidas', name: 'Yeezy Boost 350 V2', colorway: 'Zebra', sku: 'CP9654', retail_price_usd: 220, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800' },
  { brand_slug: 'adidas', name: 'Yeezy Boost 350 V2', colorway: 'Bred', sku: 'CP9652', retail_price_usd: 220, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=800' },
  { brand_slug: 'adidas', name: 'Yeezy Boost 700', colorway: 'Wave Runner', sku: 'B75571', retail_price_usd: 300, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800' },
  { brand_slug: 'adidas', name: 'Samba OG', colorway: 'Black/White', sku: 'B75807', retail_price_usd: 90, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800' },
  { brand_slug: 'adidas', name: 'Stan Smith', colorway: 'White/Green', sku: 'M20324', retail_price_usd: 85, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800' },
  { brand_slug: 'adidas', name: 'Superstar', colorway: 'White/Black', sku: 'EG4958', retail_price_usd: 85, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800' },
  
  // New Balance
  { brand_slug: 'new-balance', name: '550 White Green', colorway: 'White/Green', sku: 'BB550WT1', retail_price_usd: 110, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800' },
  { brand_slug: 'new-balance', name: '574 Core', colorway: 'Grey', sku: 'ML574EGG', retail_price_usd: 80, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800' },
  { brand_slug: 'new-balance', name: '990v5', colorway: 'Grey', sku: 'M990GL5', retail_price_usd: 175, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800' },
  { brand_slug: 'new-balance', name: '2002R Protection Pack', colorway: 'Grey', sku: 'M2002RDA', retail_price_usd: 150, gender: 'unisex', image_url: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800' }
];

// Common sizes (EU sizing)
const SIZES_EU = [
  38, 38.5, 39, 40, 40.5, 41, 42, 42.5, 43, 44, 44.5, 45, 46, 47
];

// EU to US conversion (approximate)
const euToUs = (eu) => {
  const conversions = {
    38: 6, 38.5: 6.5, 39: 7, 40: 7.5, 40.5: 8, 41: 8.5,
    42: 9, 42.5: 9.5, 43: 10, 44: 10.5, 44.5: 11, 45: 11.5,
    46: 12, 47: 13
  };
  return conversions[eu] || null;
};

// EU to UK conversion (approximate)
const euToUk = (eu) => {
  const conversions = {
    38: 5, 38.5: 5.5, 39: 6, 40: 6.5, 40.5: 7, 41: 7.5,
    42: 8, 42.5: 8.5, 43: 9, 44: 9.5, 44.5: 10, 45: 10.5,
    46: 11, 47: 12
  };
  return conversions[eu] || null;
};

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Seed Brands
    console.log('📦 Seeding brands...');
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .upsert(BRANDS, { onConflict: 'slug' })
      .select();

    if (brandsError) throw brandsError;
    console.log(`✓ Seeded ${brands.length} brands\n`);

    // Create brand lookup
    const brandMap = {};
    brands.forEach(brand => {
      brandMap[brand.slug] = brand.id;
    });

    // 2. Seed Products
    console.log('👟 Seeding products...');
    const productsToInsert = PRODUCTS.map(p => ({
      brand_id: brandMap[p.brand_slug],
      name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      colorway: p.colorway,
      sku: p.sku,
      retail_price_usd: p.retail_price_usd,
      gender: p.gender,
      image_url: p.image_url,
      description: `${p.name} in ${p.colorway} colorway. Original retail price: $${p.retail_price_usd}.`,
      featured: Math.random() > 0.7, // 30% chance of being featured
      active: true
    }));

    const { data: products, error: productsError } = await supabase
      .from('products')
      .upsert(productsToInsert, { onConflict: 'slug' })
      .select();

    if (productsError) throw productsError;
    console.log(`✓ Seeded ${products.length} products\n`);

    // 3. Seed Variants (sizes)
    console.log('📏 Seeding variants (sizes)...');
    const variants = [];
    
    for (const product of products) {
      for (const sizeEu of SIZES_EU) {
        variants.push({
          product_id: product.id,
          size_eu: sizeEu,
          size_us: euToUs(sizeEu),
          size_uk: euToUk(sizeEu),
          active: true
        });
      }
    }

    // Insert in batches to avoid timeout
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < variants.length; i += batchSize) {
      const batch = variants.slice(i, i + batchSize);
      const { error: variantsError } = await supabase
        .from('variants')
        .upsert(batch, { onConflict: 'product_id,size_eu' });
      
      if (variantsError) throw variantsError;
      insertedCount += batch.length;
      console.log(`  Inserted ${insertedCount}/${variants.length} variants...`);
    }

    console.log(`✓ Seeded ${variants.length} variants\n`);

    // 4. Initialize Market Stats
    console.log('📊 Initializing market stats...');
    const { data: allVariants, error: variantsSelectError } = await supabase
      .from('variants')
      .select('id');

    if (variantsSelectError) throw variantsSelectError;

    const marketStats = allVariants.map(v => ({
      variant_id: v.id,
      lowest_ask_ars: null,
      highest_bid_ars: null,
      last_sale_price_ars: null,
      total_asks: 0,
      total_bids: 0,
      total_sales: 0
    }));

    // Insert in batches
    insertedCount = 0;
    for (let i = 0; i < marketStats.length; i += batchSize) {
      const batch = marketStats.slice(i, i + batchSize);
      const { error: statsError } = await supabase
        .from('market_stats')
        .upsert(batch, { onConflict: 'variant_id' });
      
      if (statsError) throw statsError;
      insertedCount += batch.length;
      console.log(`  Initialized ${insertedCount}/${marketStats.length} market stats...`);
    }

    console.log(`✓ Initialized ${marketStats.length} market stats\n`);

    // Summary
    console.log('✅ Database seeding completed successfully!\n');
    console.log('Summary:');
    console.log(`  - ${brands.length} brands`);
    console.log(`  - ${products.length} products`);
    console.log(`  - ${variants.length} variants (sizes)`);
    console.log(`  - ${marketStats.length} market stats initialized`);
    console.log('\nNext steps:');
    console.log('  1. Visit http://localhost:3000/products');
    console.log('  2. Browse the product catalog');
    console.log('  3. Search for products\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

seedDatabase();
