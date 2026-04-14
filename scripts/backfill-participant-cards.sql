-- Backfill participant cards for existing verified orders
-- This script generates participant cards for all orders that:
-- 1. Have verified payments (payment_status = 'verified')
-- 2. Don't already have a participant card

-- Insert participant cards for orders with verified payments that don't have cards yet
INSERT INTO participant_cards (
  user_id,
  order_id,
  card_token,
  full_name,
  email,
  institution,
  position,
  events,
  is_checked_in,
  issued_at
)
SELECT 
  o.user_id,
  o.id as order_id,
  encode(gen_random_bytes(32), 'hex') as card_token,
  COALESCE(o.full_name, p.full_name) as full_name,
  COALESCE(o.email, (SELECT email FROM auth.users WHERE id = o.user_id)) as email,
  COALESCE(o.institution, p.institution) as institution,
  COALESCE(o.position, p.position) as position,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'event_id', oi.event_id,
        'event_label', oi.event_label,
        'participant_type_id', oi.participant_type_id,
        'participant_type_label', oi.participant_type_label
      )
    )
    FROM order_items oi
    WHERE oi.order_id = o.id AND oi.item_type = 'event'
  ) as events,
  false as is_checked_in,
  NOW() as issued_at
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id
JOIN order_payments op ON op.order_id = o.id
WHERE op.payment_status = 'verified'
  AND o.user_id IS NOT NULL
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
