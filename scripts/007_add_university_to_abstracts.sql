-- Add university column to abstracts table
ALTER TABLE abstracts ADD COLUMN IF NOT EXISTS university TEXT;

-- Drop the old category constraint first (before any data changes)
ALTER TABLE abstracts DROP CONSTRAINT IF EXISTS abstracts_category_check;

-- Handle all edge cases: NULL values, empty strings, and old constraint values
-- Move old category values to keywords field if keywords is empty or NULL
UPDATE abstracts 
SET keywords = COALESCE(category, ''),
    category = 'Research'
WHERE category IS NULL 
   OR category NOT IN ('Case Report', 'Research');

-- For rows that already have keywords, append the old category if it's different
UPDATE abstracts 
SET category = 'Research'
WHERE category NOT IN ('Case Report', 'Research')
AND keywords IS NOT NULL 
AND keywords != '';

-- Ensure no NULL categories remain
UPDATE abstracts 
SET category = 'Research' 
WHERE category IS NULL;

-- Add new category constraint to allow only Case Report and Research
ALTER TABLE abstracts ADD CONSTRAINT abstracts_category_check 
CHECK (category IN ('Case Report', 'Research'));
