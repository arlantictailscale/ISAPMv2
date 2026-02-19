-- Add extra_beds column to cart_items table
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS extra_beds integer DEFAULT 0;

-- Add extra_beds column to order_items table for order history
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS extra_beds integer DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN cart_items.extra_beds IS 'Number of extra beds requested for hotel room bookings (max 2 per room, Rp 550,000 each per night, includes breakfast)';
COMMENT ON COLUMN order_items.extra_beds IS 'Number of extra beds requested for hotel room bookings';
