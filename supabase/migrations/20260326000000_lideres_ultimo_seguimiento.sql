-- Último seguimiento para líderes (fecha del último contacto/reunión)
ALTER TABLE public.lideres
  ADD COLUMN IF NOT EXISTS ultimo_seguimiento DATE;

COMMENT ON COLUMN public.lideres.ultimo_seguimiento IS 'Fecha del último seguimiento o reunión con el líder';
