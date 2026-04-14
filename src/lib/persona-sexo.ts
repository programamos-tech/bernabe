/** Valores en `personas.sexo` (avatar y referencia). */
export type PersonaSexo = "masculino" | "femenino";

export function parsePersonaSexo(raw: unknown): PersonaSexo | null {
  if (raw === "masculino" || raw === "femenino") return raw;
  return null;
}

export function labelPersonaSexo(value: string | null | undefined): string {
  if (value === "masculino") return "Masculino";
  if (value === "femenino") return "Femenino";
  return "Sin registrar";
}
