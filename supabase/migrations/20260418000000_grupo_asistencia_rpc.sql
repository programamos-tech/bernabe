-- Agregaciones en servidor para detalle de grupo (evita descargar toda persona_asistencia).

CREATE INDEX IF NOT EXISTS idx_persona_asistencia_grupo_persona_fecha
  ON public.persona_asistencia (grupo_id, persona_id, fecha DESC);

COMMENT ON INDEX idx_persona_asistencia_grupo_persona_fecha IS
  'Soporta MAX(fecha) por (grupo_id, persona_id) y consultas por grupo ordenadas por fecha.';

-- Última fecha de asistencia por persona en un grupo (una fila por persona que haya asistido al menos una vez).
CREATE OR REPLACE FUNCTION public.ultima_asistencia_por_persona_grupo(p_grupo_id uuid)
RETURNS TABLE(persona_id uuid, ultima_fecha date)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT pa.persona_id, MAX(pa.fecha)::date AS ultima_fecha
  FROM public.persona_asistencia pa
  WHERE pa.grupo_id = p_grupo_id
  GROUP BY pa.persona_id;
$$;

COMMENT ON FUNCTION public.ultima_asistencia_por_persona_grupo(uuid) IS
  'Para la tabla de miembros: última reunión a la que asistió cada persona en este grupo. Respeta RLS de persona_asistencia.';

-- Totales del mes calendario [p_desde, p_hasta) (p_hasta exclusivo, coherente con .lt en el cliente).
CREATE OR REPLACE FUNCTION public.grupo_asistencia_totales_mes(
  p_grupo_id uuid,
  p_desde date,
  p_hasta date
)
RETURNS TABLE(registros bigint, personas_distintas bigint, fechas_distintas bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::bigint AS registros,
    COUNT(DISTINCT pa.persona_id)::bigint AS personas_distintas,
    COUNT(DISTINCT pa.fecha)::bigint AS fechas_distintas
  FROM public.persona_asistencia pa
  WHERE pa.grupo_id = p_grupo_id
    AND pa.fecha >= p_desde
    AND pa.fecha < p_hasta;
$$;

-- Asistentes de la última reunión registrada del grupo (MAX(fecha)).
CREATE OR REPLACE FUNCTION public.grupo_ultima_reunion_asistentes(p_grupo_id uuid)
RETURNS TABLE(fecha date, persona_id uuid, nombre text, sexo text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH ult AS (
    SELECT MAX(pa.fecha) AS d
    FROM public.persona_asistencia pa
    WHERE pa.grupo_id = p_grupo_id
  )
  SELECT pa.fecha::date, pa.persona_id, p.nombre::text, COALESCE(p.sexo, '')::text AS sexo
  FROM public.persona_asistencia pa
  INNER JOIN ult u ON u.d IS NOT NULL AND pa.fecha = u.d
  INNER JOIN public.personas p ON p.id = pa.persona_id
  WHERE pa.grupo_id = p_grupo_id
  ORDER BY p.nombre;
$$;

GRANT EXECUTE ON FUNCTION public.ultima_asistencia_por_persona_grupo(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ultima_asistencia_por_persona_grupo(uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.grupo_asistencia_totales_mes(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grupo_asistencia_totales_mes(uuid, date, date) TO service_role;

GRANT EXECUTE ON FUNCTION public.grupo_ultima_reunion_asistentes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grupo_ultima_reunion_asistentes(uuid) TO service_role;
