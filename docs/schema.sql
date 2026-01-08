-- ============================================================================
-- Argentine StockX Clone - PostgreSQL Database Schema
-- ============================================================================
-- Description: Complete database schema for sneaker marketplace
-- Tech Stack: Supabase (PostgreSQL 15+)
-- Features: UUIDs, timestamps, RLS policies, indexes
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE listing_type AS ENUM ('bid', 'ask');
CREATE TYPE listing_status AS ENUM ('active', 'filled', 'expired', 'cancelled');
CREATE TYPE transaction_status AS ENUM (
  'pending_payment',
  'pending_shipment',
  'in_transit_to_auth',
  'authenticating',
  'authenticated',
  'authentication_failed',
  'shipped_to_buyer',
  'delivered',
  'completed',
  'cancelled',
  'refunded'
);
CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected', 'refunded');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Authentication (managed by Supabase Auth)
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  
  -- Profile
  full_name VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  
  -- Role & Verification
  role user_role DEFAULT 'buyer',
  verified_seller BOOLEAN DEFAULT FALSE,
  verified_email BOOLEAN DEFAULT FALSE,
  verified_phone BOOLEAN DEFAULT FALSE,
  
  -- Reputation & Trust
  reputation_score INTEGER DEFAULT 50 CHECK (reputation_score >= 0 AND reputation_score <= 100),
  total_sales INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  
  -- Payment Integration
  mercadopago_account_id VARCHAR(255),
  mercadopago_email VARCHAR(255),
  
  -- Address (for shipping)
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'AR',
  
  -- Moderation
  banned_at TIMESTAMP WITH TIME ZONE,
  ban_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_verified_seller ON users(verified_seller);

-- ============================================================================
-- BRANDS TABLE
-- ============================================================================

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_brands_slug ON brands(slug);

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  colorway VARCHAR(255),
  sku VARCHAR(100),
  
  -- Pricing
  retail_price_usd DECIMAL(10, 2),
  
  -- Details
  description TEXT,
  release_date DATE,
  gender VARCHAR(20), -- 'men', 'women', 'unisex', 'kids'
  
  -- Media
  image_url TEXT NOT NULL,
  image_urls TEXT[], -- Array of additional images
  
  -- Metadata
  featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  
  -- Stats (denormalized for performance)
  total_sales INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_featured ON products(featured);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_release_date ON products(release_date);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_colorway_trgm ON products USING gin(colorway gin_trgm_ops);

-- Full-text search
ALTER TABLE products ADD COLUMN search_vector tsvector;
CREATE INDEX idx_products_search ON products USING gin(search_vector);

-- ============================================================================
-- VARIANTS TABLE (Sizes)
-- ============================================================================

CREATE TABLE variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Product Reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Size Information
  size_eu DECIMAL(4, 1) NOT NULL, -- e.g., 42.5
  size_us DECIMAL(4, 1), -- e.g., 9.5
  size_uk DECIMAL(4, 1), -- e.g., 8.5
  size_cm DECIMAL(4, 1), -- e.g., 27.0
  
  -- Availability
  active BOOLEAN DEFAULT TRUE,
  
  -- Stats (denormalized)
  total_sales INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one size per product
  UNIQUE(product_id, size_eu)
);

-- Indexes
CREATE INDEX idx_variants_product_id ON variants(product_id);
CREATE INDEX idx_variants_size_eu ON variants(size_eu);
CREATE INDEX idx_variants_active ON variants(active);

-- ============================================================================
-- BIDS TABLE
-- ============================================================================

CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Bid Details
  price_ars DECIMAL(12, 2) NOT NULL CHECK (price_ars > 0),
  price_usd DECIMAL(10, 2), -- USD equivalent at time of bid
  usd_ars_rate DECIMAL(10, 4), -- Exchange rate used
  
  -- Status
  status listing_status DEFAULT 'active',
  
  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Matching (FK added after asks table exists)
  matched_ask_id UUID,
  matched_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bids_variant_id ON bids(variant_id);
