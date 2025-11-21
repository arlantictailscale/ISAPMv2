-- Create registrations table for tracking purchases
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  institution TEXT NOT NULL,
  position TEXT NOT NULL,
  registration_type TEXT NOT NULL CHECK (registration_type IN ('general', 'resident', 'student', 'international')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'IDR',
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for registrations
CREATE POLICY "registrations_select_own" ON public.registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "registrations_insert_own" ON public.registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "registrations_update_own" ON public.registrations FOR UPDATE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_registrations_user_id ON public.registrations(user_id);
CREATE INDEX idx_registrations_created_at ON public.registrations(order_date DESC);
