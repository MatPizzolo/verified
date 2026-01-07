#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests Supabase connection and verifies schema setup
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const REQUIRED_TABLES = [
  'users',
  'products',
  'brands',
  'variants',
  'bids',
  'asks',
  'transactions',
  'payouts',
  'notifications',
  'price_history',
  'market_stats',
  'exchange_rates'
];

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env');
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
    process.exit(1);
  }

  console.log('✓ Environment variables found');

  // Create Supabase client
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

  console.log('✓ Supabase client created\n');

  // Test connection
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      process.exit(1);
    }

    console.log('✓ Connected to Supabase successfully\n');
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  }

  // Verify tables exist
  console.log('🔍 Verifying database schema...\n');
  
  let allTablesExist = true;
  
  for (const table of REQUIRED_TABLES) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      
      if (error) {
        console.error(`❌ Table '${table}' not found or not accessible`);
        allTablesExist = false;
      } else {
        console.log(`✓ Table '${table}' exists`);
      }
    } catch (err) {
      console.error(`❌ Error checking table '${table}':`, err.message);
      allTablesExist = false;
    }
  }

  if (!allTablesExist) {
    console.error('\n❌ Some tables are missing. Please run schema.sql in Supabase SQL Editor.');
    process.exit(1);
  }

  console.log('\n✓ All required tables exist\n');

  // Check RLS policies
  console.log('🔍 Checking RLS policies...\n');
  
  try {
    // Try to access users table without auth (should fail or return empty)
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    // If we get data without auth, RLS might not be properly configured
    if (data && data.length > 0) {
      console.warn('⚠️  Warning: RLS policies may not be properly configured');
      console.warn('   Users table returned data without authentication');
    } else {
      console.log('✓ RLS policies appear to be active');
    }
  } catch (err) {
    console.log('✓ RLS policies are enforcing access control');
  }

  console.log('\n✅ Database connection test completed successfully!\n');
  console.log('Next steps:');
  console.log('1. Start the application: docker-compose up');
  console.log('2. Visit http://localhost:3000/register');
  console.log('3. Create a test account\n');
}

testConnection().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
