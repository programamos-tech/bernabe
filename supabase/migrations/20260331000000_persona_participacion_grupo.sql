-- Participación dentro del grupo (mismo grupo_id): miembro regular, apoyo o co-líder.
-- Estado "En servicio" para quien sirve en apoyo o como co-líder.

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS participacion_en_grupo TEXT;

UPDATE public.personas
SET participacion_en_grupo = 'miembro'
WHERE grupo_id IS NOT NULL AND participacion_en_grupo IS NULL;

DO $$
DECLARE
  conname text;
BEGIN
  SELECT c.conname INTO conname
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND t.relname = 'personas'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%estado%'
    AND pg_get_constraintdef(c.oid) LIKE '%Activo%'
    AND pg_get_constraintdef(c.oid) LIKE '%Visitante%'
  LIMIT 1;
  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.personas DROP CONSTRAINT %I', conname);
  END IF;
END $$;

ALTER TABLE public.personas
  ADD CONSTRAINT personas_estado_check
  CHECK (estado IN ('Activo', 'Visitante', 'Inactivo', 'En seguimiento', 'En servicio'));

ALTER TABLE public.personas
  DROP CONSTRAINT IF EXISTS personas_participacion_en_grupo_check;

ALTER TABLE public.personas
  ADD CONSTRAINT personas_participacion_en_grupo_check
  CHECK (participacion_en_grupo IS NULL OR participacion_en_grupo IN ('miembro', 'apoyo', 'colider'));

ALTER TABLE public.personas
  DROP CONSTRAINT IF EXISTS personas_grupo_participacion_consistency;

ALTER TABLE public.personas
  ADD CONSTRAINT personas_grupo_participacion_consistency
  CHECK (
    (grupo_id IS NULL AND participacion_en_grupo IS NULL)
    OR (grupo_id IS NOT NULL AND participacion_en_grupo IS NOT NULL)
  );
