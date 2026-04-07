"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { EventoAvatarCluster } from "@/components/EventoAvatarCluster";
import { GrupoAvatarCluster } from "@/components/GrupoAvatarCluster";
import { createClient } from "@/lib/supabase/client";

type TipoEvento = "reunion" | "grupo" | "clase" | "servicio" | "especial";
type VistaCalendario = "mes" | "semana";

interface Evento {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  ubicacion: string;
  descripcion?: string;
  /** Imagen del grupo (solo cuando tipo === 'grupo') */
  imagen?: string | null;
  /** ID del grupo para enlazar a /grupos/[id] */
  grupoId?: string;
}

interface EventoRow {
  id: string;
  titulo: string;
  tipo: string;
  fecha: string | null;
  fecha_fin: string | null;
  hora: string | null;
  ubicacion: string | null;
  descripcion: string | null;
  recurrente: boolean;
  imagen: string | null;
}

interface GrupoRow {
  id: string;
  nombre: string;
  dia: string | null;
  hora: string | null;
  ubicacion: string | null;
  imagen: string | null;
}

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_SEMANA_COMPLETO = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const tipoEventoStyles: Record<
  TipoEvento,
  { compactBg: string; text: string; dot: string; label: string; pill: string }
> = {
  reunion: {
    compactBg: "bg-sky-500/12 dark:bg-sky-500/15",
    text: "text-sky-900 dark:text-sky-200",
    dot: "bg-sky-400/90 dark:bg-sky-300/75",
    label: "Reunión",
    pill: "bg-sky-500/10 text-sky-900 dark:text-sky-200",
  },
  grupo: {
    compactBg: "bg-emerald-500/12 dark:bg-emerald-500/15",
    text: "text-emerald-900 dark:text-emerald-200",
    dot: "bg-emerald-400/90 dark:bg-emerald-300/75",
    label: "Grupo",
    pill: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
  },
  clase: {
    compactBg: "bg-violet-500/12 dark:bg-violet-500/15",
    text: "text-violet-900 dark:text-violet-200",
    dot: "bg-violet-400/90 dark:bg-violet-300/75",
    label: "Clase",
    pill: "bg-violet-500/12 text-violet-900 dark:text-violet-200",
  },
  servicio: {
    compactBg: "bg-orange-500/12 dark:bg-orange-500/15",
    text: "text-orange-900 dark:text-orange-200",
    dot: "bg-orange-400/90 dark:bg-orange-300/75",
    label: "Servicio",
    pill: "bg-orange-500/10 text-orange-900 dark:text-orange-200",
  },
  especial: {
    compactBg: "bg-amber-400/18 dark:bg-amber-500/15",
    text: "text-amber-900 dark:text-amber-100",
    dot: "bg-amber-400/90 dark:bg-amber-300/75",
    label: "Especial",
    pill: "bg-amber-400/15 text-amber-900 dark:text-amber-100",
  },
};

/** Normaliza nombre del día para comparar (Sábados -> Sábado, Domingos -> Domingo) */
function normalizarDia(dia: string): string {
  const d = dia?.trim() ?? "";
  if (d === "Sábados") return "Sábado";
  if (d === "Domingos") return "Domingo";
  return d;
}

/** Parsea YYYY-MM-DD como fecha local para evitar desfase por UTC (ej. sábado → viernes). */
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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getWeekDates(date: Date): Date[] {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day);
  
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/** Parsea hora "08:00", "17:00", "07:00 PM", "06:45 PM" a minutos desde medianoche (0-1439). */
function parseTimeToMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr || timeStr === "—") return null;
  const s = timeStr.trim();
  const hasAmPm = /\d\s*(am|pm)\b/i.test(s);
  if (hasAmPm) {
    const match12 = /^(\d{1,2}):(\d{2})\s*(am|pm)/i.exec(s);
    if (match12) {
      let h = parseInt(match12[1], 10);
      const m = Math.min(59, Math.max(0, parseInt(match12[2], 10)));
      const pm = match12[3].toLowerCase() === "pm";
      if (h === 12) h = pm ? 12 : 0;
      else if (pm) h += 12;
      return Math.min(23 * 60 + 59, Math.max(0, h * 60 + m));
    }
  }
  const match24 = /^(\d{1,2}):(\d{2})/.exec(s);
  if (match24) {
    const h = Math.min(23, Math.max(0, parseInt(match24[1], 10)));
    const m = Math.min(59, Math.max(0, parseInt(match24[2], 10)));
    return h * 60 + m;
  }
  return null;
}

