"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ETAPA_LABELS, type EtapaPersonaDb } from "@/lib/persona-etapa";
import {
  labelSituacionAcercamiento,
  SITUACION_ACERCAMIENTO_OPTIONS,
} from "@/lib/personas-situacion-acercamiento";
import {
  BTN_FICHA_PRIMARIO_FLEX,
  BTN_FICHA_SECUNDARIO_FLEX,
} from "../[id]/_lib/persona-detail-buttons";
import { labelParticipacionEnGrupo } from "../[id]/_lib/persona-detail-participacion";

const MODAL_FIELD_CLASS =
  "w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-300/50 dark:border-white/10 dark:bg-[#252525] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-white/20";

const MODAL_SELECT_CLASS = `${MODAL_FIELD_CLASS} cursor-pointer appearance-none pr-8 dark:[color-scheme:dark]`;

const MODAL_TEXTAREA_CLASS = `${MODAL_FIELD_CLASS} min-h-[4.5rem] resize-y`;

const MODAL_READONLY_CLASS =
  "min-h-[2.75rem] w-full rounded-xl border border-gray-200/60 bg-gray-50/80 px-3 py-2.5 text-sm text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-400";

function ModalField({ label, children, multiline }: { label: string; children: ReactNode; multiline?: boolean }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
      <div className={multiline ? "min-w-0 [&_textarea]:whitespace-pre-wrap" : "min-w-0"}>{children}</div>
    </div>
  );
}

export type ProcesoEspiritualRegistroState = {
  etapaAlRegistrar: EtapaPersonaDb;
  grupoNombre: string;
  grupoRadio: string;
  bautizadoTri: "" | "true" | "false";
  situacion: string;
  vieneDeOtraIglesia: "" | "true" | "false";
  nombreIglesiaAnterior: string;
};

export type ProcesoEspiritualRegistroSetters = {
  setBautizadoTri: (v: "" | "true" | "false") => void;
  setSituacion: (v: string) => void;
  setVieneDeOtraIglesia: (v: "" | "true" | "false") => void;
  setNombreIglesiaAnterior: (v: string) => void;
};

export function ProcesoEspiritualRegistroModal({
  isOpen,
  onClose,
  values,
  setters,
}: {
  isOpen: boolean;
  onClose: () => void;
  values: ProcesoEspiritualRegistroState;
  setters: ProcesoEspiritualRegistroSetters;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 min-h-[100dvh] w-full bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="relative z-[1] flex max-h-[min(92dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-[#2a2a2a] dark:bg-[#1a1a1a]"
        role="dialog"
        aria-labelledby="proceso-espiritual-registro-title"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-[#2a2a2a]">
          <div className="min-w-0">
            <h2 id="proceso-espiritual-registro-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Etapa del proceso y camino espiritual
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Bautismo y cómo llegó a la iglesia. La etapa se ajusta según el grupo que elijas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#252525] dark:hover:text-white"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Proceso en la iglesia</h3>
              <ModalField label="Etapa">
                <p className={MODAL_READONLY_CLASS}>{ETAPA_LABELS[values.etapaAlRegistrar]}</p>
              </ModalField>
              <ModalField label="Rol">
                <p className={MODAL_READONLY_CLASS}>Miembro</p>
              </ModalField>
              <ModalField label="Grupo">
                <p className={MODAL_READONLY_CLASS}>{values.grupoNombre}</p>
              </ModalField>
              {values.grupoRadio ? (
                <ModalField label="En el grupo">
                  <p className={MODAL_READONLY_CLASS}>{labelParticipacionEnGrupo("miembro", values.grupoRadio)}</p>
                </ModalField>
              ) : null}
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Fe y llegada</h3>
              <ModalField label="Bautismo">
                <select
                  name="bautizado"
                  value={values.bautizadoTri}
                  onChange={(e) => setters.setBautizadoTri(e.target.value as "" | "true" | "false")}
                  className={MODAL_SELECT_CLASS}
                  aria-label="¿Está bautizado?"
                >
                  <option value="">Sin registrar</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </ModalField>
              <ModalField label="Acercamiento">
                <select
                  name="situacionAcercamiento"
                  value={values.situacion}
                  onChange={(e) => setters.setSituacion(e.target.value)}
                  className={MODAL_SELECT_CLASS}
                  aria-label="Situación de acercamiento"
                >
                  <option value="">Sin registrar</option>
                  {SITUACION_ACERCAMIENTO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </ModalField>
              <ModalField label="¿Viene de otra iglesia?">
                <select
                  name="vieneDeOtraIglesia"
                  value={values.vieneDeOtraIglesia}
                  onChange={(e) => setters.setVieneDeOtraIglesia(e.target.value as "" | "true" | "false")}
                  className={MODAL_SELECT_CLASS}
                  aria-label="¿Viene de otra iglesia?"
                >
                  <option value="">Sin registrar</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </ModalField>
              {values.vieneDeOtraIglesia === "true" ? (
                <ModalField label="Congregación previa" multiline>
                  <textarea
                    name="nombreIglesiaAnterior"
                    value={values.nombreIglesiaAnterior}
                    onChange={(e) => setters.setNombreIglesiaAnterior(e.target.value)}
                    rows={2}
                    className={MODAL_TEXTAREA_CLASS}
                    placeholder="Nombre de la congregación anterior"
                  />
                </ModalField>
              ) : null}
            </section>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-gray-100 px-5 py-4 dark:border-[#2a2a2a]">
          <button type="button" onClick={onClose} className={BTN_FICHA_SECUNDARIO_FLEX}>
            Cerrar
          </button>
          <button type="button" onClick={onClose} className={BTN_FICHA_PRIMARIO_FLEX}>
            Listo, continuar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function labelTriBoolResumen(value: "" | "true" | "false"): string {
  if (value === "true") return "Sí";
  if (value === "false") return "No";
  return "—";
}

export function labelAcercamientoResumen(situacion: string): string {
  const label = labelSituacionAcercamiento(situacion);
  return label || "—";
}
