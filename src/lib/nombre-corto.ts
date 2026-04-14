/** Solo la primera palabra del nombre (sin apellidos). */
export function nombreSoloPrimerNombre(nombre: string | null | undefined): string {
  const t = nombre?.trim() ?? "";
  if (!t) return "";
  const parts = t.split(/\s+/).filter(Boolean);
  return parts[0] ?? t;
}

/**
 * Primer nombre + primer apellido (primeras dos palabras del nombre completo).
 * Útil en listados compactos; el campo `personas.nombre` suele ser "Nombre Apellido1 Apellido2".
 */
export function nombrePrimerNombreYApellido(nombre: string | null | undefined): string {
  const t = nombre?.trim() ?? "";
  if (!t) return "";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return t;
  return `${parts[0]} ${parts[1]}`;
}
