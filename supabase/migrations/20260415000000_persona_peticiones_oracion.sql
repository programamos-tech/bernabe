-- Peticiones de oración por persona (historial con autor y fecha)
CREATE TABLE IF NOT EXISTS public.persona_peticiones_oracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_persona_peticiones_oracion_organization
  ON public.persona_peticiones_oracion(organization_id);
CREATE INDEX IF NOT EXISTS idx_persona_peticiones_oracion_persona
  ON public.persona_peticiones_oracion(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_peticiones_oracion_created_at
  ON public.persona_peticiones_oracion(persona_id, created_at DESC);

ALTER TABLE public.persona_peticiones_oracion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can manage persona_peticiones_oracion" ON public.persona_peticiones_oracion;
CREATE POLICY "Org members can manage persona_peticiones_oracion"
  ON public.persona_peticiones_oracion FOR ALL
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());
