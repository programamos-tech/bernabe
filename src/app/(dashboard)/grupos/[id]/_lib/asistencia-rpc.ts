/** Filas devueltas por `ultima_asistencia_por_persona_grupo`. */
export type UltimaAsistenciaPorPersonaRow = { persona_id: string; ultima_fecha: string };

export function ultimaAsistenciaRpcToMap(rows: UltimaAsistenciaPorPersonaRow[] | null): Record<string, string> {
  const map: Record<string, string> = {};
  for (const r of rows ?? []) {
    if (r.persona_id && r.ultima_fecha) map[r.persona_id] = r.ultima_fecha;
  }
  return map;
}
