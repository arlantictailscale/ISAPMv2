-- Fix handle_new_user trigger - remove email column that doesn't exist in profiles table
-- Run this in Supabase SQL Editor

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function that matches ACTUAL profiles schema (no email column)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert new profile with user data from auth.users metadata
  -- Note: profiles table does NOT have an email column
  INSERT INTO public.profiles (
    id,
    full_name,
    first_name,
    last_name,
    title_degree,
    nik,
    phone,
    institution,
    position,
    role,
    satu_sehat_name,
    satu_sehat_email,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(new.raw_user_meta_data->>'title_degree', ''),
    COALESCE(new.raw_user_meta_data->>'nik', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'institution', ''),
    COALESCE(new.raw_user_meta_data->>'position', ''),
    'user',
    COALESCE(new.raw_user_meta_data->>'satu_sehat_name', ''),
    COALESCE(new.raw_user_meta_data->>'satu_sehat_email', ''),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    updated_at = now(),
    full_name = COALESCE(NULLIF(profiles.full_name, ''), EXCLUDED.full_name);

  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Create trigger to auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile entry when a new user signs up. Matches current profiles schema without email column.';
