"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/UserAvatar";
import { soloDigitosDocumentoId } from "@/lib/documento-id";
import { createClient } from "@/lib/supabase/client";

type Estado = "Activo" | "Visitante" | "Inactivo" | "En seguimiento" | "En servicio";

interface PersonaRow {
  id: string;
  cedula: string | null;
  nombre: string;
  telefono: string | null;
  grupo_id: string | null;
  participacion_en_grupo?: string | null;
  estado: string;
  ultimo_contacto: string | null;
  /** Supabase puede devolver objeto o array según el join */
  grupos: { nombre: string } | { nombre: string }[] | null;
}

/** Puntos pastel por estado (lectura rápida sin recargar el UI). */
const estadoDotClass: Record<Estado, string> = {
  Activo: "bg-emerald-400/75 dark:bg-emerald-400/55",
  Visitante: "bg-amber-300/90 dark:bg-amber-300/65",
  "En seguimiento": "bg-sky-400/80 dark:bg-sky-400/55",
  "En servicio": "bg-violet-400/80 dark:bg-violet-400/55",
  Inactivo: "bg-gray-400/85 dark:bg-gray-500/65",
};

function dotClassForEstado(e: Estado): string {
  return estadoDotClass[e] ?? estadoDotClass.Activo;
}

const PAGE_SIZE = 20;

const FILTER_ESTADOS: { value: Estado | "Todos"; label: string }[] = [
  { value: "Todos", label: "Todos" },
  { value: "Activo", label: "Activos" },
  { value: "Visitante", label: "Visitantes" },
  { value: "En seguimiento", label: "En seguimiento" },
  { value: "Inactivo", label: "Inactivos" },
  { value: "En servicio", label: "En servicio" },
];

/** Si tiene grupo asignado no es visitante ni en seguimiento, se considera Activo (salvo Inactivo / En servicio). */
function nombreGrupoLabel(p: PersonaRow): string {
  const g = p.grupos;
  if (g == null) return "Sin asignar";
  return (Array.isArray(g) ? g[0]?.nombre : g.nombre) ?? "Sin asignar";
}

function displayEstado(p: PersonaRow): Estado {
  if (p.grupo_id) {
    if (p.estado === "En servicio" || p.estado === "Inactivo") return p.estado as Estado;
    if (p.estado === "Visitante" || p.estado === "En seguimiento") return "Activo";
    return p.estado as Estado;
  }
  return p.estado as Estado;
}

