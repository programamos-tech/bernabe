-- Victorias compartibles entre líderes (feed global de Comunidad)

CREATE TABLE IF NOT EXISTS public.victorias_compartidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (
    tipo IN (
      'contactos_semana',
      'asistencias_semana',
      'nuevos_visitantes',
      'racha_grupo',
      'primer_grupo',
      'manual'
    )
  ),
  titulo TEXT NOT NULL CHECK (char_length(trim(titulo)) >= 1 AND char_length(titulo) <= 200),
  metric_value INT,
  emoji TEXT NOT NULL DEFAULT '🎉',
  autor_nombre TEXT NOT NULL,
  autor_ubicacion TEXT,
  periodo_desde DATE,
  periodo_hasta DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_victorias_compartidas_created
  ON public.victorias_compartidas(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_victorias_compartidas_profile_periodo
  ON public.victorias_compartidas(profile_id, tipo, periodo_desde);

CREATE TABLE IF NOT EXISTS public.victoria_reacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  victoria_id UUID NOT NULL REFERENCES public.victorias_compartidas(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('💪', '🙏', '❤️', '🎉')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (victoria_id, profile_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_victoria_reacciones_victoria
  ON public.victoria_reacciones(victoria_id);

ALTER TABLE public.victorias_compartidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.victoria_reacciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read victorias" ON public.victorias_compartidas;
DROP POLICY IF EXISTS "Users insert own victorias" ON public.victorias_compartidas;
DROP POLICY IF EXISTS "Users delete own victorias" ON public.victorias_compartidas;

CREATE POLICY "Authenticated users read victorias"
  ON public.victorias_compartidas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users insert own victorias"
  ON public.victorias_compartidas FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    AND organization_id = public.current_organization_id()
  );

CREATE POLICY "Users delete own victorias"
  ON public.victorias_compartidas FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users read reacciones" ON public.victoria_reacciones;
DROP POLICY IF EXISTS "Users manage own reacciones" ON public.victoria_reacciones;

CREATE POLICY "Authenticated users read reacciones"
  ON public.victoria_reacciones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users manage own reacciones"
  ON public.victoria_reacciones FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
