#!/usr/bin/env node

/**
 * Fix infinite recursion in RLS policies for users table
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

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies for users table...\n');

  try {
    // Drop the problematic policy with circular reference
    console.log('1. Dropping old users_select_own policy...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      query: 'DROP POLICY IF EXISTS users_select_own ON users;'
    });

    if (dropError && dropError.code !== 'PGRST202') {
      console.error('Drop error:', dropError);
    } else {
      console.log('   ✓ Old policy dropped\n');
    }

    // Create new simple policy without circular reference
    console.log('2. Creating new users_select_own policy...');
    const { error: createError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE POLICY users_select_own ON users
        FOR SELECT USING (auth.uid() = auth_id);
      `
    });

    if (createError && createError.code !== 'PGRST202') {
      console.error('Create error:', createError);
    } else {
      console.log('   ✓ New policy created\n');
    }

    console.log('✅ RLS policies fixed!');
    console.log('\nNote: Since Supabase RPC might not support DDL,');
    console.log('you may need to run this via Supabase Dashboard SQL Editor:');
    console.log('\nDROP POLICY IF EXISTS users_select_own ON users;');
    console.log('CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = auth_id);');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixRLSPolicies();
