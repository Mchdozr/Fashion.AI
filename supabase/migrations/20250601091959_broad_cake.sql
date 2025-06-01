-- Create restore function
CREATE OR REPLACE FUNCTION restore_generation(generation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE generations
  SET 
    deleted_at = NULL,
    updated_at = NOW()
  WHERE id = generation_id
  AND auth.uid() = user_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Create permanent delete function
CREATE OR REPLACE FUNCTION permanent_delete_generation(generation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM generations
  WHERE id = generation_id
  AND auth.uid() = user_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION restore_generation TO authenticated;
GRANT EXECUTE ON FUNCTION permanent_delete_generation TO authenticated;