-- Create storage bucket for company assets (logos)
-- This bucket will store company logos and other company-related files

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true, -- Public bucket so logos can be accessed via public URLs
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage.objects table for this bucket
-- Note: RLS on storage.objects is handled by Supabase automatically, but we need policies

-- Policy: Allow authenticated users to upload files to their own folder
CREATE POLICY IF NOT EXISTS "Users can upload company assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to view their own files
CREATE POLICY IF NOT EXISTS "Users can view their own company assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'company-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own files
CREATE POLICY IF NOT EXISTS "Users can update their own company assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'company-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete their own company assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to company logos (for displaying in quotes)
CREATE POLICY IF NOT EXISTS "Public can view company assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-assets');

COMMENT ON POLICY "Users can upload company assets" ON storage.objects IS 'Allows authenticated users to upload company logos to their own folder (company-assets/{user_id}/...)';
COMMENT ON POLICY "Users can view their own company assets" ON storage.objects IS 'Allows authenticated users to view their own company logos';
COMMENT ON POLICY "Users can update their own company assets" ON storage.objects IS 'Allows authenticated users to update their own company logos';
COMMENT ON POLICY "Users can delete their own company assets" ON storage.objects IS 'Allows authenticated users to delete their own company logos';
COMMENT ON POLICY "Public can view company assets" ON storage.objects IS 'Allows public read access to company logos for displaying in quotes';

