-- ============================================
-- Project Management System Enhancement
-- ============================================
-- This migration transforms the projects table into a comprehensive
-- project management system with auto-save capabilities

-- Add new columns to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS bedrooms INT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS bathrooms NUMERIC;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS sqft INT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('mls', 'manual_upload', 'customer_upload'));
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS upload_session_id UUID REFERENCES public.uploads(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS photo_urls TEXT[];
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'detecting', 'editing', 'quote_sent', 'archived'));
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS detection_completed_at TIMESTAMPTZ;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS rooms_classified JSONB;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS mls_listing_id TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS last_auto_save TIMESTAMPTZ DEFAULT NOW();

-- Add project_id to uploads table to link customer uploads to projects
ALTER TABLE public.uploads ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_source ON public.projects(source);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_upload_session_id ON public.projects(upload_session_id);
CREATE INDEX IF NOT EXISTS idx_projects_quote_id ON public.projects(quote_id);
CREATE INDEX IF NOT EXISTS idx_projects_customer_email ON public.projects(customer_email);
CREATE INDEX IF NOT EXISTS idx_uploads_project_id ON public.uploads(project_id);

-- Update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_auto_save = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_projects_updated_at_trigger ON public.projects;
CREATE TRIGGER update_projects_updated_at_trigger
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- Add comments for documentation
COMMENT ON COLUMN public.projects.source IS 'Origin of the project: mls (MLS search), manual_upload (user upload), customer_upload (shared link)';
COMMENT ON COLUMN public.projects.upload_session_id IS 'References the upload session if created from customer upload';
COMMENT ON COLUMN public.projects.photo_urls IS 'Array of photo URLs from Supabase Storage or external sources';
COMMENT ON COLUMN public.projects.status IS 'Project workflow status: draft, detecting, editing, quote_sent, archived';
COMMENT ON COLUMN public.projects.detection_completed_at IS 'Timestamp when AI detection was completed';
COMMENT ON COLUMN public.projects.rooms_classified IS 'Stores room classification results from AI';
COMMENT ON COLUMN public.projects.quote_id IS 'References the quote generated from this project';
COMMENT ON COLUMN public.projects.last_auto_save IS 'Timestamp of last auto-save operation';
COMMENT ON COLUMN public.uploads.project_id IS 'Links customer upload to the project created from it';

-- Grant necessary permissions (if needed)
-- Note: RLS policies already exist from previous migration

-- Create a view for active projects with enriched data
CREATE OR REPLACE VIEW public.active_projects_view AS
SELECT
  p.*,
  q.customer_name as quote_customer_name,
  q.total_amount as quote_total,
  q.status as quote_status,
  u.customer_name as upload_customer_name,
  u.customer_phone as upload_customer_phone,
  (SELECT COUNT(*) FROM jsonb_array_elements(p.detections)) as detection_count,
  CASE
    WHEN p.status = 'archived' THEN false
    ELSE true
  END as is_active
FROM public.projects p
LEFT JOIN public.quotes q ON p.quote_id = q.id
LEFT JOIN public.uploads u ON p.upload_session_id = u.id
WHERE p.status != 'archived'
ORDER BY p.updated_at DESC;

-- Add RLS policy for the view
ALTER VIEW public.active_projects_view SET (security_invoker = true);

COMMENT ON VIEW public.active_projects_view IS 'Enriched view of active projects with related quote and upload data';
