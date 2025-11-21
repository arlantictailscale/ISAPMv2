-- Update the category check constraint to allow the new topic categories
ALTER TABLE public.abstracts DROP CONSTRAINT IF EXISTS abstracts_category_check;

-- Add new check constraint with the updated categories
ALTER TABLE public.abstracts ADD CONSTRAINT abstracts_category_check 
CHECK (category IN (
  'Emergencies (Kegawatdaruratan)',
  'Pain Management (Manajemen Nyeri)',
  'ICU Management (Manajemen ICU)',
  'Anesthesia Management (Manajemen Anestesi)'
));
