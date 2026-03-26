-- Registro de asistencia de personas a reuniones del grupo
-- Una fila = una persona asistió a su grupo en una fecha (reunión)
CREATE TABLE IF NOT EXISTS public.persona_asistencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_persona_asistencia_organization ON public.persona_asistencia(organization_id);
CREATE INDEX IF NOT EXISTS idx_persona_asistencia_persona ON public.persona_asistencia(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_asistencia_grupo ON public.persona_asistencia(grupo_id);
CREATE INDEX IF NOT EXISTS idx_persona_asistencia_fecha ON public.persona_asistencia(fecha);

ALTER TABLE public.persona_asistencia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can manage persona_asistencia" ON public.persona_asistencia;
CREATE POLICY "Org members can manage persona_asistencia"
  ON public.persona_asistencia FOR ALL
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());
