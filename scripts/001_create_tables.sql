-- Create attendees table for conference registrations
CREATE TABLE IF NOT EXISTS public.attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  institution TEXT,
  specialization TEXT,
  phone TEXT,
  country TEXT,
  registration_type TEXT NOT NULL CHECK (registration_type IN ('student', 'professional', 'speaker')),
  dietary_requirements TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create abstracts table for Call for Papers submissions
CREATE TABLE IF NOT EXISTS public.abstracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  authors TEXT NOT NULL,
  keywords TEXT,
  category TEXT NOT NULL CHECK (category IN ('oral', 'poster')),
  submission_status TEXT DEFAULT 'pending' CHECK (submission_status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create speakers table for keynote speakers and faculty
CREATE TABLE IF NOT EXISTS public.speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  expertise TEXT,
  bio TEXT,
  institution TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contact messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abstracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendees
CREATE POLICY "attendees_select_own" ON public.attendees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "attendees_insert_own" ON public.attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attendees_update_own" ON public.attendees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "attendees_delete_own" ON public.attendees FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for abstracts
CREATE POLICY "abstracts_select_own" ON public.abstracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "abstracts_insert_own" ON public.abstracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "abstracts_update_own" ON public.abstracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "abstracts_delete_own" ON public.abstracts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for speakers (public read)
CREATE POLICY "speakers_select_all" ON public.speakers FOR SELECT USING (true);
CREATE POLICY "speakers_insert_service_role" ON public.speakers FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for contact messages (public insert)
CREATE POLICY "contact_insert_public" ON public.contact_messages FOR INSERT WITH CHECK (true);
