-- ============================================================================
-- SAVED PRODUCTS / FAVORITES TABLE
-- ============================================================================
-- Allows users to save/favorite products they're interested in

CREATE TABLE IF NOT EXISTS saved_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Metadata
  notes TEXT, -- Optional user notes about why they saved it
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, product_id) -- User can only save a product once
);

-- Indexes
CREATE INDEX idx_saved_products_user_id ON saved_products(user_id);
CREATE INDEX idx_saved_products_product_id ON saved_products(product_id);
CREATE INDEX idx_saved_products_created_at ON saved_products(created_at DESC);

-- RLS Policies
ALTER TABLE saved_products ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved products
CREATE POLICY "Users can view own saved products"
  ON saved_products FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Users can insert their own saved products
CREATE POLICY "Users can save products"
  ON saved_products FOR INSERT
  WITH CHECK (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Users can delete their own saved products
CREATE POLICY "Users can unsave products"
  ON saved_products FOR DELETE
  USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Trigger for updated_at
CREATE TRIGGER update_saved_products_updated_at
  BEFORE UPDATE ON saved_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
