-- Función para crear grupos y eventos por defecto al terminar el onboarding.
-- Se ejecuta con SECURITY DEFINER para no depender del RLS justo después de crear la org.

CREATE OR REPLACE FUNCTION public.create_default_grupos_and_eventos(p_organization_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Grupos por defecto
  INSERT INTO public.grupos (organization_id, nombre, tipo, descripcion, dia, hora, ubicacion, imagen, activo)
  VALUES
    (p_organization_id, 'Parejas', 'parejas', 'Espacio para matrimonios y parejas fortaleciendo su relación con principios bíblicos.', 'Sábados', '18:00', 'Salón principal', '/parejados.jpg', true),
    (p_organization_id, 'Jóvenes', 'jovenes', 'Comunidad de jóvenes adultos creciendo en fe, amistad y servicio.', 'Viernes', '19:00', 'Auditorio juvenil', '/fiesta.jpg', true),
    (p_organization_id, 'Teens', 'teens', 'Grupo para adolescentes descubriendo su propósito y creciendo en Cristo.', 'Sábados', '16:00', 'Sala de teens', '/mesaycena.jpg', true);

  -- Eventos por defecto
  INSERT INTO public.eventos (organization_id, titulo, tipo, fecha, hora, recurrente, imagen, ubicacion)
  VALUES
    (p_organization_id, 'Domingos', 'servicio', '2026-01-05', '10:00', true, '/fiesta.jpg', 'Templo principal'),
    (p_organization_id, 'Escuela bíblica', 'clase', '2026-01-08', '19:00', true, '/mesaycena.jpg', 'Aulas'),
    (p_organization_id, 'Ayunos', 'especial', '2026-01-10', '06:00', true, '/mesaycena.jpg', 'Templo principal');
END;
$$;

-- Permitir a usuarios autenticados ejecutar la función (solo pasando un UUID; la función no verifica propiedad por diseño, se llama justo tras crear la org).
GRANT EXECUTE ON FUNCTION public.create_default_grupos_and_eventos(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_default_grupos_and_eventos(UUID) TO service_role;
