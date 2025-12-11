-- Seed script for events table
-- Populates all events with data from event-pricing.ts

-- Insert Webinar 1: Equity in Pain Management
INSERT INTO events (
  slug, event_type, title, short_title, description, short_description,
  start_date, end_date, start_time, end_time, timezone,
  location, venue, is_online, status, is_active, is_featured,
  pricing, settings
) VALUES (
  'webinar_equity_pain',
  'webinar',
  'Webinar: Achieving Equity in Pain Management Services in Indonesia',
  'Webinar Equity Pain Management',
  'Join us for an insightful webinar on achieving equity in pain management services across Indonesia. This session will cover current challenges, best practices, and strategies for improving access to pain management care.',
  'Webinar on equity in pain management services in Indonesia',
  '2026-01-30', '2026-01-30', '13:00', '15:00', 'Asia/Jakarta',
  'Online', 'Zoom Webinar', true, 'active', true, false,
  '{"participant_types": [{"id": "general", "label": "General Participant", "early_bird": 100000, "normal": 100000, "onsite": 100000, "currency": "IDR"}]}',
  '{"max_participants": 500}'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  short_title = EXCLUDED.short_title,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  timezone = EXCLUDED.timezone,
  location = EXCLUDED.location,
  venue = EXCLUDED.venue,
  is_online = EXCLUDED.is_online,
  pricing = EXCLUDED.pricing,
  updated_at = NOW();

-- Insert Webinar 2 (Coming Soon)
INSERT INTO events (
  slug, event_type, title, short_title, description,
  start_date, end_date, start_time, end_time, timezone,
  location, venue, is_online, status, is_active, is_featured,
  pricing, settings
) VALUES (
  'webinar_2',
  'webinar',
  'Webinar 2 - Coming Soon',
  'Webinar 2',
  'Details coming soon.',
  NULL, NULL, NULL, NULL, 'Asia/Jakarta',
  'Online', 'Zoom Webinar', true, 'coming_soon', true, false,
  '{"participant_types": []}',
  '{}'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Insert Webinar 3 (Coming Soon)
INSERT INTO events (
  slug, event_type, title, short_title, description,
  start_date, end_date, start_time, end_time, timezone,
  location, venue, is_online, status, is_active, is_featured,
  pricing, settings
) VALUES (
  'webinar_3',
  'webinar',
  'Webinar 3 - Coming Soon',
  'Webinar 3',
  'Details coming soon.',
  NULL, NULL, NULL, NULL, 'Asia/Jakarta',
  'Online', 'Zoom Webinar', true, 'coming_soon', true, false,
  '{"participant_types": []}',
  '{}'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Insert Webinar 4 (Coming Soon)
INSERT INTO events (
  slug, event_type, title, short_title, description,
  start_date, end_date, start_time, end_time, timezone,
  location, venue, is_online, status, is_active, is_featured,
  pricing, settings
) VALUES (
  'webinar_4',
  'webinar',
  'Webinar 4 - Coming Soon',
  'Webinar 4',
  'Details coming soon.',
  NULL, NULL, NULL, NULL, 'Asia/Jakarta',
  'Online', 'Zoom Webinar', true, 'coming_soon', true, false,
  '{"participant_types": []}',
  '{}'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Updated location to The Singhasari Resort, Batu, Malang for all in-person events
-- Insert CPD (Continuing Professional Development) Courses
INSERT INTO events (
  slug, event_type, title, short_title, description, short_description,
  start_date, end_date, start_time, end_time, timezone,
  location, venue, address, is_online, status, is_active, is_featured,
  pricing, settings
) VALUES (
  'cpd',
  'cpd',
  'CPD (Continuing Professional Development) Courses',
  'CPD Courses',
  'A comprehensive 2-day Continuing Professional Development course designed for anesthesiologists. This intensive program covers the latest advancements in pain management, including theoretical foundations and practical applications.',
  '2-day CPD course for anesthesiologists',
  '2026-04-16', '2026-04-17', '08:00', '17:00', 'Asia/Jakarta',
  'Batu, Malang, Indonesia', 'The Singhasari Resort', 'Jl. Ir. Soekarno No.120, Beji, Kec. Junrejo, Kota Batu, Jawa Timur 65236',
  false, 'active', true, true,
  '{"participant_types": [{"id": "span", "label": "Anesthesiologist", "early_bird": 4000000, "normal": 4500000, "onsite": 5000000, "currency": "IDR"}]}',
  '{"max_participants": 50, "benefits": ["Certificate of Completion", "Course Materials", "Lunch and Coffee Breaks", "SKP Points"]}'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  short_title = EXCLUDED.short_title,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  location = EXCLUDED.location,
  venue = EXCLUDED.venue,
  address = EXCLUDED.address,
  pricing = EXCLUDED.pricing,
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- Insert Workshop 1: Regenerative Pain Therapy
INSERT INTO events (
  slug, event_type, title, short_title, description, short_description,
  start_date, end_date, start_time, end_time, timezone,
  location, venue, address, is_online, status, is_active, is_featured,
  pricing, settings
) VALUES (
  'ws1',
  'workshop',
  'WS 1: Regenerative Pain Therapy',
  'Regenerative Pain Therapy',
  'Explore the cutting-edge field of regenerative pain therapy. This workshop covers PRP therapy, stem cell applications, and other regenerative techniques for chronic pain management.',
  'Workshop on regenerative techniques for pain management',
  '2026-04-17', '2026-04-17', '08:00', '17:00', 'Asia/Jakarta',
  'Batu, Malang, Indonesia', 'The Singhasari Resort', 'Jl. Ir. Soekarno No.120, Beji, Kec. Junrejo, Kota Batu, Jawa Timur 65236',
  false, 'active', true, false,
  '{"participant_types": [{"id": "span", "label": "Anesthesiologist", "early_bird": 3000000, "normal": 3500000, "onsite": 4000000, "currency": "IDR"}]}',
  '{"max_participants": 30, "benefits": ["Certificate of Completion", "Workshop Materials", "Hands-on Training", "Lunch and Coffee Breaks"]}'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  short_title = EXCLUDED.short_title,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  location = EXCLUDED.location,
  venue = EXCLUDED.venue,
  address = EXCLUDED.address,
  pricing = EXCLUDED.pricing,
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- Insert Workshop 2: Basic Interventional Pain Management
INSERT INTO events (
  slug, event_type, title, short_title, description, short_description,
  start_date, end_date, start_time, end_time, timezone,
  location, venue, address, is_online, status, is_active, is_featured,
  pricing, settings
) VALUES (
  'ws2',
  'workshop',
  'WS 2: Basic Interventional Pain Management (Musculoskeletal)',
  'Basic Interventional Pain Management',
  'A foundational workshop on interventional pain management techniques for musculoskeletal conditions. Learn essential injection techniques, ultrasound guidance, and patient selection criteria.',
  'Basic interventional techniques for musculoskeletal pain',
  '2026-04-17', '2026-04-17', '08:00', '17:00', 'Asia/Jakarta',
  'Batu, Malang, Indonesia', 'The Singhasari Resort', 'Jl. Ir. Soekarno No.120, Beji, Kec. Junrejo, Kota Batu, Jawa Timur 65236',
  false, 'active', true, false,
  '{"participant_types": [{"id": "span", "label": "Anesthesiologist", "early_bird": 2500000, "normal": 3000000, "onsite": 3500000, "currency": "IDR"}]}',
  '{"max_participants": 30, "benefits": ["Certificate of Completion", "Workshop Materials", "Hands-on Training", "Lunch and Coffee Breaks"]}'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  short_title = EXCLUDED.short_title,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  location = EXCLUDED.location,
  venue = EXCLUDED.venue,
  address = EXCLUDED.address,
  pricing = EXCLUDED.pricing,
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- Insert Workshop 3: Pediatric Essential Pain Management
INSERT INTO events (
  slug, event_type, title, short_title, description, short_description,
  start_date, end_date, start_time, end_time, timezone,
  location, venue, address, is_online, status, is_active, is_featured,
  pricing, settings
) VALUES (
  'ws3',
  'workshop',
  'WS 3: Pediatric Essential Pain Management (EPM Lite) + TOT',
  'Pediatric Essential Pain Management',
  'Specialized workshop focusing on pediatric pain management. Includes the EPM Lite curriculum and Train-the-Trainer (TOT) certification for healthcare professionals working with pediatric patients.',
  'Pediatric pain management with TOT certification',
  '2026-04-17', '2026-04-17', '08:00', '17:00', 'Asia/Jakarta',
  'Batu, Malang, Indonesia', 'The Singhasari Resort', 'Jl. Ir. Soekarno No.120, Beji, Kec. Junrejo, Kota Batu, Jawa Timur 65236',
  false, 'active', true, false,
  '{"participant_types": [{"id": "span", "label": "Anesthesiologist", "early_bird": 2000000, "normal": 2500000, "onsite": 3000000, "currency": "IDR"}, {"id": "resident", "label": "Resident", "early_bird": 1500000, "normal": 1750000, "onsite": 2000000, "currency": "IDR"}, {"id": "dokter_umum", "label": "General Practitioner", "early_bird": 1500000, "normal": 1750000, "onsite": 2000000, "currency": "IDR"}, {"id": "perawat", "label": "Nurse", "early_bird": 500000, "normal": 750000, "onsite": 1000000, "currency": "IDR"}]}',
  '{"max_participants": 40, "benefits": ["Certificate of Completion", "TOT Certification", "Workshop Materials", "Lunch and Coffee Breaks"]}'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  short_title = EXCLUDED.short_title,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  location = EXCLUDED.location,
  venue = EXCLUDED.venue,
  address = EXCLUDED.address,
  pricing = EXCLUDED.pricing,
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- Insert Workshop 4: Adjunct Therapy for Pain Management
INSERT INTO events (
  slug, event_type, title, short_title, description, short_description,
  start_date, end_date, start_time, end_time, timezone,
  location, venue, address, is_online, status, is_active, is_featured,
  pricing, settings
) VALUES (
  'ws4',
  'workshop',
  'WS 4: Adjunct Therapy for Pain Management',
  'Adjunct Therapy',
  'Learn about complementary and adjunct therapies in pain management. This workshop covers pharmacological and non-pharmacological approaches to enhance pain treatment outcomes.',
  'Complementary therapies for pain management',
  '2026-04-17', '2026-04-17', '08:00', '17:00', 'Asia/Jakarta',
  'Batu, Malang, Indonesia', 'The Singhasari Resort', 'Jl. Ir. Soekarno No.120, Beji, Kec. Junrejo, Kota Batu, Jawa Timur 65236',
  false, 'active', true, false,
  '{"participant_types": [{"id": "resident", "label": "Resident", "early_bird": 1500000, "normal": 1750000, "onsite": 2000000, "currency": "IDR"}, {"id": "dokter_umum", "label": "General Practitioner", "early_bird": 1500000, "normal": 1750000, "onsite": 2000000, "currency": "IDR"}, {"id": "perawat", "label": "Nurse", "early_bird": 500000, "normal": 750000, "onsite": 1000000, "currency": "IDR"}, {"id": "penata_anestesi", "label": "Nurse Anesthetist", "early_bird": 500000, "normal": 750000, "onsite": 1000000, "currency": "IDR"}]}',
  '{"max_participants": 40, "benefits": ["Certificate of Completion", "Workshop Materials", "Lunch and Coffee Breaks"]}'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  short_title = EXCLUDED.short_title,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  location = EXCLUDED.location,
  venue = EXCLUDED.venue,
  address = EXCLUDED.address,
  pricing = EXCLUDED.pricing,
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- Insert Workshop 5: Developing a Pain Clinic
INSERT INTO events (
  slug, event_type, title, short_title, description, short_description,
  start_date, end_date, start_time, end_time, timezone,
  location, venue, address, is_online, status, is_active, is_featured,
  pricing, settings
) VALUES (
  'ws5',
  'workshop',
  'WS 5: Developing a Pain Clinic',
  'Developing a Pain Clinic',
  'A comprehensive workshop for healthcare teams on establishing and managing a pain clinic. Covers business planning, staffing, equipment, protocols, and quality management for pain services.',
  'Guide to establishing and managing a pain clinic',
  '2026-04-17', '2026-04-17', '08:00', '17:00', 'Asia/Jakarta',
  'Batu, Malang, Indonesia', 'The Singhasari Resort', 'Jl. Ir. Soekarno No.120, Beji, Kec. Junrejo, Kota Batu, Jawa Timur 65236',
  false, 'active', true, false,
  '{"participant_types": [{"id": "span_team", "label": "Anesthesiologist and team (team of 4 participants)", "early_bird": 6000000, "normal": 6500000, "onsite": 7000000, "currency": "IDR"}]}',
  '{"max_participants": 20, "benefits": ["Certificate of Completion", "Workshop Materials", "Business Plan Template", "Lunch and Coffee Breaks"]}'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  short_title = EXCLUDED.short_title,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  location = EXCLUDED.location,
  venue = EXCLUDED.venue,
  address = EXCLUDED.address,
  pricing = EXCLUDED.pricing,
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- Insert Workshop 6: Cancer Pain
INSERT INTO events (
  slug, event_type, title, short_title, description, short_description,
  start_date, end_date, start_time, end_time, timezone,
  location, venue, address, is_online, status, is_active, is_featured,
  pricing, settings
) VALUES (
  'ws6',
  'workshop',
  'WS 6: Cancer Pain',
  'Cancer Pain',
  'Specialized workshop on cancer pain management. Learn about multimodal approaches, interventional techniques, and palliative care strategies for oncology patients.',
  'Comprehensive cancer pain management techniques',
  '2026-04-17', '2026-04-17', '08:00', '17:00', 'Asia/Jakarta',
  'Batu, Malang, Indonesia', 'The Singhasari Resort', 'Jl. Ir. Soekarno No.120, Beji, Kec. Junrejo, Kota Batu, Jawa Timur 65236',
  false, 'active', true, false,
  '{"participant_types": [{"id": "span", "label": "Anesthesiologist", "early_bird": 2500000, "normal": 3000000, "onsite": 3500000, "currency": "IDR"}]}',
  '{"max_participants": 30, "benefits": ["Certificate of Completion", "Workshop Materials", "Case Studies", "Lunch and Coffee Breaks"]}'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  short_title = EXCLUDED.short_title,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  location = EXCLUDED.location,
  venue = EXCLUDED.venue,
  address = EXCLUDED.address,
  pricing = EXCLUDED.pricing,
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- Insert Workshop 7: Advanced Intervention of Pain Management
INSERT INTO events (
  slug, event_type, title, short_title, description, short_description,
  start_date, end_date, start_time, end_time, timezone,
  location, venue, address, is_online, status, is_active, is_featured,
  pricing, settings
) VALUES (
  'ws7',
  'workshop',
  'WS 7: Advanced Intervention of Pain Management',
  'Advanced Intervention',
  'Advanced workshop for experienced practitioners covering complex interventional pain procedures. Includes neuromodulation, intrathecal drug delivery, and advanced nerve block techniques.',
  'Advanced interventional pain procedures',
  '2026-04-17', '2026-04-17', '08:00', '17:00', 'Asia/Jakarta',
  'Batu, Malang, Indonesia', 'The Singhasari Resort', 'Jl. Ir. Soekarno No.120, Beji, Kec. Junrejo, Kota Batu, Jawa Timur 65236',
  false, 'active', true, true,
  '{"participant_types": [{"id": "span", "label": "Anesthesiologist", "early_bird": 9000000, "normal": 10000000, "onsite": 11000000, "currency": "IDR"}]}',
  '{"max_participants": 20, "benefits": ["Certificate of Completion", "Workshop Materials", "Cadaver Lab Access", "Lunch and Coffee Breaks"]}'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  short_title = EXCLUDED.short_title,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  location = EXCLUDED.location,
  venue = EXCLUDED.venue,
  address = EXCLUDED.address,
  pricing = EXCLUDED.pricing,
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- Insert Symposium
INSERT INTO events (
  slug, event_type, title, short_title, description, short_description,
  start_date, end_date, start_time, end_time, timezone,
  location, venue, address, is_online, status, is_active, is_featured,
  pricing, settings
) VALUES (
  'symposium',
  'symposium',
  'ISAPM 8th National Meeting Symposium',
  'Symposium',
  'The main symposium event of the ISAPM 8th National Meeting. Join leading experts and practitioners for keynote presentations, panel discussions, and networking opportunities in the field of pain management.',
  'Main symposium event with keynotes and panel discussions',
  '2026-04-18', '2026-04-18', '08:00', '17:00', 'Asia/Jakarta',
  'Batu, Malang, Indonesia', 'The Singhasari Resort', 'Jl. Ir. Soekarno No.120, Beji, Kec. Junrejo, Kota Batu, Jawa Timur 65236',
  false, 'active', true, true,
  '{"participant_types": [{"id": "span", "label": "Anesthesiologist", "early_bird": 2500000, "normal": 3000000, "onsite": 3500000, "currency": "IDR"}, {"id": "resident", "label": "Resident", "early_bird": 1500000, "normal": 1750000, "onsite": 2000000, "currency": "IDR"}, {"id": "dokter_umum", "label": "General Practitioner", "early_bird": 1500000, "normal": 1750000, "onsite": 2000000, "currency": "IDR"}]}',
  '{"max_participants": 500, "benefits": ["Certificate of Attendance", "Conference Bag", "Lunch and Coffee Breaks", "Networking Dinner", "SKP Points", "4 Bonus Webinars"]}'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  short_title = EXCLUDED.short_title,
  description = EXCLUDED.description,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  location = EXCLUDED.location,
  venue = EXCLUDED.venue,
  address = EXCLUDED.address,
  pricing = EXCLUDED.pricing,
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- Verify the inserted data
SELECT slug, event_type, title, start_date, location, venue 
FROM events 
ORDER BY 
  CASE event_type 
    WHEN 'webinar' THEN 1 
    WHEN 'cpd' THEN 2 
    WHEN 'workshop' THEN 3 
    WHEN 'symposium' THEN 4 
  END,
  slug;
