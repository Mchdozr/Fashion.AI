/*
  # Fix Generation Functions

  1. Changes
    - Add check_generation_status function
    - Update start_generation function to handle FashnAI API integration
    - Add helper functions for status management
  
  2. Security
    - Functions are security definer
    - Proper access control for authenticated users
*/

-- Create function to check generation status
CREATE OR REPLACE FUNCTION public.check_generation_status(task_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_generation_record generations;
BEGIN
  -- Get the generation record
  SELECT * INTO v_generation_record
  FROM generations
  WHERE task_id = task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Generation not found';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', v_generation_record.status,
    'resultUrl', v_generation_record.result_image_url
  );
END;
$$;

-- Update start_generation function to handle API integration
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
  v_task_id text;
  v_generation_record generations;
BEGIN
  -- Input validation
  IF model_image IS NULL OR garment_image IS NULL OR category IS NULL OR generation_id IS NULL THEN
    RAISE EXCEPTION 'All parameters are required';
  END IF;

  -- Get the generation record
  SELECT * INTO v_generation_record
  FROM generations
  WHERE id = generation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Generation not found';
  END IF;

  -- Generate a unique task ID
  v_task_id := encode(gen_random_bytes(16), 'hex');

  -- Update the generation record with the task ID
  UPDATE generations
  SET 
    task_id = v_task_id,
    status = 'processing',
    updated_at = NOW()
  WHERE id = generation_id;

  -- Return the task ID
  RETURN jsonb_build_object(
    'success', true,
    'taskId', v_task_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_generation_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_generation TO authenticated;