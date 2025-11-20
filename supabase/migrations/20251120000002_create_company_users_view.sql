CREATE OR REPLACE VIEW public.company_users AS
SELECT
  p.id,
  p.company_id,
  p.full_name,
  u.email,
  p.role,
  p.is_active
FROM
  public.profiles p
JOIN
  auth.users u ON p.id = u.id;

ALTER VIEW company_users OWNER TO postgres;
GRANT ALL ON TABLE public.company_users TO postgres;
GRANT SELECT ON TABLE public.company_users TO authenticated;

-- RLS for the view
ALTER VIEW public.company_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can view users in their company" ON public.company_users
  FOR SELECT
  USING (
    get_my_company_id() = company_id AND
    (get_my_role() IN ('admin', 'manager'))
  );
