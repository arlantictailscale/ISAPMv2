-- Create a database function to update room settings with elevated privileges
-- This function bypasses RLS restrictions by using SECURITY DEFINER

CREATE OR REPLACE FUNCTION update_room_availability_settings(
  p_room_type TEXT,
  p_default_capacity INTEGER
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Log the operation
  RAISE LOG '[update_room_availability_settings] Updating % rooms to %', p_room_type, p_default_capacity;
  
  -- Upsert the room setting
  INSERT INTO room_availability_settings (room_type, default_capacity, created_at, updated_at)
  VALUES (p_room_type, p_default_capacity, NOW(), NOW())
  ON CONFLICT (room_type) DO UPDATE
  SET default_capacity = EXCLUDED.default_capacity, updated_at = NOW();
  
  -- Return success
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Room settings updated successfully'
  );
  
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG '[update_room_availability_settings] Error: %', SQLERRM;
  v_result := jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
  RETURN v_result;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION update_room_availability_settings(TEXT, INTEGER) TO authenticated;
