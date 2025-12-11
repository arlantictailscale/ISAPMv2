-- Symposium Webinar Grants Table
-- This table tracks webinar access granted to users who purchase Symposium events
-- Each grant links a user to a webinar with audit trail

-- Create the symposium_webinar_grants table
CREATE TABLE IF NOT EXISTS public.symposium_webinar_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  webinar_id TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  grant_type TEXT NOT NULL DEFAULT 'symposium_bonus' CHECK (grant_type IN ('symposium_bonus', 'manual', 'promotional')),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate grants for the same webinar from the same order
  UNIQUE(user_id, webinar_id, order_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_symposium_webinar_grants_user_id 
  ON public.symposium_webinar_grants(user_id);

CREATE INDEX IF NOT EXISTS idx_symposium_webinar_grants_order_id 
  ON public.symposium_webinar_grants(order_id);

CREATE INDEX IF NOT EXISTS idx_symposium_webinar_grants_webinar_id 
  ON public.symposium_webinar_grants(webinar_id);

CREATE INDEX IF NOT EXISTS idx_symposium_webinar_grants_status 
  ON public.symposium_webinar_grants(status);

CREATE INDEX IF NOT EXISTS idx_symposium_webinar_grants_grant_type 
  ON public.symposium_webinar_grants(grant_type);

-- Enable Row Level Security
ALTER TABLE public.symposium_webinar_grants ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own grants
CREATE POLICY "Users can view own webinar grants"
  ON public.symposium_webinar_grants
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Admins can view all grants
CREATE POLICY "Admins can view all webinar grants"
  ON public.symposium_webinar_grants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Admins can insert grants
CREATE POLICY "Admins can insert webinar grants"
  ON public.symposium_webinar_grants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Service role can insert grants (for auto-grant on payment verification)
CREATE POLICY "Service role can insert webinar grants"
  ON public.symposium_webinar_grants
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policy: Admins can update grants (for revocation)
CREATE POLICY "Admins can update webinar grants"
  ON public.symposium_webinar_grants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS update_symposium_webinar_grants_updated_at ON public.symposium_webinar_grants;
CREATE TRIGGER update_symposium_webinar_grants_updated_at
  BEFORE UPDATE ON public.symposium_webinar_grants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.symposium_webinar_grants TO authenticated;
GRANT INSERT, UPDATE ON public.symposium_webinar_grants TO service_role;
