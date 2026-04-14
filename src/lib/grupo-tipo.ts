/** Etiquetas de `grupos.tipo` (misma convención que el listado de Grupos). */
const TIPO_LABELS: Record<string, string> = {
  parejas: "Parejas",
  jovenes: "Jóvenes",
  teens: "Teens",
  hombres: "Hombres",
  mujeres: "Mujeres",
  general: "General",
};

export function tipoLabelGrupo(t: string): string {
  return TIPO_LABELS[t] ?? t;
}
