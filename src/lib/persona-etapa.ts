/** Valores de `personas.etapa` en base de datos (snake_case). */
export const ETAPAS_PERSONA_DB = [
  "visitante",
  "nuevo_creyente",
  "en_proceso",
  "consolidado",
  "lider_en_formacion",
  "lider_grupo",
  "en_servicio",
  "inactivo",
] as const;

export type EtapaPersonaDb = (typeof ETAPAS_PERSONA_DB)[number];

export const ETAPA_LABELS: Record<EtapaPersonaDb, string> = {
  visitante: "Visitante",
  nuevo_creyente: "Nuevo creyente",
  en_proceso: "En proceso",
  consolidado: "Consolidado",
  lider_en_formacion: "Líder en formación",
  lider_grupo: "Líder de grupo",
  en_servicio: "En servicio",
  inactivo: "Inactivo",
};

/** Orden del embudo para stepper / filtros (inactivo al final, fuera del camino feliz). */
export const ETAPAS_ORDEN_CAMINO: EtapaPersonaDb[] = [
  "visitante",
  "nuevo_creyente",
  "en_proceso",
  "consolidado",
  "lider_en_formacion",
  "lider_grupo",
  "en_servicio",
];

export const ETAPAS_FILTRO_LISTA: { value: EtapaPersonaDb | "Todos"; label: string }[] = [
  { value: "Todos", label: "Todas las etapas" },
  ...ETAPAS_ORDEN_CAMINO.map((value) => ({ value, label: ETAPA_LABELS[value] })),
  { value: "inactivo", label: ETAPA_LABELS.inactivo },
];

export function parseEtapaDb(raw: string | null | undefined): EtapaPersonaDb {
  if (raw && ETAPAS_PERSONA_DB.includes(raw as EtapaPersonaDb)) return raw as EtapaPersonaDb;
  return "visitante";
}

export const etapaDotClass: Record<EtapaPersonaDb, string> = {
  visitante: "bg-amber-300/90 dark:bg-amber-300/65",
  nuevo_creyente: "bg-orange-400/80 dark:bg-orange-400/55",
  en_proceso: "bg-sky-400/80 dark:bg-sky-400/55",
  consolidado: "bg-emerald-400/75 dark:bg-emerald-400/55",
  lider_en_formacion: "bg-teal-400/80 dark:bg-teal-400/55",
  lider_grupo: "bg-indigo-400/80 dark:bg-indigo-400/55",
  en_servicio: "bg-violet-400/80 dark:bg-violet-400/55",
  inactivo: "bg-gray-400/85 dark:bg-gray-500/65",
};

export const etapaBadgeClass: Record<EtapaPersonaDb, string> = {
  visitante: "bg-amber-400/15 text-amber-900 dark:text-amber-100",
  nuevo_creyente: "bg-orange-500/12 text-orange-900 dark:text-orange-200",
  en_proceso: "bg-sky-500/10 text-sky-900 dark:text-sky-200",
  consolidado: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
  lider_en_formacion: "bg-teal-500/12 text-teal-900 dark:text-teal-200",
  lider_grupo: "bg-indigo-500/12 text-indigo-900 dark:text-indigo-200",
  en_servicio: "bg-violet-500/12 text-violet-900 dark:text-violet-200",
  inactivo: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
};

export function etapaStyles(e: EtapaPersonaDb): { dot: string; badge: string } {
  return { dot: etapaDotClass[e], badge: etapaBadgeClass[e] };
}
