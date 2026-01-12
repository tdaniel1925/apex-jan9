-- ============================================
-- PHASE 1: Multi-Source Commission System
-- Prepares database for 3 commission sources:
--   1. Retail (e-commerce digital products)
--   2. Smart Office (insurance carrier integration)
--   3. Manual Import (CSV uploads)
-- ============================================

-- Add 'retail' to carrier types
ALTER TYPE carrier_type ADD VALUE IF NOT EXISTS 'retail';

-- Add commission source types
CREATE TYPE commission_source AS ENUM ('retail', 'smart_office', 'manual_import');

-- Add new fields to commissions table
ALTER TABLE commissions
  ADD COLUMN IF NOT EXISTS source commission_source NOT NULL DEFAULT 'manual_import',
  ADD COLUMN IF NOT EXISTS product_id UUID,
  ADD COLUMN IF NOT EXISTS order_id UUID,
  ADD COLUMN IF NOT EXISTS bonus_volume DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS external_reference TEXT;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_commissions_source ON commissions(source);
CREATE INDEX IF NOT EXISTS idx_commissions_product ON commissions(product_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON commissions(order_id);

-- Add comment explaining the fields
COMMENT ON COLUMN commissions.source IS 'Source of commission: retail (e-commerce), smart_office (insurance), or manual_import (CSV)';
COMMENT ON COLUMN commissions.product_id IS 'Reference to products table (only for retail commissions)';
COMMENT ON COLUMN commissions.order_id IS 'Reference to orders table (only for retail commissions)';
COMMENT ON COLUMN commissions.bonus_volume IS 'Bonus volume for commission calculations (primarily for retail)';
COMMENT ON COLUMN commissions.external_reference IS 'External system reference ID (e.g., Smart Office policy ID)';

-- ============================================
-- PRODUCTS TABLE (Digital Products)
-- ============================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  long_description TEXT,

  -- Pricing
  price DECIMAL(12,2) NOT NULL,
  bonus_volume DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Categorization
  category TEXT NOT NULL, -- 'training', 'tools', 'leads', 'software', etc.
  tags TEXT[], -- Array of tags for filtering

  -- Digital Asset
  digital_asset_url TEXT, -- S3/Supabase Storage URL
  download_limit INTEGER DEFAULT 5, -- Max downloads per purchase

  -- Images
  image_url TEXT,
  thumbnail_url TEXT,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Stats (updated by triggers)
  total_sales INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);

-- ============================================
-- ORDERS TABLE
-- ============================================

