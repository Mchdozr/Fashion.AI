-- Create soft delete function
CREATE OR REPLACE FUNCTION soft_delete_generation(generation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE generations
  SET 
    deleted_at = NOW(),
    updated_at = NOW()
  WHERE id = generation_id
  AND auth.uid() = user_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION soft_delete_generation TO authenticated;