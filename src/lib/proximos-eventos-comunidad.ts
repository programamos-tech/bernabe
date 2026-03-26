/**
 * Próximas ocurrencias de eventos (tabla eventos) + reuniones de grupos (día/hora),
 * misma lógica base que el calendario.
 */

export type TipoEvento = "reunion" | "grupo" | "clase" | "servicio" | "especial";

export interface EventoRowComunidad {
  id: string;
  titulo: string;
  tipo: string;
  fecha: string | null;
  fecha_fin: string | null;
  hora: string | null;
  ubicacion: string | null;
  recurrente: boolean;
  imagen: string | null;
  grupo_id: string | null;
}

export interface GrupoRowComunidad {
  id: string;
  nombre: string;
  dia: string | null;
  hora: string | null;
  ubicacion: string | null;
  imagen: string | null;
}

export interface ProximoEventoItem {
  key: string;
  titulo: string;
  fecha: Date;
  hora: string;
  imagen: string | null;
  href: string;
  etiqueta: string;
}

const DIAS_SEMANA_COMPLETO = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const TIPO_LABEL: Record<string, string> = {
  reunion: "Reunión",
  grupo: "Grupo",
  clase: "Clase",
  servicio: "Servicio",
  especial: "Especial",
};

function parseFecha(fechaStr: string | null): Date | null {
  if (!fechaStr) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaStr.trim());
  if (match) {
    const [, y, m, d] = match.map(Number);
    const date = new Date(y, m - 1, d);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const d = new Date(fechaStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

function normalizarDia(dia: string): string {
  const d = dia?.trim() ?? "";
  if (d === "Sábados") return "Sábado";
  if (d === "Domingos") return "Domingo";
  return d;
}

function parseTimeToMinutes(timeStr: string | null | undefined): number {
  if (!timeStr || timeStr === "—") return 0;
  const s = timeStr.trim();
  const match24 = /^(\d{1,2}):(\d{2})/.exec(s);
  if (match24) {
    const h = Math.min(23, Math.max(0, parseInt(match24[1], 10)));
    const m = Math.min(59, Math.max(0, parseInt(match24[2], 10)));
    return h * 60 + m;
  }
  return 0;
}

/**
 * Próximas ocurrencias desde hoy, ordenadas por fecha y hora.
 */
export function buildProximosEventosItems(
  eventosDb: EventoRowComunidad[],
  gruposDb: GrupoRowComunidad[],
  options: { limit: number; horizonDays?: number } = { limit: 8 }
): ProximoEventoItem[] {
  const limit = options.limit;
  const horizonDays = options.horizonDays ?? 90;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() + horizonDays);

  const grupoById = new Map(gruposDb.map((g) => [g.id, g]));

  const out: ProximoEventoItem[] = [];
  const seen = new Set<string>();

  for (let d = new Date(now); d <= end; d.setDate(d.getDate() + 1)) {
    const date = new Date(d);
    const dayName = DIAS_SEMANA_COMPLETO[date.getDay()];
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    for (const e of eventosDb) {
      const parsed = parseFecha(e.fecha);
      const parsedFin = parseFecha(e.fecha_fin);
      let matchesDate: boolean;
      if (e.recurrente && parsed) {
        matchesDate = parsed.getDay() === date.getDay();
      } else if (parsed && parsedFin) {
        const dayMid = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        const startMid = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
        const endMid = new Date(parsedFin.getFullYear(), parsedFin.getMonth(), parsedFin.getDate()).getTime();
        matchesDate = dayMid >= startMid && dayMid <= endMid;
      } else {
        matchesDate = parsed != null && isSameDay(parsed, date);
      }
      if (!matchesDate) continue;

      const key = `${e.id}-${dateStr}`;
      if (seen.has(key) || date < now) continue;
      seen.add(key);

      const tipo = (e.tipo as TipoEvento) || "reunion";
      const tipoLabel = TIPO_LABEL[tipo] ?? tipo;
      const gLinked = e.grupo_id ? grupoById.get(e.grupo_id) : undefined;
      const imagen = e.imagen || gLinked?.imagen || null;
      let etiqueta = tipoLabel;
      if (gLinked?.nombre) {
        etiqueta = `${tipoLabel} · ${gLinked.nombre}`;
      }

      out.push({
        key,
        titulo: e.titulo,
        fecha: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        hora: e.hora ?? "—",
        imagen,
        href: `/eventos/${e.id}`,
        etiqueta,
      });
    }

    for (const g of gruposDb) {
      if (!g.dia || !g.hora) continue;
      if (normalizarDia(g.dia) !== dayName) continue;
      const key = `grupo-${g.id}-${dateStr}`;
      if (seen.has(key) || date < now) continue;
      seen.add(key);

      out.push({
        key,
        titulo: g.nombre,
        fecha: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        hora: g.hora,
        imagen: g.imagen ?? null,
        href: `/grupos/${g.id}`,
        etiqueta: g.dia ? `Grupo · ${g.dia}` : "Grupo",
      });
    }
  }

  out.sort((a, b) => {
    const td = a.fecha.getTime() - b.fecha.getTime();
    if (td !== 0) return td;
    return parseTimeToMinutes(a.hora) - parseTimeToMinutes(b.hora);
  });

  return out.slice(0, limit);
}

const DIAS_CORTO = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Ej. "Dom 22" */
export function formatDiaMesCorto(fecha: Date): string {
  return `${DIAS_CORTO[fecha.getDay()]} ${fecha.getDate()}`;
}
