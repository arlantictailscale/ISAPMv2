-- Add columns for tracking bonus items in cart
-- Run this migration to support the Symposium + Free Webinars promotion

-- Add is_bonus_item column to track items added as part of a promotion
ALTER TABLE cart_items
ADD COLUMN IF NOT EXISTS is_bonus_item BOOLEAN DEFAULT FALSE;

-- Add bonus_source column to track which promotion/item triggered the bonus
ALTER TABLE cart_items
ADD COLUMN IF NOT EXISTS bonus_source TEXT DEFAULT NULL;

-- Add original_price column to display the value of free items
ALTER TABLE cart_items
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2) DEFAULT NULL;

-- Create index for efficient querying of bonus items
CREATE INDEX IF NOT EXISTS idx_cart_items_is_bonus_item ON cart_items(is_bonus_item);
CREATE INDEX IF NOT EXISTS idx_cart_items_bonus_source ON cart_items(bonus_source);

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'cart_items' 
AND column_name IN ('is_bonus_item', 'bonus_source', 'original_price');
