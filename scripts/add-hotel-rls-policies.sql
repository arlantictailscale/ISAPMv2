-- Add missing RLS policies for room_availability_settings table
-- This allows authenticated admin users to insert and update room settings

-- Enable RLS if not already enabled
ALTER TABLE public.room_availability_settings ENABLE ROW LEVEL SECURITY;

-- Policy for INSERT - allow authenticated users (admin role)
CREATE POLICY "Allow service role to insert room settings"
  ON public.room_availability_settings
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- Policy for UPDATE - allow authenticated users (admin role)
CREATE POLICY "Allow service role to update room settings"
  ON public.room_availability_settings
  FOR UPDATE
  USING (auth.role() = 'service_role' OR auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.role() = 'service_role' OR auth.jwt() ->> 'role' = 'admin');

-- Verify existing SELECT policy is in place
-- The SELECT policy should already exist as "Allow public viewing of room availability"
