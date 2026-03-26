-- Quien completa el onboarding queda como pastor/datos en organizations pero no tenía fila en lideres.
-- Inserta un líder tipo Pastor por iglesia cuando hay pastor_name y aún no hay coincidencia por email o nombre.

INSERT INTO public.lideres (organization_id, nombre, email, telefono, rol, estado, grupo_asignado, miembros_a_cargo, notas)
SELECT
  o.id,
  trim(o.pastor_name),
  NULLIF(trim(o.pastor_email), ''),
  NULLIF(trim(o.pastor_phone), ''),
  'Pastor',
  'Activo',
  NULL,
  0,
  'Cuenta principal (datos de onboarding)'
FROM public.organizations o
WHERE o.pastor_name IS NOT NULL
  AND trim(o.pastor_name) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.lideres l
    WHERE l.organization_id = o.id
      AND (
        (o.pastor_email IS NOT NULL AND lower(trim(l.email)) = lower(trim(o.pastor_email)))
        OR lower(trim(l.nombre)) = lower(trim(o.pastor_name))
      )
  );
