"use client";

import type { RegistroSeguimientoItem } from "../_lib/persona-detail-types";
import { formatUltimoContacto } from "../_lib/persona-detail-dates";

export function RachasCabeceraPersona({
  tieneGrupo,
  rachaAsistencia,
  ultimaAsistencia,
  rachaSeguimiento,
  registrosSeguimiento,
  variante = "cabecera",
}: {
  tieneGrupo: boolean;
  rachaAsistencia: number;
  ultimaAsistencia: string | null;
  rachaSeguimiento: number;
  registrosSeguimiento: RegistroSeguimientoItem[];
  /** `lateral`: columna estrecha. `header`: solo número + texto, sin marcos (ficha persona). */
  variante?: "cabecera" | "lateral" | "header";
}) {
  const ultimaSeguimientoIso = registrosSeguimiento[0]?.fecha ?? null;
  const semTxt = (n: number) => (n === 1 ? "1 sem." : `${n} sem.`);

  if (variante === "header") {
    const lineAsist = !tieneGrupo ? (
      <span className="text-gray-400 dark:text-gray-500">— Asistencia al grupo</span>
    ) : ultimaAsistencia === null ? (
      <>
        <span className="tabular-nums font-semibold text-gray-900 dark:text-white">0</span>
        <span className="text-gray-600 dark:text-gray-300"> sem. Asistencia al grupo</span>
      </>
    ) : (
      <>
        <span className="tabular-nums font-semibold text-gray-900 dark:text-white">{rachaAsistencia}</span>
        <span className="text-gray-600 dark:text-gray-300"> sem. Asistencia al grupo</span>
      </>
    );

    const lineSeg =
      registrosSeguimiento.length === 0 ? (
        <>
          <span className="tabular-nums font-semibold text-gray-900 dark:text-white">0</span>
          <span className="text-gray-600 dark:text-gray-300"> sem. Seguimiento pastoral</span>
        </>
      ) : (
        <>
          <span className="tabular-nums font-semibold text-gray-900 dark:text-white">{rachaSeguimiento}</span>
          <span className="text-gray-600 dark:text-gray-300"> sem. Seguimiento pastoral</span>
        </>
      );

    return (
      <div className="flex flex-col gap-0.5 text-xs leading-snug sm:text-right">
        <p className="text-gray-500 dark:text-gray-400">{lineAsist}</p>
        <p className="text-gray-500 dark:text-gray-400">{lineSeg}</p>
      </div>
    );
  }

  const lateral = variante === "lateral";
  const compact = lateral;
  const wrap = lateral ? "flex w-full flex-col gap-2" : "grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3";
  const card = compact
    ? "min-w-0 flex-1 rounded-xl border border-gray-200/50 bg-white/40 px-2.5 py-2 dark:border-white/[0.07] dark:bg-white/[0.03]"
    : "rounded-xl border border-gray-200/50 bg-white/40 px-3 py-2.5 dark:border-white/[0.07] dark:bg-white/[0.03]";
  const titulo = compact ? "text-[10px] font-medium text-gray-500 dark:text-gray-400" : "text-xs font-medium text-gray-500 dark:text-gray-400";
  const numAsist = compact ? "text-base font-semibold" : "text-lg font-semibold";
  const numSeg = compact ? "text-base font-semibold text-gray-900 dark:text-white" : "text-lg font-semibold text-[#0ca6b2]";
  const meta = compact ? "text-[10px]" : "text-xs";

  return (
    <div className={wrap}>
      <div className={card}>
        <p className={titulo}>Racha · asistencia al grupo</p>
        {!tieneGrupo ? (
          <p className={`mt-1 tabular-nums text-gray-400 dark:text-gray-500 ${compact ? "text-xs" : "mt-1.5 text-sm"}`}>—</p>
        ) : ultimaAsistencia === null ? (
          <p className={`mt-1 tabular-nums text-gray-400 dark:text-gray-500 ${compact ? "text-xs" : "mt-1.5 text-sm"}`}>0 sem.</p>
        ) : (
          <div className={`mt-1 flex flex-wrap items-baseline gap-1.5 ${compact ? "" : "mt-1.5 gap-2"}`}>
            <span className={`tabular-nums text-gray-900 dark:text-white ${numAsist}`}>{rachaAsistencia}</span>
            <span className={`text-gray-600 dark:text-gray-300 ${compact ? "text-xs" : "text-sm"}`}>{semTxt(rachaAsistencia)}</span>
            <span className={`min-w-0 truncate text-gray-400 dark:text-gray-500 ${meta}`}>
              · {formatUltimoContacto(ultimaAsistencia)}
            </span>
          </div>
        )}
      </div>

      <div className={card}>
        <p className={titulo}>Racha · seguimiento pastoral</p>
        {registrosSeguimiento.length === 0 ? (
          <p className={`mt-1 tabular-nums text-gray-400 dark:text-gray-500 ${compact ? "text-xs" : "mt-1.5 text-sm"}`}>0 sem.</p>
        ) : (
          <>
            <div className={`mt-1 flex flex-wrap items-baseline gap-1.5 ${compact ? "" : "mt-1.5 gap-2"}`}>
              <span className={`tabular-nums ${numSeg}`}>{rachaSeguimiento}</span>
              <span className={`text-gray-600 dark:text-gray-300 ${compact ? "text-xs" : "text-sm"}`}>{semTxt(rachaSeguimiento)}</span>
              {ultimaSeguimientoIso ? (
                <span className={`min-w-0 truncate text-gray-400 dark:text-gray-500 ${meta}`}>
                  · {formatUltimoContacto(ultimaSeguimientoIso)}
                </span>
              ) : null}
            </div>
            <a
              href="#registros-seguimiento"
              className={`mt-1 inline-block text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-white ${compact ? "text-[10px]" : "text-[11px] text-[#0ca6b2]"}`}
            >
              Historial
            </a>
          </>
        )}
      </div>
    </div>
  );
}
