-- Sexo declarado para la persona (avatar ilustrado y referencia pastoral). NULL = no indicado.
ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS sexo text;

ALTER TABLE public.personas
  DROP CONSTRAINT IF EXISTS personas_sexo_check;

ALTER TABLE public.personas
  ADD CONSTRAINT personas_sexo_check
  CHECK (sexo IS NULL OR sexo IN ('masculino', 'femenino'));

COMMENT ON COLUMN public.personas.sexo IS 'masculino | femenino | NULL. Usado entre otros para el avatar (react-nice-avatar).';
