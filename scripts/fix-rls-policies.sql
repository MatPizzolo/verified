-- Fix infinite recursion in RLS policies for users table
-- The issue: users_select_own policy references users table while checking users table
-- This creates infinite recursion when querying users

-- Drop the problematic policies
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;

-- Recreate without circular references
-- Simple policy: users can read their own profile
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = auth_id);

-- Users can update their own profile
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Note: Admin access should be handled via service role key (createAdminClient)
-- Not through RLS policies to avoid circular dependencies
