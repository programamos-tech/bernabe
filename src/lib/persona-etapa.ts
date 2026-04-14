/** Valores de `personas.etapa` en base de datos (snake_case). */
export const ETAPAS_PERSONA_DB = [
  "visitante",
  "nuevo_creyente",
  "bautizado",
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
  bautizado: "Camino al bautismo",
  consolidado: "Consolidado",
  lider_en_formacion: "Líder en formación",
  lider_grupo: "Líder de grupo",
  en_servicio: "Buen siervo",
  inactivo: "Inactivo",
};

/** Orden del embudo para stepper / filtros (inactivo al final, fuera del camino feliz). */
export const ETAPAS_ORDEN_CAMINO: EtapaPersonaDb[] = [
  "visitante",
  "nuevo_creyente",
  "bautizado",
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
  if (raw === "en_proceso") return "bautizado";
  if (raw && ETAPAS_PERSONA_DB.includes(raw as EtapaPersonaDb)) return raw as EtapaPersonaDb;
  return "visitante";
}

export const etapaDotClass: Record<EtapaPersonaDb, string> = {
  visitante: "bg-amber-300/90 dark:bg-amber-300/65",
  nuevo_creyente: "bg-orange-400/80 dark:bg-orange-400/55",
  bautizado: "bg-sky-400/80 dark:bg-sky-400/55",
  consolidado: "bg-emerald-400/75 dark:bg-emerald-400/55",
  lider_en_formacion: "bg-teal-400/80 dark:bg-teal-400/55",
  lider_grupo: "bg-indigo-400/80 dark:bg-indigo-400/55",
  en_servicio: "bg-violet-400/80 dark:bg-violet-400/55",
  inactivo: "bg-gray-400/85 dark:bg-gray-500/65",
};

export const etapaBadgeClass: Record<EtapaPersonaDb, string> = {
  visitante: "bg-amber-400/15 text-amber-900 dark:text-amber-100",
  nuevo_creyente: "bg-orange-500/12 text-orange-900 dark:text-orange-200",
  bautizado: "bg-sky-500/10 text-sky-900 dark:text-sky-200",
  consolidado: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
  lider_en_formacion: "bg-teal-500/12 text-teal-900 dark:text-teal-200",
  lider_grupo: "bg-indigo-500/12 text-indigo-900 dark:text-indigo-200",
  en_servicio: "bg-violet-500/12 text-violet-900 dark:text-violet-200",
  inactivo: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
};

export function etapaStyles(e: EtapaPersonaDb): { dot: string; badge: string } {
  return { dot: etapaDotClass[e], badge: etapaBadgeClass[e] };
}

/**
 * Círculo del paso **actual** en el mapa horizontal (borde + fondo acorde a la etapa).
 * Antes el paso activo era gris/negro con punto blanco y se perdía el color (p. ej. teal en líder en formación).
 */
export const etapaMapaPasoActualOuterClass: Record<EtapaPersonaDb, string> = {
  visitante:
    "border-2 border-amber-400/90 bg-amber-400/12 shadow-md shadow-amber-900/8 dark:border-amber-400/65 dark:bg-amber-400/15",
  nuevo_creyente:
    "border-2 border-orange-400/90 bg-orange-400/10 shadow-md dark:border-orange-400/60 dark:bg-orange-400/12",
  bautizado:
    "border-2 border-sky-400/90 bg-sky-400/10 shadow-md dark:border-sky-400/60 dark:bg-sky-400/12",
  consolidado:
    "border-2 border-emerald-400/90 bg-emerald-400/10 shadow-md dark:border-emerald-400/60 dark:bg-emerald-400/12",
  lider_en_formacion:
    "border-2 border-teal-400/95 bg-teal-400/12 shadow-md shadow-teal-900/12 dark:border-teal-400/70 dark:bg-teal-400/18",
  lider_grupo:
    "border-2 border-indigo-400/90 bg-indigo-400/10 shadow-md dark:border-indigo-400/60 dark:bg-indigo-400/12",
  en_servicio:
    "border-2 border-violet-400/90 bg-violet-400/10 shadow-md dark:border-violet-400/60 dark:bg-violet-400/12",
  inactivo:
    "border-2 border-gray-400/70 bg-gray-400/10 shadow-md dark:border-gray-500/55 dark:bg-gray-400/12",
};

