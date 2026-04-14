import { ETAPAS_ORDEN_CAMINO, type EtapaPersonaDb } from "@/lib/persona-etapa";
import type { ParticipacionEnGrupo } from "./persona-detail-participacion";

export type HitoCaminoPersona = {
  iso: string;
  titulo: string;
  descripcion: string;
  /** Etapa del mapa donde mostramos este hito (fecha + título). */
  etapaAncla: EtapaPersonaDb;
};

function normIso(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(t)) return null;
  return t.slice(0, 10);
}

/** Índice de la etapa en el camino feliz; -1 si inactivo (tratamiento aparte en UI). */
export function indiceEtapaCamino(etapa: EtapaPersonaDb): number {
  if (etapa === "inactivo") return -1;
  const i = ETAPAS_ORDEN_CAMINO.indexOf(etapa);
  return i >= 0 ? i : 0;
}

export function pasosCaminoEtapas(): readonly EtapaPersonaDb[] {
  return ETAPAS_ORDEN_CAMINO;
}

/**
 * Etapa que debe reflejar el mapa y la cabecera cuando el rol en grupo implica un punto del camino
 * distinto al valor guardado en `personas.etapa` (p. ej. co-líder = líder en formación, no etapa `en_servicio` / «Buen siervo»).
 */
export function etapaMostradaEnCamino(
  etapa: EtapaPersonaDb,
  participacion: ParticipacionEnGrupo | null,
): EtapaPersonaDb {
  if (etapa === "inactivo") return etapa;
  if (participacion !== "colider") return etapa;
  if (etapa === "en_servicio") return "lider_en_formacion";
  const i = indiceEtapaCamino(etapa);
  const minColider = indiceEtapaCamino("lider_en_formacion");
  if (i < minColider) return "lider_en_formacion";
  return etapa;
}

/** Hitos con fecha conocida (sin historial de cada cambio de etapa). */
export function hitosCaminoPersona(args: {
  fechaRegistroIso: string | null;
  fechaIngresoGrupoIso: string | null;
  fechaCaminoBautismoIso: string | null;
  /** Si hay bautismo registrado, el hito muestra «Bautizado» (no «Camino al bautismo»). */
  fechaBautismoIso: string | null;
  bautizado: boolean | null;
  grupoNombre: string | null;
  coLiderDesdeIso: string | null;
}): HitoCaminoPersona[] {
  const out: HitoCaminoPersona[] = [];
  const fr = normIso(args.fechaRegistroIso);
  if (fr) {
    out.push({
      iso: fr,
      titulo: "Registro",
      descripcion: "Alta en el registro de la iglesia.",
      etapaAncla: "visitante",
    });
  }
  const fi = normIso(args.fechaIngresoGrupoIso);
  if (fi) {
    const g = args.grupoNombre?.trim();
    out.push({
      iso: fi,
      titulo: "En grupo de célula",
      descripcion: g ? `Asignada/o a «${g}».` : "Asignada/o a un grupo.",
      etapaAncla: "nuevo_creyente",
    });
  }
  const fCamino = normIso(args.fechaCaminoBautismoIso);
  const fBautismo = normIso(args.fechaBautismoIso);
  const bautismoRealizado = args.bautizado === true || Boolean(fBautismo);
  if (bautismoRealizado && (fBautismo || fCamino)) {
    const iso = fBautismo ?? fCamino!;
    out.push({
      iso,
      titulo: "Bautizado",
      descripcion: fBautismo
        ? "Bautismo registrado en la iglesia."
        : "Bautismo registrado (fecha según el registro del camino).",
      etapaAncla: "bautizado",
    });
  } else if (fCamino) {
    out.push({
      iso: fCamino,
      titulo: "Camino al bautismo",
      descripcion: "Inicio formal del proceso de preparación al bautismo.",
      etapaAncla: "bautizado",
    });
  }
  const cl = normIso(args.coLiderDesdeIso);
  if (cl) {
    out.push({
      iso: cl,
      titulo: "Co-líder",
      descripcion: "Rol de co-liderazgo en el grupo.",
      etapaAncla: "lider_en_formacion",
    });
  }
  out.sort((a, b) => a.iso.localeCompare(b.iso));
  return out;
}

export function notaParticipacionSinFecha(participacion: ParticipacionEnGrupo | null): string | null {
  if (participacion === "apoyo") return "Hoy participa como grupo de apoyo (la fecha del cambio no está guardada en historial).";
  return null;
}
