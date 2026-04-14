export function formatFechaNacimiento(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export function calcularEdad(fechaStr: string | null): number | null {
  if (!fechaStr) return null;
  const d = new Date(fechaStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - d.getFullYear();
  if (hoy.getMonth() < d.getMonth() || (hoy.getMonth() === d.getMonth() && hoy.getDate() < d.getDate())) edad--;
  return edad >= 0 ? edad : null;
}

export function formatUltimoContacto(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  const fechaConAnio = d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff >= 2 && diff <= 6) return `Hace ${diff} días`;
  if (diff >= 7 && diff <= 13) return `Hace 1 semana · ${fechaConAnio}`;
  if (diff >= 14 && diff <= 29) return `Hace 2 semanas · ${fechaConAnio}`;
  if (diff >= 30 && diff <= 59) return `Hace 1 mes · ${fechaConAnio}`;
  if (diff >= 60) return `Hace más de 2 meses · ${fechaConAnio}`;
  return fechaConAnio;
}

export function formatHistorialFecha(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export function formatNotaTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Lunes de la semana (ISO) para agrupar por semana */
export function getMondayKey(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function parseIsoToDatePersona(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fechaLocalToIso(d: Date | null): string | null {
  if (!d || Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Racha = semanas consecutivas con al menos una asistencia (desde la más reciente hacia atrás) */
export function calcularRacha(fechas: string[]): number {
  if (fechas.length === 0) return 0;
  const weeks = Array.from(new Set(fechas.map(getMondayKey))).sort().reverse();
  let racha = 1;
  for (let i = 1; i < weeks.length; i++) {
    const prev = new Date(weeks[i - 1] + "T12:00:00");
    const curr = new Date(weeks[i] + "T12:00:00");
    const diffDays = (prev.getTime() - curr.getTime()) / (24 * 60 * 60 * 1000);
    if (diffDays === 7) racha++;
    else break;
  }
  return racha;
}
