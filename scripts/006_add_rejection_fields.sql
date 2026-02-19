-- Add rejection_comment and can_resubmit fields to abstracts table

ALTER TABLE abstracts
ADD COLUMN IF NOT EXISTS rejection_comment TEXT,
ADD COLUMN IF NOT EXISTS can_resubmit BOOLEAN DEFAULT true;

-- Add comment to explain the new columns
COMMENT ON COLUMN abstracts.rejection_comment IS 'Admin comment explaining why the submission was rejected';
COMMENT ON COLUMN abstracts.can_resubmit IS 'Whether the participant can resubmit after rejection';
