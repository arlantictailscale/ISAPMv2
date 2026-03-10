-- Add full_text_url column to abstracts table for storing full text PDF submissions
ALTER TABLE public.abstracts
ADD COLUMN IF NOT EXISTS full_text_url text;

-- Add a comment to document the column
COMMENT ON COLUMN public.abstracts.full_text_url IS 'URL to the full text PDF file (optional)';
