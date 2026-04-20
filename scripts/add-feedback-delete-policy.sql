-- Add DELETE policy for feedback table so admins can delete feedback
CREATE POLICY "Admins can delete feedback" ON public.feedback
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
