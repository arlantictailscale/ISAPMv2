-- Create RPC function to increment promo code usage count
CREATE OR REPLACE FUNCTION increment_promo_uses(code_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE promo_codes
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = code_id;
END;
$$;
