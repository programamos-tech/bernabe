"use client";

import {
  ETAPA_LABELS,
  type EtapaPersonaDb,
  etapaDotClass,
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

export function MapaCaminoEtapaPersona({
  etapaActual,
  fechaRegistroIso,
  fechaIngresoGrupoIso,
  coLiderDesdeIso,
  participacionEnGrupo,
  grupoNombre,
}: {
  etapaActual: EtapaPersonaDb;
  fechaRegistroIso: string | null;
  fechaIngresoGrupoIso: string | null;
  coLiderDesdeIso: string | null;
  participacionEnGrupo: ParticipacionEnGrupo | null;
  grupoNombre: string | null;
}) {
  const pasos = pasosCaminoEtapas();
  const inactivo = etapaActual === "inactivo";
  const etapaCamino = etapaMostradaEnCamino(etapaActual, participacionEnGrupo);
  const idxCamino = indiceEtapaCamino(etapaCamino);
  const hitos = hitosCaminoPersona({
    fechaRegistroIso,
    fechaIngresoGrupoIso,
    grupoNombre,
    coLiderDesdeIso,
  });
  const notaPart = notaParticipacionSinFecha(participacionEnGrupo);

  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white/50 px-4 py-4 dark:border-white/[0.08] dark:bg-white/[0.03] sm:px-5 sm:py-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Camino de etapas</h2>
        <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
          Etapa hoy: <span className="font-medium text-gray-800 dark:text-gray-200">{ETAPA_LABELS[etapaCamino]}</span>
        </p>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
        Progreso en el discipulado. Las fechas de registro, ingreso al grupo y co-liderazgo aparecen bajo la etapa que les
        corresponde.
      </p>

      {/* Stepper: cada etapa flex-1 con línea izq./der. alineada al círculo; hitos bajo la etiqueta */}
      <div className="mt-5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-[min(100%,820px)] items-stretch">
          {pasos.map((etapa, i) => {
            const hecho = inactivo || i < idxCamino;
            const actual = !inactivo && i === idxCamino;
            const lineaIzq = i > 0 && (inactivo || idxCamino >= i);
            const lineaDer = i < pasos.length - 1 && (inactivo || idxCamino > i);
            const hitosAqui = hitos.filter((h) => h.etapaAncla === etapa);
            return (
              <div key={etapa} className="flex min-w-0 flex-1 flex-col items-center">
                <div className="flex h-8 w-full items-center">
                  <div
                    className={`h-0.5 min-w-0 flex-1 rounded-full ${lineaIzq ? "bg-gray-400/55 dark:bg-white/20" : "bg-transparent"}`}
                    aria-hidden
                  />
                  <div
                    className={`mx-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      actual
                        ? "border-gray-900 bg-gray-900 shadow-md dark:border-white dark:bg-white"
                        : hecho
                          ? "border-gray-400/80 bg-gray-100 dark:border-white/25 dark:bg-white/[0.12]"
                          : "border-gray-200 bg-white dark:border-white/[0.12] dark:bg-[#1a1a1a]"
                    }`}
                    aria-current={actual ? "step" : undefined}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${actual ? "bg-white dark:bg-gray-900" : etapaDotClass[etapa]} ${hecho && !actual ? "opacity-90" : ""}`}
                    />
                  </div>
                  <div
                    className={`h-0.5 min-w-0 flex-1 rounded-full ${lineaDer ? "bg-gray-400/55 dark:bg-white/20" : "bg-gray-200 dark:bg-white/[0.08]"}`}
                    aria-hidden
                  />
                </div>
                <p
                  className={`mt-2 max-w-[5.25rem] text-center text-[10px] font-medium leading-tight sm:max-w-none sm:text-[11px] ${
                    actual
                      ? "text-gray-900 dark:text-white"
                      : hecho
                        ? "text-gray-600 dark:text-gray-300"
                        : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {ETAPA_LABELS[etapa]}
                </p>
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

      {inactivo ? (
        <p className="mt-4 rounded-xl border border-gray-200/60 bg-gray-50/80 px-3 py-2 text-xs text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-300">
          Estado <span className="font-semibold">{ETAPA_LABELS.inactivo}</span>: no sigue el camino activo.
        </p>
      ) : null}

      {!inactivo && hitos.length === 0 ? (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Aún no hay fechas en el registro para mostrar hitos (alta, grupo o co-liderazgo).
        </p>
      ) : null}

      {notaPart ? (
        <p className="mt-3 text-[11px] leading-snug text-gray-500 dark:text-gray-400">{notaPart}</p>
      ) : null}
    </div>
  );
}
