-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE users IS 'User accounts for guest checkout and optional registration';
COMMENT ON COLUMN users.metadata IS 'Additional user data stored as JSONB';

-- =====================================================
-- PRODUCTS
-- =====================================================

CREATE TABLE products (
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
  dimensions_cm JSONB, -- {length, width, height}
  metadata JSONB DEFAULT '{}'::jsonb,
  search_vector tsvector, -- For full-text search
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE products IS 'Main product catalog';
COMMENT ON COLUMN products.search_vector IS 'Full-text search vector auto-updated via trigger';
COMMENT ON COLUMN products.dimensions_cm IS 'Product dimensions stored as JSONB: {length, width, height}';

-- =====================================================
-- CATEGORIES
-- =====================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Product categories with hierarchical structure';

-- Many-to-many relationship
CREATE TABLE product_categories (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- =====================================================
-- PRODUCT IMAGES
-- =====================================================

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_path VARCHAR(500) NOT NULL, -- Supabase Storage path
  display_order INTEGER DEFAULT 0,
  alt_text VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN product_images.storage_path IS 'Path in Supabase Storage bucket';

-- =====================================================
-- PRODUCT VARIANTS (Colors, Sizes, etc.)
-- =====================================================

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL, -- e.g., "Black / Large"
  price_adjustment DECIMAL(10, 2) DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  attributes JSONB NOT NULL, -- {color: "black", size: "large"}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN product_variants.attributes IS 'Variant attributes as JSONB: {color, size, etc}';

-- =====================================================
-- REVIEWS & RATINGS
-- =====================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id UUID, -- Will reference orders table
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE reviews IS 'Product reviews and ratings from customers';
COMMENT ON COLUMN reviews.is_verified_purchase IS 'True if user purchased the product';

-- =====================================================
-- ORDERS
-- =====================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_email VARCHAR(255), -- For guest checkout
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  shipping_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  currency VARCHAR(3) DEFAULT 'USD',

  -- Shipping details
  shipping_name VARCHAR(255) NOT NULL,
  shipping_email VARCHAR(255) NOT NULL,
  shipping_phone VARCHAR(50),
  shipping_address_line1 VARCHAR(255) NOT NULL,
  shipping_address_line2 VARCHAR(255),
  shipping_city VARCHAR(100) NOT NULL,
  shipping_state VARCHAR(100),
  shipping_postal_code VARCHAR(20) NOT NULL,
  shipping_country VARCHAR(2) NOT NULL,

  -- Billing details (if different)
  billing_same_as_shipping BOOLEAN DEFAULT true,
  billing_address JSONB,

  -- Stripe payment details
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),

  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE orders IS 'Customer orders with payment and shipping details';
COMMENT ON COLUMN orders.guest_email IS 'Email for guest checkout without account';

-- =====================================================
-- ORDER ITEMS
-- =====================================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name VARCHAR(500) NOT NULL, -- Snapshot at time of order
  variant_name VARCHAR(255),
  sku VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE order_items IS 'Line items for orders with product snapshots';

-- =====================================================
-- WISHLISTS
-- =====================================================

CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

COMMENT ON TABLE wishlists IS 'User wishlists for saved products';

-- =====================================================
-- ADMIN USERS
-- =====================================================

CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin', -- admin, super_admin
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admin_users IS 'Admin panel users with role-based access';

-- =====================================================
-- PRODUCT VIEWS (Analytics)
-- =====================================================

CREATE TABLE product_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE product_views IS 'Product view tracking for analytics';
