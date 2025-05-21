/*
  # Setup Storage for Image Uploads

  1. Changes
    - Create storage bucket for images
    - Add RLS policies for storage access
*/

-- Enable storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- Set up RLS policies for storage
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');