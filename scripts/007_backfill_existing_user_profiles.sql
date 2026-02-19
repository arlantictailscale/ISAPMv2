-- Backfill profiles for existing auth users who don't have profile records yet
-- This handles users who signed up before the profiles table and trigger were created

INSERT INTO public.profiles (id, first_name, last_name, phone, institution, position, created_at, updated_at)
SELECT 
  au.id,
  '' as first_name,
  '' as last_name,
  '' as phone,
  '' as institution,
  '' as position,
  au.created_at,
  now() as updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);
