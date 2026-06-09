"use client";

import { useMemo } from "react";

export type SemanaAsistenciaChart = {
  label: string;
  rango: string;
  pct: number | null;
  esActual: boolean;
  esAnterior: boolean;
};

function colorPct(pct: number | null): string {
  if (pct === null) return "rgb(156 163 175)";
  if (pct < 40) return "rgb(244 63 94)";
  if (pct < 65) return "rgb(245 158 11)";
  return "rgb(16 185 129)";
}

export function HomeAsistenciaComparativa({
  semanas,
  loading,
}: {
  semanas: SemanaAsistenciaChart[];
  loading: boolean;
}) {
  const semActual = semanas.find((s) => s.esActual);
  const semAnterior = semanas.find((s) => s.esAnterior);

  const delta =
    semActual?.pct != null && semAnterior?.pct != null ? semActual.pct - semAnterior.pct : null;

  const chart = useMemo(() => {
    const W = 800;
    const H = 220;
    const pad = { t: 26, r: 6, b: 48, l: 28 };
    const innerW = W - pad.l - pad.r;
    const innerH = H - pad.t - pad.b;
    const n = semanas.length;
    const step = n > 1 ? innerW / (n - 1) : 0;

    const puntos = semanas.map((s, i) => {
      const x = pad.l + (n === 1 ? innerW / 2 : i * step);
      const y = s.pct === null ? pad.t + innerH : pad.t + innerH - (s.pct / 100) * innerH;
      return { x, y, ...s };
    });

    const linePath =
      puntos.filter((p) => p.pct !== null).length >= 2
        ? puntos
            .filter((p) => p.pct !== null)
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
            .join(" ")
        : null;

    const areaPath =
      linePath && puntos.filter((p) => p.pct !== null).length >= 2
        ? (() => {
            const valid = puntos.filter((p) => p.pct !== null);
            const baseY = pad.t + innerH;
            const first = valid[0];
            const last = valid[valid.length - 1];
            return `${linePath} L ${last.x.toFixed(1)} ${baseY} L ${first.x.toFixed(1)} ${baseY} Z`;
          })()
        : null;

    const gridLines = [0, 25, 50, 75, 100].map((pct) => {
      const y = pad.t + innerH - (pct / 100) * innerH;
      return { pct, y };
    });

    return { W, H, pad, innerH, puntos, linePath, areaPath, gridLines };
  }, [semanas]);

  const sinDatos = !loading && semanas.every((s) => s.pct === null);

  return (
    <div className="mt-4 border-t border-gray-200/60 pt-4 dark:border-white/[0.08]">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Asistencia en células</h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Comparativa semana a semana</p>
        </div>

        {!loading && semActual?.pct != null ? (
          <div className="flex flex-wrap items-end gap-4 sm:gap-6">
            {semAnterior?.pct != null ? (
              <div className="min-w-[4.75rem] px-1">
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Semana pasada
                </p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
                  {Math.round(semAnterior.pct)}%
                </p>
              </div>
            ) : null}
            <div className="min-w-[4.75rem] px-1">
              <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Esta semana
              </p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                {Math.round(semActual.pct)}%
              </p>
            </div>
            {delta !== null ? (
              <div
                className="min-w-[4.75rem] px-1"
                title="Puntos porcentuales: cuánto subió o bajó la asistencia respecto a la semana pasada"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Cambio
                </p>
                <p
                  className={`mt-0.5 text-xl font-semibold tabular-nums ${
                    delta > 0
                      ? "text-emerald-700 dark:text-emerald-300"
                      : delta < 0
                        ? "text-rose-700 dark:text-rose-300"
                        : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {delta > 0 ? "↑" : delta < 0 ? "↓" : "→"} {Math.abs(Math.round(delta))} pts
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="flex h-52 items-center justify-center rounded-2xl bg-white/40 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Calculando asistencia…</p>
        </div>
      ) : sinDatos ? (
        <div className="flex h-52 items-center justify-center rounded-2xl border border-dashed border-gray-200/80 bg-white/30 px-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aún no hay asistencia registrada. Regístrala desde cada grupo para ver la comparativa.
          </p>
        </div>
      ) : (
        <div className="-mx-2 rounded-2xl border border-gray-200/60 bg-white/50 py-2 dark:border-white/[0.08] dark:bg-white/[0.03] sm:-mx-3 sm:py-3">
          <svg
            viewBox={`0 0 ${chart.W} ${chart.H}`}
            className="block h-auto w-full max-h-[240px]"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Gráfica comparativa de asistencia semanal en células"
          >
            {chart.gridLines.map(({ pct, y }) => (
              <g key={pct}>
                <line
                  x1={chart.pad.l}
                  y1={y}
                  x2={chart.W - chart.pad.r}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.08}
                  className="text-gray-900 dark:text-white"
                />
                <text
                  x={chart.pad.l - 4}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-gray-400 text-[9px] dark:fill-gray-500"
                >
                  {pct}%
                </text>
              </g>
            ))}

            {chart.areaPath ? (
              <path d={chart.areaPath} fill="url(#asistenciaAreaGrad)" opacity={0.35} />
            ) : null}

            {chart.linePath ? (
              <path
                d={chart.linePath}
                fill="none"
                stroke="rgb(16 185 129)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="dark:stroke-emerald-400"
              />
            ) : null}

            {chart.puntos.map((p) => {
              const activo = p.esActual || p.esAnterior;
              const r = p.esActual ? 7 : p.esAnterior ? 6 : 4.5;
              const fill = p.esActual
                ? "rgb(16 185 129)"
                : p.esAnterior
                  ? "rgb(107 114 128)"
                  : colorPct(p.pct);
              return (
                <g key={p.label}>
                  {p.pct !== null ? (
                    <>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={activo ? r + 3 : r + 2}
                        fill={fill}
                        opacity={0.2}
                      />
                      <circle cx={p.x} cy={p.y} r={r} fill={fill} stroke="white" strokeWidth={2} className="dark:stroke-[#1a1a1a]" />
                      <text
                        x={p.x}
                        y={p.y - (activo ? 14 : 10)}
                        textAnchor="middle"
                        className={`fill-gray-800 text-[11px] font-semibold dark:fill-gray-100 ${p.esActual ? "text-[12px]" : ""}`}
                      >
                        {p.pct === null ? "" : `${Math.round(p.pct)}%`}
                      </text>
                    </>
                  ) : (
                    <circle cx={p.x} cy={chart.pad.t + chart.innerH} r={3} fill="rgb(156 163 175)" opacity={0.5} />
                  )}
                  <text
                    x={p.x}
                    y={chart.H - 18}
                    textAnchor="middle"
                    className={`fill-gray-500 text-[9px] dark:fill-gray-400 ${p.esActual ? "font-semibold fill-emerald-700 dark:fill-emerald-300" : ""}`}
                  >
                    {p.label}
                  </text>
                  <text
                    x={p.x}
                    y={chart.H - 6}
                    textAnchor="middle"
                    className="fill-gray-400 text-[8px] dark:fill-gray-500"
                  >
                    {p.rango}
                  </text>
                </g>
              );
            })}

            <defs>
              <linearGradient id="asistenciaAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
          </svg>

          <div className="mt-2 flex flex-wrap gap-4 border-t border-gray-200/50 px-3 pt-2 text-[11px] text-gray-500 dark:border-white/[0.06] dark:text-gray-400 sm:px-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Esta semana
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
              Semana pasada
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
              Semanas anteriores
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
