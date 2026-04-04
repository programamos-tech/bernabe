-- Una sola persona por documento (cédula) dentro de cada organización.
-- Filas sin documento o solo espacios no entran en el índice (varias permitidas).
CREATE UNIQUE INDEX IF NOT EXISTS personas_organization_cedula_trim_unique
  ON public.personas (organization_id, (btrim(cedula)))
  WHERE cedula IS NOT NULL AND btrim(cedula) <> '';
