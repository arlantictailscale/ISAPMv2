-- Create a function to count auth users (requires SECURITY DEFINER to access auth.users)
CREATE OR REPLACE FUNCTION public.count_auth_users()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  RETURN user_count;
EXCEPTION
  WHEN OTHERS THEN
    RETURN -1; -- Return -1 if there's an error
END;
$$;

-- Cast email to TEXT to match the return type declaration
CREATE OR REPLACE FUNCTION public.get_all_auth_users()
RETURNS TABLE (
  user_id uuid,
  user_email text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.users.id as user_id,
    auth.users.email::text as user_email,
    auth.users.created_at as created_at
  FROM auth.users
  ORDER BY auth.users.created_at DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.count_auth_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_auth_users() TO authenticated;
