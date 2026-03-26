-- Campos del paso "¿Quién administrará Bernabé?" (cargo y teléfono)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS pastor_role TEXT,
  ADD COLUMN IF NOT EXISTS pastor_phone TEXT;
