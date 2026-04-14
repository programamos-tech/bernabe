"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { EventoAvatarCluster } from "@/components/EventoAvatarCluster";
import { UserAvatar } from "@/components/UserAvatar";
import { createClient } from "@/lib/supabase/client";

type TipoEvento = "reunion" | "grupo" | "clase" | "servicio" | "especial";

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const FILTER_OPTIONS: { value: TipoEvento | "Todos"; label: string }[] = [
  { value: "Todos", label: "Todos" },
  { value: "servicio", label: "Servicios" },
  { value: "reunion", label: "Reuniones" },
  { value: "grupo", label: "Grupos" },
  { value: "clase", label: "Clases" },
  { value: "especial", label: "Especiales" },
];

interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: TipoEvento;
  fecha: string;
  fechaFin: string | null;
  hora: string;
  ubicacion: string;
  imagen: string | null;
  asistentesEsperados?: number;
  responsable?: string;
  recurrente?: boolean;
}

function formatFechaDisplay(fecha: string | null, fechaFin: string | null, recurrente: boolean): string {
  if (!fecha) return "—";
  if (recurrente) {
    const d = new Date(fecha + "T12:00:00");
    if (Number.isNaN(d.getTime())) return fecha;
    const name = DIAS_SEMANA[d.getDay()].toLowerCase();
    const plural = name.endsWith("o") ? name + "s" : name;
    return `Todos los ${plural}`;
  }
  const start = new Date(fecha + "T12:00:00");
  if (Number.isNaN(start.getTime())) return fecha;
  const d = start.getDate();
  const m = MESES_SHORT[start.getMonth()];
  const y = start.getFullYear();
  const startStr = `${d} ${m} ${y}`;
  if (!fechaFin) return startStr;
  const end = new Date(fechaFin + "T12:00:00");
  if (Number.isNaN(end.getTime())) return startStr;
  const endStr = `${end.getDate()} ${MESES_SHORT[end.getMonth()]} ${end.getFullYear()}`;
  return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
}

/** Chips pastel (punto + fondo suave), legibles sobre el bloque superior claro/oscuro. */
const tipoEventoPill: Record<TipoEvento, { dot: string; badge: string; label: string }> = {
  servicio: {
    dot: "bg-orange-400/80 dark:bg-orange-300/70",
    badge: "bg-orange-500/10 text-orange-900 dark:text-orange-200",
    label: "Servicio",
  },
  reunion: {
    dot: "bg-sky-400/80 dark:bg-sky-300/70",
    badge: "bg-sky-500/10 text-sky-900 dark:text-sky-200",
    label: "Reunión",
  },
  grupo: {
    dot: "bg-emerald-400/80 dark:bg-emerald-300/70",
    badge: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
    label: "Grupo",
  },
  clase: {
    dot: "bg-violet-400/80 dark:bg-violet-300/70",
    badge: "bg-violet-500/12 text-violet-900 dark:text-violet-200",
    label: "Clase",
  },
  especial: {
    dot: "bg-amber-400/80 dark:bg-amber-300/70",
    badge: "bg-amber-400/15 text-amber-900 dark:text-amber-100",
    label: "Especial",
  },
};

