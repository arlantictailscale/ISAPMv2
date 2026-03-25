-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed_amount', 'fixed_price'
  discount_value DECIMAL(10, 2), -- Default discount if no specific rules
  max_uses INTEGER, -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,
  min_order_amount DECIMAL(10, 2),
  max_discount_amount DECIMAL(10, 2), -- Cap for percentage discounts
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create promo_code_rules table for event-specific discount rules
CREATE TABLE IF NOT EXISTS promo_code_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  event_slug VARCHAR(100), -- NULL = applies to all events
  event_type VARCHAR(50), -- 'symposium', 'workshop', 'cpd', 'webinar', 'hotel'
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed_amount', 'fixed_price'
  discount_value DECIMAL(10, 2) NOT NULL,
  participant_type VARCHAR(50), -- 'doctor', 'nurse', 'gp', 'specialist', NULL = all
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create promo_code_uses table to track usage
CREATE TABLE IF NOT EXISTS promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  discount_amount DECIMAL(10, 2) NOT NULL,
  original_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active, starts_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_promo_code_rules_code_id ON promo_code_rules(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_rules_event ON promo_code_rules(event_slug, event_type);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_user ON promo_code_uses(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_code ON promo_code_uses(promo_code_id);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes
CREATE POLICY "Anyone can view active promo codes" ON promo_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage promo codes" ON promo_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for promo_code_rules
CREATE POLICY "Anyone can view active rules" ON promo_code_rules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage promo code rules" ON promo_code_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for promo_code_uses
CREATE POLICY "Users can view their own promo usage" ON promo_code_uses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own promo usage" ON promo_code_uses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all promo usage" ON promo_code_uses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Add promo_code_id and discount columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10, 2);

-- Add discount columns to order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS promo_rule_id UUID REFERENCES promo_code_rules(id);