/** Paso ya superado (no es el actual): anillo con color de etapa suave (evita todo gris en líder en formación / líder de grupo). */
export const etapaMapaPasoHechoOuterClass: Record<EtapaPersonaDb, string> = {
  visitante:
    "border-2 border-amber-400/55 bg-amber-400/10 dark:border-amber-400/45 dark:bg-amber-400/12",
  nuevo_creyente:
    "border-2 border-orange-400/55 bg-orange-400/10 dark:border-orange-400/45 dark:bg-orange-400/12",
  bautizado:
    "border-2 border-sky-400/55 bg-sky-400/10 dark:border-sky-400/45 dark:bg-sky-400/12",
  consolidado:
    "border-2 border-emerald-400/55 bg-emerald-400/10 dark:border-emerald-400/45 dark:bg-emerald-400/12",
  lider_en_formacion:
    "border-2 border-teal-400/60 bg-teal-400/12 dark:border-teal-400/50 dark:bg-teal-400/14",
  lider_grupo:
    "border-2 border-indigo-400/60 bg-indigo-400/12 dark:border-indigo-400/50 dark:bg-indigo-400/14",
  en_servicio:
    "border-2 border-violet-400/55 bg-violet-400/10 dark:border-violet-400/45 dark:bg-violet-400/12",
  inactivo:
    "border-2 border-gray-400/70 bg-gray-400/10 dark:border-gray-500/50 dark:bg-gray-400/12",
};

/** Paso aún no alcanzado: borde y fondo levemente teñidos con el color de la etapa. */
export const etapaMapaPasoFuturoOuterClass: Record<EtapaPersonaDb, string> = {
  visitante:
    "border-2 border-amber-400/40 bg-amber-50/80 dark:border-amber-400/35 dark:bg-amber-950/25",
  nuevo_creyente:
    "border-2 border-orange-400/40 bg-orange-50/50 dark:border-orange-400/35 dark:bg-orange-950/20",
  bautizado:
    "border-2 border-sky-400/40 bg-sky-50/50 dark:border-sky-400/32 dark:bg-sky-950/20",
  consolidado:
    "border-2 border-emerald-400/40 bg-emerald-50/40 dark:border-emerald-400/32 dark:bg-emerald-950/20",
  lider_en_formacion:
    "border-2 border-teal-400/45 bg-teal-50/40 dark:border-teal-400/38 dark:bg-teal-950/30",
  lider_grupo:
    "border-2 border-indigo-400/45 bg-indigo-50/40 dark:border-indigo-400/38 dark:bg-indigo-950/30",
  en_servicio:
    "border-2 border-violet-400/40 bg-violet-50/40 dark:border-violet-400/32 dark:bg-violet-950/20",
  inactivo:
    "border-2 border-gray-300 bg-white dark:border-white/[0.12] dark:bg-[#1a1a1a]",
};

/** Etiqueta bajo el nodo: paso superado (legible, matiz de color). */
export const etapaMapaLabelHechoClass: Record<EtapaPersonaDb, string> = {
  visitante: "text-amber-900/90 dark:text-amber-100/90",
  nuevo_creyente: "text-orange-900/90 dark:text-orange-100/85",
  bautizado: "text-sky-900/90 dark:text-sky-100/85",
  consolidado: "text-emerald-900/90 dark:text-emerald-100/85",
  lider_en_formacion: "text-teal-900/90 dark:text-teal-100/90",
  lider_grupo: "text-indigo-900/90 dark:text-indigo-100/90",
  en_servicio: "text-violet-900/90 dark:text-violet-100/85",
  inactivo: "text-gray-600 dark:text-gray-300",
};

/** Etiqueta bajo el nodo: paso pendiente (más tenue, mismo matiz). */
export const etapaMapaLabelFuturoClass: Record<EtapaPersonaDb, string> = {
  visitante: "text-amber-700/75 dark:text-amber-200/55",
  nuevo_creyente: "text-orange-700/75 dark:text-orange-200/50",
  bautizado: "text-sky-700/75 dark:text-sky-200/50",
  consolidado: "text-emerald-700/75 dark:text-emerald-200/50",
  lider_en_formacion: "text-teal-700/80 dark:text-teal-200/55",
  lider_grupo: "text-indigo-700/80 dark:text-indigo-200/55",
  en_servicio: "text-violet-700/75 dark:text-violet-200/50",
  inactivo: "text-gray-400 dark:text-gray-500",
};
