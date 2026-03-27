"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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

const tipoColors: Record<TipoGrupo, string> = {
  parejas: "bg-pink-500",
  jovenes: "bg-[#e64b27]",
  teens: "bg-purple-500",
  hombres: "bg-[#18301d] dark:bg-[#0ca6b2]",
  mujeres: "bg-[#0ca6b2]",
  general: "bg-gray-500",
};

const FILTER_TIPOS: { value: TipoGrupo | "Todos"; label: string }[] = [
  { value: "Todos", label: "Todos" },
  { value: "parejas", label: "Parejas" },
  { value: "jovenes", label: "Jóvenes" },
  { value: "teens", label: "Teens" },
  { value: "hombres", label: "Hombres" },
  { value: "mujeres", label: "Mujeres" },
  { value: "general", label: "General" },
];

function GrupoCard({ grupo }: { grupo: GrupoRow }) {
  const tipo = (grupo.tipo as TipoGrupo) || "general";
  const colorClass = tipoColors[tipo] ?? tipoColors.general;
  const liderNombre =
    grupo.lideres == null
      ? null
      : Array.isArray(grupo.lideres)
        ? grupo.lideres[0]?.nombre ?? null
        : grupo.lideres.nombre;

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden hover:shadow-xl dark:hover:shadow-[#0ca6b2]/10 transition-shadow group">
      {/* Image or gradient */}
      <div className="relative h-48 overflow-hidden">
        {grupo.imagen ? (
          <Image
            src={grupo.imagen}
            alt={grupo.nombre}
            fill
            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`absolute inset-0 ${colorClass} opacity-80`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${colorClass}`}>
            {grupo.activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white">{grupo.nombre}</h3>
          <p className="text-white/80 text-sm mt-1 line-clamp-1">
            {grupo.descripcion || "Sin descripción"}
          </p>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#0ca6b2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div>
              <p className="text-lg font-bold text-[#18301d] dark:text-white">{grupo.miembrosReales ?? grupo.miembros_count}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Miembros</p>
            </div>
          </div>
          <div className="h-10 w-px bg-gray-100 dark:bg-[#2a2a2a]" />
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#f9c70c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-[#18301d] dark:text-white">{grupo.dia || "—"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{grupo.hora || "—"}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <UserAvatar seed={liderNombre ?? grupo.nombre} size={40} />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Líder</p>
            {grupo.lider_id ? (
              <Link href={`/lideres/${grupo.lider_id}`} className="text-sm font-medium text-[#18301d] dark:text-white hover:text-[#0ca6b2] transition">
                {liderNombre ?? "Sin asignar"}
              </Link>
            ) : (
              <p className="text-sm font-medium text-[#18301d] dark:text-white">
                Sin asignar
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-[#2a2a2a]">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 min-w-0 flex-1">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="truncate" title={grupo.ubicacion || undefined}>
              {grupo.ubicacion || "Sin ubicación"}
            </span>
          </div>
          <Link
            href={`/grupos/${grupo.id}`}
            className="flex items-center gap-1 text-sm font-medium text-[#0ca6b2] hover:text-[#0a8f99] transition flex-shrink-0 whitespace-nowrap"
          >
            Ver grupo
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
    if (filterTipo === "Todos") return grupos;
    return grupos.filter((g) => g.tipo === filterTipo);
  }, [grupos, filterTipo]);

  return (
    <div className="px-4 py-8 md:px-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#18301d] dark:text-white">Grupos</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Comunidades de conexión y crecimiento de la iglesia.
            </p>
          </div>
          <Link
            href="/grupos/nuevo"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0ca6b2] text-white font-semibold rounded-full hover:bg-[#0a8f99] transition shadow-lg shadow-[#0ca6b2]/25 w-full sm:w-auto flex-shrink-0 whitespace-nowrap"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo grupo
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {FILTER_TIPOS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilterTipo(value)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                filterTipo === value
                  ? "bg-[#18301d] dark:bg-[#0ca6b2] text-white"
                  : "bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2a2a2a] hover:border-[#0ca6b2] hover:text-[#0ca6b2]"
              }`}
            >
              {label}
            </button>
          ))}
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
              {grupos.length === 0
                ? "Aún no hay grupos. Crea el primero desde el botón Nuevo grupo."
                : "Ningún grupo coincide con el filtro."}
            </p>
            <Link href="/grupos/nuevo" className="inline-flex items-center gap-2 mt-4 text-[#0ca6b2] font-medium hover:underline">
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
          <div className="mt-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              ¿Necesitas crear más grupos?{" "}
              <Link href="/grupos/nuevo" className="text-[#0ca6b2] font-medium hover:underline">
                Crear nuevo grupo
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
