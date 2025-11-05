-- Clear invalid email settings
-- This migration removes custom email settings that use unverified domains
-- Users will automatically get auto-generated emails from the verified domain

-- Set from_email to NULL for emails using unverified domains
UPDATE user_email_settings
SET 
  from_email = NULL,
  updated_at = NOW()
WHERE 
  from_email IS NOT NULL
  AND (
    -- Gmail domain (not allowed for sending)
    from_email LIKE '%@gmail.com%'
    OR from_email LIKE '%@gmail.%'
    -- Starmovers domain (not verified)
    OR from_email LIKE '%@starmovers.ca%'
    OR from_email LIKE '%@starmovers.%'
    -- Any other domains that might be unverified
    OR from_email NOT LIKE '%@movsense.com%'
  );

-- Set reply_to to NULL for emails using unverified domains
UPDATE user_email_settings
SET 
  reply_to = NULL,
  updated_at = NOW()
WHERE 
  reply_to IS NOT NULL
  AND (
    -- Gmail domain (not allowed for sending)
    reply_to LIKE '%@gmail.com%'
    OR reply_to LIKE '%@gmail.%'
    -- Starmovers domain (not verified)
    OR reply_to LIKE '%@starmovers.ca%'
    OR reply_to LIKE '%@starmovers.%'
    -- Any other domains that might be unverified
    OR reply_to NOT LIKE '%@movsense.com%'
  );

-- Log the changes
DO $$
DECLARE
  cleared_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cleared_count
  FROM user_email_settings
  WHERE from_email IS NULL AND reply_to IS NULL;
  
  RAISE NOTICE 'Cleared invalid email settings. Users with NULL settings will use auto-generated emails.';
END $$;