const SEMANA_HORA_INICIO = 0;
const SEMANA_HORA_FIN = 23;
const SEMANA_PIXELS_POR_HORA = 40;
const SEMANA_ALTURA_TOTAL = (SEMANA_HORA_FIN - SEMANA_HORA_INICIO + 1) * SEMANA_PIXELS_POR_HORA;
/** Hora con la que empieza la vista por defecto (scroll inicial para ver "horario de día"). */
const SEMANA_SCROLL_INICIAL_HORA = 6;
const SEMANA_HEADER_ALTURA = 48;
const SEMANA_SCROLL_INICIAL_PX = SEMANA_HEADER_ALTURA + SEMANA_SCROLL_INICIAL_HORA * SEMANA_PIXELS_POR_HORA;

function EventoBadge({ evento, compact = false }: { evento: Evento; compact?: boolean }) {
  const style = tipoEventoStyles[evento.tipo];

  if (compact) {
    return (
      <div className={`rounded-lg px-2 py-1.5 ${style.compactBg}`}>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
          <span className={`truncate text-xs font-medium ${style.text}`}>{evento.titulo}</span>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-gray-600 dark:text-gray-400" title={evento.ubicacion}>
          {evento.horaInicio}
          {evento.ubicacion && evento.ubicacion !== "—" ? ` · ${evento.ubicacion}` : ""}
        </p>
      </div>
    );
  }

  const isGroup = !!evento.grupoId;
  const isEventFromDb = Boolean(evento.id && !evento.id.startsWith("grupo-"));
  const eventoIdForAvatar = isEventFromDb && !evento.grupoId ? evento.id : `${evento.titulo}|${evento.grupoId ?? evento.id}`;

  const cardInner = (
    <div className="cursor-pointer overflow-hidden rounded-2xl border border-gray-200/50 bg-gray-100/40 transition hover:bg-gray-100/60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]">
      <div className="relative flex h-28 items-center justify-center bg-gradient-to-b from-gray-100/90 to-gray-100/45 dark:from-white/[0.08] dark:to-white/[0.03]">
        <div
          className={`absolute left-2 top-2 z-10 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm shadow-black/[0.04] dark:shadow-none ${style.pill}`}
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
          {style.label}
        </div>
        {evento.grupoId ? (
          <GrupoAvatarCluster nombreGrupo={evento.titulo} sizeCenter={56} sizeSide={36} />
        ) : (
          <EventoAvatarCluster titulo={evento.titulo} eventoId={eventoIdForAvatar} sizeCenter={56} sizeSide={36} />
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{evento.titulo}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {evento.horaInicio}
          {evento.horaInicio !== evento.horaFin ? ` - ${evento.horaFin}` : ""}
        </p>
        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400" title={evento.ubicacion}>
          {evento.ubicacion}
        </p>
        {evento.grupoId ? (
          <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">Ver grupo →</p>
        ) : null}
        {isEventFromDb && !evento.grupoId ? (
          <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">Ver evento →</p>
        ) : null}
      </div>
    </div>
  );

  if (isGroup && evento.grupoId) {
    return (
      <Link href={`/grupos/${evento.grupoId}`} className="block">
        {cardInner}
      </Link>
    );
  }
  if (isEventFromDb) {
    return (
      <Link href={`/eventos/${evento.id}`} className="block">
        {cardInner}
      </Link>
    );
  }
  return cardInner;
}

export default function Page() {
  const [eventosDb, setEventosDb] = useState<EventoRow[]>([]);
  const [gruposDb, setGruposDb] = useState<GrupoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(today);
  const [vista, setVista] = useState<VistaCalendario>("semana");
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const semanaScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("eventos").select("id, titulo, tipo, fecha, fecha_fin, hora, ubicacion, descripcion, recurrente, imagen").order("fecha"),
      supabase.from("grupos").select("id, nombre, dia, hora, ubicacion, imagen").eq("activo", true),
    ]).then(([eventosRes, gruposRes]) => {
      setEventosDb((eventosRes.data as EventoRow[]) ?? []);
      setGruposDb((gruposRes.data as GrupoRow[]) ?? []);
      setLoading(false);
    });
  }, []);

  const getEventsForDate = (date: Date): Evento[] => {
    const dayName = DIAS_SEMANA_COMPLETO[date.getDay()];
    const result: Evento[] = [];

    const dateStr = date.toISOString().slice(0, 10);
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
      if (matchesDate) {
        result.push({
          id: e.id,
          titulo: e.titulo,
          tipo: (e.tipo as TipoEvento) || "reunion",
          fecha: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          horaInicio: e.hora ?? "—",
          horaFin: e.hora ?? "—",
          ubicacion: e.ubicacion ?? "—",
          descripcion: e.descripcion ?? undefined,
          imagen: e.imagen ?? undefined,
        });
      }
    }

    for (const g of gruposDb) {
      if (!g.dia || !g.hora) continue;
      if (normalizarDia(g.dia) !== dayName) continue;
      result.push({
        id: `grupo-${g.id}-${dateStr}`,
        titulo: g.nombre,
        tipo: "grupo",
        fecha: new Date(date),
        horaInicio: g.hora,
        horaFin: g.hora,
        ubicacion: g.ubicacion ?? "—",
        imagen: g.imagen ?? undefined,
        grupoId: g.id,
      });
    }

    result.sort((a, b) => (a.horaInicio < b.horaInicio ? -1 : a.horaInicio > b.horaInicio ? 1 : 0));
    return result;
  };

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  const prevPeriod = () => {
    if (vista === "mes") {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const nextPeriod = () => {
    if (vista === "mes") {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const weekDates = getWeekDates(currentDate);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(currentDate);
    start.setDate(1);
    start.setMonth(start.getMonth() - 1);
    const end = new Date(currentDate);
    end.setMonth(end.getMonth() + 2);
    const out: Evento[] = [];
    const seen = new Set<string>();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const date = new Date(d);
      const dayName = DIAS_SEMANA_COMPLETO[date.getDay()];
      const dateStr = date.toISOString().slice(0, 10);
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
        if (matchesDate) {
          const key = `${e.id}-${dateStr}`;
          if (!seen.has(key) && date >= now) {
            seen.add(key);
            out.push({
              id: e.id,
              titulo: e.titulo,
              tipo: (e.tipo as TipoEvento) || "reunion",
              fecha: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
              horaInicio: e.hora ?? "—",
              horaFin: e.hora ?? "—",
              ubicacion: e.ubicacion ?? "—",
              imagen: e.imagen ?? undefined,
            });
          }
        }
      }
      for (const g of gruposDb) {
        if (!g.dia || !g.hora) continue;
        if (normalizarDia(g.dia) !== dayName) continue;
        const key = `grupo-${g.id}-${dateStr}`;
        if (!seen.has(key) && date >= now) {
          seen.add(key);
          out.push({
            id: key,
            titulo: g.nombre,
            tipo: "grupo",
            fecha: date,
            horaInicio: g.hora,
            horaFin: g.hora,
            ubicacion: g.ubicacion ?? "—",
            imagen: g.imagen ?? undefined,
            grupoId: g.id,
          });
        }
      }
    }
    return out.sort((a, b) => a.fecha.getTime() - b.fecha.getTime()).slice(0, 8);
  }, [currentDate, eventosDb, gruposDb]);

  useEffect(() => {
    if (vista !== "semana" || !semanaScrollRef.current) return;
    semanaScrollRef.current.scrollTop = SEMANA_SCROLL_INICIAL_PX;
  }, [vista, currentDate]);

  // Build calendar days array for month view
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 md:px-6">
        <svg className="h-8 w-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const selectedDayClass = "bg-gray-900 text-white dark:bg-white dark:text-gray-900";
  const todayMutedClass = "bg-gray-200/70 dark:bg-white/10";

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full max-w-none px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-medium text-[#18301d] dark:text-white font-logo-soft tracking-tight">Calendario</h1>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-snug">
            Eventos, reuniones y actividades de la iglesia.
          </p>
        </div>
        <Link
          href="/eventos/nuevo"
          className="flex w-fit items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-black/10 transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:shadow-none dark:hover:bg-gray-100"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo evento
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04] lg:col-span-2">
          <div className="border-b border-gray-200/60 p-4 dark:border-white/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={prevPeriod}
                  className="rounded-full p-2 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:hover:bg-white/[0.08] dark:hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                  {vista === "mes"
                    ? `${MESES[currentMonth]} ${currentYear}`
                    : `${weekDates[0].getDate()} - ${weekDates[6].getDate()} ${MESES[weekDates[6].getMonth()]} ${weekDates[6].getFullYear()}`}
                </h2>
                <button
                  type="button"
                  onClick={nextPeriod}
                  className="rounded-full p-2 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:hover:bg-white/[0.08] dark:hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={goToToday}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200/60 dark:text-gray-300 dark:hover:bg-white/[0.08]"
                >
                  Hoy
                </button>
                <div className="flex rounded-full bg-gray-200/50 p-1 dark:bg-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setVista("mes")}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      vista === "mes"
                        ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-white"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    Mes
                  </button>
                  <button
                    type="button"
                    onClick={() => setVista("semana")}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      vista === "semana"
                        ? "bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-white"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    Semana
                  </button>
                </div>
              </div>
            </div>
          </div>

            {/* Month View */}
            {vista === "mes" && (
              <div className="p-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {DIAS_SEMANA.map((dia) => (
                    <div key={dia} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                      {dia}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => {
                    if (day === null) {
                      return <div key={`empty-${i}`} className="aspect-square" />;
                    }

                    const date = new Date(currentYear, currentMonth, day);
                    const dayEvents = getEventsForDate(date);
                    const isSelectedDay = selectedDate && isSameDay(date, selectedDate);
                    const isTodayDay = isToday(date);

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(date)}
                        className={`relative aspect-square rounded-xl p-1 transition group ${
                          isSelectedDay
                            ? selectedDayClass
                            : isTodayDay
                              ? todayMutedClass
                              : "hover:bg-gray-200/50 dark:hover:bg-white/[0.06]"
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            isSelectedDay
                              ? "text-white dark:text-gray-900"
                              : isTodayDay
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {day}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {dayEvents.slice(0, 3).map((evento) => (
                              <span
                                key={evento.id}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSelectedDay ? "bg-white" : tipoEventoStyles[evento.tipo].dot
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Week View con guía de horas */}
            {vista === "semana" && (
              <div className="p-4 pb-6">
                <div
                  ref={semanaScrollRef}
                  className="scrollbar-brand max-h-[70vh] overflow-y-auto overflow-x-auto rounded-2xl border border-gray-200/60 dark:border-white/10"
                >
                  <div className="flex gap-2 min-w-0">
                    {/* Columna de horas */}
                    <div
                      className="flex-shrink-0 w-12 flex flex-col text-right pr-2"
                      style={{ height: SEMANA_ALTURA_TOTAL + SEMANA_HEADER_ALTURA }}
                    >
                      <div className="h-12 flex-shrink-0" />
                    {Array.from({ length: SEMANA_HORA_FIN - SEMANA_HORA_INICIO + 1 }, (_, i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 border-t border-gray-200/50 pt-0.5 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400"
                        style={{ height: SEMANA_PIXELS_POR_HORA }}
                      >
                        {String(SEMANA_HORA_INICIO + i).padStart(2, "0")}:00
                      </div>
                    ))}
                  </div>
                  {/* Columnas de días */}
                  <div className="grid grid-cols-7 gap-2 flex-1 min-w-0">
                    {weekDates.map((date, i) => {
                      const dayEvents = getEventsForDate(date);
                      const isSelectedDay = selectedDate && isSameDay(date, selectedDate);
                      const isTodayDay = isToday(date);

                      return (
                        <div key={i} className="flex flex-col min-w-0">
                          <button
                            onClick={() => setSelectedDate(date)}
                            className={`mb-2 w-full flex-shrink-0 rounded-xl px-1 py-2 transition ${
                              isSelectedDay
                                ? selectedDayClass
                                : isTodayDay
                                  ? todayMutedClass
                                  : "hover:bg-gray-200/50 dark:hover:bg-white/[0.06]"
                            }`}
                          >
                            <p
                              className={`truncate text-xs ${
                                isSelectedDay ? "text-white/85 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {DIAS_SEMANA_COMPLETO[i]}
                            </p>
                            <p
                              className={`truncate text-base font-semibold ${
                                isSelectedDay
                                  ? "text-white dark:text-gray-900"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {date.getDate()}
                            </p>
                          </button>
                          <div
                            className="relative flex-1 overflow-hidden rounded-xl border border-gray-200/60 bg-gray-100/30 dark:border-white/10 dark:bg-white/[0.03]"
                            style={{ height: SEMANA_ALTURA_TOTAL }}
                          >
                            {Array.from({ length: SEMANA_HORA_FIN - SEMANA_HORA_INICIO }, (_, j) => (
                              <div
                                key={j}
                                className="absolute left-0 right-0 border-t border-gray-200/50 dark:border-white/10"
                                style={{ top: (j + 1) * SEMANA_PIXELS_POR_HORA }}
                              />
                            ))}
                            {(() => {
                              const slotCount: Record<number, number> = {};
                              return dayEvents.map((evento) => {
                                const mins = parseTimeToMinutes(evento.horaInicio);
                                const topMinutes = mins != null
                                  ? Math.max(0, mins - SEMANA_HORA_INICIO * 60)
                                  : 0;
                                let topPx = (topMinutes / 60) * SEMANA_PIXELS_POR_HORA;
                                const slotKey = Math.floor(topPx / SEMANA_PIXELS_POR_HORA) * SEMANA_PIXELS_POR_HORA;
                                const indexInSlot = slotCount[slotKey] ?? 0;
                                slotCount[slotKey] = indexInSlot + 1;
                                if (indexInSlot > 0) topPx += indexInSlot * 48;
                                topPx = Math.min(topPx, SEMANA_ALTURA_TOTAL - 48);

                                return (
                                  <div
                                    key={evento.id}
                                    className="absolute left-1 right-1 rounded-lg overflow-hidden shadow-sm min-h-[44px] max-h-[96px]"
                                    style={{
                                      top: topPx,
                                      width: "calc(100% - 8px)",
                                    }}
                                  >
                                    <EventoBadge evento={evento} compact />
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200/60 bg-gray-100/30 px-4 py-3 dark:border-white/10 dark:bg-white/[0.02]">
              <div className="flex flex-wrap gap-4">
                {Object.entries(tipoEventoStyles).map(([tipo, style]) => (
                  <div key={tipo} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{style.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="h-fit overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
            <div className="border-b border-gray-200/60 p-4 dark:border-white/10">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {selectedDate
                  ? `${DIAS_SEMANA_COMPLETO[selectedDate.getDay()]} ${selectedDate.getDate()}`
                  : "Selecciona un día"
                }
              </h3>
              {selectedDate && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {MESES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </p>
              )}
            </div>

            <div className="p-4">
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#252525] flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No hay eventos este día</p>
                  <Link
                    href="/eventos/nuevo"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white"
                  >
                    Crear evento
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map((evento) => (
                    <EventoBadge key={evento.id} evento={evento} />
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming events */}
            <div className="border-t border-gray-200/60 p-4 dark:border-white/10">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                Próximos eventos
              </h4>
              <div className="space-y-2">
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No hay eventos próximos.</p>
                ) : (
                  upcomingEvents.map((evento) => {
                    const style = tipoEventoStyles[evento.tipo];
                    const isGroup = !!evento.grupoId;
                    const isEventFromDb = Boolean(evento.id && !evento.id.startsWith("grupo-"));
                    const rowClass =
                      "flex cursor-pointer items-center gap-3 rounded-xl border border-transparent p-2 transition hover:bg-gray-200/40 dark:hover:bg-white/[0.06]";
                    const key = `${evento.id}-${evento.fecha.toISOString()}`;

                    const upcomingEvId =
                      evento.id && !evento.id.startsWith("grupo-")
                        ? evento.id
                        : `${evento.titulo}|${evento.grupoId ?? evento.id}`;

                    const rowInner = (
                      <>
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-gray-100/90 to-gray-100/45 dark:from-white/[0.08] dark:to-white/[0.03]">
                          <div className="absolute inset-0 flex items-center justify-center scale-[0.38]">
                            {evento.grupoId ? (
                              <GrupoAvatarCluster nombreGrupo={evento.titulo} sizeCenter={72} sizeSide={44} />
                            ) : (
                              <EventoAvatarCluster titulo={evento.titulo} eventoId={upcomingEvId} sizeCenter={72} sizeSide={44} />
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 flex justify-center bg-black/45 py-0.5 dark:bg-black/50">
                            <span className="text-[10px] font-bold text-white">{evento.fecha.getDate()}</span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={`text-[10px] font-semibold uppercase tracking-wide ${style.text}`}>{style.label}</span>
                          <p className="mt-0.5 truncate text-sm font-medium text-gray-900 dark:text-white">{evento.titulo}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{evento.horaInicio}</p>
                        </div>
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} title={style.label} />
                      </>
                    );

                    if (isGroup && evento.grupoId) {
                      return (
                        <Link key={key} href={`/grupos/${evento.grupoId}`} className={rowClass}>
                          {rowInner}
                        </Link>
                      );
                    }
                    if (isEventFromDb) {
                      return (
                        <Link key={key} href={`/eventos/${evento.id}`} className={rowClass}>
                          {rowInner}
                        </Link>
                      );
                    }
                    return (
                      <div key={key} className={rowClass}>
                        {rowInner}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
