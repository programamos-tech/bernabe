-- Avatar seed estable + ciudad solo (sin país inventado) + reacciones sin emoji

ALTER TABLE public.victorias_compartidas
  ADD COLUMN IF NOT EXISTS autor_avatar_seed TEXT;

UPDATE public.victorias_compartidas
SET autor_avatar_seed = profile_id::text
WHERE autor_avatar_seed IS NULL;

ALTER TABLE public.victorias_compartidas
  ALTER COLUMN emoji SET DEFAULT '';

UPDATE public.victorias_compartidas
SET emoji = ''
WHERE emoji IS NOT NULL AND emoji <> '';

-- Reacciones: códigos de texto en lugar de emojis
ALTER TABLE public.victoria_reacciones
  DROP CONSTRAINT IF EXISTS victoria_reacciones_emoji_check;

UPDATE public.victoria_reacciones SET emoji = 'animo'
WHERE emoji IN ('💪', '🎉');

UPDATE public.victoria_reacciones SET emoji = 'oracion'
WHERE emoji = '🙏';

UPDATE public.victoria_reacciones SET emoji = 'gusto'
WHERE emoji = '❤️';

ALTER TABLE public.victoria_reacciones
  ADD CONSTRAINT victoria_reacciones_emoji_check
  CHECK (emoji IN ('animo', 'oracion', 'gusto'));
