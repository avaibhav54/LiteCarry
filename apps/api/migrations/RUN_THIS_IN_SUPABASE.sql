-- ============================================================
-- IMPORTANT: Run this SQL in Supabase SQL Editor
-- ============================================================
-- This file contains all database migrations for the Luggage Shop
--
-- Steps:
-- 1. Open Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Copy and paste this entire file
-- 5. Click "Run"
--
-- This script is idempotent and safe to run multiple times
-- ============================================================

-- =====================================================
-- MIGRATION 001: INITIAL SCHEMA
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
  compare_at_price DECIMAL(10, 2) CHECK (compare_at_price >= 0),
  brand VARCHAR(100),
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  sku VARCHAR(100) UNIQUE NOT NULL,
  weight_kg DECIMAL(8, 2),
  dimensions_cm JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  search_vector tsvector,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_categories (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_path VARCHAR(500) NOT NULL,
  display_order INTEGER DEFAULT 0,
  alt_text VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PRODUCT VARIANTS
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  price_adjustment DECIMAL(10, 2) DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  attributes JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_email VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  shipping_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  shipping_name VARCHAR(255) NOT NULL,
  shipping_email VARCHAR(255) NOT NULL,
  shipping_phone VARCHAR(50),
  shipping_address_line1 VARCHAR(255) NOT NULL,
  shipping_address_line2 VARCHAR(255),
  shipping_city VARCHAR(100) NOT NULL,
  shipping_state VARCHAR(100),
  shipping_postal_code VARCHAR(20) NOT NULL,
  shipping_country VARCHAR(2) NOT NULL,
  billing_same_as_shipping BOOLEAN DEFAULT true,
  billing_address JSONB,
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name VARCHAR(500) NOT NULL,
  variant_name VARCHAR(255),
  sku VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- WISHLISTS
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ADMIN USERS
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PRODUCT VIEWS
CREATE TABLE IF NOT EXISTS product_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- MIGRATION 002: INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_metadata ON users USING GIN(metadata);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published, created_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured, created_at DESC) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_price ON products(base_price);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_quantity) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_brand_trgm ON products USING GIN(brand gin_trgm_ops);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active_order ON categories(is_active, display_order) WHERE is_active = true;

-- Product categories indexes
CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);

-- Product images indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id, display_order);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id) WHERE is_primary = true;

-- Product variants indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON product_variants(stock_quantity);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, is_approved, created_at DESC) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(product_id, rating) WHERE is_approved = true;
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(product_id) WHERE is_verified_purchase = true AND is_approved = true;

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_guest ON orders(guest_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_intent ON orders(stripe_payment_intent_id);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Wishlists indexes
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON wishlists(product_id);

-- Admin users indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email) WHERE is_active = true;

-- Product views indexes
CREATE INDEX IF NOT EXISTS idx_product_views_product_date ON product_views(product_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_session ON product_views(session_id);

-- =====================================================
-- MIGRATION 003: SEARCH AND TRIGGERS
-- =====================================================

-- Function to update search vector on products
CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.sku, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search vector
DROP TRIGGER IF EXISTS products_search_vector_trigger ON products;
CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

-- Materialized view for product ratings
DROP MATERIALIZED VIEW IF EXISTS product_ratings;
CREATE MATERIALIZED VIEW product_ratings AS
SELECT
  product_id,
  COUNT(*) as review_count,
  AVG(rating)::NUMERIC(3,2) as avg_rating,
  COUNT(*) FILTER (WHERE rating = 5) as five_star_count,
  COUNT(*) FILTER (WHERE rating = 4) as four_star_count,
  COUNT(*) FILTER (WHERE rating = 3) as three_star_count,
  COUNT(*) FILTER (WHERE rating = 2) as two_star_count,
  COUNT(*) FILTER (WHERE rating = 1) as one_star_count
FROM reviews
WHERE is_approved = true
GROUP BY product_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_ratings_product ON product_ratings(product_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to decrement stock
CREATE OR REPLACE FUNCTION decrement_product_stock(
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity INTEGER
) RETURNS VOID AS $$
BEGIN
  IF p_variant_id IS NOT NULL THEN
    UPDATE product_variants
    SET stock_quantity = stock_quantity - p_quantity
    WHERE id = p_variant_id AND stock_quantity >= p_quantity;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for variant %', p_variant_id;
    END IF;
  ELSE
    UPDATE products
    SET stock_quantity = stock_quantity - p_quantity
    WHERE id = p_product_id AND stock_quantity >= p_quantity;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    new_number := 'LUG-' ||
                  TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                  LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = new_number) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users: can only view/update their own data
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Orders: users can only see their own orders
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (
    auth.uid() = user_id OR
    guest_email = (SELECT email FROM users WHERE id = auth.uid())
  );

-- Order items: accessible if order is accessible
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE user_id = auth.uid() OR
            guest_email = (SELECT email FROM users WHERE id = auth.uid())
    )
  );

-- Wishlists: users can manage their own wishlists
DROP POLICY IF EXISTS "Users can manage own wishlists" ON wishlists;
CREATE POLICY "Users can manage own wishlists" ON wishlists
  FOR ALL USING (auth.uid() = user_id);

-- Reviews: users can view approved reviews, manage their own
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON reviews;
CREATE POLICY "Anyone can view approved reviews" ON reviews
  FOR SELECT USING (is_approved = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- STORAGE BUCKET FOR PRODUCT IMAGES
-- =====================================================

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Public read access for product images
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Admin upload policy (requires admin authentication)
DROP POLICY IF EXISTS "Admin upload" ON storage.objects;
CREATE POLICY "Admin upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' AND
    auth.jwt() ->> 'role' = 'admin'
  );

-- =====================================================
-- SEED DATA (Optional - for development)
-- =====================================================

-- Insert sample categories
INSERT INTO categories (slug, name, description, display_order, is_active)
VALUES
  ('carry-on', 'Carry-On Luggage', 'Perfect for short trips and business travel', 1, true),
  ('checked', 'Checked Luggage', 'Spacious luggage for longer journeys', 2, true),
  ('backpacks', 'Travel Backpacks', 'Versatile backpacks for the modern traveler', 3, true),
  ('accessories', 'Travel Accessories', 'Essential accessories for your journey', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables created
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verify indexes created
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All migrations completed successfully!';
  RAISE NOTICE 'Tables created: %', (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public');
  RAISE NOTICE 'Indexes created: %', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public');
END $$;
