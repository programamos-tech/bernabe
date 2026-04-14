"use client";

import {
  ETAPA_LABELS,
  type EtapaPersonaDb,
  etapaDotClass,
  etapaMapaLabelFuturoClass,
  etapaMapaLabelHechoClass,
  etapaMapaPasoActualOuterClass,
  etapaMapaPasoFuturoOuterClass,
  etapaMapaPasoHechoOuterClass,
  etapaStyles,
} from "@/lib/persona-etapa";
import type { ParticipacionEnGrupo } from "../_lib/persona-detail-participacion";
import { formatHistorialFecha } from "../_lib/persona-detail-dates";
import {
  etapaMostradaEnCamino,
  hitosCaminoPersona,
  indiceEtapaCamino,
  notaParticipacionSinFecha,
  pasosCaminoEtapas,
} from "../_lib/persona-camino-etapas";

/**
 * Utilidades teal/indigo usadas vía `@/lib/persona-etapa`; una cadena literal en este archivo asegura que el CSS de Tailwind las genere.
 */
const _TW_REF_MAPA_LIDER =
  "bg-teal-400/80 dark:bg-teal-400/55 bg-indigo-400/80 dark:bg-indigo-400/55 border-teal-400/95 bg-teal-400/12 shadow-teal-900/12 dark:border-teal-400/70 dark:bg-teal-400/18 border-indigo-400/90 bg-indigo-400/10 dark:border-indigo-400/60 dark:bg-indigo-400/12 border-teal-400/60 dark:border-teal-400/50 dark:bg-teal-400/14 border-indigo-400/60 dark:border-indigo-400/50 dark:bg-indigo-400/14 border-teal-400/45 bg-teal-50/40 dark:border-teal-400/38 dark:bg-teal-950/30 border-indigo-400/45 bg-indigo-50/40 dark:border-indigo-400/38 dark:bg-indigo-950/30 text-teal-900/90 dark:text-teal-100/90 text-indigo-900/90 dark:text-indigo-100/90 text-teal-700/80 dark:text-teal-200/55 text-indigo-700/80 dark:text-indigo-200/55 bg-teal-500/12 text-teal-900 dark:text-teal-200 bg-indigo-500/12 text-indigo-900 dark:text-indigo-200";

