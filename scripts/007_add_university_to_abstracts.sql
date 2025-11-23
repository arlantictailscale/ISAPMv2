-- Add university column to abstracts table
ALTER TABLE abstracts ADD COLUMN IF NOT EXISTS university TEXT;
