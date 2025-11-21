-- =====================================================
-- MOVSENSE - QUICK DATABASE SETUP (Public Schema)
-- =====================================================
-- Run this in your Sold2Move Supabase SQL Editor
-- Database: https://idbyrtwdeeruiutoukct.supabase.co
--
-- This creates the projects and quotes tables needed for MovSense
-- The listings tables (just_listed, sold_listings) should already exist
-- =====================================================

BEGIN;

-- 1. Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  project_name TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  bedrooms INT,
  bathrooms NUMERIC,
  sqft INT,
  source TEXT CHECK (source IN ('mls', 'manual_upload', 'customer_upload')),
  upload_session_id UUID,
  photo_urls TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'detecting', 'editing', 'quote_sent', 'archived')),
  detections JSONB DEFAULT '[]'::jsonb,
  estimate JSONB DEFAULT '{}'::jsonb,
  detection_completed_at TIMESTAMPTZ,
  rooms_classified JSONB,
  quote_id UUID,
  mls_listing_id TEXT,
  notes TEXT,
  last_auto_save TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_source ON public.projects(source);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- Create RLS policies
CREATE POLICY "Users can view their own projects"
  ON public.projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Create quotes table (if not exists)
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  moving_from TEXT,
  moving_to TEXT,
  move_date DATE,
  bedrooms INT,
  bathrooms NUMERIC,
  sqft INT,
  items JSONB DEFAULT '[]'::jsonb,
  total_amount DECIMAL(10, 2),
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for quotes
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON public.quotes(created_at DESC);

-- Enable RLS for quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON public.quotes;

-- Create RLS policies for quotes
CREATE POLICY "Users can view their own quotes"
  ON public.quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes"
  ON public.quotes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes"
  ON public.quotes FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Create auto-update trigger for projects
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_auto_save = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_updated_at_trigger ON public.projects;
CREATE TRIGGER update_projects_updated_at_trigger
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete! Projects and quotes tables created in public schema.';
END $$;
