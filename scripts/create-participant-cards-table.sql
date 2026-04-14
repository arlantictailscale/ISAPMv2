-- Create participant_cards table for event check-in system
CREATE TABLE IF NOT EXISTS participant_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  card_token VARCHAR(64) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  institution VARCHAR(255),
  position VARCHAR(100),
  events JSONB NOT NULL DEFAULT '[]',
  is_checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES auth.users(id),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_participant_cards_user_id ON participant_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_participant_cards_order_id ON participant_cards(order_id);
CREATE INDEX IF NOT EXISTS idx_participant_cards_card_token ON participant_cards(card_token);
CREATE INDEX IF NOT EXISTS idx_participant_cards_is_checked_in ON participant_cards(is_checked_in);

-- Enable RLS
ALTER TABLE participant_cards ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own cards
CREATE POLICY "Users can view own participant cards"
  ON participant_cards
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all cards
CREATE POLICY "Admins can view all participant cards"
  ON participant_cards
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can insert cards
CREATE POLICY "Admins can insert participant cards"
  ON participant_cards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: System can insert cards (for auto-generation)
CREATE POLICY "Service role can insert participant cards"
  ON participant_cards
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can update cards (for check-in)
CREATE POLICY "Admins can update participant cards"
  ON participant_cards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_participant_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_participant_cards_updated_at ON participant_cards;
CREATE TRIGGER trigger_update_participant_cards_updated_at
  BEFORE UPDATE ON participant_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_cards_updated_at();
