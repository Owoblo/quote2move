-- =====================================================
-- MOVSENSE ENTERPRISE SCHEMA FIX - ALL-IN-ONE MIGRATION
-- =====================================================
-- This file combines all 3 migrations into one
-- Safe to run multiple times (idempotent)
-- =====================================================

BEGIN;

-- =====================================================
-- PART 1: Create MovSense Enterprise Tables
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '📦 Creating movsense enterprise tables...';
END $$;

-- Step 1: Create custom type in movsense schema (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'movsense')) THEN
        CREATE TYPE movsense.user_role AS ENUM ('admin', 'manager', 'rep');
        RAISE NOTICE '✅ Created movsense.user_role enum';
    ELSE
        RAISE NOTICE '⏭️  movsense.user_role already exists';
    END IF;
END $$;

-- Step 2: Create companies table in movsense schema
CREATE TABLE IF NOT EXISTS movsense.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    service_area TEXT,
    truck_count INT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    RAISE NOTICE '✅ Created/verified movsense.companies table';
END $$;

ALTER TABLE movsense.companies ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_movsense_companies_owner_id ON movsense.companies(owner_id);

-- Step 3: Create profiles table in movsense schema
CREATE TABLE IF NOT EXISTS movsense.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES movsense.companies(id) ON DELETE CASCADE,
    full_name TEXT,
    role movsense.user_role DEFAULT 'rep'::movsense.user_role,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    RAISE NOTICE '✅ Created/verified movsense.profiles table';
END $$;

ALTER TABLE movsense.profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_movsense_profiles_company_id ON movsense.profiles(company_id);

-- Step 4: Create pricing_rules table in movsense schema
CREATE TABLE IF NOT EXISTS movsense.pricing_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES movsense.companies(id) ON DELETE CASCADE UNIQUE,
    hourly_rate DECIMAL(10, 2),
    truck_fees JSONB,
    special_items JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    RAISE NOTICE '✅ Created/verified movsense.pricing_rules table';
END $$;

ALTER TABLE movsense.pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_movsense_pricing_rules_company_id ON movsense.pricing_rules(company_id);

-- Step 5: Add company_id to quotes if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'movsense'
        AND table_name = 'quotes'
        AND column_name = 'company_id'
    ) THEN
        ALTER TABLE movsense.quotes ADD COLUMN company_id UUID REFERENCES movsense.companies(id) ON DELETE CASCADE;
        CREATE INDEX idx_movsense_quotes_company_id ON movsense.quotes(company_id);
        RAISE NOTICE '✅ Added company_id to movsense.quotes';
    ELSE
        RAISE NOTICE '⏭️  company_id already exists on movsense.quotes';
    END IF;
END $$;

-- Step 6: Update or create handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF jsonb_path_exists(new.raw_user_meta_data, '$.company_id') THEN
    INSERT INTO movsense.profiles (id, full_name, company_id, role)
    VALUES (
      new.id,
      new.raw_user_meta_data->>'full_name',
      (new.raw_user_meta_data->>'company_id')::UUID,
      (new.raw_user_meta_data->>'role')::movsense.user_role
    );
  ELSE
    INSERT INTO movsense.profiles (id, full_name)
    VALUES (new.id, new.raw_user_meta_data->>'full_name');
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    RAISE NOTICE '✅ Updated handle_new_user() function';
END $$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DO $$
BEGIN
    RAISE NOTICE '✅ Created trigger on_auth_user_created';
END $$;

-- =====================================================
-- PART 2: Fix RLS Helper Functions and Policies
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔒 Setting up RLS helper functions and policies...';
END $$;

-- Helper function to get the current user's company_id from their profile
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT company_id FROM movsense.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    RAISE NOTICE '✅ Created get_my_company_id() function';
END $$;

