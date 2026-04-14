-- Fecha de ingreso al grupo actual y fecha desde la que la persona es co-líder (mismo grupo).
ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS fecha_ingreso_grupo date,
  ADD COLUMN IF NOT EXISTS co_lider_desde date;

COMMENT ON COLUMN public.personas.fecha_ingreso_grupo IS 'Última fecha en que la persona fue asignada a su grupo_id actual.';
COMMENT ON COLUMN public.personas.co_lider_desde IS 'Si participacion_en_grupo = colider: desde cuándo ejerce co-liderazgo en este grupo.';

UPDATE public.personas p
SET fecha_ingreso_grupo = COALESCE(p.fecha_registro::date, (p.created_at AT TIME ZONE 'UTC')::date)
WHERE p.grupo_id IS NOT NULL AND p.fecha_ingreso_grupo IS NULL;

UPDATE public.personas p
SET co_lider_desde = COALESCE(p.fecha_registro::date, (p.created_at AT TIME ZONE 'UTC')::date)
WHERE p.participacion_en_grupo = 'colider' AND p.grupo_id IS NOT NULL AND p.co_lider_desde IS NULL;
