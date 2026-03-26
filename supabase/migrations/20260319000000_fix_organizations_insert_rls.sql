-- Fix: asegurar que el INSERT en organizations durante el onboarding pase RLS

-- Por si la migración anterior quedó incompleta, recreamos la política explícitamente.
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert organization for new onboarding" ON public.organizations;

CREATE POLICY "Allow insert organization for new onboarding"
  ON public.organizations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

