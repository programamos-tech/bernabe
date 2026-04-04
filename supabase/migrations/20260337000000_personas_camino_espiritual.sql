-- Contexto espiritual / llegada: bautismo, procedencia, situación respecto a la fe y la iglesia
ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS bautizado boolean,
  ADD COLUMN IF NOT EXISTS viene_de_otra_iglesia boolean,
  ADD COLUMN IF NOT EXISTS nombre_iglesia_anterior text,
  ADD COLUMN IF NOT EXISTS situacion_acercamiento text;

ALTER TABLE public.personas DROP CONSTRAINT IF EXISTS personas_situacion_acercamiento_check;

ALTER TABLE public.personas
  ADD CONSTRAINT personas_situacion_acercamiento_check
  CHECK (
    situacion_acercamiento IS NULL
    OR situacion_acercamiento IN (
      'primera_vez_fe',
      'otra_iglesia',
      'retorno',
      'no_indica'
    )
  );
