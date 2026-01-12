-- ============================================================================
-- ADD SAVED_PRODUCTS TABLE MIGRATION
-- ============================================================================
-- 
-- This migration adds the missing saved_products table to your existing
-- Supabase database. Run this in the Supabase SQL Editor.
--
-- ============================================================================

-- Create saved_products table
CREATE TABLE IF NOT EXISTS saved_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user can't save same product twice
  UNIQUE(user_id, product_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_products_user_id ON saved_products(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_products_product_id ON saved_products(product_id);
CREATE INDEX IF NOT EXISTS idx_saved_products_created_at ON saved_products(created_at DESC);

-- Enable RLS
ALTER TABLE saved_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY saved_products_select_own ON saved_products
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY saved_products_insert_own ON saved_products
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY saved_products_delete_own ON saved_products
  FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Verification query
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'saved_products'
ORDER BY ordinal_position;
