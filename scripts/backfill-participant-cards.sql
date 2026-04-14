-- Backfill participant cards for existing verified orders
-- This script generates participant cards for all orders that:
-- 1. Have verified payments (status = 'verified')
-- 2. Don't already have a participant card

-- Insert participant cards for orders with verified payments that don't have cards yet
INSERT INTO participant_cards (
  user_id,
  order_id,
  card_number,
  secure_token,
  full_name,
  email,
  phone,
  institution,
  position,
  events,
  status
)
SELECT 
  o.user_id,
  o.id as order_id,
  'ISAPM-2026-' || LPAD(FLOOR(RANDOM() * 100000)::text, 5, '0') as card_number,
  encode(gen_random_bytes(32), 'hex') as secure_token,
  p.full_name,
  p.email,
  p.phone,
  p.institution,
  p.position,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'event_id', oi.event_id,
        'event_label', oi.event_label,
        'participant_type', oi.participant_type,
        'participant_type_label', oi.participant_type_label
      )
    )
    FROM order_items oi
    WHERE oi.order_id = o.id AND oi.item_type = 'event'
  ) as events,
  'active' as status
FROM orders o
JOIN profiles p ON o.user_id = p.id
JOIN payments pay ON pay.order_id = o.id
WHERE pay.status = 'verified'
  AND NOT EXISTS (
    SELECT 1 FROM participant_cards pc WHERE pc.order_id = o.id
  )
  AND EXISTS (
    SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.item_type = 'event'
  );

-- Show how many cards were created
SELECT 
  'Backfill complete' as status,
  COUNT(*) as cards_created
FROM participant_cards
WHERE created_at > NOW() - INTERVAL '1 minute';
