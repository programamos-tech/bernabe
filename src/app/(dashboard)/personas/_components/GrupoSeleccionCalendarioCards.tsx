"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { GrupoAvatarCluster } from "@/components/GrupoAvatarCluster";

/** Mismas clases que `tipoEventoStyles.grupo` en calendario (badge “Grupo”). */
const GRUPO_BADGE_PILL =
  "bg-emerald-500/10 text-emerald-900 shadow-sm shadow-black/[0.04] dark:text-emerald-200 dark:shadow-none";
const GRUPO_BADGE_DOT = "bg-emerald-400/90 dark:bg-emerald-300/75";

export function GrupoSelectableCard({
  selected,
  onSelect,
  children,
  className = "",
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={() => onSelect()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative cursor-pointer overflow-hidden rounded-2xl border text-left transition outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-neutral-400 dark:focus-visible:ring-offset-[#0c0c0c] ${
        selected
          ? "border-neutral-400 shadow-[0_0_0_1px_rgba(115,115,115,0.45)] dark:border-neutral-500 dark:bg-white/[0.06] dark:shadow-[0_0_0_1px_rgba(163,163,163,0.35)]"
          : "border-gray-200/50 bg-gray-100/40 dark:border-white/10 dark:bg-white/[0.04] hover:border-gray-300/90 hover:bg-gray-100/55 dark:hover:bg-white/[0.07]"
      } ${className}`}
    >
      {selected ? (
        <span className="absolute right-2 top-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-600 text-white shadow-md dark:bg-neutral-500">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      ) : null}
      {children}
    </div>
  );
}

/** Misma estructura visual que la tarjeta de grupo en `calendario/page.tsx` (`EventoBadge`). */
export function GrupoCalendarioStyleCard({
  nombre,
  horaLinea,
  ubicacionLinea,
  grupoId,
}: {
  nombre: string;
  horaLinea: string;
  ubicacionLinea: string;
  grupoId: string;
}) {
  return (
    <>
      <div className="relative flex h-28 items-center justify-center bg-gradient-to-b from-gray-100/90 to-gray-100/45 dark:from-white/[0.08] dark:to-white/[0.03]">
        <div
          className={`absolute left-2 top-2 z-10 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${GRUPO_BADGE_PILL}`}
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${GRUPO_BADGE_DOT}`} />
          Grupo
        </div>
        <GrupoAvatarCluster nombreGrupo={nombre} sizeCenter={56} sizeSide={36} />
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{nombre}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{horaLinea}</p>
        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400" title={ubicacionLinea}>
          {ubicacionLinea}
        </p>
        <Link
          href={`/grupos/${grupoId}`}
          prefetch={false}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 mt-2 inline-block text-xs font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          Ver grupo →
        </Link>
      </div>
    </>
  );
}
