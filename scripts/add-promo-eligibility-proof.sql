-- Add promo_eligibility_proof_url column to order_payments
-- This stores the URL of the uploaded document proving the user is eligible for the promo code they used

ALTER TABLE order_payments
ADD COLUMN IF NOT EXISTS promo_eligibility_proof_url text;

COMMENT ON COLUMN order_payments.promo_eligibility_proof_url IS 'URL of document uploaded by user to prove eligibility for the applied promo code';
