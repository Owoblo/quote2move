-- Create company settings table
-- This stores company branding information (name, logo, etc.)
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL DEFAULT 'Saturn Star Movers',
  company_logo_url TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_settings_user_id ON company_settings(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own company settings" ON company_settings;
DROP POLICY IF EXISTS "Users can insert their own company settings" ON company_settings;
DROP POLICY IF EXISTS "Users can update their own company settings" ON company_settings;
DROP POLICY IF EXISTS "Users can delete their own company settings" ON company_settings;

-- Create RLS policies
CREATE POLICY "Users can view their own company settings"
  ON company_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company settings"
  ON company_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company settings"
  ON company_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company settings"
  ON company_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE company_settings IS 'Stores company branding and contact information for each user';
COMMENT ON COLUMN company_settings.company_name IS 'Company name displayed in quotes and emails (e.g., "Saturn Star Movers")';
COMMENT ON COLUMN company_settings.company_logo_url IS 'URL to company logo image';

