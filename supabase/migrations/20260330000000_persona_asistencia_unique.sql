-- Una sola asistencia por persona, grupo y fecha de reunión
DO $$
BEGIN
  -- Evita fallar si esta migración se ejecuta antes de crear la tabla
  IF to_regclass('public.persona_asistencia') IS NOT NULL THEN
    CREATE UNIQUE INDEX IF NOT EXISTS persona_asistencia_persona_grupo_fecha_uniq
      ON public.persona_asistencia(persona_id, grupo_id, fecha);
  END IF;
END $$;
