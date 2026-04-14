"use client";

import Link from "next/link";
import { GrupoAvatarCluster } from "@/components/GrupoAvatarCluster";
import { UserAvatar } from "@/components/UserAvatar";
import { tipoLabelGrupo } from "@/lib/grupo-tipo";

export type GrupoResumenCardModel = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  activo: boolean;
  miembros_count: number;
  lider_id: string | null;
  dia: string | null;
  hora: string | null;
  ubicacion: string | null;
};

type Props = {
  grupo: GrupoResumenCardModel;
  liderNombre: string | null;
  /** Miembros reales o `miembros_count` de respaldo */
  miembrosCount: number;
  /** Barra lateral (ficha persona): cabecera un poco más baja */
  compact?: boolean;
  /** Texto bajo la descripción, p. ej. rol de la persona en el grupo */
  rolEnGrupo?: string | null;
};

/**
 * Misma “cara” que las tarjetas del listado `/grupos`: badges, cluster, metadatos, líder, ubicación y enlace.
 */
export function GrupoResumenCard({
  grupo,
  liderNombre,
  miembrosCount,
  compact,
  rolEnGrupo,
}: Props) {
  return (
    <div className="group overflow-hidden rounded-3xl bg-gray-100/40 transition hover:bg-gray-100/55 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]">
      <div className="relative bg-gradient-to-b from-gray-100/80 to-gray-100/30 dark:from-white/[0.06] dark:to-white/[0.02]">
        <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2 sm:left-4 sm:top-4">
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
            {tipoLabelGrupo(grupo.tipo)}
          </span>
        </div>
        <div
          className={`flex items-end justify-center ${compact ? "h-[7rem] pb-4 pt-5" : "h-[8.5rem] pb-5 pt-6"}`}
        >
          <GrupoAvatarCluster
            nombreGrupo={grupo.nombre}
            sizeCenter={compact ? 72 : 84}
            sizeSide={compact ? 44 : 52}
          />
        </div>
      </div>

      <div className={`${compact ? "px-4 pb-4 pt-1 sm:px-5" : "px-5 pb-5 pt-1"}`}>
        <h3 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white sm:text-lg">{grupo.nombre}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
          {grupo.descripcion || "Sin descripción"}
        </p>
        {rolEnGrupo ? (
          <p className="mt-2 text-xs font-medium text-violet-600 dark:text-violet-400">{rolEnGrupo}</p>
        ) : null}

        <div className={`mt-4 flex flex-wrap items-center gap-4 ${compact ? "gap-3" : ""}`}>
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
              <p className="text-base font-semibold tabular-nums text-gray-900 dark:text-white">{miembrosCount}</p>
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
          <UserAvatar seed={liderNombre ?? `líder·${grupo.nombre}`} size={compact ? 36 : 40} />
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
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
