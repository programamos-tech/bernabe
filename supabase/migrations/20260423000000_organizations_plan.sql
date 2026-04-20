-- Plan de acceso: líder individual (gratis con límites) vs iglesia (funciones completas / facturación).
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS plan text;

UPDATE public.organizations
SET plan = 'church'
WHERE plan IS NULL;

ALTER TABLE public.organizations
  ALTER COLUMN plan SET DEFAULT 'leader_individual',
  ALTER COLUMN plan SET NOT NULL;

ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_plan_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_plan_check
  CHECK (plan IN ('leader_individual', 'church'));

COMMENT ON COLUMN public.organizations.plan IS
  'leader_individual: hasta 50 personas y 3 grupos; sin módulos Líderes ni Eventos. church: producto completo.';
