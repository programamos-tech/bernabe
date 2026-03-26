-- Flag explícito en BD: el usuario puede ponerlo en false con RLS (sin service_role).
-- NULL = legado: el middleware sigue mirando app_metadata de Auth.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT NULL;

COMMENT ON COLUMN public.profiles.must_change_password IS
  'true = debe pasar por /primer-acceso; false = ya listo; NULL = usar solo JWT/app_metadata (legado)';