-- Helper function to get the current user's role from their profile
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS movsense.user_role AS $$
BEGIN
  RETURN (SELECT role FROM movsense.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    RAISE NOTICE '✅ Created get_my_role() function';
END $$;

--- RLS for movsense.profiles table ---
DROP POLICY IF EXISTS "Users can view their own profile" ON movsense.profiles;
CREATE POLICY "Users can view their own profile" ON movsense.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins and managers can view profiles in their company" ON movsense.profiles;
CREATE POLICY "Admins and managers can view profiles in their company" ON movsense.profiles
  FOR SELECT USING (
    get_my_company_id() = company_id AND (get_my_role() IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON movsense.profiles;
CREATE POLICY "Users can update their own profile" ON movsense.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update profiles in their company" ON movsense.profiles;
CREATE POLICY "Admins can update profiles in their company" ON movsense.profiles
  FOR UPDATE USING (
    get_my_company_id() = company_id AND get_my_role() = 'admin'
  );

DO $$
BEGIN
    RAISE NOTICE '✅ Created RLS policies for movsense.profiles';
END $$;

--- RLS for movsense.companies table ---
DROP POLICY IF EXISTS "Users can view their own company" ON movsense.companies;
CREATE POLICY "Users can view their own company" ON movsense.companies
  FOR SELECT USING (get_my_company_id() = id);

DROP POLICY IF EXISTS "Company owner can update their company" ON movsense.companies;
CREATE POLICY "Company owner can update their company" ON movsense.companies
  FOR UPDATE USING (auth.uid() = owner_id);

DO $$
BEGIN
    RAISE NOTICE '✅ Created RLS policies for movsense.companies';
END $$;

--- RLS for movsense.quotes table ---
-- First, drop the old, simpler policies
DROP POLICY IF EXISTS "Users can view their own quotes" ON movsense.quotes;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON movsense.quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON movsense.quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON movsense.quotes;

-- Drop old role-based policies if they exist
DROP POLICY IF EXISTS "Reps can view their own quotes" ON movsense.quotes;
DROP POLICY IF EXISTS "Admins and managers can view all quotes in their company" ON movsense.quotes;
DROP POLICY IF EXISTS "Users can create quotes for their company" ON movsense.quotes;
DROP POLICY IF EXISTS "Reps can update their own quotes" ON movsense.quotes;
DROP POLICY IF EXISTS "Admins and managers can update all quotes in their company" ON movsense.quotes;
DROP POLICY IF EXISTS "Reps can delete their own quotes" ON movsense.quotes;
DROP POLICY IF EXISTS "Admins and managers can delete any quote in their company" ON movsense.quotes;

-- New RLS policies for quotes
CREATE POLICY "Reps can view their own quotes" ON movsense.quotes
  FOR SELECT USING (
    get_my_role() = 'rep' AND auth.uid() = user_id
  );

CREATE POLICY "Admins and managers can view all quotes in their company" ON movsense.quotes
  FOR SELECT USING (
    get_my_company_id() = company_id AND (get_my_role() IN ('admin', 'manager'))
  );

CREATE POLICY "Users can create quotes for their company" ON movsense.quotes
  FOR INSERT WITH CHECK (
    get_my_company_id() = company_id
  );

CREATE POLICY "Reps can update their own quotes" ON movsense.quotes
  FOR UPDATE USING (
    get_my_role() = 'rep' AND auth.uid() = user_id
  );

CREATE POLICY "Admins and managers can update all quotes in their company" ON movsense.quotes
  FOR UPDATE USING (
    get_my_company_id() = company_id AND (get_my_role() IN ('admin', 'manager'))
  );

CREATE POLICY "Reps can delete their own quotes" ON movsense.quotes
  FOR DELETE USING (
    get_my_role() = 'rep' AND auth.uid() = user_id
  );

CREATE POLICY "Admins and managers can delete any quote in their company" ON movsense.quotes
  FOR DELETE USING (
    get_my_company_id() = company_id AND (get_my_role() IN ('admin', 'manager'))
  );

DO $$
BEGIN
    RAISE NOTICE '✅ Created RLS policies for movsense.quotes';
END $$;

--- RLS for movsense.pricing_rules table ---
DROP POLICY IF EXISTS "Users can view pricing rules for their company" ON movsense.pricing_rules;
CREATE POLICY "Users can view pricing rules for their company" ON movsense.pricing_rules
  FOR SELECT USING (get_my_company_id() = company_id);

DROP POLICY IF EXISTS "Admins can manage pricing rules" ON movsense.pricing_rules;
CREATE POLICY "Admins can manage pricing rules" ON movsense.pricing_rules
  FOR ALL USING (
    get_my_company_id() = company_id AND get_my_role() = 'admin'
  );

DO $$
BEGIN
    RAISE NOTICE '✅ Created RLS policies for movsense.pricing_rules';
END $$;

-- =====================================================
-- PART 3: Fix company_users View
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '👁️  Creating company_users view...';
END $$;

-- Drop the old view if it exists
DROP VIEW IF EXISTS public.company_users;

-- Create the corrected view
CREATE OR REPLACE VIEW public.company_users
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.company_id,
  p.full_name,
  u.email,
  p.role,
  p.is_active
FROM
  movsense.profiles p
JOIN
  auth.users u ON p.id = u.id;

-- Grant access to authenticated users
GRANT SELECT ON public.company_users TO authenticated;

DO $$
BEGIN
    RAISE NOTICE '✅ Created company_users view';
END $$;

-- RLS policies for the view
DROP POLICY IF EXISTS "Users can view company users in their company" ON public.company_users;
CREATE POLICY "Users can view company users in their company" ON public.company_users
  FOR SELECT USING (
    get_my_company_id() = company_id
  );

DO $$
BEGIN
    RAISE NOTICE '✅ Created RLS policy for company_users view';
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
    movsense_tables INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Verifying installation...';

    SELECT COUNT(*) INTO movsense_tables
    FROM information_schema.tables
    WHERE table_schema = 'movsense'
    AND table_name IN ('companies', 'profiles', 'pricing_rules');

    IF movsense_tables = 3 THEN
        RAISE NOTICE '✅ All 3 movsense enterprise tables created successfully!';
    ELSE
        RAISE NOTICE '⚠️  Warning: Only % of 3 tables found', movsense_tables;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '================================';
    RAISE NOTICE '✅ MIGRATION COMPLETED!';
    RAISE NOTICE '================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Deploy updated signup-company edge function';
    RAISE NOTICE '2. Test company signup at /signup-company';
    RAISE NOTICE '';
END $$;

COMMIT;
