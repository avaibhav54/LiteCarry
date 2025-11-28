-- =====================================================
-- FULL-TEXT SEARCH SETUP
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

COMMENT ON FUNCTION products_search_vector_update() IS 'Auto-updates search_vector on product changes';

-- Trigger to auto-update search vector
CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

-- =====================================================
-- MATERIALIZED VIEW FOR PRODUCT RATINGS
-- =====================================================

-- Materialized view for aggregated product ratings (performance optimization)
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

CREATE UNIQUE INDEX idx_product_ratings_product ON product_ratings(product_id);

COMMENT ON MATERIALIZED VIEW product_ratings IS 'Aggregated ratings for performance, refresh periodically';

-- =====================================================
-- AUTO-UPDATE TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to decrement stock (atomic operation)
CREATE OR REPLACE FUNCTION decrement_product_stock(
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity INTEGER
) RETURNS VOID AS $$
BEGIN
  IF p_variant_id IS NOT NULL THEN
    -- Decrement variant stock
    UPDATE product_variants
    SET stock_quantity = stock_quantity - p_quantity
    WHERE id = p_variant_id AND stock_quantity >= p_quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for variant %', p_variant_id;
    END IF;
  ELSE
    -- Decrement product stock
    UPDATE products
    SET stock_quantity = stock_quantity - p_quantity
    WHERE id = p_product_id AND stock_quantity >= p_quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION decrement_product_stock IS 'Atomically decrements stock with validation';

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate order number: LUG-YYYYMMDD-XXXX
    new_number := 'LUG-' ||
                  TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                  LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- Check if it exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = new_number) INTO exists;

    EXIT WHEN NOT exists;
  END LOOP;

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_order_number IS 'Generates unique order numbers with format LUG-YYYYMMDD-XXXX';
