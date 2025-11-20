-- =====================================================
-- CRITICAL: Database Schema Separation for MovSense
-- =====================================================
-- This migration creates a dedicated 'movsense' schema to prevent
-- table name collisions with other applications sharing the database.
--
-- BEFORE: All tables in 'public' schema (collision risk)
-- AFTER: All MovSense tables in 'movsense' schema (isolated)
-- =====================================================

-- Step 1: Create the movsense schema
CREATE SCHEMA IF NOT EXISTS movsense;

-- Step 2: Move all existing tables to movsense schema
ALTER TABLE IF EXISTS public.projects SET SCHEMA movsense;
ALTER TABLE IF EXISTS public.quotes SET SCHEMA movsense;
ALTER TABLE IF EXISTS public.uploads SET SCHEMA movsense;
ALTER TABLE IF EXISTS public.upload_files SET SCHEMA movsense;
ALTER TABLE IF EXISTS public.leads SET SCHEMA movsense;
ALTER TABLE IF EXISTS public.company_settings SET SCHEMA movsense;
ALTER TABLE IF EXISTS public.user_email_settings SET SCHEMA movsense;
ALTER TABLE IF EXISTS public.custom_upsells SET SCHEMA movsense;
ALTER TABLE IF EXISTS public.quote_email_events SET SCHEMA movsense;
ALTER TABLE IF EXISTS public.quote_follow_ups SET SCHEMA movsense;

-- Step 3: Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA movsense TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA movsense TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA movsense TO authenticated;

-- Step 4: Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA movsense
GRANT ALL ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA movsense
GRANT ALL ON SEQUENCES TO authenticated;

-- Step 5: Update search path to include movsense schema first
-- This allows queries to find tables without explicit schema prefix
ALTER DATABASE postgres SET search_path TO movsense, public;

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. All RLS policies automatically moved with tables
-- 2. Foreign key constraints automatically updated
-- 3. Storage policies reference tables by name (no schema needed)
-- 4. Code changes required: Update supabase client config
-- 5. Other apps can now use 'public' schema without conflicts
-- =====================================================

-- Verify the migration (optional - will show all tables in movsense schema)
-- SELECT table_schema, table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'movsense'
-- ORDER BY table_name;
