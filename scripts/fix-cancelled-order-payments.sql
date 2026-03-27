-- Fix payment status for all cancelled orders
-- This updates order_payments to 'cancelled' status for orders that were cancelled
-- but still have 'verified' or other payment statuses

UPDATE order_payments
SET 
  payment_status = 'cancelled',
  updated_at = NOW()
WHERE order_id IN (
  SELECT id FROM orders WHERE status = 'cancelled'
)
AND payment_status != 'cancelled';

-- Verify the update
SELECT 
  o.id as order_id,
  o.status as order_status,
  op.payment_status,
  o.full_name
FROM orders o
LEFT JOIN order_payments op ON o.id = op.order_id
WHERE o.status = 'cancelled'
ORDER BY o.updated_at DESC;
