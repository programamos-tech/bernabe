"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/UserAvatar";
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

const estadoStyles: Record<Estado, string> = {
  Activo: "bg-green-500",
  Visitante: "bg-[#f9c70c]",
  "En seguimiento": "bg-[#0ca6b2]",
  "En servicio": "bg-violet-500",
  Inactivo: "bg-gray-300",
};

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

export default function Page() {
  const [personas, setPersonas] = useState<PersonaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState<Estado | "Todos">("Todos");
  const [search, setSearch] = useState("");

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

  const filtered = useMemo(() => {
    let list = personas;
    if (filterEstado !== "Todos") {
      list = list.filter((p) => displayEstado(p) === filterEstado);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(q) ||
          p.telefono?.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
          (p.cedula && p.cedula.replace(/\s/g, "").includes(q.replace(/\s/g, "")))
      );
    }
    return list;
  }, [personas, filterEstado, search]);

  return (
    <div className="px-4 py-8 md:px-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#18301d] dark:text-white">Personas</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Miembros y visitantes de la iglesia.
            </p>
          </div>
          <Link
            href="/personas/nuevo"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#e64b27] text-white font-semibold rounded-full hover:bg-[#d4421f] transition shadow-lg shadow-[#e64b27]/25 sm:w-auto w-full"
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

        {/* Search - Mobile */}
        <div className="relative mb-4 md:hidden">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar persona..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-full text-sm text-[#18301d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
          {FILTER_ESTADOS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilterEstado(value)}
              className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-full transition ${
                filterEstado === value
                  ? "bg-[#18301d] dark:bg-[#0ca6b2] text-white"
                  : "bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2a2a2a] hover:border-[#0ca6b2] hover:text-[#0ca6b2]"
              }`}
            >
              {label}
            </button>
          ))}
          <div className="hidden md:block flex-1" />
          <div className="relative hidden md:block">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar persona..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-full text-sm text-[#18301d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="w-8 h-8 animate-spin text-[#0ca6b2]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {personas.length === 0
                ? "Aún no hay personas registradas. Agrega la primera desde el botón Nueva persona."
                : "Ninguna persona coincide con el filtro o la búsqueda."}
            </p>
            <Link
              href="/personas/nuevo"
              className="inline-flex items-center gap-2 mt-4 text-[#0ca6b2] font-medium hover:underline"
            >
              Nueva persona
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((persona) => (
                <div key={persona.id} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar seed={persona.nombre} size={48} />
                    <div className="flex-1 min-w-0">
                      <Link href={`/personas/${persona.id}`} className="font-medium text-[#18301d] dark:text-white hover:text-[#0ca6b2] transition">
                        {persona.nombre}
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{persona.telefono ?? "—"}</p>
                      {persona.cedula && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">CC: {persona.cedula}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#333] text-gray-600 dark:text-gray-300">
                          {nombreGrupoLabel(persona)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${estadoStyles[displayEstado(persona)] ?? "bg-gray-400"}`} />
                          <span className="text-xs text-gray-500 dark:text-gray-400">{displayEstado(persona)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-[#2a2a2a]">
                    <span className="text-xs text-gray-400">Contacto: {persona.ultimo_contacto ?? "—"}</span>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/personas/${persona.id}`}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-[#18301d] dark:hover:text-white transition"
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
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-[#0ca6b2] transition"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                          </svg>
                        </a>
                      )}
                      <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-[#18301d] dark:hover:text-white transition">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#252525]">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cédula
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Persona
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Grupo
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        Último contacto
                      </th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                    {filtered.map((persona) => (
                      <tr key={persona.id} className="hover:bg-[#faddbf]/20 dark:hover:bg-[#252525] transition-colors">
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-sm">
                          {persona.cedula ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/personas/${persona.id}`} className="flex items-center gap-3 group">
                            <UserAvatar seed={persona.nombre} size={44} />
                            <div>
                              <div className="font-medium text-[#18301d] dark:text-white group-hover:text-[#0ca6b2] transition">
                                {persona.nombre}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {persona.telefono ?? "—"}
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{nombreGrupoLabel(persona)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${estadoStyles[displayEstado(persona)] ?? "bg-gray-400"}`}
                            />
                            <span className="text-gray-700 dark:text-gray-300">{displayEstado(persona)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {persona.ultimo_contacto ?? "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/personas/${persona.id}`}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-[#18301d] dark:hover:text-white transition"
                              title="Ver perfil"
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
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-[#0ca6b2] transition"
                                title="WhatsApp"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                                </svg>
                              </a>
                            )}
                            <button
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-[#18301d] dark:hover:text-white transition"
                              title="Más opciones"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
