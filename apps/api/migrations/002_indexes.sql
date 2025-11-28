-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_metadata ON users USING GIN(metadata);

-- Products indexes (critical for performance)
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_published ON products(is_published, created_at DESC) WHERE is_published = true;
CREATE INDEX idx_products_featured ON products(is_featured, created_at DESC) WHERE is_featured = true;
CREATE INDEX idx_products_price ON products(base_price);
CREATE INDEX idx_products_brand ON products(brand) WHERE is_published = true;
CREATE INDEX idx_products_stock ON products(stock_quantity) WHERE is_published = true;
CREATE INDEX idx_products_sku ON products(sku);

-- Full-text search indexes
CREATE INDEX idx_products_search_vector ON products USING GIN(search_vector);
CREATE INDEX idx_products_name_trgm ON products USING GIN(name gin_trgm_ops);
CREATE INDEX idx_products_brand_trgm ON products USING GIN(brand gin_trgm_ops);

-- Categories indexes
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active_order ON categories(is_active, display_order) WHERE is_active = true;

-- Product categories indexes
CREATE INDEX idx_product_categories_product ON product_categories(product_id);
CREATE INDEX idx_product_categories_category ON product_categories(category_id);

-- Product images indexes
CREATE INDEX idx_product_images_product ON product_images(product_id, display_order);
CREATE INDEX idx_product_images_primary ON product_images(product_id) WHERE is_primary = true;

-- Product variants indexes
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_stock ON product_variants(stock_quantity);

-- Reviews indexes
CREATE INDEX idx_reviews_product ON reviews(product_id, is_approved, created_at DESC) WHERE is_approved = true;
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(product_id, rating) WHERE is_approved = true;
CREATE INDEX idx_reviews_verified ON reviews(product_id) WHERE is_verified_purchase = true AND is_approved = true;

-- Orders indexes
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_guest ON orders(guest_email, created_at DESC);
CREATE INDEX idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_stripe_intent ON orders(stripe_payment_intent_id);

-- Order items indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Wishlists indexes
CREATE INDEX idx_wishlists_user ON wishlists(user_id, created_at DESC);
CREATE INDEX idx_wishlists_product ON wishlists(product_id);

-- Admin users indexes
CREATE INDEX idx_admin_users_email ON admin_users(email) WHERE is_active = true;

-- Product views indexes
CREATE INDEX idx_product_views_product_date ON product_views(product_id, viewed_at DESC);
CREATE INDEX idx_product_views_session ON product_views(session_id);
