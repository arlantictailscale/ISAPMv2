-- Create room_availability_settings table to store default room counts
CREATE TABLE IF NOT EXISTS public.room_availability_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type TEXT NOT NULL UNIQUE,
  default_capacity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.room_availability_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read room availability
CREATE POLICY "Anyone can view room availability"
  ON public.room_availability_settings
  FOR SELECT
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role only can modify"
  ON public.room_availability_settings
  FOR ALL
  USING (auth.role() = 'service_role');

-- Insert default values
INSERT INTO public.room_availability_settings (room_type, default_capacity)
VALUES 
  ('deluxe', 120),
  ('premier', 56)
ON CONFLICT (room_type) DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_room_type ON public.room_availability_settings(room_type);
