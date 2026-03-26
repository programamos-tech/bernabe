-- Teléfono del usuario en su perfil (se rellena con el del pastor en onboarding)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;
