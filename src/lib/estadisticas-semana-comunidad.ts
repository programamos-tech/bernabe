/**
 * Estadísticas "Esta semana" (lunes 00:00 – domingo 23:59, hora local)
 * para la vista Comunidad.
 */

import { inicioSemanaLunes } from "@/lib/cumpleanos-comunidad";

export interface StatsSemanaComunidad {
  /** Filas en persona_asistencia (una persona en una reunión de grupo = 1) */
  asistenciasEnGrupos: number;
  /** Pares distintos (grupo_id, fecha) con al menos una asistencia */
  reunionesDeGrupo: number;
  /** Personas con estado Visitante creadas en la semana */
  nuevosVisitantes: number;
  /** Entradas en persona_historial con seguimiento (excluye solo registro de asistencia) */
  seguimientos: number;
}

/** Fechas ISO YYYY-MM-DD (inclusive) para columnas tipo DATE o TEXT ISO. */
export function rangoSemanaFechasISO(ref: Date = new Date()): { desde: string; hasta: string } {
  const inicio = inicioSemanaLunes(ref);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  return {
    desde: toFechaISO(inicio),
    hasta: toFechaISO(fin),
  };
}

function toFechaISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Límite para filtros `created_at` (timestamptz): [desde, hastaExclusive). */
export function rangoSemanaCreatedAt(ref: Date = new Date()): { desde: string; hastaExclusive: string } {
  const inicio = inicioSemanaLunes(ref);
  const finExclusive = new Date(inicio);
  finExclusive.setDate(finExclusive.getDate() + 7);
  return {
    desde: inicio.toISOString(),
    hastaExclusive: finExclusive.toISOString(),
  };
}

export function computeStatsAsistenciaGrupo(
  rows: { grupo_id: string; fecha: string }[] | null | undefined
): Pick<StatsSemanaComunidad, "asistenciasEnGrupos" | "reunionesDeGrupo"> {
  const list = rows ?? [];
  const reunionesKeys = new Set(list.map((r) => `${r.grupo_id}|${r.fecha}`));
  return {
    asistenciasEnGrupos: list.length,
    reunionesDeGrupo: reunionesKeys.size,
  };
}
