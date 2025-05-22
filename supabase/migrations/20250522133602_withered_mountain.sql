/*
  # Add pgcrypto extension
  
  1. Changes
    - Enables the pgcrypto extension which provides cryptographic functions
    - This adds support for gen_random_bytes() function
    
  2. Purpose
    - Required for generating secure random bytes
    - Used by the start_generation function
*/

-- Enable the pgcrypto extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the start_generation function that uses gen_random_bytes
CREATE OR REPLACE FUNCTION start_generation(
  p_model_image text,
  p_garment_image text,
  p_category text,
  p_generation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task_id text;
BEGIN
  -- Generate a random task ID using gen_random_bytes
  v_task_id := encode(gen_random_bytes(16), 'hex');
  
  RETURN jsonb_build_object(
    'success', true,
    'taskId', v_task_id
  );
END;
$$;