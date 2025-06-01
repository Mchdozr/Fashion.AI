-- Create toggle_favorite function
CREATE OR REPLACE FUNCTION toggle_favorite(generation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_state boolean;
BEGIN
  UPDATE generations
  SET 
    is_favorite = NOT is_favorite,
    updated_at = NOW()
  WHERE id = generation_id
  AND auth.uid() = user_id
  RETURNING is_favorite INTO new_state;
  
  RETURN jsonb_build_object('is_favorite', new_state);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION toggle_favorite TO authenticated;