-- Reemplaza personas.estado por personas.etapa (embudo de discipulado hasta líder o servicio).

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS etapa TEXT;

UPDATE public.personas
SET etapa = CASE estado
  WHEN 'Visitante' THEN 'visitante'
  WHEN 'En seguimiento' THEN 'en_proceso'
  WHEN 'En servicio' THEN 'en_servicio'
  WHEN 'Inactivo' THEN 'inactivo'
  WHEN 'Activo' THEN CASE WHEN grupo_id IS NOT NULL THEN 'consolidado' ELSE 'en_proceso' END
  ELSE 'en_proceso'
END
WHERE etapa IS NULL;

ALTER TABLE public.personas
  ALTER COLUMN etapa SET DEFAULT 'visitante';

UPDATE public.personas SET etapa = 'visitante' WHERE etapa IS NULL;

ALTER TABLE public.personas
  ALTER COLUMN etapa SET NOT NULL;

ALTER TABLE public.personas DROP CONSTRAINT IF EXISTS personas_estado_check;

ALTER TABLE public.personas DROP COLUMN IF EXISTS estado;

ALTER TABLE public.personas
  DROP CONSTRAINT IF EXISTS personas_etapa_check;

ALTER TABLE public.personas
  ADD CONSTRAINT personas_etapa_check
  CHECK (
    etapa IN (
      'visitante',
      'nuevo_creyente',
      'en_proceso',
      'consolidado',
      'lider_en_formacion',
      'lider_grupo',
      'en_servicio',
      'inactivo'
    )
  );

COMMENT ON COLUMN public.personas.etapa IS 'Etapa del camino de discipulado en la iglesia (reemplaza el antiguo estado operativo).';
