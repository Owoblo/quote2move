-- Setup Storage Policies for property-uploads bucket
-- Note: The bucket must be created manually in Supabase Dashboard first
-- See supabase/STORAGE_SETUP.md for instructions

-- Allow authenticated users to upload files to their own directory
create policy "Users can upload files to their directory"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'property-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read files from their own directory
create policy "Users can read their own files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'property-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update files in their own directory
create policy "Users can update their own files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'property-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete files from their own directory
create policy "Users can delete their own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'property-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access for all files (needed for customer upload links and shared URLs)
create policy "Public can read all files"
on storage.objects for select
to public
using (bucket_id = 'property-uploads');

-- Comments
comment on policy "Users can upload files to their directory" on storage.objects is
  'Allows authenticated users to upload files to their own user directory in property-uploads bucket';

comment on policy "Public can read all files" on storage.objects is
  'Allows public read access for shareable customer upload links and AI detection services';
