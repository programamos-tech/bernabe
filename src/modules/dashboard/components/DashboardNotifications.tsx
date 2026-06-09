"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  fetchDashboardNotifications,
  iconColorClassForNotificacionTipo,
  iconPathForNotificacionTipo,
  labelForNotificacionTipo,
  type DashboardNotificacion,
} from "@/lib/dashboard-notifications";

type DashboardNotificationsProps = {
  leaderFree: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DashboardNotifications({ leaderFree, open: openControlled, onOpenChange }: DashboardNotificationsProps) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openControlled ?? openInternal;
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<DashboardNotificacion[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const setPanelOpen = useCallback(
    (next: boolean) => {
      if (openControlled === undefined) setOpenInternal(next);
      onOpenChange?.(next);
    },
    [onOpenChange, openControlled],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDashboardNotifications(leaderFree);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [leaderFree]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    void load();
    const onPointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setPanelOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, load, setPanelOpen]);

  const count = items.length;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setPanelOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={count > 0 ? `Notificaciones (${count})` : "Notificaciones"}
        className="relative rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {count > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-semibold text-white dark:bg-white dark:text-gray-900">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="absolute right-0 top-full z-50 mt-1.5 flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-lg dark:border-white/10 dark:bg-[#1a1a1a]"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/10">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Notificaciones</h2>
            <Link
              href="/cuenta?tab=notificaciones"
              onClick={() => setPanelOpen(false)}
              className="text-xs font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            >
              Preferencias
            </Link>
          </div>

          <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No hay notificaciones por ahora</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setPanelOpen(false)}
                      className="flex gap-3 px-4 py-3 transition hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                    >
                      <svg
                        className={`mt-0.5 h-5 w-5 shrink-0 ${iconColorClassForNotificacionTipo(item.tipo)}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.75}
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d={iconPathForNotificacionTipo(item.tipo)} />
                      </svg>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.titulo}</span>
                          {item.timeLabel ? (
                            <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">{item.timeLabel}</span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{item.descripcion}</span>
                        <span className="mt-1 inline-block text-[11px] font-medium text-gray-400 dark:text-gray-500">
                          {labelForNotificacionTipo(item.tipo)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
