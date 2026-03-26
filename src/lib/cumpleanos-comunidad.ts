/**
 * Cumpleaños de la semana actual (lunes–domingo) a partir de personas.fecha_nacimiento.
 */

export interface PersonaCumpleRow {
  id: string;
  nombre: string;
  fecha_nacimiento: string | null;
}

export interface CumpleanoSemanaItem {
  id: string;
  nombre: string;
  /** Fecha del cumpleaños en el calendario (esta semana) */
  fecha: Date;
  etiqueta: string;
}

const DIAS_CORTO = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** Inicio de semana (lunes 00:00 local). */
export function inicioSemanaLunes(ref: Date): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 dom … 6 sáb
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function parseFechaNacimiento(fechaStr: string | null): { month: number; day: number } | null {
  if (!fechaStr) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaStr.trim());
  if (!m) return null;
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

function cumpleCoincideConDia(month: number, day: number, enDia: Date): boolean {
  const y = enDia.getFullYear();
  let m = month;
  let d = day;
  if (m === 2 && d === 29 && !isLeapYear(y)) {
    m = 2;
    d = 28;
  }
  return enDia.getMonth() + 1 === m && enDia.getDate() === d;
}

function soloFecha(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Etiqueta relativa: "Hoy", "Mañana", o "Vie 20".
 */
export function formatEtiquetaCumple(fechaCumple: Date, hoy: Date): string {
  const a = soloFecha(fechaCumple).getTime();
  const b = soloFecha(hoy).getTime();
  const diffDias = Math.round((a - b) / 86400000);
  if (diffDias === 0) return "Hoy";
  if (diffDias === 1) return "Mañana";
  return `${DIAS_CORTO[fechaCumple.getDay()]} ${fechaCumple.getDate()}`;
}

/**
 * Personas cuyo cumpleaños cae entre el lunes y el domingo de la semana de `referencia`.
 */
export function buildCumpleanosEstaSemana(
  rows: PersonaCumpleRow[],
  referencia: Date = new Date()
): CumpleanoSemanaItem[] {
  const hoy = soloFecha(referencia);
  const inicio = inicioSemanaLunes(referencia);
  const items: CumpleanoSemanaItem[] = [];

  for (let i = 0; i < 7; i++) {
    const dia = new Date(inicio);
    dia.setDate(inicio.getDate() + i);

    for (const row of rows) {
      const parts = parseFechaNacimiento(row.fecha_nacimiento);
      if (!parts) continue;
      if (!cumpleCoincideConDia(parts.month, parts.day, dia)) continue;

      items.push({
        id: row.id,
        nombre: row.nombre,
        fecha: new Date(dia.getFullYear(), dia.getMonth(), dia.getDate()),
        etiqueta: formatEtiquetaCumple(dia, hoy),
      });
    }
  }

  items.sort((a, b) => {
    const t = a.fecha.getTime() - b.fecha.getTime();
    if (t !== 0) return t;
    return a.nombre.localeCompare(b.nombre, "es");
  });

  return items;
}
