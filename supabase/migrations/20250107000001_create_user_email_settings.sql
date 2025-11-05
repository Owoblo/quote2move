-- Create user email settings table
-- This allows each user to customize their email sender information
CREATE TABLE IF NOT EXISTS user_email_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  from_email TEXT, -- NULL means use auto-generated user-specific email
  from_name TEXT NOT NULL DEFAULT 'MovSense',
  reply_to TEXT, -- NULL means use auto-generated user-specific email
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_email_settings_user_id ON user_email_settings(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_email_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own email settings" ON user_email_settings;
DROP POLICY IF EXISTS "Users can insert their own email settings" ON user_email_settings;
DROP POLICY IF EXISTS "Users can update their own email settings" ON user_email_settings;
DROP POLICY IF EXISTS "Users can delete their own email settings" ON user_email_settings;

-- Create RLS policies
CREATE POLICY "Users can view their own email settings"
  ON user_email_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email settings"
  ON user_email_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email settings"
  ON user_email_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email settings"
  ON user_email_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE user_email_settings IS 'Stores email sender configuration for each user';
COMMENT ON COLUMN user_email_settings.from_email IS 'Email address to send from (e.g., "My Company <noreply@mycompany.com>")';
COMMENT ON COLUMN user_email_settings.from_name IS 'Display name for the sender';
COMMENT ON COLUMN user_email_settings.reply_to IS 'Reply-to email address';

