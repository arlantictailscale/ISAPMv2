-- Add room column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS room TEXT;

-- Add comment for documentation
COMMENT ON COLUMN events.room IS 'Room name/number for the event (e.g., Ballroom A, Conference Room 1)';
