-- Fix handle_new_user trigger that causes "Error updating user" on Google sign-in
-- This script completely removes and recreates the trigger with proper error handling

-- Step 1: Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop the existing function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Create an improved function with comprehensive error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _full_name text;
  _first_name text;
  _last_name text;
BEGIN
  -- Extract name from user metadata (supports both email signup and OAuth)
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    ''
  );
  
  _first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'given_name',
    split_part(_full_name, ' ', 1),
    ''
  );
  
  _last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'family_name',
    CASE 
      WHEN position(' ' in _full_name) > 0 
      THEN substring(_full_name from position(' ' in _full_name) + 1)
      ELSE ''
    END
  );

  -- Insert profile with all required fields, using ON CONFLICT to handle duplicates
  INSERT INTO public.profiles (
    id,
    full_name,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NULLIF(_full_name, ''),
    NULLIF(_first_name, ''),
    NULLIF(_last_name, ''),
    'user',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    updated_at = NOW();

  -- Always return NEW to allow the user creation to succeed
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    -- Return NEW anyway so user creation succeeds
    RETURN NEW;
END;
$$;

-- Step 4: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO anon;

-- Step 6: Verify the trigger was created
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
