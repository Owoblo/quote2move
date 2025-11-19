# Supabase Storage Setup

This document outlines the required Supabase Storage buckets for the MovSense application.

## Required Buckets

### 1. property-uploads

**Purpose**: Store user-uploaded photos and videos for furniture detection

**Configuration**:
- **Bucket Name**: `property-uploads`
- **Public**: Yes (enable public access)
- **File Size Limit**: 50 MB per file (recommended)
- **Allowed MIME Types**:
  - Images: `image/jpeg`, `image/png`, `image/webp`
  - Videos: `video/mp4`, `video/quicktime`, `video/x-msvideo`

**Setup Instructions**:

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Enter bucket name: `property-uploads`
5. Check **Public bucket** option
6. Click **Create bucket**

**Storage Policies**:

The bucket should have the following RLS policies (automatically applied via SQL):

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-uploads');

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'property-uploads');

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-uploads');

-- Allow public read access for customer uploads
CREATE POLICY "Public can read files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-uploads');
```

**File Path Structure**:
```
property-uploads/
  └── {user_id}/
      └── {upload_id}/
          └── {timestamp}-{filename}
```

Example: `property-uploads/abc123-def456/uuid-upload-id/1704067200000-kitchen.jpg`

## Security Considerations

- Files are scoped by user ID to prevent unauthorized access
- Public read access is enabled for shareable customer upload links
- File size limits prevent abuse
- MIME type restrictions ensure only valid media files are uploaded

## Maintenance

- Monitor storage usage regularly
- Consider implementing cleanup policies for old uploads
- Set up lifecycle rules to archive or delete files after retention period
