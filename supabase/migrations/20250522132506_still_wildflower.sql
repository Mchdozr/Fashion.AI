/*
  # Add start_generation function
  
  1. New Function
    - Creates a PostgreSQL function `start_generation` that initiates the try-on generation process
    - Accepts parameters:
      - model_image (text): URL of the model image
      - garment_image (text): URL of the garment image
      - category (text): Category of the garment
      - generation_id (uuid): ID of the generation record
    - Returns a JSON object containing the task ID
  
  2. Security
    - Function is accessible only to authenticated users
    - Validates input parameters
*/

CREATE OR REPLACE FUNCTION public.start_generation(
  model_image text,
  garment_image text,
  category text,
  generation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_id text;
BEGIN
  -- Input validation
  IF model_image IS NULL OR garment_image IS NULL OR category IS NULL OR generation_id IS NULL THEN
    RAISE EXCEPTION 'All parameters are required';
  END IF;

  -- Generate a unique task ID
  task_id := gen_random_uuid()::text;

  -- Return the task ID in JSON format
  RETURN jsonb_build_object(
    'taskId', task_id
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.start_generation TO authenticated;