CREATE INDEX idx_bids_user_id ON bids(user_id);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_bids_expires_at ON bids(expires_at);
CREATE INDEX idx_bids_price_ars ON bids(price_ars DESC);

-- ============================================================================
-- ASKS TABLE
-- ============================================================================

CREATE TABLE asks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Ask Details
  price_ars DECIMAL(12, 2) NOT NULL CHECK (price_ars > 0),
  price_usd DECIMAL(10, 2), -- USD equivalent at time of ask
  usd_ars_rate DECIMAL(10, 4), -- Exchange rate used
  
  -- Status
  status listing_status DEFAULT 'active',
  
  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Matching (FK added after both tables exist)
  matched_bid_id UUID,
  matched_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cross-reference foreign keys (added after both tables exist)
ALTER TABLE bids ADD CONSTRAINT fk_bids_matched_ask FOREIGN KEY (matched_ask_id) REFERENCES asks(id);
ALTER TABLE asks ADD CONSTRAINT fk_asks_matched_bid FOREIGN KEY (matched_bid_id) REFERENCES bids(id);

-- Indexes
CREATE INDEX idx_asks_variant_id ON asks(variant_id);
CREATE INDEX idx_asks_user_id ON asks(user_id);
CREATE INDEX idx_asks_status ON asks(status);
CREATE INDEX idx_asks_expires_at ON asks(expires_at);
CREATE INDEX idx_asks_price_ars ON asks(price_ars ASC);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  bid_id UUID NOT NULL REFERENCES bids(id),
  ask_id UUID NOT NULL REFERENCES asks(id),
  variant_id UUID NOT NULL REFERENCES variants(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  
  -- Pricing
  sale_price_ars DECIMAL(12, 2) NOT NULL,
  sale_price_usd DECIMAL(10, 2),
  usd_ars_rate DECIMAL(10, 4),
  
  -- Fees
  platform_fee_ars DECIMAL(10, 2) DEFAULT 0,
  authentication_fee_ars DECIMAL(10, 2) DEFAULT 0,
  shipping_fee_ars DECIMAL(10, 2) DEFAULT 0,
  total_buyer_payment_ars DECIMAL(12, 2) NOT NULL,
  
  -- Seller Payout (FK added after payouts table exists)
  seller_payout_ars DECIMAL(12, 2),
  payout_id UUID,
  
  -- Status
  status transaction_status DEFAULT 'pending_payment',
  
  -- Payment (Mercado Pago)
  payment_id VARCHAR(255), -- MP payment ID
  payment_status payment_status DEFAULT 'pending',
  payment_method VARCHAR(100),
  installments INTEGER DEFAULT 1,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Shipping to Authentication Center
  tracking_number_to_auth VARCHAR(255),
  carrier_to_auth VARCHAR(100),
  shipped_to_auth_at TIMESTAMP WITH TIME ZONE,
  arrived_at_auth_at TIMESTAMP WITH TIME ZONE,
  
  -- Authentication
  authenticated_by UUID REFERENCES users(id),
  authenticated_at TIMESTAMP WITH TIME ZONE,
  authentication_passed BOOLEAN,
  authentication_notes TEXT,
  authentication_images TEXT[], -- URLs to uploaded images
  
  -- Shipping to Buyer
  tracking_number_to_buyer VARCHAR(255),
  carrier_to_buyer VARCHAR(100),
  shipped_to_buyer_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Completion
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_bid_id ON transactions(bid_id);
CREATE INDEX idx_transactions_ask_id ON transactions(ask_id);
-- CRITICAL: Unique indexes for idempotency (prevent duplicate matches)
CREATE UNIQUE INDEX idx_transactions_bid_id_unique ON transactions(bid_id);
CREATE UNIQUE INDEX idx_transactions_ask_id_unique ON transactions(ask_id);
CREATE INDEX idx_transactions_variant_id ON transactions(variant_id);
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ============================================================================
-- PAYOUTS TABLE
-- ============================================================================

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  
  -- Amount
  amount_ars DECIMAL(12, 2) NOT NULL,
  
  -- Mercado Pago
  mp_transfer_id VARCHAR(255),
  mp_status VARCHAR(50),
  
  -- Status
  status payout_status DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT
);

