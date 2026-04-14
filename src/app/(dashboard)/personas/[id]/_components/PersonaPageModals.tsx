"use client";

import { useState, useEffect, useMemo, type JSX } from "react";
import { createClient } from "@/lib/supabase/client";
import { fechaHoyYYYYMMDD } from "@/lib/fecha-hoy-local";
import {
  ETAPA_LABELS,
  ETAPAS_FILTRO_LISTA,
  type EtapaPersonaDb,
  etapaDotClass,
  parseEtapaDb,
} from "@/lib/persona-etapa";
import type { ParticipacionEnGrupo } from "../_lib/persona-detail-participacion";
import type {
  SeguimientoSavePayload,
  TipoSeguimientoActivo,
  TipoSeguimientoVisitante,
  ResultadoSeguimientoActivo,
  ResultadoSeguimientoVisitante,
} from "../_lib/persona-seguimiento-labels";

/** Primario en modales de grupo/apoyo/co-líder: mismo criterio que CTAs de la ficha (sin cyan). */
const BTN_MODAL_ACCION_PRIMARIA =
  "flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200/80 bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 dark:focus-visible:ring-white/25";

type TipoSeguimientoItem = {
  value: string;
  label: string;
  icon: JSX.Element;
  color: string;
  fillIcon?: boolean;
};

type ResultadoSeguimientoItem = { value: string; label: string; dot: string };

const tiposSeguimientoVisitante: TipoSeguimientoItem[] = [
  {
    value: "mensaje",
    label: "Le escribí",
    fillIcon: true,
    color: "text-[#25D366]",
    icon: <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />,
  },
  {
    value: "llamada",
    label: "Lo llamé",
    color: "text-[#0ca6b2]",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      />
    ),
  },
  {
    value: "visita",
    label: "Lo visité",
    color: "text-[#e64b27]",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    ),
  },
];

const tiposSeguimientoActivo: TipoSeguimientoItem[] = [
  {
    value: "mensaje",
    label: "Le escribí",
    fillIcon: true,
    color: "text-[#25D366]",
    icon: <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />,
  },
  {
    value: "llamada",
    label: "Lo llamé",
    color: "text-[#0ca6b2]",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      />
    ),
  },
  {
    value: "encuentro",
    label: "Café o encuentro",
    color: "text-amber-500 dark:text-amber-400",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.75 9.75H5.25A2.25 2.25 0 003 12v1.5a4.5 4.5 0 004.5 4.5h9a4.5 4.5 0 004.5-4.5V12a2.25 2.25 0 00-2.25-2.25Zm-2.25-6v3m-4.5-3v3M9 3.75v3"
      />
    ),
  },
];

const resultadosSeguimientoVisitante: ResultadoSeguimientoItem[] = [
  { value: "contesto", label: "Contestó / Respondió", dot: "bg-green-500" },
  { value: "no_contesto", label: "No contestó / No respondió", dot: "bg-gray-400" },
  { value: "volvera", label: "Dijo que volverá", dot: "bg-[#0ca6b2]" },
  { value: "no_volvera", label: "No va a volver", dot: "bg-red-500" },
  { value: "interesado", label: "Interesado en un grupo", dot: "bg-[#f9c70c]" },
  { value: "otro", label: "Otro", dot: "bg-gray-300 dark:bg-gray-500" },
];

