-- Add rejection_reason column to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_rejection_reason ON public.payments(rejection_reason);
