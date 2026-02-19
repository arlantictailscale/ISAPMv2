-- Add invoice_number column to order_payments table
-- This ensures the invoice number generated when payment is verified
-- is stored and reused when downloading the invoice later

ALTER TABLE order_payments
ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_payments_invoice_number ON order_payments(invoice_number);

-- Add comment to explain the column
COMMENT ON COLUMN order_payments.invoice_number IS 'Unique invoice number generated when payment is verified. Format: Natmet-YYMMDD-XXXX';