function EventoCard({ evento }: { evento: Evento }) {
  const tipo = tipoEventoPill[evento.tipo];
  return (
    <div className="group overflow-hidden rounded-3xl bg-gray-100/40 transition hover:bg-gray-100/55 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]">
      <div className="relative flex min-h-[12rem] flex-col overflow-hidden bg-gradient-to-b from-gray-100/90 to-gray-100/45 dark:from-white/[0.08] dark:to-white/[0.03]">
        <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm shadow-black/[0.04] dark:shadow-none ${tipo.badge}`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tipo.dot}`} />
            {tipo.label}
          </span>
          {evento.recurrente ? (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm shadow-black/[0.04] dark:bg-white/10 dark:text-gray-200 dark:shadow-none">
              Recurrente
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-2 pt-10">
          <EventoAvatarCluster titulo={evento.titulo} eventoId={evento.id} sizeCenter={84} sizeSide={54} />
        </div>

        <div className="px-5 pb-4 pt-0">
          <h3 className="text-center text-lg font-semibold tracking-tight text-gray-900 dark:text-white md:text-xl">
            {evento.titulo}
          </h3>
          <p className="mt-1 line-clamp-2 text-center text-sm text-gray-600 dark:text-gray-400">{evento.descripcion}</p>
        </div>
      </div>

      <div className="px-5 pb-5 pt-4">
        <div className="mb-3 flex items-center gap-2">
          <svg className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatFechaDisplay(evento.fecha, evento.fechaFin, evento.recurrente ?? false)}
          </span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-400">{evento.hora}</span>
          </div>
          {evento.asistentesEsperados ? (
            <>
              <div className="hidden h-4 w-px bg-gray-200/80 sm:block dark:bg-white/10" />
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">{evento.asistentesEsperados} esperados</span>
              </div>
            </>
          ) : null}
        </div>

        {evento.responsable ? (
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gray-100/70 px-3 py-2.5 dark:bg-white/[0.06]">
            <UserAvatar seed={evento.responsable} size={40} />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Responsable</p>
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{evento.responsable}</p>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-gray-200/60 pt-4 dark:border-white/10">
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="truncate">{evento.ubicacion || "—"}</span>
          </div>
          <Link
            href={`/eventos/${evento.id}`}
            className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Ver detalles
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<TipoEvento | "Todos">("Todos");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("eventos")
      .select("id, titulo, descripcion, tipo, fecha, fecha_fin, hora, ubicacion, imagen, asistentes_esperados, responsable, recurrente")
      .order("titulo")
      .then(({ data, error }) => {
        if (error) {
          setEventos([]);
        } else {
          setEventos(
            (data ?? []).map((row) => ({
              id: row.id,
              titulo: row.titulo ?? "",
              descripcion: row.descripcion ?? "",
              tipo: (row.tipo as TipoEvento) ?? "reunion",
              fecha: row.fecha ?? "",
              fechaFin: row.fecha_fin ?? null,
              hora: row.hora ?? "—",
              ubicacion: row.ubicacion ?? "",
              imagen: row.imagen ?? null,
              asistentesEsperados: row.asistentes_esperados ?? undefined,
              responsable: row.responsable ?? undefined,
              recurrente: row.recurrente ?? false,
            }))
          );
        }
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return eventos.filter((e) => {
      if (filterTipo !== "Todos" && e.tipo !== filterTipo) return false;
      if (!q) return true;
      const blob = `${e.titulo} ${e.descripcion} ${e.ubicacion}`.toLowerCase();
      return blob.includes(q);
    });
  }, [eventos, filterTipo, search]);

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-medium text-[#18301d] dark:text-white font-logo-soft tracking-tight">Eventos</h1>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-snug">
            Todos los eventos y actividades de nuestra iglesia.
          </p>
        </div>
        <Link
          href="/eventos/nuevo"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-black/10 transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:shadow-none dark:hover:bg-gray-100 sm:w-auto sm:flex-shrink-0"
        >
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo evento
        </Link>
      </div>

      <div className="mb-6 flex min-w-0 flex-row flex-nowrap items-center gap-3">
        <div className="relative min-w-0 min-w-[8rem] flex-1">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <label htmlFor="eventos-buscar" className="sr-only">
            Buscar evento
          </label>
          <input
            id="eventos-buscar"
            type="search"
            placeholder="Buscar evento…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="w-full rounded-full bg-gray-100/80 py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/40 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-white/15"
          />
        </div>
        <div className="scrollbar-brand flex shrink-0 items-center justify-end gap-2 overflow-x-auto overflow-y-hidden pb-0.5 [-webkit-overflow-scrolling:touch]">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilterTipo(value)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                filterTipo === value
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-gray-100/90 text-gray-700 hover:bg-gray-200/80 dark:bg-white/[0.08] dark:text-gray-200 dark:hover:bg-white/[0.12]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="h-7 w-7 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-gray-100/50 p-12 text-center dark:bg-white/[0.04]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {eventos.length === 0
              ? "Aún no hay eventos. Crea el primero con Nuevo evento."
              : "Ningún evento coincide con la búsqueda o el filtro."}
          </p>
          <Link
            href="/eventos/nuevo"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white"
          >
            Crear nuevo evento
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((evento) => (
            <EventoCard key={evento.id} evento={evento} />
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 ? (
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          ¿Planeas un nuevo evento?{" "}
          <Link href="/eventos/nuevo" className="font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white">
            Crear nuevo evento
          </Link>
        </p>
      ) : null}
    </div>
  );
}
