-- Add DELETE policy for registrations table so users can delete their own registrations

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "registrations_delete_own" ON public.registrations;

-- Create DELETE policy for users to delete their own registrations
CREATE POLICY "registrations_delete_own" 
  ON public.registrations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Also add policy for admins to delete any registration
DROP POLICY IF EXISTS "Admins can delete all registrations" ON public.registrations;

CREATE POLICY "Admins can delete all registrations" 
  ON public.registrations 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
