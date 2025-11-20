-- Helper function to get the current user's company_id from their profile
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT company_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get the current user's role from their profile
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--- RLS for profiles table ---
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins and managers can view profiles in their company" ON profiles
  FOR SELECT USING (
    get_my_company_id() = company_id AND (get_my_role() IN ('admin', 'manager'))
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update profiles in their company" ON profiles
  FOR UPDATE USING (
    get_my_company_id() = company_id AND get_my_role() = 'admin'
  );

--- RLS for companies table ---
CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT USING (get_my_company_id() = id);

CREATE POLICY "Company owner can update their company" ON companies
  FOR UPDATE USING (auth.uid() = owner_id);

--- RLS for quotes table ---
-- First, drop the old, simpler policies
DROP POLICY IF EXISTS "Users can view their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON quotes;

-- New RLS policies for quotes
CREATE POLICY "Reps can view their own quotes" ON quotes
  FOR SELECT USING (
    get_my_role() = 'rep' AND auth.uid() = user_id
  );

CREATE POLICY "Admins and managers can view all quotes in their company" ON quotes
  FOR SELECT USING (
    get_my_company_id() = company_id AND (get_my_role() IN ('admin', 'manager'))
  );

CREATE POLICY "Users can create quotes for their company" ON quotes
  FOR INSERT WITH CHECK (
    get_my_company_id() = company_id
  );

CREATE POLICY "Reps can update their own quotes" ON quotes
  FOR UPDATE USING (
    get_my_role() = 'rep' AND auth.uid() = user_id
  );
  
CREATE POLICY "Admins and managers can update all quotes in their company" ON quotes
  FOR UPDATE USING (
    get_my_company_id() = company_id AND (get_my_role() IN ('admin', 'manager'))
  );

CREATE POLICY "Reps can delete their own quotes" ON quotes
  FOR DELETE USING (
    get_my_role() = 'rep' AND auth.uid() = user_id
  );

CREATE POLICY "Admins and managers can delete any quote in their company" ON quotes
  FOR DELETE USING (
    get_my_company_id() = company_id AND (get_my_role() IN ('admin', 'manager'))
  );


--- RLS for pricing_rules table ---
CREATE POLICY "Users can view pricing rules for their company" ON pricing_rules
  FOR SELECT USING (get_my_company_id() = company_id);

CREATE POLICY "Admins can manage pricing rules" ON pricing_rules
  FOR ALL USING (
    get_my_company_id() = company_id AND get_my_role() = 'admin'
  );
