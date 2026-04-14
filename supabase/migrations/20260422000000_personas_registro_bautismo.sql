-- Registro pastoral del bautismo (fecha y lugar) desde la ficha de persona.

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS fecha_bautismo DATE;

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS lugar_bautismo TEXT;

COMMENT ON COLUMN public.personas.fecha_bautismo IS 'Fecha en que la persona fue bautizada (registro pastoral manual).';
COMMENT ON COLUMN public.personas.lugar_bautismo IS 'Lugar donde ocurrió el bautismo (registro pastoral manual).';
