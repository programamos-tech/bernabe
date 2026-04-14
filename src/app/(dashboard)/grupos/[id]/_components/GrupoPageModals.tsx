"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { soloDigitosDocumentoId } from "@/lib/documento-id";
import { fechaHoyYYYYMMDD } from "@/lib/fecha-hoy-local";
import { ETAPA_LABELS, parseEtapaDb, etapaStyles } from "@/lib/persona-etapa";
import { createClient } from "@/lib/supabase/client";
import { parsePersonaSexo } from "@/lib/persona-sexo";
import { UserAvatar } from "@/components/UserAvatar";

type ParticipacionEnGrupo = "miembro" | "apoyo" | "colider";

const rolMiembroStyles: Record<string, string> = {
  Líder: "text-gray-600 dark:text-gray-300 font-medium",
  Miembro: "text-gray-500 dark:text-gray-400",
  Visitante: "text-gray-500 dark:text-gray-400",
  Diácono: "text-violet-600/90 dark:text-violet-400/90 font-medium",
};

function etapaPillFor(raw: string): { dot: string; badge: string; label: string } {
  const e = parseEtapaDb(raw);
  const { dot, badge } = etapaStyles(e);
  return { dot, badge, label: ETAPA_LABELS[e] };
}


function formatFechaCorta(dateStr: string): string {
  // dateStr viene como YYYY-MM-DD (tipo DATE en Postgres)
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}
export function RegistroAsistenciaModal({
  isOpen,
  onClose,
  grupoId,
  grupoNombre,
  proximaReunionText,
  ubicacion,
  hayMiembrosEnGrupo,
  grupoActivo,
}: {
  isOpen: boolean;
  onClose: () => void;
  grupoId: string;
  grupoNombre: string;
  proximaReunionText: string;
  ubicacion: string;
  /** Sin miembros no se puede registrar asistencia (documento ID debe coincidir con alguien del grupo) */
  hayMiembrosEnGrupo: boolean;
  /** Grupo inactivo: no se registra asistencia */
  grupoActivo: boolean;
}) {
  const [fecha, setFecha] = useState("");
  const [cedula, setCedula] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [personaResuelta, setPersonaResuelta] = useState<{ id: string; nombre: string } | null>(null);
  const [resolviendoDoc, setResolviendoDoc] = useState(false);
  const [confirmoIdentidad, setConfirmoIdentidad] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFecha(new Date().toISOString().slice(0, 10));
      setCedula("");
      setError(null);
      setExito(null);
      setPersonaResuelta(null);
      setResolviendoDoc(false);
      setConfirmoIdentidad(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !grupoActivo || !hayMiembrosEnGrupo) {
      setPersonaResuelta(null);
      setResolviendoDoc(false);
      setConfirmoIdentidad(false);
      return;
    }
    const digits = soloDigitosDocumentoId(cedula);
    setConfirmoIdentidad(false);
    if (!digits) {
      setPersonaResuelta(null);
      setResolviendoDoc(false);
      return;
    }
    setResolviendoDoc(true);
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data: miembros, error: miembrosErr } = await supabase
          .from("personas")
          .select("id, nombre, cedula")
          .eq("grupo_id", grupoId);
        if (cancelled || soloDigitosDocumentoId(cedula) !== digits) return;
        if (miembrosErr) {
          setPersonaResuelta(null);
          return;
        }
        const match = (miembros ?? []).find((p) => {
          const c = (p as { cedula: string | null }).cedula;
          if (!c) return false;
          return soloDigitosDocumentoId(c) === digits;
        }) as { id: string; nombre: string; cedula: string | null } | undefined;
        setPersonaResuelta(match ? { id: match.id, nombre: match.nombre } : null);
      } finally {
        if (!cancelled) {
          setResolviendoDoc(false);
        }
      }
    }, 320);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      setResolviendoDoc(false);
    };
  }, [cedula, isOpen, grupoId, grupoActivo, hayMiembrosEnGrupo]);

  const handleSubmit = useCallback(async () => {
    if (!grupoActivo) {
      setError("Este grupo está inactivo. Reactívalo para registrar asistencia.");
      return;
    }
    if (!hayMiembrosEnGrupo) {
      setError("Este grupo no tiene miembros asignados. Agrega personas antes de registrar asistencia.");
      return;
    }
    const digits = soloDigitosDocumentoId(cedula);
    if (!fecha) {
      setError("Elige la fecha de la reunión.");
      return;
    }
    if (!digits) {
      setError("Ingresa el documento ID del miembro.");
      return;
    }
    if (!personaResuelta || !confirmoIdentidad) {
      setError("Confirma que eres la persona indicada (pulsa «Sí») antes de registrar.");
      return;
    }
    setError(null);
    setExito(null);
    setEnviando(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        setError("Debes iniciar sesión.");
        setEnviando(false);
        return;
      }
      const personaId = personaResuelta.id;

      const [profileRes, personaRes, yaRes] = await Promise.all([
        supabase.from("profiles").select("organization_id, full_name").eq("id", user.id).single(),
        supabase
          .from("personas")
          .select("id, nombre, cedula")
          .eq("id", personaId)
          .eq("grupo_id", grupoId)
          .single(),
        supabase
          .from("persona_asistencia")
          .select("id")
          .eq("persona_id", personaId)
          .eq("grupo_id", grupoId)
          .eq("fecha", fecha)
          .maybeSingle(),
      ]);

      const profile = profileRes.data;
      const orgId = profile?.organization_id;
      if (profileRes.error || !orgId) {
        setError("No se pudo obtener tu organización.");
        setEnviando(false);
        return;
      }

      if (personaRes.error) throw personaRes.error;

      const match = personaRes.data as { id: string; nombre: string; cedula: string | null } | null;
      if (
        !match ||
        match.id !== personaResuelta.id ||
        soloDigitosDocumentoId(match.cedula ?? "") !== digits
      ) {
        setError("El documento ya no coincide con un miembro del grupo. Vuelve a verificar.");
        setEnviando(false);
        return;
      }

      if (yaRes.error) throw yaRes.error;

      if (yaRes.data) {
        setError(`Ya consta asistencia de ${match.nombre} para esa fecha.`);
        setEnviando(false);
        return;
      }

      const { error: insertErr } = await supabase.from("persona_asistencia").insert({
        organization_id: orgId,
        persona_id: match.id,
        grupo_id: grupoId,
        fecha,
      });

      if (insertErr) {
        if (insertErr.code === "23505") {
          setError(`Ya consta asistencia de ${match.nombre} para esa fecha.`);
        } else {
          throw insertErr;
        }
        setEnviando(false);
        return;
      }

      const fechaLabelHist = formatFechaCorta(fecha);
      const accionHistorial = `Asistencia a reunión del grupo «${grupoNombre}» (${fechaLabelHist})`;
      const responsableHist = profile?.full_name?.trim() || "Equipo";
      const matchNombre = match.nombre;
      const matchId = match.id;

      setExito(`Asistencia registrada: ${matchNombre}`);
      setCedula("");
      setPersonaResuelta(null);
      setConfirmoIdentidad(false);
      onClose();

      void supabase
        .from("persona_historial")
        .insert({
          organization_id: orgId,
          persona_id: matchId,
          fecha,
          accion: accionHistorial,
          responsable: responsableHist,
          tipo_seguimiento: "asistencia",
          resultado_seguimiento: null,
          notas: null,
        })
        .then(({ error: historialErr }) => {
          if (historialErr) console.error("persona_historial asistencia:", historialErr);
        });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar la asistencia.");
    } finally {
      setEnviando(false);
    }
  }, [cedula, fecha, grupoId, grupoNombre, hayMiembrosEnGrupo, grupoActivo, personaResuelta, confirmoIdentidad]);

  if (!isOpen) return null;

  const fechaLabel = fecha
    ? new Date(fecha + "T12:00:00").toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-200/60 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900"
        role="dialog"
        aria-labelledby="asistencia-titulo"
      >
        <div className="flex items-center justify-between border-b border-gray-200/60 px-5 py-4 dark:border-white/10">
          <div>
            <h2 id="asistencia-titulo" className="text-lg font-semibold text-gray-900 dark:text-white">
              Registrar asistencia
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{grupoNombre}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg transition"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-2xl bg-gray-100/70 px-4 py-3 text-sm dark:bg-white/[0.06]">
            <p className="font-medium text-gray-900 dark:text-white">{proximaReunionText}</p>
            {ubicacion && <p className="text-gray-600 dark:text-gray-400 mt-1">{ubicacion}</p>}
            {fechaLabel && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">Fecha: {fechaLabel}</p>
            )}
          </div>

          {!grupoActivo ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
              <p className="font-medium">Grupo inactivo</p>
              <p className="mt-1 text-amber-800/90 dark:text-amber-100/90">
                Reactiva el grupo desde <strong>Acciones rápidas</strong> para poder registrar asistencia.
              </p>
            </div>
          ) : !hayMiembrosEnGrupo ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
              <p className="font-medium">No hay miembros en este grupo</p>
              <p className="mt-1 text-amber-800/90 dark:text-amber-100/90">
                Primero agrega personas con <strong>+ Agregar miembro</strong>. La asistencia solo se puede registrar para quienes ya pertenecen al grupo.
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor="cedula-asistencia" className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Documento ID del miembro
              </label>
              <input
                id="cedula-asistencia"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                placeholder="Ej: 1234567890"
                value={cedula}
                onChange={(e) => setCedula(soloDigitosDocumentoId(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:ring-white/20"
              />
              {soloDigitosDocumentoId(cedula) ? (
                <div className="mt-3 space-y-2">
                  {resolviendoDoc ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Buscando en el grupo…</p>
                  ) : personaResuelta ? (
                    <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-3 dark:border-white/10 dark:bg-white/[0.05]">
                      <p className="text-sm text-gray-800 dark:text-gray-100">
                        ¿Tú eres <span className="font-semibold text-gray-900 dark:text-white">{personaResuelta.nombre}</span>?
                      </p>
                      {confirmoIdentidad ? (
                        <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300/90">
                          Listo. Ahora puedes pulsar <span className="font-semibold">Registrar</span>.
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmoIdentidad(true)}
                          className="mt-2.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                        >
                          Sí, soy yo
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-800/90 dark:text-amber-200/90">
                      No encontramos ese documento entre los miembros de este grupo.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{error}</p>
          )}
          {exito && (
            <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2">{exito}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full py-3 px-4 font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.08]"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={
                enviando ||
                !hayMiembrosEnGrupo ||
                !grupoActivo ||
                !personaResuelta ||
                !confirmoIdentidad ||
                resolviendoDoc
              }
              className="flex-1 rounded-full bg-gray-900 py-3 px-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              {enviando ? "Guardando…" : "Registrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function filasCoincidenDigitosDocumento<T extends { cedula: string | null }>(rows: T[], digits: string): T[] {
  if (digits.length >= 4) {
    return rows.filter((p) => soloDigitosDocumentoId(p.cedula ?? "").includes(digits));
  }
  return rows;
}

function elegirMejorCoincidenciaBusqueda<T extends { nombre: string; cedula: string | null }>(
  candidatos: T[],
  digits: string,
): T {
  const primero = candidatos[0]!;
  if (candidatos.length === 1) return primero;
  if (digits.length >= 4) {
    const exacta = candidatos.find((p) => soloDigitosDocumentoId(p.cedula ?? "") === digits);
    if (exacta) return exacta;
  }
  return [...candidatos].sort((a, b) => a.nombre.localeCompare(b.nombre))[0]!;
}

function participacionEnGrupoDb(raw: string | null | undefined): ParticipacionEnGrupo {
  if (raw === "apoyo" || raw === "colider" || raw === "miembro") return raw;
  return "miembro";
}

function hintPersonaEnOtroGrupo(nombre: string): string {
  return `${nombre}: está en otro grupo. Libérala en su ficha.`;
}

/** En este grupo pero no encaja en la búsqueda (rol o etapa). */
function hintEnEsteGrupoNoCandidata(
  nombre: string,
  participacion: ParticipacionEnGrupo,
  modo: "apoyo" | "colider",
  etapaP: ReturnType<typeof parseEtapaDb>,
): string {
  if (modo === "colider") {
    if (participacion === "colider") return `${nombre}: ya es co-líder.`;
    if (participacion === "miembro") {
      return `${nombre}: el co-líder solo se designa desde grupo de apoyo. Pásala a apoyo primero.`;
    }
    return `${nombre}: no aplica como co-líder aquí.`;
  }
  if (participacion === "miembro" && etapaP !== "consolidado") {
    return `${nombre}: hace falta etapa ${ETAPA_LABELS.consolidado}. (Ahora: ${ETAPA_LABELS[etapaP]}.)`;
  }
  if (participacion === "apoyo") return `${nombre}: ya está en grupo de apoyo.`;
  if (participacion === "colider") return `${nombre}: ya es co-líder (líder en formación). El apoyo es otro rol.`;
  return `${nombre}: no aplica aquí.`;
}

function hintEtapaRequiereConsolidadoFueraDeGrupo(nombre: string, etapaLabel: string): string {
  return `${nombre}: hace falta ${ETAPA_LABELS.consolidado}. (Ahora: ${etapaLabel}.)`;
}

function hintPersonaYaTieneGrupoMiembro(nombre: string): string {
  return `${nombre}: ya tiene grupo. Aquí solo sin grupo.`;
}

/** Apoyo: consolidado sin grupo o miembro del núcleo de este grupo. Co-líder: solo quien ya está en apoyo en este grupo. */
function esCandidataRolServicio(
  p: { etapa: string | null; grupo_id: string | null; participacion_en_grupo: string | null },
  grupoId: string,
  modo: "apoyo" | "colider",
): boolean {
  if (modo === "colider") {
    return p.grupo_id === grupoId && participacionEnGrupoDb(p.participacion_en_grupo) === "apoyo";
  }
  if (parseEtapaDb(p.etapa) !== "consolidado") return false;
  if (p.grupo_id == null) return true;
  if (p.grupo_id !== grupoId) return false;
  return participacionEnGrupoDb(p.participacion_en_grupo) === "miembro";
}

type FilaAgregarPersona = {
  id: string;
  nombre: string;
  sexo: string | null;
  cedula: string | null;
  rol: string;
  etapa: string;
  grupo_id: string | null;
  /** Sin grupo (nuevo) vs ya en este grupo (cambio de rol). */
  origen: "sin_grupo" | "mismo_grupo";
};

export function AgregarPersonasModal({
  isOpen,
  onClose,
  grupoId,
  modo,
  onRefetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  grupoId: string;
  modo: "apoyo" | "miembros" | "colider";
  onRefetch: () => Promise<void>;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<FilaAgregarPersona[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [agregandoIds, setAgregandoIds] = useState<Record<string, boolean>>({});
  const [hintListaVacia, setHintListaVacia] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setResultados([]);
    setError(null);
    setExito(null);
    setHintListaVacia(null);
  }, [isOpen, modo]);

  useEffect(() => {
    if (!isOpen) return;
    const q = query.trim();
    if (!q) {
      setResultados([]);
      setError(null);
      setHintListaVacia(null);
      return;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      setBuscando(true);
      setError(null);
      setExito(null);
      try {
        const qSafe = q.replace(/[%_]/g, "");
        const digits = soloDigitosDocumentoId(qSafe);

        const { data, error: qErr } = await supabase
          .from("personas")
          .select("id, nombre, sexo, cedula, rol, etapa, grupo_id, participacion_en_grupo")
          .or(`cedula.ilike.%${qSafe}%,nombre.ilike.%${qSafe}%`)
          .limit(20);

        if (cancelled) return;
        if (qErr) throw qErr;

        const rows = (data ?? []) as {
          id: string;
          nombre: string;
          sexo: string | null;
          cedula: string | null;
          rol: string | null;
          etapa: string | null;
          grupo_id: string | null;
          participacion_en_grupo: string | null;
        }[];

        const mapRow = (p: (typeof rows)[number], origen: FilaAgregarPersona["origen"]): FilaAgregarPersona => ({
          id: p.id,
          nombre: p.nombre,
          sexo: p.sexo ?? null,
          cedula: p.cedula,
          rol: p.rol ?? "Miembro",
          etapa: p.etapa ?? "visitante",
          grupo_id: p.grupo_id ?? null,
          origen,
        });

        if (modo === "miembros") {
          const sinGrupo = rows.filter((p) => p.grupo_id == null);
          const finales = filasCoincidenDigitosDocumento(sinGrupo, digits);
          const ordenados = finales.map((p) => mapRow(p, "sin_grupo")).sort((a, b) => a.nombre.localeCompare(b.nombre));
          setResultados(ordenados);

          if (ordenados.length === 0) {
            const candidatosTodos = filasCoincidenDigitosDocumento(rows, digits);
            if (candidatosTodos.length > 0) {
              const p = elegirMejorCoincidenciaBusqueda(candidatosTodos, digits);
              setHintListaVacia(p.grupo_id != null ? hintPersonaYaTieneGrupoMiembro(p.nombre) : null);
            } else {
              setHintListaVacia(null);
            }
          } else {
            setHintListaVacia(null);
          }
        } else {
          const modoRol = modo;
          const finalesTodos = filasCoincidenDigitosDocumento(rows, digits);
          const candidatas = finalesTodos
            .filter((p) => esCandidataRolServicio(p, grupoId, modoRol))
            .map((p) => mapRow(p, p.grupo_id === grupoId ? "mismo_grupo" : "sin_grupo"))
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
          setResultados(candidatas);

          if (candidatas.length === 0) {
            const candidatosTodos = filasCoincidenDigitosDocumento(rows, digits);
            if (candidatosTodos.length === 0) {
              setHintListaVacia(null);
            } else {
              const p = elegirMejorCoincidenciaBusqueda(candidatosTodos, digits);
              const etapaP = parseEtapaDb(p.etapa);
              const part = participacionEnGrupoDb(p.participacion_en_grupo);
              if (p.grupo_id && p.grupo_id !== grupoId) {
                setHintListaVacia(hintPersonaEnOtroGrupo(p.nombre));
              } else if (p.grupo_id === grupoId) {
                if (esCandidataRolServicio(p, grupoId, modoRol)) {
                  setHintListaVacia(null);
                } else {
                  setHintListaVacia(hintEnEsteGrupoNoCandidata(p.nombre, part, modoRol, etapaP));
                }
              } else if (p.grupo_id == null) {
                if (modoRol === "colider") {
                  setHintListaVacia(
                    `${p.nombre}: el co-líder solo se elige entre quien ya está en grupo de apoyo en este grupo.`,
                  );
                } else if (etapaP !== "consolidado") {
                  setHintListaVacia(hintEtapaRequiereConsolidadoFueraDeGrupo(p.nombre, ETAPA_LABELS[etapaP]));
                } else {
                  setHintListaVacia(null);
                }
              }
            }
          } else {
            setHintListaVacia(null);
          }
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "No se pudo buscar personas.");
      } finally {
        if (!cancelled) setBuscando(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, isOpen, grupoId, modo, supabase]);

  const handleAgregar = async (personaId: string) => {
    setError(null);
    setExito(null);
    setAgregandoIds((prev) => ({ ...prev, [personaId]: true }));
    try {
      const { data: personaRow, error: getErr } = await supabase
        .from("personas")
        .select("grupo_id, etapa, participacion_en_grupo")
        .eq("id", personaId)
        .single();
      if (getErr) throw getErr;

      const hoy = fechaHoyYYYYMMDD();

      if (modo === "miembros") {
        if (personaRow?.grupo_id) {
          setError("Solo sin grupo. Libérala en su ficha si debe cambiar.");
          return;
        }
        const { error: updErr } = await supabase
          .from("personas")
          .update({
            grupo_id: grupoId,
            etapa: "consolidado",
            participacion_en_grupo: "miembro",
            fecha_ingreso_grupo: hoy,
            co_lider_desde: null,
          })
          .eq("id", personaId);
        if (updErr) throw updErr;
        setExito("Agregada al núcleo.");
        setResultados((prev) => prev.filter((r) => r.id !== personaId));
        await onRefetch();
        return;
      }

      if (modo === "apoyo") {
        if (parseEtapaDb(personaRow?.etapa) !== "consolidado") {
          setError(`Requiere etapa ${ETAPA_LABELS.consolidado}.`);
          return;
        }

        const gid = personaRow?.grupo_id ?? null;
        if (gid && gid !== grupoId) {
          setError("Está en otro grupo. Libérala en su ficha.");
          return;
        }

        const partActual = participacionEnGrupoDb(personaRow?.participacion_en_grupo);
        const yaEnEsteGrupo = gid === grupoId;

        if (!esCandidataRolServicio(
          { etapa: personaRow?.etapa ?? null, grupo_id: gid, participacion_en_grupo: personaRow?.participacion_en_grupo ?? null },
          grupoId,
          "apoyo",
        )) {
          setError("No aplica para grupo de apoyo.");
          return;
        }
        if (yaEnEsteGrupo) {
          const { error: updErr } = await supabase
            .from("personas")
            .update({
              participacion_en_grupo: "apoyo",
              etapa: "en_servicio",
              co_lider_desde: null,
            })
            .eq("id", personaId);
          if (updErr) throw updErr;
          setExito("Pasada a grupo de apoyo.");
        } else {
          const { error: updErr } = await supabase
            .from("personas")
            .update({
              grupo_id: grupoId,
              etapa: "en_servicio",
              participacion_en_grupo: "apoyo",
              fecha_ingreso_grupo: hoy,
              co_lider_desde: null,
            })
            .eq("id", personaId);
          if (updErr) throw updErr;
          setExito("Agregada al grupo de apoyo.");
        }
        setResultados((prev) => prev.filter((r) => r.id !== personaId));
        await onRefetch();
        return;
      }

      // colider: solo desde grupo de apoyo en este mismo grupo
      const gidCol = personaRow?.grupo_id ?? null;
      if (gidCol !== grupoId) {
        setError("El co-líder solo se designa entre quien ya está en apoyo en este grupo.");
        return;
      }
      if (participacionEnGrupoDb(personaRow?.participacion_en_grupo) !== "apoyo") {
        setError("Solo personas en grupo de apoyo de este grupo.");
        return;
      }
      if (
        !esCandidataRolServicio(
          {
            etapa: personaRow?.etapa ?? null,
            grupo_id: gidCol,
            participacion_en_grupo: personaRow?.participacion_en_grupo ?? null,
          },
          grupoId,
          "colider",
        )
      ) {
        setError("No aplica como co-líder aquí.");
        return;
      }
      const { error: updErr } = await supabase
        .from("personas")
        .update({
          participacion_en_grupo: "colider",
          etapa: "lider_en_formacion",
          co_lider_desde: hoy,
        })
        .eq("id", personaId);
      if (updErr) throw updErr;
      setExito("Designada co-líder.");
      setResultados((prev) => prev.filter((r) => r.id !== personaId));
      await onRefetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo agregar la persona.");
    } finally {
      setAgregandoIds((prev) => ({ ...prev, [personaId]: false }));
    }
  };

  if (!isOpen) return null;

  const titulo =
    modo === "apoyo" ? "Agregar grupo de apoyo" : modo === "colider" ? "Designar co-líder" : "Agregar miembros";

  const descripcionModal =
    modo === "apoyo"
      ? `${ETAPA_LABELS.consolidado}: sin grupo o núcleo de este grupo. Pasa a apoyo → etapa ${ETAPA_LABELS.en_servicio}.`
      : modo === "colider"
        ? `Solo quien ya está en grupo de apoyo de este grupo. Pasa a co-líder → ${ETAPA_LABELS.lider_en_formacion}.`
        : "Solo quien no tiene grupo. Entra al núcleo.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200/60 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-gray-200/60 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{titulo}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{descripcionModal}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg transition"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
              Nombre o documento ID
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre o documento ID"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:ring-white/20"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{error}</p>}
          {exito && <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2">{exito}</p>}

          <div className="overflow-hidden rounded-2xl border border-gray-200/60 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-gray-200/60 px-4 py-3 dark:border-white/10">
              <p className="text-sm text-gray-500 dark:text-gray-400">{buscando ? "Buscando…" : `${resultados.length} resultado(s)`}</p>
            </div>

            {resultados.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                {buscando ? (
                  "Un momento…"
                ) : hintListaVacia ? (
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{hintListaVacia}</p>
                ) : modo === "apoyo" ? (
                  `Sin candidatas (${ETAPA_LABELS.consolidado}). Otro nombre o documento.`
                ) : modo === "colider" ? (
                  "Sin candidatas en grupo de apoyo de este grupo. Otro nombre o documento."
                ) : (
                  "Sin personas sin grupo. Otro criterio."
                )}
              </div>
            ) : (
              <div className="scrollbar-brand max-h-[320px] divide-y divide-gray-200/50 overflow-y-auto overscroll-y-contain dark:divide-white/10">
                {resultados.map((p) => {
                  const pill = etapaPillFor(p.etapa);
                  const rolClass = rolMiembroStyles[p.rol] ?? "text-gray-500 dark:text-gray-400";
                  const esAgregando = !!agregandoIds[p.id];
                  const etiquetaAccion =
                    modo === "miembros"
                      ? esAgregando
                        ? "Agregando…"
                        : "Agregar al núcleo"
                      : modo === "apoyo"
                        ? esAgregando
                          ? "Guardando…"
                          : p.origen === "mismo_grupo"
                            ? "Pasar a apoyo"
                            : "Agregar al apoyo"
                        : esAgregando
                          ? "Guardando…"
                          : "Designar co-líder";
                  return (
                    <div
                      key={p.id}
                      className="flex min-w-0 items-center justify-between gap-3 px-4 py-3 transition hover:bg-gray-200/40 dark:hover:bg-white/[0.06]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar seed={p.nombre} sexo={parsePersonaSexo(p.sexo)} size={36} />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{p.nombre}</p>
                          <p className={`text-xs truncate mt-0.5 ${rolClass}`}>{p.rol}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                            {p.cedula ? `Doc. ID: ${p.cedula}` : ""}
                            {p.origen === "mismo_grupo" && modo !== "miembros" ? " · En este grupo" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <span
                          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${pill.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${pill.dot}`} />
                          {pill.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleAgregar(p.id)}
                          disabled={esAgregando}
                          className="shrink-0 whitespace-nowrap rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                        >
                          {etiquetaAccion}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full py-3 px-4 font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.08]"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