export function MapaCaminoEtapaPersona({
  etapaActual,
  fechaRegistroIso,
  fechaIngresoGrupoIso,
  fechaCaminoBautismoIso,
  fechaBautismoIso,
  bautizado,
  coLiderDesdeIso,
  participacionEnGrupo,
  grupoNombre,
}: {
  etapaActual: EtapaPersonaDb;
  fechaRegistroIso: string | null;
  fechaIngresoGrupoIso: string | null;
  fechaCaminoBautismoIso: string | null;
  fechaBautismoIso: string | null;
  bautizado: boolean | null;
  coLiderDesdeIso: string | null;
  participacionEnGrupo: ParticipacionEnGrupo | null;
  grupoNombre: string | null;
}) {
  const pasos = pasosCaminoEtapas();
  const n = pasos.length;
  const inactivo = etapaActual === "inactivo";
  const etapaCamino = etapaMostradaEnCamino(etapaActual, participacionEnGrupo);
  const idxCamino = indiceEtapaCamino(etapaCamino);
  const hitos = hitosCaminoPersona({
    fechaRegistroIso,
    fechaIngresoGrupoIso,
    fechaCaminoBautismoIso,
    fechaBautismoIso,
    bautizado,
    grupoNombre,
    coLiderDesdeIso,
  });
  const etiquetaEtapaBautismo =
    bautizado === true || Boolean(fechaBautismoIso?.trim()) ? "Bautizado" : ETAPA_LABELS.bautizado;
  const notaPart = notaParticipacionSinFecha(participacionEnGrupo);

  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white/50 px-4 py-4 dark:border-white/[0.08] dark:bg-white/[0.03] sm:px-5 sm:py-5">
      <span className={`pointer-events-none fixed left-0 top-0 -z-[1] h-px w-px overflow-hidden opacity-0 ${_TW_REF_MAPA_LIDER}`} aria-hidden />
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Camino de etapas</h2>

      {/* Una sola línea continua entre centro del 1.º y del último nodo; los círculos van encima (evita cortes entre columnas). */}
      <div className="mt-5 overflow-x-auto px-1 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="relative flex min-w-[min(100%,820px)] flex-col">
          <div className="relative flex h-10 w-full shrink-0 items-center">
            {n > 1 ? (
              <>
                <div
                  className="pointer-events-none absolute top-1/2 z-0 h-0.5 -translate-y-1/2 bg-gray-200 dark:bg-white/[0.08]"
                  style={{
                    left: `calc(100% / (2 * ${n}))`,
                    width: `calc(100% - 100% / ${n})`,
                  }}
                  aria-hidden
                />
                {!inactivo && idxCamino > 0 ? (
                  <div
                    className="pointer-events-none absolute top-1/2 z-[1] h-0.5 -translate-y-1/2 bg-gray-400/55 dark:bg-white/20"
                    style={{
                      left: `calc(100% / (2 * ${n}))`,
                      width: `calc((100% - 100% / ${n}) * ${idxCamino} / ${n - 1})`,
                    }}
                    aria-hidden
                  />
                ) : null}
              </>
            ) : null}
            {pasos.map((etapa, i) => {
              const hecho = inactivo || i < idxCamino;
              const actual = !inactivo && i === idxCamino;
              const outerClass = actual
                ? etapaMapaPasoActualOuterClass[etapa]
                : hecho
                  ? etapaMapaPasoHechoOuterClass[etapa]
                  : etapaMapaPasoFuturoOuterClass[etapa];
              return (
                <div key={etapa} className="relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center">
                  <div
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center"
                    aria-current={actual ? "step" : undefined}
                    aria-label={
                      actual
                        ? `Etapa actual: ${etapa === "bautizado" ? etiquetaEtapaBautismo : ETAPA_LABELS[etapa]}`
                        : undefined
                    }
                  >
                    {actual ? (
                      <span
                        aria-hidden
                        className={`absolute z-0 h-8 w-8 rounded-full motion-reduce:animate-none animate-mapa-etapa-actual-halo ${etapaDotClass[etapa]}`}
                      />
                    ) : null}
                    <div
                      className={`relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${outerClass} ${actual ? "ring-2 ring-white/80 ring-offset-2 ring-offset-white shadow-sm dark:ring-white/35 dark:ring-offset-[#0c0c0c]" : ""}`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${etapaDotClass[etapa]} ${actual ? "scale-110 shadow-md" : ""} ${hecho && !actual ? "opacity-90" : ""}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex w-full">
            {pasos.map((etapa, i) => {
              const hecho = inactivo || i < idxCamino;
              const actual = !inactivo && i === idxCamino;
              const labelClass = actual
                ? `rounded-full px-1.5 py-0.5 ${etapaStyles(etapa).badge}`
                : hecho
                  ? etapaMapaLabelHechoClass[etapa]
                  : etapaMapaLabelFuturoClass[etapa];
              return (
                <div key={`label-${etapa}`} className="flex min-w-0 flex-1 flex-col items-center">
                  <p
                    className={`mt-2 max-w-[5.25rem] text-center text-[10px] font-medium leading-tight sm:max-w-none sm:text-[11px] ${labelClass}`}
                  >
                    {etapa === "bautizado" ? etiquetaEtapaBautismo : ETAPA_LABELS[etapa]}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex w-full items-stretch">
            {pasos.map((etapa) => {
              const hitosAqui = hitos.filter((h) => h.etapaAncla === etapa);
              return (
                <div key={`hitos-${etapa}`} className="flex min-w-0 flex-1 flex-col items-center">
                  <div className="mt-2 w-full max-w-[6.5rem] flex-1 px-0.5 sm:max-w-none">
                    {hitosAqui.length > 0 ? (
                      <ul className="space-y-2 border-t border-gray-200/40 pt-2 text-left dark:border-white/[0.06]">
                        {hitosAqui.map((h) => (
                          <li key={`${h.iso}-${h.titulo}`}>
                            <p className="text-[9px] font-medium tabular-nums text-gray-500 dark:text-gray-400">
                              {formatHistorialFecha(h.iso)}
                            </p>
                            <p className="text-[10px] font-semibold leading-snug text-gray-800 dark:text-gray-200">{h.titulo}</p>
                            <p className="mt-0.5 text-[9px] leading-snug text-gray-500 dark:text-gray-400">{h.descripcion}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="min-h-[1rem]" aria-hidden />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {inactivo ? (
        <p className="mt-4 rounded-xl border border-gray-200/60 bg-gray-50/80 px-3 py-2 text-xs text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300">
          Estado <span className="font-semibold">{ETAPA_LABELS.inactivo}</span>: no sigue el camino activo.
        </p>
      ) : null}

      {!inactivo && hitos.length === 0 ? (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Aún no hay fechas en el registro para mostrar hitos (alta, grupo, camino al bautismo o co-liderazgo).
        </p>
      ) : null}

      {notaPart ? (
        <p className="mt-3 text-[11px] leading-snug text-gray-500 dark:text-gray-400">{notaPart}</p>
      ) : null}
    </div>
  );
}