function PersonasPaginationBar({
  totalFiltered,
  pageSafe,
  totalPages,
  rangeFrom,
  rangeTo,
  onPrev,
  onNext,
}: {
  totalFiltered: number;
  pageSafe: number;
  totalPages: number;
  rangeFrom: number;
  rangeTo: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalFiltered === 0) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-8 pt-2">
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
        Mostrando <span className="font-medium text-gray-800 dark:text-gray-200">{rangeFrom}</span>
        {" — "}
        <span className="font-medium text-gray-800 dark:text-gray-200">{rangeTo}</span> de{" "}
        <span className="font-medium text-gray-800 dark:text-gray-200">{totalFiltered}</span>
      </p>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={pageSafe <= 1}
          className="px-4 py-2 text-sm font-medium rounded-full bg-gray-100/90 text-gray-700 dark:bg-white/[0.08] dark:text-gray-200 disabled:opacity-35 disabled:pointer-events-none hover:bg-gray-200/80 dark:hover:bg-white/[0.12] transition"
        >
          Anterior
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400 px-2 tabular-nums">
          Página {pageSafe} de {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={pageSafe >= totalPages}
          className="px-4 py-2 text-sm font-medium rounded-full bg-gray-100/90 text-gray-700 dark:bg-white/[0.08] dark:text-gray-200 disabled:opacity-35 disabled:pointer-events-none hover:bg-gray-200/80 dark:hover:bg-white/[0.12] transition"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const [personas, setPersonas] = useState<PersonaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState<Estado | "Todos">("Todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("personas")
      .select("id, cedula, nombre, telefono, grupo_id, participacion_en_grupo, estado, ultimo_contacto, grupos(nombre)")
      .order("nombre")
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          setPersonas([]);
        } else {
          setPersonas((data ?? []) as PersonaRow[]);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filterEstado, search]);

  const filtered = useMemo(() => {
    let list = personas;
    if (filterEstado !== "Todos") {
      list = list.filter((p) => displayEstado(p) === filterEstado);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const qDigits = soloDigitosDocumentoId(search.trim());
      list = list.filter((p) => {
        const nameOk = Boolean(p.nombre?.toLowerCase().includes(q));
        const phoneDigits = p.telefono?.replace(/\D/g, "") ?? "";
        const phoneOk = qDigits.length > 0 && phoneDigits.includes(qDigits);
        const docOk = qDigits.length > 0 && soloDigitosDocumentoId(p.cedula ?? "").includes(qDigits);
        return nameOk || phoneOk || docOk;
      });
    }
    return list;
  }, [personas, filterEstado, search]);

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageSafe = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE),
    [filtered, pageSafe]
  );

  const rangeFrom = totalFiltered === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(pageSafe * PAGE_SIZE, totalFiltered);

  const goPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const goNext = useCallback(() => setPage((p) => Math.min(totalPages, p + 1)), [totalPages]);

  const paginationProps = {
    totalFiltered,
    pageSafe,
    totalPages,
    rangeFrom,
    rangeTo,
    onPrev: goPrev,
    onNext: goNext,
  };

  return (
    <div className="w-full max-w-none px-4 py-8 md:px-6 lg:px-8 min-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Personas</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Miembros y visitantes de la iglesia.
            </p>
          </div>
          <Link
            href="/personas/nuevo"
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition sm:w-auto w-full shadow-sm shadow-black/10 dark:shadow-none"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nueva persona
          </Link>
        </div>

        {/* Buscador + filtro por estado */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:items-center">
          <div className="relative min-w-0 flex-1">
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Buscar persona..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              className="w-full rounded-full bg-gray-100/80 py-2.5 pl-11 pr-4 text-sm text-gray-900 dark:bg-white/[0.06] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/40 dark:focus:ring-white/15"
            />
          </div>
          <div className="relative w-full sm:w-52 md:w-56 shrink-0">
            <label htmlFor="personas-filtro-estado" className="sr-only">
              Filtrar por estado
            </label>
            <select
              id="personas-filtro-estado"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as Estado | "Todos")}
              className="w-full cursor-pointer appearance-none rounded-full bg-gray-100/80 py-2.5 pl-4 pr-10 text-sm text-gray-900 dark:bg-white/[0.06] dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300/40 dark:focus:ring-white/15"
            >
              {FILTER_ESTADOS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label === "Todos" ? "Todos los estados" : label}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="w-7 h-7 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl bg-gray-100/50 p-12 text-center dark:bg-white/[0.04]">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {personas.length === 0
                ? "Aún no hay personas registradas. Agrega la primera desde el botón Nueva persona."
                : "Ninguna persona coincide con el filtro o la búsqueda."}
            </p>
            <Link
              href="/personas/nuevo"
              className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-gray-900 dark:text-white hover:underline underline-offset-4"
            >
              Nueva persona
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {paginated.map((persona) => (
                <div key={persona.id} className="rounded-2xl bg-gray-100/60 p-4 dark:bg-white/[0.05]">
                  <div className="flex items-start gap-3">
                    <UserAvatar seed={persona.nombre} size={44} />
                    <div className="flex-1 min-w-0">
                      <Link href={`/personas/${persona.id}`} className="font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition">
                        {persona.nombre}
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{persona.telefono ?? "—"}</p>
                      {persona.cedula && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">ID: {persona.cedula}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-normal text-gray-600 dark:bg-white/10 dark:text-gray-400">
                          {nombreGrupoLabel(persona)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClassForEstado(displayEstado(persona))}`}
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">{displayEstado(persona)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-3">
                    <span className="text-xs text-gray-400">Contacto: {persona.ultimo_contacto ?? "—"}</span>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/personas/${persona.id}`}
                        className="rounded-full p-2 text-gray-400 transition hover:bg-white/80 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </Link>
                      {persona.telefono && (
                        <a
                          href={`https://wa.me/${persona.telefono.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full p-2 text-gray-400 transition hover:bg-white/80 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                          </svg>
                        </a>
                      )}
                      <button className="rounded-full p-2 text-gray-400 transition hover:bg-white/80 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <PersonasPaginationBar {...paginationProps} />
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400">
                      <th className="px-5 pb-2 pt-4 text-left text-xs font-medium uppercase tracking-wide">
                        Documento ID
                      </th>
                      <th className="px-5 pb-2 pt-4 text-left text-xs font-medium uppercase tracking-wide">
                        Persona
                      </th>
                      <th className="px-5 pb-2 pt-4 text-left text-xs font-medium uppercase tracking-wide">
                        Grupo
                      </th>
                      <th className="px-5 pb-2 pt-4 text-left text-xs font-medium uppercase tracking-wide">
                        Estado
                      </th>
                      <th className="whitespace-nowrap px-5 pb-2 pt-4 text-left text-xs font-medium uppercase tracking-wide">
                        Último contacto
                      </th>
                      <th className="whitespace-nowrap px-5 pb-2 pt-4 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((persona) => (
                      <tr
                        key={persona.id}
                        className="transition-colors hover:bg-white/60 dark:hover:bg-white/[0.06]"
                      >
                        <td className="px-5 py-3.5 font-mono tabular-nums text-gray-500 dark:text-gray-400">
                          {persona.cedula ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <Link href={`/personas/${persona.id}`} className="group flex items-center gap-3">
                            <UserAvatar seed={persona.nombre} size={36} />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition">
                                {persona.nombre}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400">
                                {persona.telefono ?? "—"}
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">{nombreGrupoLabel(persona)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClassForEstado(displayEstado(persona))}`}
                            />
                            <span className="text-gray-700 dark:text-gray-300">{displayEstado(persona)}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 tabular-nums text-gray-500 dark:text-gray-400">
                          {persona.ultimo_contacto ?? "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-0.5">
                            <Link
                              href={`/personas/${persona.id}`}
                              className="rounded-full p-1.5 text-gray-400 transition hover:bg-white/90 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
                              title="Ver perfil"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </Link>
                            {persona.telefono && (
                              <a
                                href={`https://wa.me/${persona.telefono.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full p-1.5 text-gray-400 transition hover:bg-white/90 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
                                title="WhatsApp"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                                </svg>
                              </a>
                            )}
                            <button
                              className="rounded-full p-1.5 text-gray-400 transition hover:bg-white/90 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
                              title="Más opciones"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-2 pb-3">
                <PersonasPaginationBar {...paginationProps} />
              </div>
            </div>
          </>
        )}
    </div>
  );
}
