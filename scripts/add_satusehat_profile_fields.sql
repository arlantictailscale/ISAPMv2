-- Add Satu Sehat fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS satu_sehat_name TEXT,
ADD COLUMN IF NOT EXISTS satu_sehat_email TEXT,
ADD COLUMN IF NOT EXISTS title_degree TEXT;

-- Add comment to describe the columns
COMMENT ON COLUMN profiles.satu_sehat_name IS 'Name registered on Satu Sehat SDMK account';
COMMENT ON COLUMN profiles.satu_sehat_email IS 'Email registered on Satu Sehat SDMK account';
COMMENT ON COLUMN profiles.title_degree IS 'Professional titles and degrees (e.g., Dr., Sp.An, M.Kes)';
