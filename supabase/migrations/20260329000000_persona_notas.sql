-- Historial de notas por persona (anotaciones puntuales en el tiempo)
CREATE TABLE IF NOT EXISTS public.persona_notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  contenido TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_persona_notas_organization ON public.persona_notas(organization_id);
CREATE INDEX IF NOT EXISTS idx_persona_notas_persona ON public.persona_notas(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_notas_created_at ON public.persona_notas(persona_id, created_at DESC);

ALTER TABLE public.persona_notas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can manage persona_notas" ON public.persona_notas;
CREATE POLICY "Org members can manage persona_notas"
  ON public.persona_notas FOR ALL
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

-- Copiar notas antiguas (campo personas.notas) como primera entrada del historial
INSERT INTO public.persona_notas (organization_id, persona_id, contenido, created_at)
SELECT p.organization_id, p.id, trim(p.notas), COALESCE(p.updated_at, p.created_at)
FROM public.personas p
WHERE p.notas IS NOT NULL AND length(trim(p.notas)) > 0;