-- Indexes
CREATE INDEX idx_payouts_transaction_id ON payouts(transaction_id);
CREATE INDEX idx_payouts_seller_id ON payouts(seller_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- FK for transactions.payout_id (added after payouts table exists)
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_payout FOREIGN KEY (payout_id) REFERENCES payouts(id);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  type VARCHAR(50) NOT NULL, -- 'bid_matched', 'ask_matched', 'payment_received', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Links
  link_url TEXT,
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- PRICE_HISTORY TABLE
-- ============================================================================

CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id),
  
  -- Price Data
  price_ars DECIMAL(12, 2) NOT NULL,
  price_usd DECIMAL(10, 2),
  
  -- Timestamp
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_price_history_variant_id ON price_history(variant_id);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at DESC);

-- ============================================================================
-- MARKET_STATS TABLE (Materialized View for Performance)
-- ============================================================================

CREATE TABLE market_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  variant_id UUID UNIQUE NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  
  -- Current Market Data
  lowest_ask_ars DECIMAL(12, 2),
  lowest_ask_id UUID REFERENCES asks(id),
  highest_bid_ars DECIMAL(12, 2),
  highest_bid_id UUID REFERENCES bids(id),
  
  -- Last Sale
  last_sale_price_ars DECIMAL(12, 2),
  last_sale_at TIMESTAMP WITH TIME ZONE,
  
  -- Statistics
  total_asks INTEGER DEFAULT 0,
  total_bids INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  avg_sale_price_ars DECIMAL(12, 2),
  
  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_market_stats_variant_id ON market_stats(variant_id);

-- ============================================================================
-- EXCHANGE_RATES TABLE
-- ============================================================================

CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Rate Data
  rate_type VARCHAR(50) NOT NULL, -- 'official', 'blue', 'mep'
  usd_to_ars DECIMAL(10, 4) NOT NULL,
  
  -- Source
  source VARCHAR(100), -- 'dolarapi.com', 'manual', etc.
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_exchange_rates_rate_type ON exchange_rates(rate_type);
CREATE INDEX idx_exchange_rates_created_at ON exchange_rates(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asks_updated_at BEFORE UPDATE ON asks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update product search vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.colorway, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_search_vector BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE asks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Users: Can read own profile, admins can read all
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = auth_id OR EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Brands: Public read, admin write
CREATE POLICY brands_select_all ON brands FOR SELECT USING (true);
CREATE POLICY brands_insert_admin ON brands FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- Products: Public read, admin write
CREATE POLICY products_select_all ON products FOR SELECT USING (true);
CREATE POLICY products_insert_admin ON products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- Variants: Public read, admin write
CREATE POLICY variants_select_all ON variants FOR SELECT USING (true);
CREATE POLICY variants_insert_admin ON variants FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- Bids: Users can read own bids and active bids for products, can insert own
CREATE POLICY bids_select_own_or_active ON bids
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
    status = 'active'
  );

CREATE POLICY bids_insert_own ON bids
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY bids_update_own ON bids
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Asks: Users can read own asks and active asks for products, can insert own
CREATE POLICY asks_select_own_or_active ON asks
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
    status = 'active'
  );

