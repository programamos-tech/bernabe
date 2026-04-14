/** Texto para líder: trabajo y/o estudios. */
export function labelSituacionLaboralEstudio(
  trabaja: boolean | null | undefined,
  estudia: boolean | null | undefined
): string {
  const t = trabaja === true;
  const e = estudia === true;
  const tNo = trabaja === false;
  const eNo = estudia === false;
  if (t && e) return "Trabaja y estudia";
  if (t) return "Trabaja";
  if (e) return "Estudia";
  if (tNo && eNo) return "No indica trabajo ni estudios formales (p. ej. hogar, búsqueda activa)";
  if (tNo && !e) return "No trabaja";
  if (eNo && !t) return "No estudia";
  return "Sin registrar";
}

/** Indica si el estado civil suele implicar vínculo de pareja (orientación al líder, no jurídica). */
export function sugiereUnionEstable(estadoCivil: string | null | undefined): boolean {
  if (!estadoCivil) return false;
  const e = estadoCivil.toLowerCase();
  return e.includes("casad") || e.includes("unión") || e.includes("union");
}

/**
 * Un solo texto para ficha: estado civil (incluye casado/unión en la etiqueta elegida),
 * más situación explícita de pareja y nombre si aplica.
 */
export function formatEstadoCivilYPareja(
  estadoCivil: string | null | undefined,
  tienePareja: boolean | null | undefined,
  nombrePareja: string | null | undefined
): string {
  const ec = (estadoCivil ?? "").trim();
  const nombre = (nombrePareja ?? "").trim();
  const parts: string[] = [];

  if (ec) parts.push(ec);

  if (tienePareja === true) {
    parts.push(nombre ? `Pareja: ${nombre}` : "Con pareja o relación estable");
  } else if (tienePareja === false) {
    parts.push("Sin pareja");
  }

  if (parts.length === 0) return "Sin registrar";
  return parts.join(" · ");
}
