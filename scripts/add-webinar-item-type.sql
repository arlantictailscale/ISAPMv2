-- Migration to add 'webinar' as a valid item_type in cart_items and order_items tables
-- This allows webinar registrations to be added to the cart and orders

-- Step 1: Drop the existing check constraint on cart_items
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_item_type_check;

-- Step 2: Add new check constraint that includes 'webinar'
ALTER TABLE cart_items ADD CONSTRAINT cart_items_item_type_check 
  CHECK (item_type IN ('event', 'workshop', 'hotel', 'webinar'));

-- Step 3: Drop the existing check constraint on order_items (if exists)
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_item_type_check;

-- Step 4: Add new check constraint for order_items that includes 'webinar'
ALTER TABLE order_items ADD CONSTRAINT order_items_item_type_check 
  CHECK (item_type IN ('event', 'workshop', 'hotel', 'webinar'));

-- Verify the constraints were added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname IN ('cart_items_item_type_check', 'order_items_item_type_check');
