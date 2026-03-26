-- Campos adicionales del onboarding para organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS tiene_grupos BOOLEAN,
  ADD COLUMN IF NOT EXISTS cantidad_grupos_aprox INT,
  ADD COLUMN IF NOT EXISTS objetivo_principal TEXT;
