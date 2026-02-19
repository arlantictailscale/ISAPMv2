-- Fix the category check constraint to allow submission types
ALTER TABLE public.abstracts DROP CONSTRAINT IF EXISTS abstracts_category_check;

-- Add new check constraint for category (submission type)
ALTER TABLE public.abstracts ADD CONSTRAINT abstracts_category_check 
CHECK (category IN (
  'Case Report',
  'Research'
));
