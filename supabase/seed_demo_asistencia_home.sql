-- Demo: asistencia simulada para la gráfica del home (últimas 4 semanas).
-- Ejecutar: supabase db query --local -f supabase/seed_demo_asistencia_home.sql
-- Idempotente: borra e inserta de nuevo en el rango de 4 semanas por organización.

DO $$
DECLARE
  v_org_id UUID;
  v_lunes_actual DATE;
  v_semana_inicio DATE;
  v_semanas_atras INT;
  v_pct INT;
  v_desde DATE;
  v_hasta DATE;
BEGIN
  v_lunes_actual := CURRENT_DATE;
  IF EXTRACT(DOW FROM v_lunes_actual) = 0 THEN
    v_lunes_actual := v_lunes_actual - 6;
  ELSE
    v_lunes_actual := v_lunes_actual - (EXTRACT(DOW FROM v_lunes_actual)::int - 1);
  END IF;

  v_desde := v_lunes_actual - 21;
  v_hasta := v_lunes_actual + 7;

  FOR v_org_id IN
    SELECT DISTINCT p.organization_id
    FROM public.personas p
    INNER JOIN public.grupos g ON g.id = p.grupo_id AND g.activo = true
  LOOP
    DELETE FROM public.persona_asistencia
    WHERE organization_id = v_org_id
      AND fecha >= v_desde
      AND fecha < v_hasta;

    -- Objetivos: 45% → 58% → 40% → 68% (antigua a actual)
    FOR v_semanas_atras IN REVERSE 3..0 LOOP
      v_pct := CASE v_semanas_atras
        WHEN 3 THEN 45
        WHEN 2 THEN 58
        WHEN 1 THEN 40
        WHEN 0 THEN 68
      END;

      v_semana_inicio := v_lunes_actual - (v_semanas_atras * 7);

      INSERT INTO public.persona_asistencia (organization_id, persona_id, grupo_id, fecha)
      WITH reuniones AS (
        SELECT
          g.id AS grupo_id,
          g.organization_id,
          v_semana_inicio + CASE lower(translate(g.dia, 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU'))
            WHEN 'lunes'     THEN 0
            WHEN 'martes'    THEN 1
            WHEN 'miercoles' THEN 2
            WHEN 'jueves'    THEN 3
            WHEN 'viernes'   THEN 4
            WHEN 'sabados'   THEN 5
            WHEN 'domingos'  THEN 6
            ELSE 1
          END AS fecha
        FROM public.grupos g
        WHERE g.organization_id = v_org_id
          AND g.activo = true
          AND g.dia IS NOT NULL
          AND g.dia <> ''
          AND EXISTS (SELECT 1 FROM public.personas p WHERE p.grupo_id = g.id)
      ),
      miembros AS (
        SELECT
          p.id AS persona_id,
          p.grupo_id,
          p.organization_id,
          row_number() OVER (PARTITION BY p.grupo_id ORDER BY p.nombre) AS rn,
          abs(hashtext(p.id::text || v_semana_inicio::text)) % 100 AS bucket
        FROM public.personas p
        INNER JOIN reuniones r ON r.grupo_id = p.grupo_id
      )
      SELECT m.organization_id, m.persona_id, m.grupo_id, r.fecha
      FROM miembros m
      INNER JOIN reuniones r ON r.grupo_id = m.grupo_id
      WHERE m.rn = 1 OR m.bucket < v_pct
      ON CONFLICT DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Demo asistencia org % (% → %)', v_org_id, v_desde, v_hasta;
  END LOOP;
END $$;
