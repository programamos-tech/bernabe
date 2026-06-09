"use client";

import { useEffect, useState } from "react";

type VersiculoResponse = {
  reference: string;
  content: string;
  copyright: string | null;
  passageId: string;
  version: string;
  versionTitle: string;
  usedFallback: boolean;
  url: string;
};

export function HomeVersiculoDelDia() {
  const [versiculo, setVersiculo] = useState<VersiculoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/versiculo-del-dia");
        const data = (await res.json()) as VersiculoResponse & { error?: string; configured?: boolean };
        if (!res.ok) {
          throw new Error(data.error ?? "No se pudo cargar el versículo");
        }
        if (alive) setVersiculo(data);
      } catch (e) {
        if (alive) {
          setVersiculo(null);
          setError(e instanceof Error ? e.message : "Error desconocido");
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="border-t border-gray-200/60 px-3 pb-3 pt-4 dark:border-white/[0.08] sm:px-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Versículo del día
        </h3>
        <span
          className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:text-amber-200"
          title={versiculo?.versionTitle ?? "Nueva Traducción Viviente"}
        >
          {loading ? "NTV" : (versiculo?.version ?? "…")}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2 py-1">
          <div className="h-3 w-full animate-pulse rounded bg-gray-200/70 dark:bg-white/10" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-gray-200/70 dark:bg-white/10" />
          <div className="h-2.5 w-1/3 animate-pulse rounded bg-gray-200/60 dark:bg-white/[0.06]" />
        </div>
      ) : versiculo ? (
        <blockquote className="space-y-2">
          <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-100">
            &ldquo;{versiculo.content}&rdquo;
          </p>
          <footer className="space-y-1">
            <cite className="not-italic">
              <a
                href={versiculo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300"
              >
                {versiculo.reference}
              </a>
            </cite>
            {versiculo.copyright ? (
              <p className="text-[10px] leading-snug text-gray-400 dark:text-gray-500">{versiculo.copyright}</p>
            ) : null}
          </footer>
        </blockquote>
      ) : (
        <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {error?.includes("YVP_APP_KEY")
            ? "Agrega YVP_APP_KEY en .env.local (App Key gratis en platform.youversion.com)."
            : (error ?? "Versículo no disponible por ahora.")}
        </p>
      )}
    </div>
  );
}
