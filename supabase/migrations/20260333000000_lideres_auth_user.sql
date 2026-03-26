-- Usuario de Auth vinculado al líder (acceso a la app)
ALTER TABLE public.lideres
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS lideres_auth_user_id_key
  ON public.lideres(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

COMMENT ON COLUMN public.lideres.auth_user_id IS 'UUID en auth.users: cuenta con la que el líder inicia sesión';
