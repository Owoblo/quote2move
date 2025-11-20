-- =====================================================
-- FIX: Update company_users View for movsense Schema
-- =====================================================
-- This migration recreates the company_users view to reference
-- movsense.profiles instead of public.profiles
-- =====================================================

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

-- Enable RLS on the view
ALTER VIEW public.company_users SET (security_invoker = true);

-- Grant access to authenticated users
GRANT SELECT ON public.company_users TO authenticated;

-- RLS policies for the view
DROP POLICY IF EXISTS "Users can view company users in their company" ON public.company_users;
CREATE POLICY "Users can view company users in their company" ON public.company_users
  FOR SELECT USING (
    get_my_company_id() = company_id
  );
