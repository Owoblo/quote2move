-- =====================================================
-- FIX: Update RLS Helper Functions and Policies for movsense Schema
-- =====================================================
-- This migration updates all helper functions and RLS policies
-- to reference movsense.profiles instead of public.profiles
-- =====================================================

-- Helper function to get the current user's company_id from their profile
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT company_id FROM movsense.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get the current user's role from their profile
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS movsense.user_role AS $$
BEGIN
  RETURN (SELECT role FROM movsense.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

--- RLS for movsense.companies table ---
DROP POLICY IF EXISTS "Users can view their own company" ON movsense.companies;
CREATE POLICY "Users can view their own company" ON movsense.companies
  FOR SELECT USING (get_my_company_id() = id);

DROP POLICY IF EXISTS "Company owner can update their company" ON movsense.companies;
CREATE POLICY "Company owner can update their company" ON movsense.companies
  FOR UPDATE USING (auth.uid() = owner_id);

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


--- RLS for movsense.pricing_rules table ---
DROP POLICY IF EXISTS "Users can view pricing rules for their company" ON movsense.pricing_rules;
CREATE POLICY "Users can view pricing rules for their company" ON movsense.pricing_rules
  FOR SELECT USING (get_my_company_id() = company_id);

DROP POLICY IF EXISTS "Admins can manage pricing rules" ON movsense.pricing_rules;
CREATE POLICY "Admins can manage pricing rules" ON movsense.pricing_rules
  FOR ALL USING (
    get_my_company_id() = company_id AND get_my_role() = 'admin'
  );
