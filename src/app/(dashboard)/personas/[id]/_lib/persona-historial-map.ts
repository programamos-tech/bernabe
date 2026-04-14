import {
  resultadoSeguimientoLabelsCorto,
  tipoSeguimientoLabelsCorto,
} from "./persona-seguimiento-labels";
import type { RegistroSeguimientoItem } from "./persona-detail-types";
import { formatHistorialFecha } from "./persona-detail-dates";

export function mapHistorialRowToRegistro(row: {
  id: string;
  fecha: string;
  accion: string;
  tipo_seguimiento: string | null;
  resultado_seguimiento: string | null;
  notas: string | null;
}): RegistroSeguimientoItem | null {
  if (row.tipo_seguimiento === "asistencia") return null;

  const tipoKey = row.tipo_seguimiento;
  const resKey = row.resultado_seguimiento;
  let titulo: string;
  let subtitulo: string | null;

  if (tipoKey && tipoSeguimientoLabelsCorto[tipoKey]) {
    titulo = tipoSeguimientoLabelsCorto[tipoKey];
    subtitulo = resKey ? resultadoSeguimientoLabelsCorto[resKey] ?? resKey : null;
  } else {
    titulo = row.accion;
    subtitulo = null;
  }

  return {
    id: row.id,
    fecha: row.fecha,
    fechaDisplay: formatHistorialFecha(row.fecha),
    titulo,
    subtitulo,
    notas: (row.notas ?? "").trim() || null,
  };
}
