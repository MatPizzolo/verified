#!/usr/bin/env tsx
/**
 * Standalone Test Script for Supabase Functions
 * 
 * Tests the consolidated bid/ask creation logic directly in Supabase
 * Run with: npx tsx scripts/test-supabase-functions.ts
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Test data
let testVariantId: string;
let testUserId: string;
let createdBidId: string;
let createdAskId: string;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function setup() {
  log('\n🔧 Setting up test environment...', 'cyan');
  
  // Get a test variant
  const { data: variant, error: variantError } = await supabase
    .from('variants')
    .select('id')
    .limit(1)
    .single();
  
  if (variantError || !variant) {
    throw new Error('No variants found. Run seed script first.');
  }
  
  testVariantId = variant.id;
  log(`✓ Found test variant: ${testVariantId}`, 'green');
  
  // Get a test user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .limit(1)
    .single();
  
  if (userError || !user) {
    throw new Error('No users found. Run seed script first.');
  }
  
  testUserId = user.id;
  log(`✓ Found test user: ${testUserId}`, 'green');
}

async function testCreateBid() {
  log('\n📝 Test 1: Create valid bid', 'blue');
  
  try {
    const { data, error } = await supabase.rpc('create_bid_or_ask', {
      p_listing_type: 'bid',
      p_variant_id: testVariantId,
      p_user_id: testUserId,
      p_price_ars: 10000000, // 100,000.00 ARS
      p_expires_at: null
    });
    
    if (error) {
      log(`✗ Failed: ${error.message}`, 'red');
      return false;
    }
    
    createdBidId = data.id;
    log(`✓ Success: Created bid ${data.id}`, 'green');
    log(`  Price: ${data.price_ars} centavos (${data.price_ars / 100} ARS)`, 'reset');
    log(`  USD: ${data.price_usd} cents`, 'reset');
    log(`  Rate: ${data.usd_ars_rate}`, 'reset');
    return true;
  } catch (err) {
    log(`✗ Exception: ${err}`, 'red');
    return false;
  }
}

async function testCreateAsk() {
  log('\n📝 Test 2: Create valid ask', 'blue');
  
  try {
    const { data, error } = await supabase.rpc('create_bid_or_ask', {
      p_listing_type: 'ask',
      p_variant_id: testVariantId,
      p_user_id: testUserId,
      p_price_ars: 9500000, // 95,000.00 ARS
      p_expires_at: null
    });
    
    if (error) {
      log(`✗ Failed: ${error.message}`, 'red');
      return false;
    }
    
    createdAskId = data.id;
    log(`✓ Success: Created ask ${data.id}`, 'green');
    log(`  Price: ${data.price_ars} centavos (${data.price_ars / 100} ARS)`, 'reset');
    return true;
  } catch (err) {
    log(`✗ Exception: ${err}`, 'red');
    return false;
  }
}

async function testInvalidPrice() {
  log('\n📝 Test 3: Reject negative price', 'blue');
  
  try {
    const { data, error } = await supabase.rpc('create_bid_or_ask', {
      p_listing_type: 'bid',
      p_variant_id: testVariantId,
      p_user_id: testUserId,
      p_price_ars: -1000, // Invalid: negative
      p_expires_at: null
    });
    
    if (error && error.message.includes('positive')) {
      log(`✓ Correctly rejected: ${error.message}`, 'green');
      return true;
    }
    
    log('✗ Should have failed but succeeded', 'red');
    return false;
  } catch (err) {
    log(`✗ Unexpected exception: ${err}`, 'red');
    return false;
  }
}

async function testZeroPrice() {
  log('\n📝 Test 4: Reject zero price', 'blue');
  
  try {
    const { data, error } = await supabase.rpc('create_bid_or_ask', {
      p_listing_type: 'bid',
      p_variant_id: testVariantId,
      p_user_id: testUserId,
      p_price_ars: 0, // Invalid: zero
      p_expires_at: null
    });
    
    if (error && error.message.includes('positive')) {
      log(`✓ Correctly rejected: ${error.message}`, 'green');
      return true;
    }
    
    log('✗ Should have failed but succeeded', 'red');
    return false;
  } catch (err) {
    log(`✗ Unexpected exception: ${err}`, 'red');
    return false;
  }
}

async function testInvalidVariant() {
  log('\n📝 Test 5: Reject invalid variant', 'blue');
  
  try {
    const { data, error } = await supabase.rpc('create_bid_or_ask', {
      p_listing_type: 'bid',
      p_variant_id: '00000000-0000-0000-0000-000000000000',
      p_user_id: testUserId,
      p_price_ars: 10000000,
      p_expires_at: null
    });
    
    if (error && error.message.includes('Variant not found')) {
      log(`✓ Correctly rejected: ${error.message}`, 'green');
      return true;
    }
    
    log('✗ Should have failed with variant error', 'red');
    return false;
  } catch (err) {
    log(`✗ Unexpected exception: ${err}`, 'red');
    return false;
  }
}

async function testInvalidListingType() {
  log('\n📝 Test 6: Reject invalid listing type', 'blue');
  
  try {
    const { data, error } = await supabase.rpc('create_bid_or_ask', {
      p_listing_type: 'invalid',
      p_variant_id: testVariantId,
      p_user_id: testUserId,
      p_price_ars: 10000000,
      p_expires_at: null
    });
    
    if (error && error.message.includes('Invalid listing type')) {
      log(`✓ Correctly rejected: ${error.message}`, 'green');
      return true;
    }
    
    log('✗ Should have failed with listing type error', 'red');
    return false;
  } catch (err) {
    log(`✗ Unexpected exception: ${err}`, 'red');
    return false;
  }
}

async function testCancelBid() {
  log('\n📝 Test 7: Cancel bid', 'blue');
  
  if (!createdBidId) {
    log('⚠ Skipping: No bid to cancel', 'yellow');
    return true;
  }
  
  try {
    const { data, error } = await supabase.rpc('cancel_listing', {
      p_listing_type: 'bid',
      p_listing_id: createdBidId,
      p_user_id: testUserId
    });
    
    if (error) {
      log(`✗ Failed: ${error.message}`, 'red');
      return false;
    }
    
    log(`✓ Success: Cancelled bid ${data.id}`, 'green');
    log(`  New status: ${data.status}`, 'reset');
    return true;
  } catch (err) {
    log(`✗ Exception: ${err}`, 'red');
    return false;
  }
}

async function testCancelAlreadyCancelled() {
  log('\n📝 Test 8: Reject cancelling already cancelled bid', 'blue');
  
  if (!createdBidId) {
    log('⚠ Skipping: No bid to test', 'yellow');
    return true;
  }
  
  try {
    const { data, error } = await supabase.rpc('cancel_listing', {
      p_listing_type: 'bid',
      p_listing_id: createdBidId,
      p_user_id: testUserId
    });
    
    if (error && error.message.includes('cannot be cancelled')) {
      log(`✓ Correctly rejected: ${error.message}`, 'green');
      return true;
    }
    
    log('✗ Should have failed but succeeded', 'red');
    return false;
  } catch (err) {
    log(`✗ Unexpected exception: ${err}`, 'red');
    return false;
  }
}

async function testPriceConversion() {
  log('\n📝 Test 9: Verify price conversion accuracy', 'blue');
  
  try {
    const testPrice = 12345678; // 123,456.78 ARS
    
    const { data, error } = await supabase.rpc('create_bid_or_ask', {
      p_listing_type: 'bid',
      p_variant_id: testVariantId,
      p_user_id: testUserId,
      p_price_ars: testPrice,
      p_expires_at: null
    });
    
    if (error) {
      log(`✗ Failed: ${error.message}`, 'red');
      return false;
    }
    
    // Verify price is stored correctly
    if (data.price_ars !== testPrice) {
      log(`✗ Price mismatch: expected ${testPrice}, got ${data.price_ars}`, 'red');
      return false;
    }
    
    // Verify USD conversion is an integer
    if (!Number.isInteger(data.price_usd)) {
      log(`✗ USD price is not an integer: ${data.price_usd}`, 'red');
      return false;
    }
    
    log(`✓ Success: Price conversion accurate`, 'green');
    log(`  ARS: ${data.price_ars} centavos`, 'reset');
    log(`  USD: ${data.price_usd} cents`, 'reset');
    
    // Clean up
    await supabase.rpc('cancel_listing', {
      p_listing_type: 'bid',
      p_listing_id: data.id,
      p_user_id: testUserId
    });
    
    return true;
  } catch (err) {
    log(`✗ Exception: ${err}`, 'red');
    return false;
  }
}

async function testExpirationDefault() {
  log('\n📝 Test 10: Verify default expiration (30 days)', 'blue');
  
  try {
    const { data, error } = await supabase.rpc('create_bid_or_ask', {
      p_listing_type: 'bid',
      p_variant_id: testVariantId,
      p_user_id: testUserId,
      p_price_ars: 10000000,
      p_expires_at: null // Should default to 30 days
    });
    
    if (error) {
      log(`✗ Failed: ${error.message}`, 'red');
      return false;
    }
    
    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    const diffDays = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 29 || diffDays > 31) {
      log(`✗ Expiration not ~30 days: ${diffDays} days`, 'red');
      return false;
    }
    
    log(`✓ Success: Default expiration set to ${diffDays} days`, 'green');
    
    // Clean up
    await supabase.rpc('cancel_listing', {
      p_listing_type: 'bid',
      p_listing_id: data.id,
      p_user_id: testUserId
    });
    
    return true;
  } catch (err) {
    log(`✗ Exception: ${err}`, 'red');
    return false;
  }
}

async function cleanup() {
  log('\n🧹 Cleaning up test data...', 'cyan');
  
  // Cancel any remaining test listings
  if (createdAskId) {
    await supabase.rpc('cancel_listing', {
      p_listing_type: 'ask',
      p_listing_id: createdAskId,
      p_user_id: testUserId
    }).catch(() => {});
  }
  
  log('✓ Cleanup complete', 'green');
}

async function runAllTests() {
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║       🧪 Supabase Functions Test Suite                    ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  try {
    await setup();
    
    const tests = [
      { name: 'Create Bid', fn: testCreateBid },
      { name: 'Create Ask', fn: testCreateAsk },
      { name: 'Invalid Price (Negative)', fn: testInvalidPrice },
      { name: 'Invalid Price (Zero)', fn: testZeroPrice },
      { name: 'Invalid Variant', fn: testInvalidVariant },
      { name: 'Invalid Listing Type', fn: testInvalidListingType },
      { name: 'Cancel Bid', fn: testCancelBid },
      { name: 'Cancel Already Cancelled', fn: testCancelAlreadyCancelled },
      { name: 'Price Conversion', fn: testPriceConversion },
      { name: 'Expiration Default', fn: testExpirationDefault },
    ];
    
    const results = [];
    for (const test of tests) {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    }
    
    await cleanup();
    
    // Summary
    log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║                     📊 Test Results                        ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const percentage = Math.round((passed / total) * 100);
    
    results.forEach(r => {
      const icon = r.passed ? '✓' : '✗';
      const color = r.passed ? 'green' : 'red';
      log(`  ${icon} ${r.name}`, color);
    });
    
    log('', 'reset');
    log(`  Total: ${passed}/${total} tests passed (${percentage}%)`, 'cyan');
    
    if (passed === total) {
      log('\n  ✅ All tests passed!', 'green');
      process.exit(0);
    } else {
      log(`\n  ❌ ${total - passed} test(s) failed`, 'red');
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Fatal error: ${error}`, 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests();
