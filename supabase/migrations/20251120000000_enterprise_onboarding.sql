-- Create a custom type for user roles
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'rep');

-- Create the companies table
CREATE TABLE companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    service_area TEXT,
    truck_count INT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_companies_owner_id ON companies(owner_id);

-- Create the profiles table to store user-specific data
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    full_name TEXT,
    role user_role DEFAULT 'rep'::user_role,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_profiles_company_id ON profiles(company_id);

-- Auto-create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF jsonb_path_exists(new.raw_user_meta_data, '$.company_id') THEN
    INSERT INTO public.profiles (id, full_name, company_id, role)
    VALUES (
      new.id, 
      new.raw_user_meta_data->>'full_name',
      (new.raw_user_meta_data->>'company_id')::UUID,
      (new.raw_user_meta_data->>'role')::user_role
    );
  ELSE
    INSERT INTO public.profiles (id, full_name)
    VALUES (new.id, new.raw_user_meta_data->>'full_name');
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function after a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add company_id to the quotes table
ALTER TABLE quotes ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
CREATE INDEX idx_quotes_company_id ON quotes(company_id);

-- Create the pricing_rules table
CREATE TABLE pricing_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    hourly_rate DECIMAL(10, 2),
    truck_fees JSONB,
    special_items JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_pricing_rules_company_id ON pricing_rules(company_id);
