-- Add favorites and deleted items support
ALTER TABLE generations
ADD COLUMN is_favorite boolean DEFAULT false,
ADD COLUMN deleted_at timestamptz DEFAULT null;

-- Add index for faster queries
CREATE INDEX idx_generations_is_favorite ON generations(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_generations_deleted_at ON generations(deleted_at) WHERE deleted_at IS NOT NULL;

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