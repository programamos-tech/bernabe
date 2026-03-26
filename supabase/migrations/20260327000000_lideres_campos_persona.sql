-- Mismos campos de información personal que en personas
ALTER TABLE public.lideres
  ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
  ADD COLUMN IF NOT EXISTS estado_civil TEXT,
  ADD COLUMN IF NOT EXISTS ocupacion TEXT,
  ADD COLUMN IF NOT EXISTS direccion TEXT;

COMMENT ON COLUMN public.lideres.fecha_nacimiento IS 'Fecha de nacimiento del líder';
COMMENT ON COLUMN public.lideres.estado_civil IS 'Estado civil (ej. Casado, Soltero)';
COMMENT ON COLUMN public.lideres.ocupacion IS 'Ocupación o profesión';
COMMENT ON COLUMN public.lideres.direccion IS 'Dirección de residencia';
