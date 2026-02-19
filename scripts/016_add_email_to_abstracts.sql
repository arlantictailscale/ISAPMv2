-- Add email column to abstracts table
ALTER TABLE abstracts ADD COLUMN IF NOT EXISTS email text;

-- Add comment to explain the column
COMMENT ON COLUMN abstracts.email IS 'Email address of the person who submitted the abstract';
