"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserAvatar } from "@/components/UserAvatar";
import { useParams } from "next/navigation";
import { labelSituacionAcercamiento, labelTriBool } from "@/lib/personas-situacion-acercamiento";
import { createClient } from "@/lib/supabase/client";

type Rol = "Líder" | "Miembro" | "Visitante" | "Diácono";
type Estado = "Activo" | "Visitante" | "Inactivo" | "En seguimiento" | "En servicio";
type ParticipacionEnGrupo = "miembro" | "apoyo" | "colider";

/** Seguimiento a visitante / en seguimiento (sin grupo o aún no integrado) */
type TipoSeguimientoVisitante = "mensaje" | "llamada" | "visita";
type ResultadoSeguimientoVisitante =
  | "contesto"
  | "no_contesto"
  | "volvera"
  | "no_volvera"
  | "interesado"
  | "otro";

/** Seguimiento pastoral a quien ya asiste a un grupo */
type TipoSeguimientoActivo = "mensaje" | "llamada" | "encuentro";
type ResultadoSeguimientoActivo =
  | "bien_grupo"
  | "dificultades"
  | "apoyo_pastoral"
  | "camino_proceso"
  | "pendiente_contacto"
  | "otro";

type SeguimientoSavePayload =
  | {
      perfil: "visitante";
      tipo: TipoSeguimientoVisitante;
      resultado: ResultadoSeguimientoVisitante;
      notas: string;
    }
  | {
      perfil: "activo";
      tipo: TipoSeguimientoActivo;
      resultado: ResultadoSeguimientoActivo;
      notas: string;
    };

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
  esMiembroActivoEnGrupo,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  personaNombre: string;
  esMiembroActivoEnGrupo: boolean;
  onSave: (data: SeguimientoSavePayload) => void;
}) {
  const [tipo, setTipo] = useState<string>("");
  const [resultado, setResultado] = useState<string>("");
  const [notas, setNotas] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tiposOpciones = esMiembroActivoEnGrupo ? tiposSeguimientoActivo : tiposSeguimientoVisitante;
  const resultadosOpciones = esMiembroActivoEnGrupo ? resultadosSeguimientoActivo : resultadosSeguimientoVisitante;

  useEffect(() => {
    if (!isOpen) return;
    setTipo("");
    setResultado("");
    setNotas("");
  }, [isOpen, esMiembroActivoEnGrupo]);

  const handleSubmit = async () => {
    if (!tipo || !resultado) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (esMiembroActivoEnGrupo) {
      onSave({
        perfil: "activo",
        tipo: tipo as TipoSeguimientoActivo,
        resultado: resultado as ResultadoSeguimientoActivo,
        notas,
      });
    } else {
      onSave({
        perfil: "visitante",
        tipo: tipo as TipoSeguimientoVisitante,
        resultado: resultado as ResultadoSeguimientoVisitante,
        notas,
      });
    }
    setIsSubmitting(false);
    onClose();
    setTipo("");
    setResultado("");
    setNotas("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#18301d] dark:text-white">Registrar seguimiento</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">a {personaNombre}</p>
            {esMiembroActivoEnGrupo ? (
              <p className="text-xs text-[#0ca6b2] mt-1.5 font-medium">
                Ya asiste a un grupo — opciones de acompañamiento pastoral
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                Seguimiento a visitante o en proceso de integración
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Tipo de seguimiento */}
          <div>
            <label className="block text-sm font-medium text-[#18301d] dark:text-white mb-3">
              ¿Qué hiciste?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {tiposOpciones.map((t) => (
                <button
                  key={`${esMiembroActivoEnGrupo ? "a" : "v"}-${t.value}`}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    tipo === t.value
                      ? "border-[#0ca6b2] bg-[#0ca6b2]/5 dark:bg-[#0ca6b2]/10"
                      : "border-gray-200 dark:border-[#333] hover:border-[#0ca6b2]/50"
                  }`}
                >
                  <svg
                    className={`w-6 h-6 mx-auto mb-2 ${t.color}`}
                    fill={t.fillIcon ? "currentColor" : "none"}
                    viewBox="0 0 24 24"
                    stroke={t.fillIcon ? "none" : "currentColor"}
                    strokeWidth={1.5}
                  >
                    {t.icon}
                  </svg>
                  <span className={`text-sm font-medium ${tipo === t.value ? "text-[#0ca6b2]" : "text-[#18301d] dark:text-white"}`}>
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
              Notas (opcional)
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Agrega detalles adicionales..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#252525] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] transition resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2a2a2a] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 text-gray-600 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-[#252525] transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!tipo || !resultado || isSubmitting}
            className="flex-1 py-3 px-4 bg-[#0ca6b2] text-white font-semibold rounded-xl hover:bg-[#0a8f99] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando...
              </>
            ) : (
              "Guardar seguimiento"
            )}
          </button>
        </div>
      </div>
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
              <li>Su estado pasará a <strong>En seguimiento</strong>.</li>
              <li>No se borran notas ni historial; solo se libera del grupo.</li>
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

interface GrupoParaAsignar {
  id: string;
  nombre: string;
  imagen: string | null;
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
          estado: "Activo",
          participacion_en_grupo: "miembro",
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

function ParticipacionGrupoModal({
  isOpen,
  onClose,
  personaId,
  participacionActual,
  estadoActual,
  nombreGrupo,
  onUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  personaId: string;
  participacionActual: ParticipacionEnGrupo;
  estadoActual: Estado;
  nombreGrupo: string;
  onUpdated: (p: ParticipacionEnGrupo, estado: Estado) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ParticipacionEnGrupo>(participacionActual);

  useEffect(() => {
    if (isOpen) {
      setSelected(participacionActual);
      setError(null);
    }
  }, [isOpen, participacionActual]);

  const guardar = async () => {
    setLoading(true);
    setError(null);
    try {
      let nuevoEstado: Estado = estadoActual;
      if (selected === "apoyo" || selected === "colider") nuevoEstado = "En servicio";
      if (selected === "miembro" && estadoActual === "En servicio") nuevoEstado = "Activo";

      if (selected === participacionActual && nuevoEstado === estadoActual) {
        onClose();
        return;
      }

      const { error: updErr } = await supabase
        .from("personas")
        .update({ participacion_en_grupo: selected, estado: nuevoEstado })
        .eq("id", personaId);
      if (updErr) throw updErr;
      onUpdated(selected, nuevoEstado);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const opciones: { value: ParticipacionEnGrupo; titulo: string; desc: string }[] = [
    { value: "miembro", titulo: "Miembro del núcleo", desc: "Integrante habitual del grupo. Estado típico: Activo." },
    { value: "colider", titulo: "Co-líder", desc: "Apoya al líder. Estado: En servicio." },
    { value: "apoyo", titulo: "Grupo de apoyo", desc: "Apoyo al grupo sin ser del núcleo. Estado: En servicio." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onClose} aria-hidden />
      <div
        className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-[#2a2a2a]"
        role="dialog"
        aria-labelledby="participacion-grupo-titulo"
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
          <div>
            <h2 id="participacion-grupo-titulo" className="text-lg font-semibold text-[#18301d] dark:text-white">
              Rol en el grupo
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{nombreGrupo}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
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
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{error}</p>
          )}
          <div className="space-y-2">
            {opciones.map((op) => (
              <label
                key={op.value}
                className={`flex gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                  selected === op.value
                    ? "border-[#0ca6b2] bg-[#0ca6b2]/5 dark:bg-[#0ca6b2]/10"
                    : "border-gray-100 dark:border-[#2a2a2a] hover:border-[#0ca6b2]/40"
                }`}
              >
                <input
                  type="radio"
                  name="participacion-grupo"
                  value={op.value}
                  checked={selected === op.value}
                  onChange={() => setSelected(op.value)}
                  className="w-4 h-4 text-[#0ca6b2] focus:ring-[#0ca6b2] shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm font-semibold text-[#18301d] dark:text-white">{op.titulo}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{op.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
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
              onClick={() => void guardar()}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-[#0ca6b2] text-white font-semibold rounded-xl hover:bg-[#0a8f99] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface HistorialItem {
  fecha: string;
  accion: string;
  responsable: string;
}

interface NotaHistorialItem {
  id: string;
  contenido: string;
  creadoEn: string;
  autor: string;
}

interface Persona {
  id: string;
  cedula: string;
  nombre: string;
  telefono: string;
  email: string;
  fechaNacimiento: string;
  edad: number | null;
  estadoCivil: string;
  ocupacion: string;
  direccion: string;
  grupo: string;
  grupoId: string | null;
  grupoImagen: string | null;
  participacionEnGrupo: ParticipacionEnGrupo | null;
  rol: Rol;
  estado: Estado;
  fechaRegistro: string;
  ultimoContacto: string;
  notasHistorial: NotaHistorialItem[];
  historial: HistorialItem[];
  bautizado: boolean | null;
  vieneDeOtraIglesia: boolean | null;
  nombreIglesiaAnterior: string | null;
  situacionAcercamiento: string | null;
}

function formatFechaNacimiento(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function calcularEdad(fechaStr: string | null): number | null {
  if (!fechaStr) return null;
  const d = new Date(fechaStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - d.getFullYear();
  if (hoy.getMonth() < d.getMonth() || (hoy.getMonth() === d.getMonth() && hoy.getDate() < d.getDate())) edad--;
  return edad >= 0 ? edad : null;
}

function formatUltimoContacto(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff >= 2 && diff <= 6) return `Hace ${diff} días`;
  if (diff >= 7 && diff <= 13) return "Hace 1 semana";
  if (diff >= 14 && diff <= 29) return "Hace 2 semanas";
  if (diff >= 30 && diff <= 59) return "Hace 1 mes";
  if (diff >= 60) return "Hace más de 2 meses";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function formatHistorialFecha(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function formatNotaTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Lunes de la semana (ISO) para agrupar por semana */
function getMondayKey(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Racha = semanas consecutivas con al menos una asistencia (desde la más reciente hacia atrás) */
function calcularRacha(fechas: string[]): number {
  if (fechas.length === 0) return 0;
  const weeks = Array.from(new Set(fechas.map(getMondayKey))).sort().reverse();
  let racha = 1;
  for (let i = 1; i < weeks.length; i++) {
    const prev = new Date(weeks[i - 1] + "T12:00:00");
    const curr = new Date(weeks[i] + "T12:00:00");
    const diffDays = (prev.getTime() - curr.getTime()) / (24 * 60 * 60 * 1000);
    if (diffDays === 7) racha++;
    else break;
  }
  return racha;
}

/** Misma lógica visual que la tabla de /personas (puntos pastel + chip suave). */
const estadoStyles: Record<Estado, { dot: string; badge: string }> = {
  Activo: {
    dot: "bg-emerald-400/75 dark:bg-emerald-400/55",
    badge: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
  },
  Visitante: {
    dot: "bg-amber-300/90 dark:bg-amber-300/65",
    badge: "bg-amber-400/15 text-amber-900 dark:text-amber-100",
  },
  "En seguimiento": {
    dot: "bg-sky-400/80 dark:bg-sky-400/55",
    badge: "bg-sky-500/10 text-sky-900 dark:text-sky-200",
  },
  "En servicio": {
    dot: "bg-violet-400/80 dark:bg-violet-400/55",
    badge: "bg-violet-500/12 text-violet-900 dark:text-violet-200",
  },
  Inactivo: {
    dot: "bg-gray-400/85 dark:bg-gray-500/65",
    badge: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
  },
};

const tipoLabelsVisitante: Record<TipoSeguimientoVisitante, string> = {
  mensaje: "Mensaje enviado por WhatsApp",
  llamada: "Llamada telefónica realizada",
  visita: "Visita pastoral realizada",
};

const tipoLabelsActivo: Record<TipoSeguimientoActivo, string> = {
  mensaje: "Mensaje enviado por WhatsApp",
  llamada: "Llamada de seguimiento",
  encuentro: "Encuentro presencial (café, comida, etc.)",
};

const resultadoLabelsVisitante: Record<ResultadoSeguimientoVisitante, string> = {
  contesto: "Contestó",
  no_contesto: "No contestó",
  volvera: "Dijo que volverá",
  no_volvera: "No volverá",
  interesado: "Interesado en un grupo",
  otro: "Otro",
};

const resultadoLabelsActivo: Record<ResultadoSeguimientoActivo, string> = {
  bien_grupo: "Va bien con el grupo",
  dificultades: "Compartió dificultades",
  apoyo_pastoral: "Necesita apoyo pastoral",
  camino_proceso: "Hablaron del proceso en la iglesia",
  pendiente_contacto: "Pendiente próximo contacto",
  otro: "Otro",
};

export default function Page() {
  const params = useParams();
  const id = params.id as string;

  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSeguimientoModal, setShowSeguimientoModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [rachaAsistencia, setRachaAsistencia] = useState<number>(0);
  const [ultimaAsistencia, setUltimaAsistencia] = useState<string | null>(null);
  const [nuevaNota, setNuevaNota] = useState("");
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [errorNota, setErrorNota] = useState<string | null>(null);
  const [showLiberarGrupoModal, setShowLiberarGrupoModal] = useState(false);
  const [liberandoGrupo, setLiberandoGrupo] = useState(false);
  const [showAsignarGrupoModal, setShowAsignarGrupoModal] = useState(false);
  const [showParticipacionModal, setShowParticipacionModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoadError(null);
    setNotFound(false);
    const supabase = createClient();
    (async () => {
      // Sin columnas opcionales de "camino espiritual": en proyectos sin migrar 20260337 falla todo el SELECT de PostgREST.
      const { data: row, error } = await supabase
        .from("personas")
        .select(
          "id, cedula, nombre, telefono, email, fecha_nacimiento, edad, estado_civil, ocupacion, direccion, grupo_id, participacion_en_grupo, rol, estado, fecha_registro, ultimo_contacto, notas, created_at, grupos(nombre, imagen)"
        )
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          setNotFound(true);
        } else {
          console.error("personas detalle:", error);
          setLoadError(error.message || "No se pudo cargar la persona.");
        }
        setLoading(false);
        return;
      }

      if (!row) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const r = row as unknown as Record<string, unknown> & {
        grupos?: { nombre: string; imagen: string | null } | { nombre: string; imagen: string | null }[] | null;
      };
      const gJoin = r.grupos;
      const grupoJoined =
        gJoin == null ? null : Array.isArray(gJoin) ? gJoin[0] ?? null : gJoin;
      const grupoNombre = grupoJoined?.nombre ?? null;
      const grupoImagen = grupoJoined?.imagen ?? null;
      const grupoIdVal = (r.grupo_id as string) ?? null;
      const participacionRaw = r.participacion_en_grupo as string | null | undefined;
      const participacionEnGrupo: ParticipacionEnGrupo | null = grupoIdVal
        ? ((participacionRaw as ParticipacionEnGrupo) ?? "miembro")
        : null;
      const fechaNac = (r.fecha_nacimiento as string) ?? null;
      const edad = (r.edad as number) ?? calcularEdad(fechaNac);
      const created = (r.created_at as string) ?? "";
      const fechaRegistro = (r.fecha_registro as string) || (created ? new Date(created).toLocaleDateString("es-ES", { month: "long", year: "numeric" }) : "—");

      const { data: historialRows } = await supabase
        .from("persona_historial")
        .select("fecha, accion, responsable")
        .eq("persona_id", id)
        .order("fecha", { ascending: false })
        .limit(50);

      const historial: HistorialItem[] = (historialRows ?? []).map((h) => ({
        fecha: formatHistorialFecha((h as { fecha: string }).fecha),
        accion: (h as { accion: string }).accion,
        responsable: (h as { responsable: string | null }).responsable ?? "—",
      }));

      const ultimoContacto = (r.ultimo_contacto as string) ?? (historialRows?.[0] ? (historialRows[0] as { fecha: string }).fecha : null);

      const { data: asistenciasRows } = await supabase
        .from("persona_asistencia")
        .select("fecha")
        .eq("persona_id", id)
        .order("fecha", { ascending: false });

      const fechasAsistencia = (asistenciasRows ?? []).map((a) => (a as { fecha: string }).fecha);
      setRachaAsistencia(calcularRacha(fechasAsistencia));
      setUltimaAsistencia(fechasAsistencia.length > 0 ? fechasAsistencia[0] : null);

      const { data: notasRows, error: notasErr } = await supabase
        .from("persona_notas")
        .select("id, contenido, created_at, created_by, profiles(full_name)")
        .eq("persona_id", id)
        .order("created_at", { ascending: false });

      let notasHistorial: NotaHistorialItem[] = !notasErr
        ? (notasRows ?? []).map((row) => {
            const n = row as {
              id: string;
              contenido: string;
              created_at: string;
              created_by: string | null;
              profiles:
                | { full_name: string | null }
                | { full_name: string | null }[]
                | null;
            };
            const p = n.profiles;
            const profileRow = Array.isArray(p) ? p[0] : p;
            const autor =
              profileRow?.full_name?.trim() ||
              (n.created_by ? "Usuario" : "—");
            return {
              id: n.id,
              contenido: n.contenido,
              creadoEn: formatNotaTimestamp(n.created_at),
              autor,
            };
          })
        : [];

      const legacyNotas = ((r.notas as string) ?? "").trim();
      if (notasHistorial.length === 0 && legacyNotas) {
        notasHistorial = [
          {
            id: "legacy",
            contenido: legacyNotas,
            creadoEn: created ? formatNotaTimestamp(created) : "—",
            autor: "—",
          },
        ];
      }

      setPersona({
        id: (r.id as string) ?? id,
        cedula: (r.cedula as string) ?? "",
        nombre: (r.nombre as string) ?? "",
        telefono: (r.telefono as string) ?? "",
        email: (r.email as string) ?? "",
        fechaNacimiento: formatFechaNacimiento(fechaNac),
        edad,
        estadoCivil: (r.estado_civil as string) ?? "",
        ocupacion: (r.ocupacion as string) ?? "",
        direccion: (r.direccion as string) ?? "",
        grupo: grupoNombre ?? "Sin asignar",
        grupoId: grupoIdVal,
        grupoImagen,
        participacionEnGrupo,
        rol: (r.rol as Rol) ?? "Miembro",
        estado: (r.estado as Estado) ?? "Visitante",
        fechaRegistro,
        ultimoContacto: formatUltimoContacto(ultimoContacto),
        notasHistorial,
        historial,
        bautizado: (r.bautizado as boolean | null | undefined) ?? null,
        vieneDeOtraIglesia: (r.viene_de_otra_iglesia as boolean | null | undefined) ?? null,
        nombreIglesiaAnterior: ((r.nombre_iglesia_anterior as string) ?? "").trim() || null,
        situacionAcercamiento: (r.situacion_acercamiento as string) ?? null,
      });
      setLoading(false);
    })();
  }, [id]);

  const handleSaveSeguimiento = async (data: SeguimientoSavePayload) => {
    const today = new Date();
    const fechaStr = today.toLocaleDateString("es-ES", { month: "short", day: "numeric", year: "numeric" });
    const fechaIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const tipoTxt =
      data.perfil === "activo" ? tipoLabelsActivo[data.tipo] : tipoLabelsVisitante[data.tipo];
    const resTxt =
      data.perfil === "activo"
        ? resultadoLabelsActivo[data.resultado]
        : resultadoLabelsVisitante[data.resultado];
    const accion = `${tipoTxt} - ${resTxt}${data.notas ? `: "${data.notas}"` : ""}`;

    const newHistorialItem: HistorialItem = {
      fecha: fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1),
      accion,
      responsable: "Tú",
    };

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
      const orgId = profile?.organization_id;
      if (orgId) {
        await supabase.from("persona_historial").insert({
          organization_id: orgId,
          persona_id: id,
          fecha: fechaIso,
          accion,
          tipo_seguimiento: data.tipo,
          resultado_seguimiento: data.resultado,
          notas: data.notas.trim() || null,
        });
        await supabase.from("lideres").update({ ultimo_seguimiento: fechaIso }).eq("persona_id", id);
        await supabase.from("personas").update({ ultimo_contacto: fechaIso }).eq("id", id);
      }
    }

    setPersona((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        estado: prev.estado === "Visitante" ? "En seguimiento" : prev.estado,
        ultimoContacto: "Hoy",
        historial: [newHistorialItem, ...prev.historial],
      };
    });

    setSuccessToast("Seguimiento registrado");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleConfirmarLiberarGrupo = async () => {
    if (!persona?.grupoId) return;
    setLiberandoGrupo(true);
    try {
      const supabase = createClient();
      const { error: updErr } = await supabase
        .from("personas")
        .update({ grupo_id: null, estado: "En seguimiento", participacion_en_grupo: null })
        .eq("id", id);

      if (updErr) throw updErr;

      setPersona((prev) =>
        prev
          ? {
              ...prev,
              grupoId: null,
              grupo: "Sin asignar",
              grupoImagen: null,
              participacionEnGrupo: null,
              estado: "En seguimiento",
            }
          : prev
      );
      setShowLiberarGrupoModal(false);
      setSuccessToast("Persona quitada del grupo");
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo quitar del grupo.");
    } finally {
      setLiberandoGrupo(false);
    }
  };

  const handleAsignadoGrupo = (grupo: GrupoParaAsignar) => {
    setPersona((prev) =>
      prev
        ? {
            ...prev,
            grupoId: grupo.id,
            grupo: grupo.nombre,
            grupoImagen: grupo.imagen,
            participacionEnGrupo: "miembro",
            estado: "Activo",
          }
        : prev
    );
    setSuccessToast("Grupo asignado correctamente");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleAgregarNota = async () => {
    const texto = nuevaNota.trim();
    if (!texto || !persona) return;
    setErrorNota(null);
    setGuardandoNota(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        setErrorNota("Debes iniciar sesión para agregar una nota.");
        setGuardandoNota(false);
        return;
      }
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("organization_id, full_name")
        .eq("id", user.id)
        .single();
      const orgId = profile?.organization_id;
      if (profileErr || !orgId) {
        setErrorNota("No se pudo obtener tu organización.");
        setGuardandoNota(false);
        return;
      }
      const { data: inserted, error: insertErr } = await supabase
        .from("persona_notas")
        .insert({
          organization_id: orgId,
          persona_id: id,
          contenido: texto,
          created_by: user.id,
        })
        .select("id, contenido, created_at")
        .single();
      if (insertErr) throw insertErr;
      if (!inserted) throw new Error("Sin respuesta al guardar");
      const autor = profile?.full_name?.trim() || "Tú";
      const item: NotaHistorialItem = {
        id: (inserted as { id: string }).id,
        contenido: (inserted as { contenido: string }).contenido,
        creadoEn: formatNotaTimestamp((inserted as { created_at: string }).created_at),
        autor,
      };
      setPersona((prev) => {
        if (!prev) return prev;
        const rest = prev.notasHistorial.filter((n) => n.id !== "legacy");
        return { ...prev, notasHistorial: [item, ...rest] };
      });
      setNuevaNota("");
    } catch (e) {
      setErrorNota(e instanceof Error ? e.message : "No se pudo guardar la nota.");
    } finally {
      setGuardandoNota(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-gray-600 dark:text-gray-400 max-w-md">{loadError}</p>
        <Link href="/personas" className="font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white">
          Volver a personas
        </Link>
      </div>
    );
  }

  if (notFound || !persona) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-600 dark:text-gray-400">Persona no encontrada.</p>
        <Link href="/personas" className="font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white">
          Volver a personas
        </Link>
      </div>
    );
  }

  const whatsappLink = persona.telefono ? `https://wa.me/${persona.telefono.replace(/\D/g, "")}` : null;
  const displayEstado: Estado = (() => {
    if (!persona.grupoId) return persona.estado;
    if (persona.estado === "En servicio" || persona.estado === "Inactivo") return persona.estado;
    if (persona.estado === "Visitante" || persona.estado === "En seguimiento") return "Activo";
    return persona.estado;
  })();

  return (
    <>
      <SeguimientoModal
        isOpen={showSeguimientoModal}
        onClose={() => setShowSeguimientoModal(false)}
        personaNombre={persona.nombre}
        esMiembroActivoEnGrupo={!!persona.grupoId}
        onSave={handleSaveSeguimiento}
      />
      <ConfirmarLiberarGrupoModal
        isOpen={showLiberarGrupoModal}
        onClose={() => !liberandoGrupo && setShowLiberarGrupoModal(false)}
        personaNombre={persona.nombre}
        nombreGrupo={persona.grupo}
        onConfirm={handleConfirmarLiberarGrupo}
        loading={liberandoGrupo}
      />
      <AsignarGrupoModal
        isOpen={showAsignarGrupoModal}
        onClose={() => setShowAsignarGrupoModal(false)}
        personaId={id}
        personaNombre={persona.nombre}
        onAssigned={handleAsignadoGrupo}
      />
      {persona.grupoId && (
        <ParticipacionGrupoModal
          isOpen={showParticipacionModal}
          onClose={() => setShowParticipacionModal(false)}
          personaId={id}
          participacionActual={persona.participacionEnGrupo ?? "miembro"}
          estadoActual={persona.estado}
          nombreGrupo={persona.grupo}
          onUpdated={(p, estado) => {
            setPersona((prev) => (prev ? { ...prev, participacionEnGrupo: p, estado } : prev));
            setSuccessToast("Participación en el grupo actualizada");
            setTimeout(() => setSuccessToast(null), 3000);
          }}
        />
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center gap-3 rounded-full bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-black/15 dark:bg-white dark:text-gray-900 dark:shadow-none">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{successToast}</span>
          </div>
        </div>
      )}
    <div className="w-full max-w-none min-h-[calc(100vh-4rem)] px-4 py-8 md:px-6 lg:px-8">
      {/* Cabecera — misma familia visual que la tabla (superficie suave, sin gradiente). */}
      <div className="mb-8 rounded-3xl bg-gray-100/50 p-5 dark:bg-white/[0.04] md:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="shrink-0 rounded-full bg-white/80 p-1 shadow-sm shadow-black/[0.06] ring-1 ring-black/[0.04] dark:bg-white/[0.08] dark:shadow-none dark:ring-white/[0.08]">
            <UserAvatar seed={persona.nombre} size={104} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-2xl">
                {persona.nombre}
              </h1>
              {persona.rol !== "Visitante" && (
                <span className="rounded-full bg-gray-200/90 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-white/[0.12] dark:text-gray-200">
                  {persona.rol}
                </span>
              )}
              <span
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${estadoStyles[displayEstado].badge}`}
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${estadoStyles[displayEstado].dot}`} />
                {displayEstado}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {persona.grupo !== "Sin asignar" ? `Grupo: ${persona.grupo}` : "Sin grupo asignado"}
              <span className="mx-2">•</span>
              Miembro desde {persona.fechaRegistro}
            </p>
            {displayEstado === "Visitante" && (
              <button
                type="button"
                onClick={() => setShowSeguimientoModal(true)}
                className="group mt-2 flex items-center gap-2 text-sm text-amber-800 transition hover:text-amber-900 dark:text-amber-200/90 dark:hover:text-amber-100"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span className="group-hover:underline">¡Escríbele o llámale! Dale seguimiento a esta persona.</span>
              </button>
            )}
            {displayEstado === "En seguimiento" && (
              <p className="mt-2 flex items-center gap-2 text-sm text-sky-800 dark:text-sky-200/90">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                En proceso de integración. ¡Invítalo a un grupo!
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:flex-col sm:items-end sm:gap-2 md:flex-row md:items-center">
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full p-2.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
                title="WhatsApp"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </a>
            )}
            {persona.telefono && (
              <a
                href={`tel:${persona.telefono}`}
                className="rounded-full p-2.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
                title="Llamar"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </a>
            )}
            <Link
              href={`/personas/${id}/editar`}
              className="rounded-full p-2.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
              title="Editar datos"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </Link>
            <Link
              href="/personas"
              className="rounded-full p-2.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
              title="Volver"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div>
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Info */}
              <div className="rounded-3xl bg-gray-100/40 p-6 dark:bg-white/[0.04]">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Información personal</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {persona.cedula && <InfoItem icon="id" color="blue" label="Documento ID" value={persona.cedula} />}
                  {persona.telefono && <InfoItem icon="phone" color="teal" label="Teléfono" value={persona.telefono} />}
                  {persona.email && <InfoItem icon="email" color="coral" label="Email" value={persona.email} />}
                  {(persona.fechaNacimiento || persona.edad != null) && (
                    <InfoItem
                      icon="cake"
                      color="yellow"
                      label="Fecha de nacimiento"
                      value={persona.fechaNacimiento ? `${persona.fechaNacimiento}${persona.edad != null ? ` (${persona.edad} años)` : ""}` : `${persona.edad} años`}
                    />
                  )}
                  {persona.estadoCivil && <InfoItem icon="heart" color="pink" label="Estado civil" value={persona.estadoCivil} />}
                  {persona.ocupacion && <InfoItem icon="work" color="purple" label="Ocupación" value={persona.ocupacion} />}
                  {persona.direccion && <InfoItem icon="location" color="green" label="Dirección" value={persona.direccion} />}
                </div>
              </div>

              {/* Camino espiritual */}
              <div className="rounded-3xl bg-gray-100/40 p-6 dark:bg-white/[0.04]">
                <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Camino espiritual y llegada</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Contexto al momento del registro (visitante nuevo en la fe, traslado desde otra iglesia, etc.).
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <InfoItem icon="sparkles" color="violet" label="Bautizado/a" value={labelTriBool(persona.bautizado)} />
                  <InfoItem
                    icon="sparkles"
                    color="violet"
                    label="Situación de acercamiento"
                    value={labelSituacionAcercamiento(persona.situacionAcercamiento) || "—"}
                  />
                  <InfoItem icon="sparkles" color="violet" label="¿Viene de otra iglesia?" value={labelTriBool(persona.vieneDeOtraIglesia)} />
                  {persona.nombreIglesiaAnterior && (
                    <InfoItem
                      icon="sparkles"
                      color="violet"
                      label="Iglesia anterior"
                      value={persona.nombreIglesiaAnterior}
                    />
                  )}
                </div>
              </div>

              {/* Notas — historial */}
              <div className="rounded-3xl bg-gray-100/40 p-6 dark:bg-white/[0.04]">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notas</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Anotaciones puntuales sobre esta persona; quedan guardadas con fecha y autor.
                  </p>
                </div>
                <div className="space-y-3 mb-6">
                  <textarea
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    placeholder="Escribe una nota nueva…"
                    rows={3}
                    className="w-full resize-none rounded-2xl bg-gray-100/80 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-300/40 dark:bg-white/[0.06] dark:text-white dark:focus:ring-white/15"
                  />
                  {errorNota && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorNota}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleAgregarNota()}
                    disabled={guardandoNota || !nuevaNota.trim()}
                    className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  >
                    {guardandoNota ? "Guardando…" : "Agregar nota"}
                  </button>
                </div>
                {persona.notasHistorial.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Aún no hay notas. Agrega la primera arriba.</p>
                ) : (
                  <ul className="space-y-3 pt-6">
                    {persona.notasHistorial.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-2xl bg-gray-100/50 p-4 dark:bg-white/[0.05]"
                      >
                        <p className="whitespace-pre-wrap leading-relaxed text-gray-900 dark:text-white">{n.contenido}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                          {n.creadoEn}
                          {n.autor && n.autor !== "—" ? ` · ${n.autor}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* History */}
              <div className="rounded-3xl bg-gray-100/40 p-6 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Historial de actividad</h2>
                </div>
                {persona.historial.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Aún no hay actividad registrada. Registra un seguimiento para ver el historial.</p>
                ) : (
                <div className="space-y-4">
                  {persona.historial.map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 shrink-0 rounded-full bg-gray-400/90 dark:bg-gray-500/70" />
                        {i < persona.historial.length - 1 && (
                          <div className="mt-1 w-px flex-1 bg-gray-200/90 dark:bg-white/10" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.accion}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.fecha} • {item.responsable}</p>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Group */}
              <div className="rounded-3xl bg-gray-100/40 p-6 dark:bg-white/[0.04]">
                <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Grupo</h3>
                {persona.grupoId ? (
                  <div className="space-y-3">
                    <Link
                      href={`/grupos/${persona.grupoId}`}
                      className="block overflow-hidden rounded-2xl bg-gray-100/60 transition hover:bg-gray-200/50 dark:bg-white/[0.06] dark:hover:bg-white/[0.09]"
                    >
                      <div className="relative h-28 w-full bg-gray-100 dark:bg-[#252525]">
                        {persona.grupoImagen ? (
                          <Image
                            src={persona.grupoImagen}
                            alt={persona.grupo}
                            fill
                            className="object-cover object-top"
                            sizes="(max-width: 1024px) 100vw, 320px"
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-semibold leading-snug text-gray-900 dark:text-white">{persona.grupo}</p>
                        {persona.participacionEnGrupo === "apoyo" && (
                          <p className="mt-1 text-xs font-medium text-violet-600 dark:text-violet-400">Grupo de apoyo</p>
                        )}
                        {persona.participacionEnGrupo === "colider" && (
                          <p className="mt-1 text-xs font-medium text-violet-600 dark:text-violet-400">Co-líder</p>
                        )}
                        <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">Ver grupo →</p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowParticipacionModal(true)}
                      className="w-full rounded-full border border-gray-300/70 px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-gray-200/50 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/[0.08]"
                    >
                      Miembro, co-líder o grupo de apoyo
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLiberarGrupoModal(true)}
                      className="w-full rounded-full border border-red-200/80 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50/80 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      Quitar del grupo (liberar)
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Sin grupo asignado</p>
                    <button
                      type="button"
                      onClick={() => setShowAsignarGrupoModal(true)}
                      className="w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                    >
                      Asignar a un grupo
                    </button>
                  </div>
                )}
              </div>

              {/* Racha de asistencia al grupo */}
              <div className="rounded-3xl bg-gray-100/40 p-6 dark:bg-white/[0.04]">
                <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Racha de asistencia al grupo
                </h3>
                {ultimaAsistencia !== null ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-200/80 dark:bg-white/[0.08]">
                        <span className="text-xl font-semibold tabular-nums text-gray-900 dark:text-white">{rachaAsistencia}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {rachaAsistencia === 1 ? "1 semana" : `${rachaAsistencia} semanas`} seguida{rachaAsistencia === 1 ? "" : "s"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Última asistencia: {formatUltimoContacto(ultimaAsistencia)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Aún no hay registros de asistencia al grupo.</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="rounded-3xl bg-gray-100/40 p-6 dark:bg-white/[0.04]">
                <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Acciones rápidas
                </h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowSeguimientoModal(true)}
                    className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-gray-200/40 dark:hover:bg-white/[0.06]"
                  >
                    <svg className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Registrar seguimiento</span>
                  </button>
                  <ActionButton icon="calendar" color="coral" label="Agendar visita" />
                  {persona.grupoId ? (
                    <button
                      type="button"
                      onClick={() => setShowParticipacionModal(true)}
                      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-gray-200/40 dark:hover:bg-white/[0.06]"
                    >
                      <svg className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Co-líder / grupo de apoyo</span>
                    </button>
                  ) : null}
                  <ActionButton icon="tag" color="yellow" label="Cambiar estado" />
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
    </>
  );
}

function InfoItem({ icon, color: _color, label, value }: { icon: string; color: string; label: string; value: string }) {
  const icons: Record<string, JSX.Element> = {
    id: <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />,
    phone: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />,
    email: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />,
    cake: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12" /></>,
    heart: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />,
    work: <><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></>,
    location: <><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></>,
    sparkles: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    ),
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-100/60 px-4 py-3 dark:bg-white/[0.05]">
      <svg
        className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        {icons[icon]}
      </svg>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({ icon, color: _color, label }: { icon: string; color: string; label: string }) {
  const icons: Record<string, JSX.Element> = {
    clock: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />,
    tag: <><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></>,
  };

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-gray-200/40 dark:hover:bg-white/[0.06]"
    >
      <svg
        className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        {icons[icon]}
      </svg>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
    </button>
  );
}
