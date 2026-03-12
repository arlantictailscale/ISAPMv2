-- Create event_quotas table for managing registration limits
CREATE TABLE IF NOT EXISTS event_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_name TEXT NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_quotas_event_id ON event_quotas(event_id);

-- Insert initial quota data based on provided spreadsheet
INSERT INTO event_quotas (event_id, event_name, max_capacity, is_active) VALUES
  ('cpd', 'CPD Courses (Day 1-2)', 60, true),
  ('ws-1', 'WS 1. Regenerative Pain Therapy', 40, true),
  ('ws-2', 'WS 2. Basic Interventional Pain Management (Musculoskeletal)', 30, true),
  ('ws-3', 'WS 3. Pediatric Essential Pain Management', 30, true),
  ('ws-4', 'WS 4. Adjunct Therapy for Pain Management', 30, true),
  ('ws-5', 'WS 5. Developing a Pain Clinic', 10, true),
  ('ws-6', 'WS 6. Cancer Pain', 30, true),
  ('ws-7', 'WS 7. Advanced Intervention of Pain Management', 10, true),
  ('symposium', 'Symposium (Day 3)', 300, true),
  ('city-tour', 'City Tour (Day 4)', 100, true)
ON CONFLICT (event_id) DO UPDATE SET
  event_name = EXCLUDED.event_name,
  max_capacity = EXCLUDED.max_capacity,
  updated_at = NOW();

-- Enable Row Level Security
ALTER TABLE event_quotas ENABLE ROW LEVEL SECURITY;

-- Allow public read access for quota checking
CREATE POLICY "event_quotas_public_read" ON event_quotas
  FOR SELECT USING (true);

-- Allow admin update access
CREATE POLICY "event_quotas_admin_update" ON event_quotas
  FOR UPDATE USING (true);

CREATE POLICY "event_quotas_admin_insert" ON event_quotas
  FOR INSERT WITH CHECK (true);