CREATE TYPE order_status AS ENUM ('pending', 'completed', 'refunded', 'failed');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Customer Info
  customer_id UUID, -- Can be agent_id or external customer
  customer_email TEXT NOT NULL,
  customer_name TEXT,

  -- Agent who gets commission (selling agent)
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,

  -- Order Details
  subtotal DECIMAL(12,2) NOT NULL,
  tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  total_bonus_volume DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Payment
  payment_method TEXT, -- 'stripe', 'paypal', etc.
  payment_intent_id TEXT, -- Stripe payment intent ID
  transaction_id TEXT, -- External payment reference

  -- Status
  status order_status NOT NULL DEFAULT 'pending',

  -- Fulfillment
  fulfilled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_agent ON orders(agent_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_payment_intent ON orders(payment_intent_id);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Snapshot of product at time of purchase
  product_name TEXT NOT NULL,
  product_description TEXT,

  -- Pricing
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  unit_bonus_volume DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Calculated totals
  line_total DECIMAL(12,2) NOT NULL,
  line_bonus_volume DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Digital delivery
  download_url TEXT,
  download_count INTEGER NOT NULL DEFAULT 0,
  download_expires_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================
-- UPDATE FUNCTIONS FOR TIMESTAMPS
-- ============================================

-- Trigger to update updated_at on products
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Trigger to update updated_at on orders
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================

-- Add FK constraints with proper names
ALTER TABLE commissions
  ADD CONSTRAINT fk_commissions_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_commissions_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- ============================================
-- BONUS VOLUME TRACKING (PBV & OBV)
-- ============================================

-- Add PBV and OBV tracking to agents table
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS personal_bonus_volume DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS organization_bonus_volume DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pbv_90_days DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS obv_90_days DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Add indexes for volume queries
CREATE INDEX IF NOT EXISTS idx_agents_pbv ON agents(personal_bonus_volume);
CREATE INDEX IF NOT EXISTS idx_agents_obv ON agents(organization_bonus_volume);

-- Add comments
COMMENT ON COLUMN agents.personal_bonus_volume IS 'Personal Bonus Volume - sum of agent''s own retail sales BV (lifetime)';
COMMENT ON COLUMN agents.organization_bonus_volume IS 'Organization Bonus Volume - sum of entire downline BV (lifetime)';
COMMENT ON COLUMN agents.pbv_90_days IS 'Personal Bonus Volume in last 90 days (for rank qualification)';
COMMENT ON COLUMN agents.obv_90_days IS 'Organization Bonus Volume in last 90 days (for rank qualification)';

COMMENT ON TABLE products IS 'Digital products available in e-commerce system';
COMMENT ON TABLE orders IS 'Customer orders for digital products';
COMMENT ON TABLE order_items IS 'Line items for each order';

-- ============================================
-- VOLUME CALCULATION FUNCTIONS
-- ============================================

-- Function to update agent's PBV when they make a sale
CREATE OR REPLACE FUNCTION update_agent_pbv()
RETURNS TRIGGER AS $$
BEGIN
  -- Update selling agent's PBV
  UPDATE agents
  SET
    personal_bonus_volume = personal_bonus_volume + NEW.bonus_volume,
    pbv_90_days = (
      SELECT COALESCE(SUM(bonus_volume), 0)
      FROM commissions
      WHERE agent_id = NEW.agent_id
        AND created_at >= NOW() - INTERVAL '90 days'
        AND bonus_volume > 0
    )
  WHERE id = NEW.agent_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update PBV when commission is created
CREATE TRIGGER trigger_update_agent_pbv
  AFTER INSERT ON commissions
  FOR EACH ROW
  WHEN (NEW.bonus_volume > 0)
  EXECUTE FUNCTION update_agent_pbv();

-- Function to recalculate OBV for an agent (called by workflow)
-- This sums all downline PBV (including agent's own PBV)
CREATE OR REPLACE FUNCTION recalculate_agent_obv(target_agent_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE agents
  SET
    organization_bonus_volume = (
      -- Get all descendants from matrix
      SELECT COALESCE(SUM(a.personal_bonus_volume), 0)
      FROM matrix_positions mp
      JOIN agents a ON a.id = mp.agent_id
      WHERE mp.path LIKE (
        SELECT path || '%'
        FROM matrix_positions
        WHERE agent_id = target_agent_id
      )
    ),
    obv_90_days = (
      -- Get all descendants' 90-day PBV
      SELECT COALESCE(SUM(a.pbv_90_days), 0)
      FROM matrix_positions mp
      JOIN agents a ON a.id = mp.agent_id
      WHERE mp.path LIKE (
        SELECT path || '%'
        FROM matrix_positions
        WHERE agent_id = target_agent_id
      )
    )
  WHERE id = target_agent_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recalculate_agent_obv IS 'Recalculates organization bonus volume by summing all downline PBV';

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

-- Products are public (anyone can view)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_select_all ON products
  FOR SELECT USING (is_active = true);

-- Admin can manage products
CREATE POLICY products_admin_all ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE user_id = auth.uid()
        AND rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- Orders - agents can view their own orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_select_own ON orders
  FOR SELECT USING (
    agent_id IN (
      SELECT id FROM agents WHERE user_id = auth.uid()
    )
  );

-- Admins can view all orders
CREATE POLICY orders_admin_all ON orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE user_id = auth.uid()
        AND rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );

-- Order items inherit from orders
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY order_items_select_own ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE agent_id IN (
        SELECT id FROM agents WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY order_items_admin_all ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE user_id = auth.uid()
        AND rank IN ('regional_mga', 'national_mga', 'executive_mga', 'premier_mga')
    )
  );
