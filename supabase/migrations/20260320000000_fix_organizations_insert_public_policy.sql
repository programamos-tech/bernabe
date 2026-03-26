-- Ensure onboarding INSERT works regardless of role matching
-- (No TO clause => policy applies to PUBLIC)

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert organization for new onboarding" ON public.organizations;
DROP POLICY IF EXISTS "Allow insert organization for new onboarding (public)" ON public.organizations;

CREATE POLICY "Allow insert organization for new onboarding"
  ON public.organizations
  FOR INSERT
  WITH CHECK (true);

