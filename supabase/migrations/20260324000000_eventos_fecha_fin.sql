-- Soporte para eventos de varios días: fecha de inicio y fecha de fin
ALTER TABLE public.eventos
  ADD COLUMN IF NOT EXISTS fecha_fin TEXT;

COMMENT ON COLUMN public.eventos.fecha_fin IS 'Fecha de fin (YYYY-MM-DD). Si es NULL, el evento es de un solo día.';
