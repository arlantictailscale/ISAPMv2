-- Add SELECT policy for registrations so users can view their own registrations
CREATE POLICY "registrations_select_own" ON public.registrations 
  FOR SELECT 
  USING (auth.uid() = user_id);
