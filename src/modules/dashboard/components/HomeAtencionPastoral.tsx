"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { HomeAtencionPastoralData } from "@/lib/home-atencion-pastoral";

function ListaVacia({ children }: { children: ReactNode }) {
  return <p className="px-1 py-4 text-sm text-gray-500 dark:text-gray-400">{children}</p>;
}

function ItemLink({
  href,
  title,
  subtitle,
  badge,
  badgeClass,
}: {
  href: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeClass?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start justify-between gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-white/60 dark:hover:bg-white/[0.06]"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      {badge ? (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClass ?? "bg-gray-500/10 text-gray-700 dark:text-gray-300"}`}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export function HomeAtencionPastoral({
  data,
  loading,
}: {
  data: HomeAtencionPastoralData | null;
  loading: boolean;
}) {
  const cumpleanos = data?.cumpleanos ?? [];
  const seguimientos = data?.seguimientos ?? [];

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <section className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
        <div className="border-b border-gray-200/60 px-4 py-3 dark:border-white/[0.08]">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Cumpleaños esta semana</h2>
        </div>
        <div className="p-2">
          {loading ? (
            <ListaVacia>Cargando…</ListaVacia>
          ) : cumpleanos.length > 0 ? (
            <ul className="divide-y divide-gray-200/50 dark:divide-white/[0.06]">
              {cumpleanos.map((c) => (
                <li key={c.id}>
                  <ItemLink
                    href={`/personas/${c.id}`}
                    title={c.nombre}
                    subtitle="Ver perfil"
                    badge={c.etiqueta}
                    badgeClass={
                      c.etiqueta.toLowerCase().includes("hoy")
                        ? "bg-rose-500/15 text-rose-900 dark:text-rose-200"
                        : "bg-rose-500/10 text-rose-800 dark:text-rose-300"
                    }
                  />
                </li>
              ))}
            </ul>
          ) : (
            <ListaVacia>No hay cumpleaños esta semana.</ListaVacia>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
        <div className="border-b border-gray-200/60 px-4 py-3 dark:border-white/[0.08]">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Seguimiento pendiente</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Sin contacto en más de 14 días</p>
        </div>
        <div className="p-2">
          {loading ? (
            <ListaVacia>Cargando…</ListaVacia>
          ) : seguimientos.length > 0 ? (
            <ul className="divide-y divide-gray-200/50 dark:divide-white/[0.06]">
              {seguimientos.map((p) => (
                <li key={p.id}>
                  <ItemLink href={`/personas/${p.id}`} title={p.nombre} subtitle={p.descripcion} />
                </li>
              ))}
            </ul>
          ) : (
            <ListaVacia>Todos tienen contacto reciente. ¡Buen trabajo!</ListaVacia>
          )}
        </div>
      </section>
    </div>
  );
}
