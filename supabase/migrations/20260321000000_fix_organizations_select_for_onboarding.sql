-- Allow user to see organization being created during onboarding
-- (RETURNING from the INSERT is subject to SELECT RLS)

DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;

CREATE POLICY "Users can view own organization"
  ON public.organizations
  FOR SELECT
  USING (
    id = public.current_organization_id()
    OR pastor_email = (auth.jwt() ->> 'email')
  );

