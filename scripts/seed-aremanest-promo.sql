-- Seed AREMANEST2026 promo code for AREMANEST FKUB Alumni

-- First, insert the main promo code
INSERT INTO promo_codes (
  code,
  name,
  description,
  discount_type,
  discount_value,
  max_uses,
  starts_at,
  expires_at,
  is_active
) VALUES (
  'AREMANEST2026',
  'AREMANEST FKUB Alumni Discount',
  'Special discount for AREMANEST FKUB Alumni - Symposium 50% off, select workshops 30-50% off, special pricing for nurse/GP referrals',
  'percentage',
  0, -- Default 0, rules define specific discounts
  NULL, -- Unlimited uses
  NOW(),
  '2026-04-19 23:59:59+07', -- Expires after event
  true
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = true,
  expires_at = EXCLUDED.expires_at;

-- Get the promo code ID
DO $$
DECLARE
  v_promo_id UUID;
BEGIN
  SELECT id INTO v_promo_id FROM promo_codes WHERE code = 'AREMANEST2026';

  -- Delete existing rules for this promo code (to avoid duplicates on re-run)
  DELETE FROM promo_code_rules WHERE promo_code_id = v_promo_id;

  -- Rule 1: 50% off Symposium
  INSERT INTO promo_code_rules (
    promo_code_id,
    event_slug,
    event_type,
    discount_type,
    discount_value,
    participant_type,
    description,
    is_active
  ) VALUES (
    v_promo_id,
    'symposium',
    'symposium',
    'percentage',
    50,
    NULL, -- All participant types
    '50% discount for Symposium registration',
    true
  );

  -- Rule 2: 30% off Workshop - Pediatric Essential Pain Management
  INSERT INTO promo_code_rules (
    promo_code_id,
    event_slug,
    event_type,
    discount_type,
    discount_value,
    participant_type,
    description,
    is_active
  ) VALUES (
    v_promo_id,
    'workshop-pediatric-pain',
    'workshop',
    'percentage',
    30,
    NULL,
    '30% discount for Pediatric Essential Pain Management Workshop',
    true
  );

  -- Rule 3: 30% off Workshop - Cancer Pain
  INSERT INTO promo_code_rules (
    promo_code_id,
    event_slug,
    event_type,
    discount_type,
    discount_value,
    participant_type,
    description,
    is_active
  ) VALUES (
    v_promo_id,
    'workshop-cancer-pain',
    'workshop',
    'percentage',
    30,
    NULL,
    '30% discount for Cancer Pain Workshop',
    true
  );

  -- Rule 4: 50% off Workshop - Adjunct Therapy for Pain Management (default)
  INSERT INTO promo_code_rules (
    promo_code_id,
    event_slug,
    event_type,
    discount_type,
    discount_value,
    participant_type,
    description,
    is_active
  ) VALUES (
    v_promo_id,
    'workshop-adjunct-therapy',
    'workshop',
    'percentage',
    50,
    NULL, -- Default for doctors/specialists
    '50% discount for Adjunct Therapy Workshop',
    true
  );

  -- Rule 5: Fixed price IDR 500,000 for Nurse referral - Adjunct Therapy Workshop
  INSERT INTO promo_code_rules (
    promo_code_id,
    event_slug,
    event_type,
    discount_type,
    discount_value,
    participant_type,
    description,
    is_active
  ) VALUES (
    v_promo_id,
    'workshop-adjunct-therapy',
    'workshop',
    'fixed_price',
    500000,
    'nurse',
    'Special fixed price IDR 500,000 for Nurse partner referral',
    true
  );

  -- Rule 6: Fixed price IDR 1,500,000 for GP referral - Adjunct Therapy Workshop
  INSERT INTO promo_code_rules (
    promo_code_id,
    event_slug,
    event_type,
    discount_type,
    discount_value,
    participant_type,
    description,
    is_active
  ) VALUES (
    v_promo_id,
    'workshop-adjunct-therapy',
    'workshop',
    'fixed_price',
    1500000,
    'gp',
    'Special fixed price IDR 1,500,000 for GP partner referral',
    true
  );

END $$;
