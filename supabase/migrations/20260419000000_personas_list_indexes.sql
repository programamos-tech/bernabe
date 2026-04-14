-- Listado /personas: filtro por organización (RLS), etapa y orden por nombre
CREATE INDEX IF NOT EXISTS idx_personas_org_etapa_nombre
  ON public.personas (organization_id, etapa, nombre);

CREATE INDEX IF NOT EXISTS idx_personas_org_nombre
  ON public.personas (organization_id, nombre);
