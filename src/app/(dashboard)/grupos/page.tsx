"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { GrupoAvatarCluster } from "@/components/GrupoAvatarCluster";
import { UserAvatar } from "@/components/UserAvatar";
import { createClient } from "@/lib/supabase/client";

type TipoGrupo = "parejas" | "jovenes" | "teens" | "hombres" | "mujeres" | "general";

interface GrupoRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  miembros_count: number;
  /** Conteo real desde personas (se rellena después de cargar) */
  miembrosReales?: number;
  lider_id: string | null;
  dia: string | null;
  hora: string | null;
  ubicacion: string | null;
  imagen: string | null;
  activo: boolean;
  /** Supabase puede devolver objeto o array según el join */
  lideres: { nombre: string } | { nombre: string }[] | null;
}

const FILTER_TIPOS: { value: TipoGrupo | "Todos"; label: string }[] = [
  { value: "Todos", label: "Todos" },
  { value: "parejas", label: "Parejas" },
  { value: "jovenes", label: "Jóvenes" },
  { value: "teens", label: "Teens" },
  { value: "hombres", label: "Hombres" },
  { value: "mujeres", label: "Mujeres" },
  { value: "general", label: "General" },
];

function tipoLabel(t: string): string {
  const f = FILTER_TIPOS.find((x) => x.value === t);
  return f?.label ?? t;
}

function liderNombreFromRow(grupo: GrupoRow): string | null {
  if (grupo.lideres == null) return null;
  return Array.isArray(grupo.lideres) ? grupo.lideres[0]?.nombre ?? null : grupo.lideres.nombre;
}

function GrupoCard({ grupo }: { grupo: GrupoRow }) {
  const liderNombre = liderNombreFromRow(grupo);

  return (
    <div className="group overflow-hidden rounded-3xl bg-gray-100/40 transition hover:bg-gray-100/55 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]">
      <div className="relative bg-gradient-to-b from-gray-100/80 to-gray-100/30 dark:from-white/[0.06] dark:to-white/[0.02]">
        <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              grupo.activo
                ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                : "bg-gray-500/10 text-gray-700 dark:text-gray-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                grupo.activo ? "bg-emerald-400/80 dark:bg-emerald-400/55" : "bg-gray-400 dark:bg-gray-500"
              }`}
            />
            {grupo.activo ? "Activo" : "Inactivo"}
          </span>
          <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-normal text-gray-600 shadow-sm shadow-black/[0.04] dark:bg-white/10 dark:text-gray-300 dark:shadow-none">
            {tipoLabel(grupo.tipo)}
          </span>
        </div>
        <div className="flex h-[8.5rem] items-end justify-center pb-5 pt-6">
          <GrupoAvatarCluster nombreGrupo={grupo.nombre} />
        </div>
      </div>

      <div className="px-5 pb-5 pt-1">
        <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">{grupo.nombre}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
          {grupo.descripcion || "Sin descripción"}
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <div>
              <p className="text-base font-semibold tabular-nums text-gray-900 dark:text-white">
                {grupo.miembrosReales ?? grupo.miembros_count}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Miembros</p>
            </div>
          </div>
          <div className="h-10 w-px bg-gray-200/80 dark:bg-white/10" />
          <div className="flex min-w-0 items-center gap-2">
            <svg
              className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{grupo.dia || "—"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{grupo.hora || "—"}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <UserAvatar seed={liderNombre ?? `líder·${grupo.nombre}`} size={40} />
          <div className="min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400">Líder</p>
            {grupo.lider_id ? (
              <Link
                href={`/lideres/${grupo.lider_id}`}
                className="text-sm font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
              >
                {liderNombre ?? "Sin asignar"}
              </Link>
            ) : (
              <p className="text-sm font-medium text-gray-900 dark:text-white">Sin asignar</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-200/60 pt-4 dark:border-white/10">
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="truncate" title={grupo.ubicacion || undefined}>
              {grupo.ubicacion || "Sin ubicación"}
            </span>
          </div>
          <Link
            href={`/grupos/${grupo.id}`}
            className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Ver grupo
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
  const [grupos, setGrupos] = useState<GrupoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<TipoGrupo | "Todos">("Todos");

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase
        .from("grupos")
        .select("id, nombre, descripcion, tipo, miembros_count, lider_id, dia, hora, ubicacion, imagen, activo, lideres(nombre)")
        .order("nombre"),
      supabase.from("personas").select("grupo_id").not("grupo_id", "is", null),
    ]).then(([gruposRes, personasRes]) => {
      if (gruposRes.error) {
        console.error(gruposRes.error);
        setGrupos([]);
        setLoading(false);
        return;
      }
      const lista = (gruposRes.data ?? []) as GrupoRow[];
      const personas = (personasRes.data ?? []) as { grupo_id: string }[];
      const conteoPorGrupo: Record<string, number> = {};
      for (const p of personas) {
        conteoPorGrupo[p.grupo_id] = (conteoPorGrupo[p.grupo_id] ?? 0) + 1;
      }
      setGrupos(
        lista.map((g) => ({
          ...g,
          miembrosReales: conteoPorGrupo[g.id] ?? 0,
        }))
      );
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let list = filterTipo === "Todos" ? grupos : grupos.filter((g) => g.tipo === filterTipo);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((g) => {
      const lider = liderNombreFromRow(g)?.toLowerCase() ?? "";
      const blob = [
        g.nombre,
        g.descripcion ?? "",
        g.ubicacion ?? "",
        g.dia ?? "",
        g.hora ?? "",
        tipoLabel(g.tipo),
        lider,
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [grupos, filterTipo, search]);

  return (
    <div className="w-full max-w-none min-h-[calc(100vh-4rem)] px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Grupos</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comunidades de conexión y crecimiento de la iglesia.
          </p>
        </div>
        <Link
          href="/grupos/nuevo"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-black/10 transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:shadow-none dark:hover:bg-gray-100 sm:w-auto"
        >
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo grupo
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
          <label htmlFor="grupos-buscar" className="sr-only">
            Buscar grupo
          </label>
          <input
            id="grupos-buscar"
            type="search"
            placeholder="Buscar grupo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="w-full rounded-full bg-gray-100/80 py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/40 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-white/15"
          />
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 overflow-x-auto overflow-y-hidden pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
          {FILTER_TIPOS.map(({ value, label }) => (
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
              {grupos.length === 0
                ? "Aún no hay grupos. Crea el primero desde el botón Nuevo grupo."
                : "Ningún grupo coincide con la búsqueda o el filtro."}
            </p>
          <Link
            href="/grupos/nuevo"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white"
          >
            Nuevo grupo
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((grupo) => (
            <GrupoCard key={grupo.id} grupo={grupo} />
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          ¿Necesitas crear más grupos?{" "}
          <Link href="/grupos/nuevo" className="font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white">
            Crear nuevo grupo
          </Link>
        </p>
      )}
    </div>
  );
}
