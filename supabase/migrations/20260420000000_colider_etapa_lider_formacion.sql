-- Co-líder corresponde a «líder en formación» en el camino, no a «en servicio».
-- Corrige filas afectadas por la lógica anterior del producto.

UPDATE public.personas
SET etapa = 'lider_en_formacion'
WHERE participacion_en_grupo = 'colider'
  AND etapa = 'en_servicio';
