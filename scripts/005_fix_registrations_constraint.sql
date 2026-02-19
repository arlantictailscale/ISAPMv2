-- Drop the old restrictive check constraint on registration_type
ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_registration_type_check;

-- Allow any text value for registration_type since we have dynamic workshop/event types
-- The application logic will handle validation
