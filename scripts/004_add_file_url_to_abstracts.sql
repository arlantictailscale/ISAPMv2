-- Add file_url column to abstracts table for e-poster file uploads
ALTER TABLE public.abstracts 
ADD COLUMN IF NOT EXISTS file_url TEXT;
