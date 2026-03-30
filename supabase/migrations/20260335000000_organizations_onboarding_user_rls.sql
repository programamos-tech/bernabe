-- Onboarding: INSERT ... RETURNING necesita que SELECT permita ver la fila recién creada.
-- Antes de actualizar profiles.organization_id, current_organization_id() es NULL y
-- pastor_email = (jwt->>'email') falla para usuarios anónimos (sin email en el JWT).

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS onboarding_user_id UUID;

COMMENT ON COLUMN public.organizations.onboarding_user_id IS
  'auth.uid() al crear la org en onboarding; permite SELECT tras INSERT antes de enlazar profiles.organization_id.';

DROP POLICY IF EXISTS "Allow insert organization for new onboarding" ON public.organizations;

CREATE POLICY "Allow insert organization for new onboarding"
  ON public.organizations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;

CREATE POLICY "Users can view own organization"
  ON public.organizations
  FOR SELECT
  USING (
    id = public.current_organization_id()
    OR pastor_email = (auth.jwt() ->> 'email')
    OR onboarding_user_id = auth.uid()
  );
