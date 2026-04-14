-- Campos de información personal útiles para líderes pastores (acompañamiento, emergencias, contexto familiar/laboral).

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS tiene_pareja BOOLEAN,
  ADD COLUMN IF NOT EXISTS nombre_pareja TEXT,
  ADD COLUMN IF NOT EXISTS trabaja_actualmente BOOLEAN,
  ADD COLUMN IF NOT EXISTS estudia_actualmente BOOLEAN,
  ADD COLUMN IF NOT EXISTS condicion_salud TEXT,
  ADD COLUMN IF NOT EXISTS contacto_emergencia_nombre TEXT,
  ADD COLUMN IF NOT EXISTS contacto_emergencia_telefono TEXT;

COMMENT ON COLUMN public.personas.tiene_pareja IS 'Si tiene pareja o relación estable (complementa estado civil).';
COMMENT ON COLUMN public.personas.nombre_pareja IS 'Nombre de la pareja o cónyuge, si aplica.';
COMMENT ON COLUMN public.personas.trabaja_actualmente IS 'Si trabaja actualmente.';
COMMENT ON COLUMN public.personas.estudia_actualmente IS 'Si estudia actualmente.';
COMMENT ON COLUMN public.personas.condicion_salud IS 'Alergias, medicación, discapacidad u otra condición relevante para el cuidado pastoral.';
COMMENT ON COLUMN public.personas.contacto_emergencia_nombre IS 'Persona de contacto en emergencia.';
COMMENT ON COLUMN public.personas.contacto_emergencia_telefono IS 'Teléfono del contacto de emergencia.';
