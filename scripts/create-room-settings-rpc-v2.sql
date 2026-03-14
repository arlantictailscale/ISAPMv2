-- Create a database function to update both room settings at once
-- This function bypasses RLS restrictions by using SECURITY DEFINER
-- Signature matches what the frontend expects: p_deluxe_rooms, p_premier_rooms

-- Drop existing functions if they exist (to avoid conflicts)
DROP FUNCTION IF EXISTS update_room_availability_settings(TEXT, INTEGER);
DROP FUNCTION IF EXISTS update_room_availability_settings(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION update_room_availability_settings(
  p_deluxe_rooms INTEGER,
  p_premier_rooms INTEGER
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
  RAISE LOG '[update_room_availability_settings] Updating deluxe=% premier=%', p_deluxe_rooms, p_premier_rooms;
  
  -- Upsert deluxe room setting
  INSERT INTO room_availability_settings (room_type, default_capacity, created_at, updated_at)
  VALUES ('deluxe', p_deluxe_rooms, NOW(), NOW())
  ON CONFLICT (room_type) DO UPDATE
  SET default_capacity = EXCLUDED.default_capacity, updated_at = NOW();
  
  -- Upsert premier room setting
  INSERT INTO room_availability_settings (room_type, default_capacity, created_at, updated_at)
  VALUES ('premier', p_premier_rooms, NOW(), NOW())
  ON CONFLICT (room_type) DO UPDATE
  SET default_capacity = EXCLUDED.default_capacity, updated_at = NOW();
  
  -- Return success
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Room settings updated successfully',
    'deluxe_rooms', p_deluxe_rooms,
    'premier_rooms', p_premier_rooms
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
GRANT EXECUTE ON FUNCTION update_room_availability_settings(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_room_availability_settings(INTEGER, INTEGER) TO anon;
