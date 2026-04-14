"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { GrupoResumenCard } from "@/components/GrupoResumenCard";
import { createClient } from "@/lib/supabase/client";
import { tipoLabelGrupo } from "@/lib/grupo-tipo";

type TipoGrupo = "parejas" | "jovenes" | "teens" | "hombres" | "mujeres" | "general";

interface GrupoRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  miembros_count: number;
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

function liderNombreFromRow(grupo: GrupoRow): string | null {
  if (grupo.lideres == null) return null;
  return Array.isArray(grupo.lideres) ? grupo.lideres[0]?.nombre ?? null : grupo.lideres.nombre;
}

function GrupoCard({ grupo }: { grupo: GrupoRow }) {
  const liderNombre = liderNombreFromRow(grupo);
  return (
    <GrupoResumenCard
      grupo={{
        id: grupo.id,
        nombre: grupo.nombre,
        descripcion: grupo.descripcion,
        tipo: grupo.tipo,
        activo: grupo.activo,
        miembros_count: grupo.miembros_count,
        lider_id: grupo.lider_id,
        dia: grupo.dia,
        hora: grupo.hora,
        ubicacion: grupo.ubicacion,
      }}
      liderNombre={liderNombre}
      miembrosCount={grupo.miembros_count}
    />
  );
}

export default function Page() {
  const [grupos, setGrupos] = useState<GrupoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<TipoGrupo | "Todos">("Todos");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("grupos")
      .select("id, nombre, descripcion, tipo, miembros_count, lider_id, dia, hora, ubicacion, imagen, activo, lideres(nombre)")
      .order("nombre")
      .then((gruposRes) => {
      if (gruposRes.error) {
        console.error(gruposRes.error);
        setGrupos([]);
        setLoading(false);
        return;
      }
      setGrupos((gruposRes.data ?? []) as GrupoRow[]);
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
        tipoLabelGrupo(g.tipo),
        lider,
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [grupos, filterTipo, search]);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-medium text-[#18301d] dark:text-white font-logo-soft tracking-tight">Grupos</h1>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-snug">
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