CREATE POLICY asks_insert_own ON asks
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY asks_update_own ON asks
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Transactions: Users can read own transactions, admins can read all
CREATE POLICY transactions_select_own_or_admin ON transactions
  FOR SELECT USING (
    buyer_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
    seller_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- Payouts: Users can read own payouts, admins can read all
CREATE POLICY payouts_select_own_or_admin ON payouts
  FOR SELECT USING (
    seller_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- Notifications: Users can read own notifications
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Price History: Public read
CREATE POLICY price_history_select_all ON price_history FOR SELECT USING (true);

-- Market Stats: Public read
CREATE POLICY market_stats_select_all ON market_stats FOR SELECT USING (true);

-- Exchange Rates: Public read
CREATE POLICY exchange_rates_select_all ON exchange_rates FOR SELECT USING (true);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert popular brands
INSERT INTO brands (name, slug, description) VALUES
  ('Nike', 'nike', 'American multinational corporation that designs, develops, and sells footwear, apparel, and accessories.'),
  ('Adidas', 'adidas', 'German multinational corporation that designs and manufactures shoes, clothing and accessories.'),
  ('Jordan', 'jordan', 'Nike sub-brand named after basketball legend Michael Jordan.'),
  ('New Balance', 'new-balance', 'American sports footwear and apparel brand.'),
  ('Puma', 'puma', 'German multinational corporation that designs and manufactures athletic and casual footwear.'),
  ('Vans', 'vans', 'American manufacturer of skateboarding shoes and apparel.'),
  ('Converse', 'converse', 'American shoe company that designs, distributes, and licenses sneakers, apparel, and accessories.');

-- Insert sample exchange rate
INSERT INTO exchange_rates (rate_type, usd_to_ars, source) VALUES
  ('blue', 1350.00, 'manual'),
  ('mep', 1320.00, 'manual'),
  ('official', 1050.00, 'manual');

-- ============================================================================
-- FUNCTIONS FOR MATCHING ENGINE
-- ============================================================================

-- Function to find matching ask for a new bid
CREATE OR REPLACE FUNCTION find_matching_ask(p_variant_id UUID, p_bid_price DECIMAL)
RETURNS UUID AS $$
DECLARE
  v_ask_id UUID;
BEGIN
  SELECT id INTO v_ask_id
  FROM asks
  WHERE variant_id = p_variant_id
    AND status = 'active'
    AND price_ars <= p_bid_price
    AND expires_at > NOW()
  ORDER BY price_ars ASC, created_at ASC
  LIMIT 1;
  
  RETURN v_ask_id;
END;
$$ LANGUAGE plpgsql;

-- Function to find matching bid for a new ask
CREATE OR REPLACE FUNCTION find_matching_bid(p_variant_id UUID, p_ask_price DECIMAL)
RETURNS UUID AS $$
DECLARE
  v_bid_id UUID;
BEGIN
  SELECT id INTO v_bid_id
  FROM bids
  WHERE variant_id = p_variant_id
    AND status = 'active'
    AND price_ars >= p_ask_price
    AND expires_at > NOW()
  ORDER BY price_ars DESC, created_at ASC
  LIMIT 1;
  
  RETURN v_bid_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update market stats for a variant
CREATE OR REPLACE FUNCTION update_market_stats(p_variant_id UUID)
RETURNS VOID AS $$
DECLARE
  v_lowest_ask DECIMAL;
  v_lowest_ask_id UUID;
  v_highest_bid DECIMAL;
  v_highest_bid_id UUID;
  v_last_sale_price DECIMAL;
  v_last_sale_at TIMESTAMP;
  v_total_asks INTEGER;
  v_total_bids INTEGER;
  v_total_sales INTEGER;
  v_avg_sale_price DECIMAL;
BEGIN
  -- Get lowest ask
  SELECT price_ars, id INTO v_lowest_ask, v_lowest_ask_id
  FROM asks
  WHERE variant_id = p_variant_id AND status = 'active' AND expires_at > NOW()
  ORDER BY price_ars ASC
  LIMIT 1;
  
  -- Get highest bid
  SELECT price_ars, id INTO v_highest_bid, v_highest_bid_id
  FROM bids
  WHERE variant_id = p_variant_id AND status = 'active' AND expires_at > NOW()
  ORDER BY price_ars DESC
  LIMIT 1;
  
  -- Get last sale
  SELECT sale_price_ars, completed_at INTO v_last_sale_price, v_last_sale_at
  FROM transactions
  WHERE variant_id = p_variant_id AND status = 'completed'
  ORDER BY completed_at DESC
  LIMIT 1;
  
  -- Get counts
  SELECT COUNT(*) INTO v_total_asks FROM asks WHERE variant_id = p_variant_id AND status = 'active';
  SELECT COUNT(*) INTO v_total_bids FROM bids WHERE variant_id = p_variant_id AND status = 'active';
  SELECT COUNT(*) INTO v_total_sales FROM transactions WHERE variant_id = p_variant_id AND status = 'completed';
  
  -- Get average sale price
  SELECT AVG(sale_price_ars) INTO v_avg_sale_price
  FROM transactions
  WHERE variant_id = p_variant_id AND status = 'completed';
  
  -- Upsert market stats
  INSERT INTO market_stats (
    variant_id, lowest_ask_ars, lowest_ask_id, highest_bid_ars, highest_bid_id,
    last_sale_price_ars, last_sale_at, total_asks, total_bids, total_sales, avg_sale_price_ars
  ) VALUES (
    p_variant_id, v_lowest_ask, v_lowest_ask_id, v_highest_bid, v_highest_bid_id,
    v_last_sale_price, v_last_sale_at, v_total_asks, v_total_bids, v_total_sales, v_avg_sale_price
  )
  ON CONFLICT (variant_id) DO UPDATE SET
    lowest_ask_ars = EXCLUDED.lowest_ask_ars,
    lowest_ask_id = EXCLUDED.lowest_ask_id,
    highest_bid_ars = EXCLUDED.highest_bid_ars,
    highest_bid_id = EXCLUDED.highest_bid_id,
    last_sale_price_ars = EXCLUDED.last_sale_price_ars,
    last_sale_at = EXCLUDED.last_sale_at,
    total_asks = EXCLUDED.total_asks,
    total_bids = EXCLUDED.total_bids,
    total_sales = EXCLUDED.total_sales,
    avg_sale_price_ars = EXCLUDED.avg_sale_price_ars,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Active Listings with Product Details
CREATE OR REPLACE VIEW active_listings AS
SELECT 
  'bid' as listing_type,
  b.id,
  b.variant_id,
  b.user_id,
  b.price_ars,
  b.status,
  b.expires_at,
  b.created_at,
  p.id as product_id,
  p.name as product_name,
  p.colorway,
  p.image_url,
  v.size_eu,
  v.size_us,
  u.full_name as user_name
FROM bids b
JOIN variants v ON b.variant_id = v.id
JOIN products p ON v.product_id = p.id
JOIN users u ON b.user_id = u.id
WHERE b.status = 'active' AND b.expires_at > NOW()

UNION ALL

SELECT 
  'ask' as listing_type,
  a.id,
  a.variant_id,
  a.user_id,
  a.price_ars,
  a.status,
  a.expires_at,
  a.created_at,
  p.id as product_id,
  p.name as product_name,
  p.colorway,
  p.image_url,
  v.size_eu,
  v.size_us,
  u.full_name as user_name
FROM asks a
JOIN variants v ON a.variant_id = v.id
JOIN products p ON v.product_id = p.id
JOIN users u ON a.user_id = u.id
WHERE a.status = 'active' AND a.expires_at > NOW();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with authentication, profile, and payment information';
COMMENT ON TABLE brands IS 'Sneaker brands (Nike, Adidas, etc.)';
COMMENT ON TABLE products IS 'Sneaker products with details and media';
COMMENT ON TABLE variants IS 'Size variants for each product';
COMMENT ON TABLE bids IS 'Buy orders from users';
COMMENT ON TABLE asks IS 'Sell orders from users';
COMMENT ON TABLE transactions IS 'Matched bid/ask pairs with payment and shipping tracking';
COMMENT ON TABLE payouts IS 'Seller payouts via Mercado Pago';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON TABLE price_history IS 'Historical price data for market analysis';
COMMENT ON TABLE market_stats IS 'Cached market statistics for performance';
COMMENT ON TABLE exchange_rates IS 'USD to ARS exchange rates';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
