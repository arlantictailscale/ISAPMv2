-- Add RLS policy to allow admins to view all registrations

-- Create policy for admins to view all registrations
CREATE POLICY "Admins can view all registrations" ON public.registrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
