"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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

const tipoEventoStyles: Record<TipoEvento, { bg: string; text: string; dot: string; label: string }> = {
  reunion: { bg: "bg-[#0ca6b2]/10 dark:bg-[#0ca6b2]/20", text: "text-[#0ca6b2]", dot: "bg-[#0ca6b2]", label: "Reunión" },
  grupo: { bg: "bg-[#18301d]/10 dark:bg-[#0ca6b2]/20", text: "text-[#18301d] dark:text-[#0ca6b2]", dot: "bg-[#18301d] dark:bg-[#0ca6b2]", label: "Grupo" },
  clase: { bg: "bg-purple-100 dark:bg-purple-500/20", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500", label: "Clase" },
  servicio: { bg: "bg-[#e64b27]/10 dark:bg-[#e64b27]/20", text: "text-[#e64b27]", dot: "bg-[#e64b27]", label: "Servicio" },
  especial: { bg: "bg-[#f9c70c]/20", text: "text-[#b8860b] dark:text-[#f9c70c]", dot: "bg-[#f9c70c]", label: "Especial" },
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
      <div className={`rounded-lg px-2 py-1.5 ${style.bg} ${style.text}`}>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
          <span className="text-xs font-medium truncate">{evento.titulo}</span>
        </div>
        <p className="text-[10px] mt-0.5 opacity-90 truncate" title={evento.ubicacion}>
          {evento.horaInicio}
          {evento.ubicacion && evento.ubicacion !== "—" ? ` · ${evento.ubicacion}` : ""}
        </p>
      </div>
    );
  }

  const isGroup = !!evento.grupoId;
  const isEventFromDb = Boolean(evento.id && !evento.id.startsWith("grupo-"));

  const cardInner = (
    <div className={`rounded-xl overflow-hidden hover:shadow-md dark:hover:shadow-[#0ca6b2]/10 transition cursor-pointer ${style.bg}`}>
      {evento.imagen ? (
        <div className="relative h-28 w-full bg-gray-200 dark:bg-[#252525]">
          <Image
            src={evento.imagen}
            alt={evento.titulo}
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 320px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute top-2 left-2 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${style.dot}`} />
            <span className={`text-xs font-medium text-white drop-shadow`}>{style.label}</span>
          </div>
        </div>
      ) : (
        <div className="pt-3 px-3">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${style.dot}`} />
            <span className={`text-xs font-medium ${style.text}`}>{style.label}</span>
          </div>
        </div>
      )}
      <div className="p-3">
        <p className={`font-medium text-sm ${style.text}`}>{evento.titulo}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {evento.horaInicio}{evento.horaInicio !== evento.horaFin ? ` - ${evento.horaFin}` : ""}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 truncate" title={evento.ubicacion}>{evento.ubicacion}</p>
        {evento.grupoId && (
          <p className="text-xs font-medium text-[#0ca6b2] mt-2 hover:underline">Ver grupo →</p>
        )}
        {isEventFromDb && !evento.grupoId && (
          <p className="text-xs font-medium text-[#0ca6b2] mt-2 hover:underline">Ver evento →</p>
        )}
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
      <div className="px-4 py-8 md:px-6 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <svg className="w-10 h-10 animate-spin text-[#0ca6b2]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 md:px-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#18301d] dark:text-white">Calendario</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Eventos, reuniones y actividades de la iglesia.
            </p>
          </div>
          <Link
            href="/eventos/nuevo"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#e64b27] text-white font-semibold rounded-full hover:bg-[#d4421f] transition shadow-lg shadow-[#e64b27]/25 w-fit"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo evento
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
            {/* Calendar header */}
            <div className="p-4 border-b border-gray-100 dark:border-[#2a2a2a]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={prevPeriod}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-500 hover:text-[#18301d] dark:hover:text-white transition"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-lg font-semibold text-[#18301d] dark:text-white">
                    {vista === "mes"
                      ? `${MESES[currentMonth]} ${currentYear}`
                      : `${weekDates[0].getDate()} - ${weekDates[6].getDate()} ${MESES[weekDates[6].getMonth()]} ${weekDates[6].getFullYear()}`
                    }
                  </h2>
                  <button
                    onClick={nextPeriod}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-500 hover:text-[#18301d] dark:hover:text-white transition"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={goToToday}
                    className="px-3 py-1.5 text-sm font-medium text-[#0ca6b2] hover:bg-[#0ca6b2]/10 rounded-lg transition"
                  >
                    Hoy
                  </button>
                  <div className="flex bg-gray-100 dark:bg-[#252525] rounded-lg p-1">
                    <button
                      onClick={() => setVista("mes")}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                        vista === "mes"
                          ? "bg-white dark:bg-[#333] text-[#18301d] dark:text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-[#18301d] dark:hover:text-white"
                      }`}
                    >
                      Mes
                    </button>
                    <button
                      onClick={() => setVista("semana")}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                        vista === "semana"
                          ? "bg-white dark:bg-[#333] text-[#18301d] dark:text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-[#18301d] dark:hover:text-white"
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
                        className={`aspect-square p-1 rounded-xl transition relative group ${
                          isSelectedDay
                            ? "bg-[#0ca6b2] text-white"
                            : isTodayDay
                            ? "bg-[#0ca6b2]/10 dark:bg-[#0ca6b2]/20"
                            : "hover:bg-gray-50 dark:hover:bg-[#252525]"
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            isSelectedDay
                              ? "text-white"
                              : isTodayDay
                              ? "text-[#0ca6b2]"
                              : "text-[#18301d] dark:text-white"
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
                  className="scrollbar-hide overflow-y-auto overflow-x-auto max-h-[70vh] rounded-lg border border-gray-100 dark:border-[#2a2a2a]"
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
                        className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-[#2a2a2a] pt-0.5"
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
                            className={`w-full py-2 px-1 rounded-xl mb-2 transition flex-shrink-0 ${
                              isSelectedDay
                                ? "bg-[#0ca6b2] text-white"
                                : isTodayDay
                                ? "bg-[#0ca6b2]/10 dark:bg-[#0ca6b2]/20"
                                : "hover:bg-gray-50 dark:hover:bg-[#252525]"
                            }`}
                          >
                            <p className={`text-xs truncate ${isSelectedDay ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                              {DIAS_SEMANA_COMPLETO[i]}
                            </p>
                            <p className={`text-base font-semibold truncate ${
                              isSelectedDay ? "text-white" : isTodayDay ? "text-[#0ca6b2]" : "text-[#18301d] dark:text-white"
                            }`}>
                              {date.getDate()}
                            </p>
                          </button>
                          <div
                            className="relative flex-1 border border-gray-100 dark:border-[#2a2a2a] rounded-lg overflow-hidden bg-gray-50/50 dark:bg-[#252525]/30"
                            style={{ height: SEMANA_ALTURA_TOTAL }}
                          >
                            {/* Líneas horizontales de hora */}
                            {Array.from({ length: SEMANA_HORA_FIN - SEMANA_HORA_INICIO }, (_, j) => (
                              <div
                                key={j}
                                className="absolute left-0 right-0 border-t border-gray-100 dark:border-[#2a2a2a]"
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

            {/* Legend */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#252525]">
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

          {/* Sidebar - Selected day events */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden h-fit">
            <div className="p-4 border-b border-gray-100 dark:border-[#2a2a2a] bg-gradient-to-r from-[#faddbf]/50 to-[#f9c70c]/20 dark:from-[#0ca6b2]/20 dark:to-[#0ca6b2]/10">
              <h3 className="font-semibold text-[#18301d] dark:text-white">
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
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#0ca6b2] hover:underline mt-2"
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
            <div className="p-4 border-t border-gray-100 dark:border-[#2a2a2a]">
              <h4 className="text-sm font-semibold text-[#18301d] dark:text-white mb-3">Próximos eventos</h4>
              <div className="space-y-2">
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No hay eventos próximos.</p>
                ) : (
                  upcomingEvents.map((evento) => {
                    const style = tipoEventoStyles[evento.tipo];
                    const isGroup = !!evento.grupoId;
                    const isEventFromDb = Boolean(evento.id && !evento.id.startsWith("grupo-"));
                    const rowClass =
                      "flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-[#333]";
                    const key = `${evento.id}-${evento.fecha.toISOString()}`;

                    const rowInner = (
                      <>
                        {evento.imagen ? (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-[#333]">
                            <Image
                              src={evento.imagen}
                              alt=""
                              fill
                              className="object-cover object-top"
                              sizes="48px"
                            />
                            <div className="absolute bottom-0 left-0 right-0 py-0.5 bg-black/60 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white">{evento.fecha.getDate()}</span>
                            </div>
                          </div>
                        ) : (
                          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${style.bg}`}>
                            <span className={`text-lg font-bold leading-none ${style.text}`}>{evento.fecha.getDate()}</span>
                            <span className={`text-[9px] font-medium uppercase mt-0.5 ${style.text} opacity-80`}>
                              {MESES[evento.fecha.getMonth()].slice(0, 3)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className={`text-[10px] font-semibold uppercase tracking-wide ${style.text}`}>
                            {style.label}
                          </span>
                          <p className="text-sm font-medium text-[#18301d] dark:text-white truncate mt-0.5">{evento.titulo}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{evento.horaInicio}</p>
                        </div>
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.dot}`} title={style.label} />
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
    </div>
  );
}
