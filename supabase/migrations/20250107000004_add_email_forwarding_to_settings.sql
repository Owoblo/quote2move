-- Add email forwarding settings
-- This allows users to receive replies to their custom movsense.com email addresses

-- Add forwarding_email column to company_settings
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS forwarding_email TEXT;

-- Add comment
COMMENT ON COLUMN company_settings.forwarding_email IS 'Email address where replies to user-specific movsense.com emails should be forwarded';

-- Update user_email_settings to include forwarding preference
-- The reply_to field already exists, but we'll ensure it's used for forwarding
COMMENT ON COLUMN user_email_settings.reply_to IS 'Email address for replies. If set, replies to user-specific emails will forward here. Otherwise, uses company_email from company_settings.';

