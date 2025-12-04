-- Add sponsor_name column to order_payments for sponsored payment type
-- This stores the benefactor/sponsor name when payment method is "Sponsored"

ALTER TABLE order_payments 
ADD COLUMN IF NOT EXISTS sponsor_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN order_payments.sponsor_name IS 'Name of the sponsor/benefactor for sponsored payments';
