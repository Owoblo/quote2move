-- =====================================================
-- FIX: Move MovSense Enterprise Tables to movsense Schema
-- =====================================================
-- This migration ensures MovSense enterprise tables are in
-- the movsense schema to avoid conflicts with Sold2Move tables
-- in the public schema.
-- =====================================================

-- Step 1: Create custom type in movsense schema (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'movsense')) THEN
        CREATE TYPE movsense.user_role AS ENUM ('admin', 'manager', 'rep');
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

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 7: Migrate any existing data from public schema (if exists)
DO $$
BEGIN
    -- Check if public.companies exists and has MovSense-specific columns
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'companies'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'companies'
        AND column_name = 'service_area'  -- MovSense-specific column
    ) THEN
        -- This is the MovSense companies table, migrate it
        INSERT INTO movsense.companies (id, name, phone, address, service_area, truck_count, owner_id, created_at)
        SELECT id, name, phone, address, service_area, truck_count, owner_id, created_at
        FROM public.companies
        ON CONFLICT (id) DO NOTHING;

        -- Don't drop public.companies as it might be used by Sold2Move
        -- Just leave it there for now
    END IF;

    -- Migrate profiles if they exist in public
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'company_id'  -- MovSense-specific column
    ) THEN
        INSERT INTO movsense.profiles (id, company_id, full_name, role, is_active, updated_at)
        SELECT id, company_id, full_name, role::movsense.user_role, is_active, updated_at
        FROM public.profiles
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Migrate pricing_rules if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'pricing_rules'
    ) THEN
        INSERT INTO movsense.pricing_rules (id, company_id, hourly_rate, truck_fees, special_items, created_at, updated_at)
        SELECT id, company_id, hourly_rate, truck_fees, special_items, created_at, updated_at
        FROM public.pricing_rules
        WHERE company_id IN (SELECT id FROM movsense.companies)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify the migration worked:
-- SELECT table_schema, table_name FROM information_schema.tables
-- WHERE table_name IN ('companies', 'profiles', 'pricing_rules')
-- ORDER BY table_schema, table_name;
