-- Renombra etapa en_proceso → bautizado (camino al bautismo) y añade fecha del hito en el mapa.
-- Importante: quitar el CHECK antes del UPDATE; si no, el valor 'bautizado' no está permitido todavía.

ALTER TABLE public.personas
  DROP CONSTRAINT IF EXISTS personas_etapa_check;

UPDATE public.personas SET etapa = 'bautizado' WHERE etapa = 'en_proceso';

ALTER TABLE public.personas
  ADD CONSTRAINT personas_etapa_check
  CHECK (
    etapa IN (
      'visitante',
      'nuevo_creyente',
      'bautizado',
      'consolidado',
      'lider_en_formacion',
      'lider_grupo',
      'en_servicio',
      'inactivo'
    )
  );

ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS fecha_camino_bautismo DATE;

COMMENT ON COLUMN public.personas.fecha_camino_bautismo IS 'Primera fecha en que pasó a etapa bautizado (camino al bautismo); hito en mapa de etapas.';