const resultadosSeguimientoActivo: ResultadoSeguimientoItem[] = [
  { value: "bien_grupo", label: "Va bien / integrado al grupo", dot: "bg-green-500" },
  { value: "dificultades", label: "Compartió dificultades o problemas", dot: "bg-amber-500" },
  { value: "apoyo_pastoral", label: "Necesita apoyo, consejería u oración", dot: "bg-[#0ca6b2]" },
  { value: "camino_proceso", label: "Hablamos de su proceso en la iglesia", dot: "bg-violet-500" },
  { value: "pendiente_contacto", label: "Quedó pendiente otro contacto", dot: "bg-[#18301d] dark:bg-gray-400" },
  { value: "otro", label: "Otro", dot: "bg-gray-300 dark:bg-gray-500" },
];
function SeguimientoModal({
  isOpen,
  onClose,
  personaNombre,
  telefono,
  esMiembroActivoEnGrupo,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  personaNombre: string;
  /** Teléfono tal como en ficha; se usa para WhatsApp (solo dígitos) y enlace tel: */
  telefono: string | null;
  esMiembroActivoEnGrupo: boolean;
  onSave: (data: SeguimientoSavePayload) => void | Promise<void>;
}) {
  const [tipo, setTipo] = useState<string>("");
  const [resultado, setResultado] = useState<string>("");
  const [notas, setNotas] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const tiposOpciones = esMiembroActivoEnGrupo ? tiposSeguimientoActivo : tiposSeguimientoVisitante;
  const resultadosOpciones = esMiembroActivoEnGrupo ? resultadosSeguimientoActivo : resultadosSeguimientoVisitante;

  useEffect(() => {
    if (!isOpen) return;
    setTipo("");
    setResultado("");
    setNotas("");
  }, [isOpen, esMiembroActivoEnGrupo]);

  useEffect(() => {
    if (!isOpen) {
      setDrawerVisible(false);
      return;
    }
    const id = requestAnimationFrame(() => setDrawerVisible(true));
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    if (!tipo || !resultado || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload: SeguimientoSavePayload = esMiembroActivoEnGrupo
        ? {
            perfil: "activo",
            tipo: tipo as TipoSeguimientoActivo,
            resultado: resultado as ResultadoSeguimientoActivo,
            notas,
          }
        : {
            perfil: "visitante",
            tipo: tipo as TipoSeguimientoVisitante,
            resultado: resultado as ResultadoSeguimientoVisitante,
            notas,
          };
      await Promise.resolve(onSave(payload));
      onClose();
      setTipo("");
      setResultado("");
      setNotas("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const telTrim = (telefono ?? "").trim();
  const telDigits = telTrim.replace(/\D/g, "");
  const whatsappHref = telDigits.length > 0 ? `https://wa.me/${telDigits}` : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        aria-label="Cerrar panel"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="seguimiento-drawer-titulo"
        className={`relative flex h-full max-h-[100dvh] w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-[#2a2a2a] dark:bg-[#1a1a1a] ${
          drawerVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-[#2a2a2a] sm:px-6">
          <div className="min-w-0">
            <h2 id="seguimiento-drawer-titulo" className="text-lg font-semibold text-[#18301d] dark:text-white">
              Registrar seguimiento
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">a {personaNombre}</p>
            {telTrim ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#25D366]/40 bg-[#25D366]/10 px-2.5 py-1.5 text-xs font-medium text-[#128C7E] transition hover:bg-[#25D366]/20 dark:border-[#25D366]/30 dark:text-[#53c97f]"
                  >
                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                    </svg>
                    WhatsApp
                  </a>
                ) : null}
                <a
                  href={`tel:${telTrim}`}
                  className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 dark:border-[#333] dark:bg-[#252525] dark:text-gray-200 dark:hover:bg-[#2e2e2e]"
                >
                  <svg className="h-4 w-4 shrink-0 text-[#0ca6b2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                    />
                  </svg>
                  <span className="truncate tabular-nums">{telTrim}</span>
                </a>
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Sin teléfono en la ficha · agrégalo al editar la persona</p>
            )}
            {esMiembroActivoEnGrupo ? (
              <p className="mt-2 text-xs font-medium text-[#0ca6b2]">
                Ya asiste a un grupo — opciones de acompañamiento pastoral
              </p>
            ) : (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Seguimiento a visitante o en proceso de integración
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#252525] dark:hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="space-y-5">
          {/* Tipo de seguimiento */}
          <div>
            <label className="block text-sm font-medium text-[#18301d] dark:text-white mb-3">
              ¿Qué hiciste?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {tiposOpciones.map((t) => (
                <button
                  key={`${esMiembroActivoEnGrupo ? "a" : "v"}-${t.value}`}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={`rounded-lg border px-1.5 py-2 text-center transition-all ${
                    tipo === t.value
                      ? "border-[#0ca6b2] bg-[#0ca6b2]/5 dark:bg-[#0ca6b2]/10"
                      : "border-gray-200 dark:border-[#333] hover:border-[#0ca6b2]/50"
                  }`}
                >
                  <svg
                    className={`mx-auto mb-1 h-5 w-5 ${t.color}`}
                    fill={t.fillIcon ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    stroke={t.fillIcon ? "none" : "currentColor"}
                    strokeWidth={1.5}
                  >
                    {t.icon}
                  </svg>
                  <span
                    className={`block text-xs font-medium leading-snug ${tipo === t.value ? "text-[#0ca6b2]" : "text-[#18301d] dark:text-white"}`}
                  >
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Resultado */}
          <div>
            <label className="block text-sm font-medium text-[#18301d] dark:text-white mb-3">
              {esMiembroActivoEnGrupo ? "¿Qué reflejó el seguimiento?" : "¿Cuál fue el resultado?"}
            </label>
            <div className="space-y-2">
              {resultadosOpciones.map((r) => (
                <button
                  key={`${esMiembroActivoEnGrupo ? "a" : "v"}-${r.value}`}
                  type="button"
                  onClick={() => setResultado(r.value)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                    resultado === r.value
                      ? "border-[#0ca6b2] bg-[#0ca6b2]/5 dark:bg-[#0ca6b2]/10"
                      : "border-gray-200 dark:border-[#333] hover:border-[#0ca6b2]/50"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${r.dot}`} />
                  <span className={`text-sm font-medium ${resultado === r.value ? "text-[#0ca6b2]" : "text-[#18301d] dark:text-white"}`}>
                    {r.label}
                  </span>
                  {resultado === r.value && (
                    <svg className="w-5 h-5 text-[#0ca6b2] ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-[#18301d] dark:text-white mb-2">
              Notas de esta conversación (opcional)
            </label>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              Van ligadas a este registro de contacto. Para anotaciones generales sobre la persona usa{" "}
              <span className="font-medium text-gray-600 dark:text-gray-300">Notas pastorales</span> en su ficha.
            </p>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Detalles de lo que hablaron, acuerdos, oración…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#252525] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] transition resize-none"
            />
          </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 px-4 py-3 dark:border-[#2a2a2a] sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#252525]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!tipo || !resultado || isSubmitting}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#0ca6b2] px-3 py-2 text-sm font-semibold whitespace-nowrap text-white transition hover:bg-[#0a8f99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Guardando...
              </>
            ) : (
              "Guardar seguimiento"
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}

function ConfirmarLiberarGrupoModal({
  isOpen,
  onClose,
  personaNombre,
  nombreGrupo,
  onConfirm,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  personaNombre: string;
  nombreGrupo: string;
  onConfirm: () => void | Promise<void>;
  loading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onClose} aria-hidden />
      <div
        className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-[#2a2a2a]"
        role="dialog"
        aria-labelledby="liberar-grupo-titulo"
        aria-describedby="liberar-grupo-desc"
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
          <div>
            <h2 id="liberar-grupo-titulo" className="text-lg font-semibold text-[#18301d] dark:text-white">
              Quitar del grupo
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{personaNombre}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition disabled:opacity-50"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
            <p id="liberar-grupo-desc" className="font-medium">¿Estás seguro?</p>
            <p className="mt-2 text-amber-800/90 dark:text-amber-100/90">
              Vas a quitar a <strong className="font-semibold">{personaNombre}</strong> del grupo{" "}
              <strong className="font-semibold">«{nombreGrupo}»</strong>.
            </p>
            <ul className="mt-3 list-disc list-inside space-y-1 text-amber-800/90 dark:text-amber-100/90">
              <li>Quedará <strong>sin grupo asignado</strong>.</li>
              <li>Su etapa pasará a <strong>En proceso</strong>.</li>
              <li>No se borran notas pastorales ni registros de seguimiento; solo se libera del grupo.</li>
            </ul>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 text-gray-600 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-[#252525] transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void onConfirm()}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Quitando…
                </>
              ) : (
                "Sí, quitar del grupo"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface GrupoParaAsignar {
  id: string;
  nombre: string;
  imagen: string | null;
}

function participacionDesdeDb(raw: string | null | undefined): ParticipacionEnGrupo {
  if (raw === "apoyo" || raw === "colider" || raw === "miembro") return raw;
  return "miembro";
}

function PasarAGrupoApoyoModal({
  isOpen,
  onClose,
  personaId,
  personaNombre,
  nombreGrupo,
  grupoIdEsperado,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  personaId: string;
  personaNombre: string;
  nombreGrupo: string;
  grupoIdEsperado: string;
  onSuccess: (p: ParticipacionEnGrupo, etapa: EtapaPersonaDb) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  const confirmar = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: row, error: getErr } = await supabase
        .from("personas")
        .select("grupo_id, etapa, participacion_en_grupo")
        .eq("id", personaId)
        .single();
      if (getErr) throw getErr;
      if (row?.grupo_id !== grupoIdEsperado) {
        setError("El grupo cambió. Cierra y vuelve a abrir la ficha.");
        return;
      }
      const etapaP = parseEtapaDb(row?.etapa);
      if (etapaP !== "consolidado") {
        setError(`Solo con etapa ${ETAPA_LABELS.consolidado}. (Ahora: ${ETAPA_LABELS[etapaP]}.)`);
        return;
      }
      if (participacionDesdeDb(row?.participacion_en_grupo) !== "miembro") {
        setError("Solo desde miembro del núcleo de este grupo.");
        return;
      }
      const { error: updErr } = await supabase
        .from("personas")
        .update({
          participacion_en_grupo: "apoyo",
          etapa: "en_servicio",
          co_lider_desde: null,
        })
        .eq("id", personaId);
      if (updErr) throw updErr;
      onSuccess("apoyo", "en_servicio");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onClose} aria-hidden />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-[#2a2a2a] dark:bg-[#1a1a1a]"
        role="dialog"
        aria-labelledby="pasar-apoyo-titulo"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-[#2a2a2a]">
          <div>
            <h2 id="pasar-apoyo-titulo" className="text-lg font-semibold text-[#18301d] dark:text-white">
              Grupo de apoyo
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {personaNombre} · «{nombreGrupo}»
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 transition hover:text-gray-600 disabled:opacity-50 dark:hover:text-white"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4 p-5">
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Pasa a <strong className="font-semibold text-[#18301d] dark:text-white">grupo de apoyo</strong> en este mismo
            grupo. La etapa pasa a <strong className="font-semibold">{ETAPA_LABELS.en_servicio}</strong>.
          </p>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl px-4 py-3 font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-[#252525]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void confirmar()}
              disabled={loading}
              className={BTN_MODAL_ACCION_PRIMARIA}
            >
              {loading ? "Guardando…" : "Pasar a apoyo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesignarColiderModal({
  isOpen,
  onClose,
  personaId,
  personaNombre,
  nombreGrupo,
  grupoIdEsperado,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  personaId: string;
  personaNombre: string;
  nombreGrupo: string;
  grupoIdEsperado: string;
  onSuccess: (p: ParticipacionEnGrupo, etapa: EtapaPersonaDb) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  const confirmar = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: row, error: getErr } = await supabase
        .from("personas")
        .select("grupo_id, participacion_en_grupo")
        .eq("id", personaId)
        .single();
      if (getErr) throw getErr;
      if (row?.grupo_id !== grupoIdEsperado) {
        setError("El grupo cambió. Cierra y vuelve a abrir la ficha.");
        return;
      }
      if (participacionDesdeDb(row?.participacion_en_grupo) !== "apoyo") {
        setError("El co-líder solo se designa desde grupo de apoyo en este grupo.");
        return;
      }
      const hoy = fechaHoyYYYYMMDD();
      const { error: updErr } = await supabase
        .from("personas")
        .update({
          participacion_en_grupo: "colider",
          etapa: "lider_en_formacion",
          co_lider_desde: hoy,
        })
        .eq("id", personaId);
      if (updErr) throw updErr;
      onSuccess("colider", "lider_en_formacion");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onClose} aria-hidden />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-[#2a2a2a] dark:bg-[#1a1a1a]"
        role="dialog"
        aria-labelledby="designar-colider-titulo"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-[#2a2a2a]">
          <div>
            <h2 id="designar-colider-titulo" className="text-lg font-semibold text-[#18301d] dark:text-white">
              Designar co-líder
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {personaNombre} · «{nombreGrupo}»
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 transition hover:text-gray-600 disabled:opacity-50 dark:hover:text-white"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4 p-5">
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Confirma el rol de <strong className="font-semibold text-[#18301d] dark:text-white">co-líder</strong> en{" "}
            <strong className="font-semibold">«{nombreGrupo}»</strong>. La etapa queda en{" "}
            <strong className="font-semibold">{ETAPA_LABELS.lider_en_formacion}</strong>.
          </p>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl px-4 py-3 font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-[#252525]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void confirmar()}
              disabled={loading}
              className={BTN_MODAL_ACCION_PRIMARIA}
            >
              {loading ? "Guardando…" : "Designar co-líder"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AsignarGrupoModal({
  isOpen,
  onClose,
  personaId,
  personaNombre,
  onAssigned,
}: {
  isOpen: boolean;
  onClose: () => void;
  personaId: string;
  personaNombre: string;
  onAssigned: (grupo: GrupoParaAsignar) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [grupos, setGrupos] = useState<GrupoParaAsignar[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedId(null);
    setError(null);
    let cancelled = false;
    setLoadingList(true);
    void (async () => {
      const { data, error: qErr } = await supabase
        .from("grupos")
        .select("id, nombre, imagen")
        .order("nombre");
      if (cancelled) return;
      if (qErr) {
        setError(qErr.message);
        setGrupos([]);
      } else {
        setGrupos((data as GrupoParaAsignar[]) ?? []);
      }
      setLoadingList(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, supabase]);

  const handleAssign = async () => {
    if (!selectedId) return;
    const chosen = grupos.find((g) => g.id === selectedId);
    if (!chosen) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data: personaRow, error: getErr } = await supabase
        .from("personas")
        .select("grupo_id")
        .eq("id", personaId)
        .single();
      if (getErr) throw getErr;
      if (personaRow?.grupo_id) {
        setError("Esta persona ya tiene un grupo asignado. Actualiza la página.");
        return;
      }
      const { error: updErr } = await supabase
        .from("personas")
        .update({
          grupo_id: selectedId,
          etapa: "consolidado",
          participacion_en_grupo: "miembro",
          fecha_ingreso_grupo: fechaHoyYYYYMMDD(),
          co_lider_desde: null,
        })
        .eq("id", personaId);
      if (updErr) throw updErr;
      onAssigned(chosen);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo asignar el grupo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={submitting ? undefined : onClose}
        aria-hidden
      />
      <div
        className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-[#2a2a2a]"
        role="dialog"
        aria-labelledby="asignar-grupo-titulo"
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
          <div>
            <h2 id="asignar-grupo-titulo" className="text-lg font-semibold text-[#18301d] dark:text-white">
              Asignar a un grupo
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Elige el grupo para <span className="font-medium text-[#18301d] dark:text-white">{personaNombre}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg transition disabled:opacity-50"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {loadingList ? (
            <div className="py-12 flex justify-center">
              <svg className="w-8 h-8 animate-spin text-[#0ca6b2]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : grupos.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
              No hay grupos en tu organización. Crea uno desde la sección Grupos.
            </p>
          ) : (
            <div className="max-h-[min(360px,50vh)] overflow-y-auto space-y-2 pr-1">
              {grupos.map((g) => (
                <label
                  key={g.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                    selectedId === g.id
                      ? "border-[#0ca6b2] bg-[#0ca6b2]/5 dark:bg-[#0ca6b2]/10"
                      : "border-gray-100 dark:border-[#2a2a2a] hover:border-[#0ca6b2]/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="grupo-asignar"
                    value={g.id}
                    checked={selectedId === g.id}
                    onChange={() => setSelectedId(g.id)}
                    className="w-4 h-4 text-[#0ca6b2] focus:ring-[#0ca6b2] shrink-0"
                  />
                  <span className="text-sm font-medium text-[#18301d] dark:text-white">{g.nombre}</span>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 px-4 text-gray-600 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-[#252525] transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleAssign()}
              disabled={!selectedId || submitting || loadingList || grupos.length === 0}
              className="flex-1 py-3 px-4 bg-[#0ca6b2] text-white font-semibold rounded-xl hover:bg-[#0a8f99] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Asignando…
                </>
              ) : (
                "Asignar grupo"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ETAPAS_SELECTOR = ETAPAS_FILTRO_LISTA.filter(
  (x): x is { value: EtapaPersonaDb; label: string } => x.value !== "Todos"
);

function CambiarEtapaModal({
  isOpen,
  onClose,
  personaId,
  personaNombre,
  etapaActual,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  personaId: string;
  personaNombre: string;
  etapaActual: EtapaPersonaDb;
  onSaved: (etapa: EtapaPersonaDb) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [selected, setSelected] = useState<EtapaPersonaDb>(etapaActual);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelected(etapaActual);
      setError(null);
    }
  }, [isOpen, etapaActual]);

  const guardar = async () => {
    if (selected === etapaActual) {
      onClose();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: updErr } = await supabase.from("personas").update({ etapa: selected }).eq("id", personaId);
      if (updErr) throw updErr;
      onSaved(selected);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onClose} aria-hidden />
      <div
        className="relative max-h-[min(90dvh,640px)] w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-[#2a2a2a] dark:bg-[#1a1a1a]"
        role="dialog"
        aria-labelledby="cambiar-etapa-titulo"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-[#2a2a2a]">
          <div>
            <h2 id="cambiar-etapa-titulo" className="text-lg font-semibold text-[#18301d] dark:text-white">
              Cambiar etapa
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-[#18301d] dark:text-white">{personaNombre}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 transition hover:text-gray-600 disabled:opacity-50 dark:hover:text-white"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex max-h-[min(60dvh,480px)] flex-col">
          <p className="px-5 pb-2 pt-4 text-xs leading-snug text-gray-500 dark:text-gray-400">
            Elige en qué etapa del discipulado va esta persona. El listado y filtros de Personas usarán este valor.
          </p>
          {error && (
            <p className="mx-5 mb-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="scrollbar-brand flex-1 space-y-1 overflow-y-auto px-3 pb-2">
            {ETAPAS_SELECTOR.map(({ value, label }) => {
              const isSel = selected === value;
              const isCurrent = etapaActual === value;
              return (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition ${
                    isSel
                      ? "border-[#0ca6b2] bg-[#0ca6b2]/5 dark:bg-[#0ca6b2]/10"
                      : "border-transparent hover:bg-gray-100/80 dark:hover:bg-white/[0.06]"
                  }`}
                >
                  <input
                    type="radio"
                    name="cambiar-etapa"
                    value={value}
                    checked={isSel}
                    onChange={() => setSelected(value)}
                    className="h-4 w-4 shrink-0 text-[#0ca6b2] focus:ring-[#0ca6b2]"
                  />
                  <span className={`h-2 w-2 shrink-0 rounded-full ${etapaDotClass[value]}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[#18301d] dark:text-white">{label}</span>
                    {isCurrent && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">Etapa actual</span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          <div className="flex gap-3 border-t border-gray-100 p-4 dark:border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl py-3 font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-[#252525]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void guardar()}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0ca6b2] py-3 font-semibold text-white transition hover:bg-[#0a8f99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Guardando…
                </>
              ) : (
                "Guardar etapa"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PersonaDetailModals({
  personaId,
  personaNombre,
  personaTelefono,
  personaGrupoId,
  personaGrupo,
  personaEtapa,
  showSeguimientoModal,
  showLiberarGrupoModal,
  liberandoGrupo,
  showAsignarGrupoModal,
  showPasarApoyoModal,
  showDesignarColiderModal,
  showCambiarEtapaModal,
  onCloseSeguimiento,
  onSaveSeguimiento,
  onCloseLiberar,
  onConfirmLiberar,
  onCloseAsignar,
  onAssignedGrupo,
  onClosePasarApoyo,
  onCloseDesignarColider,
  onParticipacionGrupoActualizada,
  onCloseEtapa,
  onSavedEtapa,
}: {
  personaId: string;
  personaNombre: string;
  personaTelefono: string | null;
  personaGrupoId: string | null;
  personaGrupo: string;
  personaEtapa: EtapaPersonaDb;
  showSeguimientoModal: boolean;
  showLiberarGrupoModal: boolean;
  liberandoGrupo: boolean;
  showAsignarGrupoModal: boolean;
  showPasarApoyoModal: boolean;
  showDesignarColiderModal: boolean;
  showCambiarEtapaModal: boolean;
  onCloseSeguimiento: () => void;
  onSaveSeguimiento: (data: SeguimientoSavePayload) => void | Promise<void>;
  onCloseLiberar: () => void;
  onConfirmLiberar: () => void | Promise<void>;
  onCloseAsignar: () => void;
  onAssignedGrupo: (grupo: GrupoParaAsignar) => void;
  onClosePasarApoyo: () => void;
  onCloseDesignarColider: () => void;
  onParticipacionGrupoActualizada: (p: ParticipacionEnGrupo, etapa: EtapaPersonaDb) => void;
  onCloseEtapa: () => void;
  onSavedEtapa: (etapa: EtapaPersonaDb) => void;
}) {
  return (
    <>
      <SeguimientoModal
        isOpen={showSeguimientoModal}
        onClose={onCloseSeguimiento}
        personaNombre={personaNombre}
        telefono={personaTelefono?.trim() || null}
        esMiembroActivoEnGrupo={!!personaGrupoId}
        onSave={onSaveSeguimiento}
      />
      <ConfirmarLiberarGrupoModal
        isOpen={showLiberarGrupoModal}
        onClose={onCloseLiberar}
        personaNombre={personaNombre}
        nombreGrupo={personaGrupo}
        onConfirm={onConfirmLiberar}
        loading={liberandoGrupo}
      />
      <AsignarGrupoModal
        isOpen={showAsignarGrupoModal}
        onClose={onCloseAsignar}
        personaId={personaId}
        personaNombre={personaNombre}
        onAssigned={onAssignedGrupo}
      />
      {personaGrupoId ? (
        <>
          <PasarAGrupoApoyoModal
            isOpen={showPasarApoyoModal}
            onClose={onClosePasarApoyo}
            personaId={personaId}
            personaNombre={personaNombre}
            nombreGrupo={personaGrupo}
            grupoIdEsperado={personaGrupoId}
            onSuccess={onParticipacionGrupoActualizada}
          />
          <DesignarColiderModal
            isOpen={showDesignarColiderModal}
            onClose={onCloseDesignarColider}
            personaId={personaId}
            personaNombre={personaNombre}
            nombreGrupo={personaGrupo}
            grupoIdEsperado={personaGrupoId}
            onSuccess={onParticipacionGrupoActualizada}
          />
        </>
      ) : null}
      <CambiarEtapaModal
        isOpen={showCambiarEtapaModal}
        onClose={onCloseEtapa}
        personaId={personaId}
        personaNombre={personaNombre}
        etapaActual={personaEtapa}
        onSaved={onSavedEtapa}
      />
    </>
  );
}
