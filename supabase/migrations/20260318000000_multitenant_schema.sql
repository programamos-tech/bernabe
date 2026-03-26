-- ============================================
-- Bernabé: Multi-tenant SaaS schema
-- Cada iglesia = 1 organización (tenant)
-- ============================================

-- Extensión para slugs únicos
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizaciones (iglesias)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country TEXT,
  city TEXT,
  denomination TEXT,
  size TEXT,
  service_days TEXT[] DEFAULT '{}',
  pastor_name TEXT,
  pastor_email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Perfiles de usuario (vinculados a auth.users y opcionalmente a una organización)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices para RLS y consultas
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

-- Función para obtener el organization_id del usuario actual
CREATE OR REPLACE FUNCTION public.current_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Trigger: crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Tablas de negocio (todas con organization_id)
-- Orden: grupos antes que personas (personas.grupo_id -> grupos)
-- ============================================

-- Grupos (creado antes que personas por FK persona.grupo_id)
CREATE TABLE IF NOT EXISTS public.grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('parejas', 'jovenes', 'teens', 'hombres', 'mujeres', 'general')),
  miembros_count INT DEFAULT 0,
  lider_id UUID,
  dia TEXT,
  hora TEXT,
  ubicacion TEXT,
  imagen TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Personas (grupo_id FK se agrega después)
CREATE TABLE IF NOT EXISTS public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cedula TEXT,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  fecha_nacimiento DATE,
  edad INT,
  estado_civil TEXT,
  ocupacion TEXT,
  direccion TEXT,
  grupo_id UUID,
  rol TEXT DEFAULT 'Miembro' CHECK (rol IN ('Líder', 'Miembro', 'Visitante', 'Diácono')),
  estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Visitante', 'Inactivo', 'En seguimiento')),
  fecha_registro TEXT,
  ultimo_contacto TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Líderes (referencia a persona o nombre libre)
CREATE TABLE IF NOT EXISTS public.lideres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  cedula TEXT,
  telefono TEXT,
  email TEXT,
  rol TEXT CHECK (rol IN ('Pastor', 'Líder de grupo', 'Coordinador', 'Mentor', 'Diácono')),
  estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'En formación', 'Descanso')),
  grupo_asignado TEXT,
  miembros_a_cargo INT DEFAULT 0,
  fecha_inicio_liderazgo TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Eventos
CREATE TABLE IF NOT EXISTS public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('reunion', 'grupo', 'clase', 'servicio', 'especial')),
  fecha TEXT,
  hora TEXT,
  ubicacion TEXT,
  imagen TEXT,
  asistentes_esperados INT,
  responsable TEXT,
  recurrente BOOLEAN DEFAULT false,
  grupo_id UUID REFERENCES public.grupos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Historial / seguimientos (por persona)
CREATE TABLE IF NOT EXISTS public.persona_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  fecha TEXT NOT NULL,
  accion TEXT NOT NULL,
  responsable TEXT,
  tipo_seguimiento TEXT,
  resultado_seguimiento TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices por tenant
CREATE INDEX IF NOT EXISTS idx_personas_organization ON public.personas(organization_id);
CREATE INDEX IF NOT EXISTS idx_grupos_organization ON public.grupos(organization_id);
CREATE INDEX IF NOT EXISTS idx_lideres_organization ON public.lideres(organization_id);
CREATE INDEX IF NOT EXISTS idx_eventos_organization ON public.eventos(organization_id);
CREATE INDEX IF NOT EXISTS idx_persona_historial_organization ON public.persona_historial(organization_id);
CREATE INDEX IF NOT EXISTS idx_persona_historial_persona ON public.persona_historial(persona_id);

-- FK de personas.grupo_id a grupos
ALTER TABLE public.personas
  DROP CONSTRAINT IF EXISTS fk_personas_grupo;

ALTER TABLE public.personas
  ADD CONSTRAINT fk_personas_grupo FOREIGN KEY (grupo_id) REFERENCES public.grupos(id) ON DELETE SET NULL;

-- FK de grupos.lider_id a lideres (opcional)
ALTER TABLE public.grupos
  DROP CONSTRAINT IF EXISTS fk_grupos_lider;

ALTER TABLE public.grupos
  ADD CONSTRAINT fk_grupos_lider FOREIGN KEY (lider_id) REFERENCES public.lideres(id) ON DELETE SET NULL;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lideres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persona_historial ENABLE ROW LEVEL SECURITY;

-- Si se vuelve a correr esta migración, evitamos duplicar políticas.
DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can update own organization" ON public.organizations;
DROP POLICY IF EXISTS "Allow insert organization for new onboarding" ON public.organizations;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile (trigger handles this)" ON public.profiles;

DROP POLICY IF EXISTS "Org members can manage personas" ON public.personas;
DROP POLICY IF EXISTS "Org members can manage grupos" ON public.grupos;
DROP POLICY IF EXISTS "Org members can manage lideres" ON public.lideres;
DROP POLICY IF EXISTS "Org members can manage eventos" ON public.eventos;
DROP POLICY IF EXISTS "Org members can manage persona_historial" ON public.persona_historial;

-- Organizations: el usuario solo ve la suya (la de su perfil)
CREATE POLICY "Users can view own organization"
  ON public.organizations FOR SELECT
  USING (id = public.current_organization_id());

CREATE POLICY "Users can update own organization"
  ON public.organizations FOR UPDATE
  USING (id = public.current_organization_id());

CREATE POLICY "Allow insert organization for new onboarding"
  ON public.organizations FOR INSERT
  WITH CHECK (true);

-- Profiles: cada uno ve y edita solo su perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile (trigger handles this)"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Personas: solo las de la organización del usuario
CREATE POLICY "Org members can manage personas"
  ON public.personas FOR ALL
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

-- Grupos
CREATE POLICY "Org members can manage grupos"
  ON public.grupos FOR ALL
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

-- Líderes
CREATE POLICY "Org members can manage lideres"
  ON public.lideres FOR ALL
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

-- Eventos
CREATE POLICY "Org members can manage eventos"
  ON public.eventos FOR ALL
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

-- Historial
CREATE POLICY "Org members can manage persona_historial"
  ON public.persona_historial FOR ALL
  USING (organization_id = public.current_organization_id())
  WITH CHECK (organization_id = public.current_organization_id());

-- ============================================
-- Actualizar updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_organizations_updated_at ON public.organizations;
CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_personas_updated_at ON public.personas;
CREATE TRIGGER set_personas_updated_at
  BEFORE UPDATE ON public.personas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_grupos_updated_at ON public.grupos;
CREATE TRIGGER set_grupos_updated_at
  BEFORE UPDATE ON public.grupos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_lideres_updated_at ON public.lideres;
CREATE TRIGGER set_lideres_updated_at
  BEFORE UPDATE ON public.lideres
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_eventos_updated_at ON public.eventos;
CREATE TRIGGER set_eventos_updated_at
  BEFORE UPDATE ON public.eventos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
