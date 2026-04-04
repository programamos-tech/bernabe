"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { GrupoAvatarCluster } from "@/components/GrupoAvatarCluster";
import { UserAvatar } from "@/components/UserAvatar";
import { soloDigitosDocumentoId } from "@/lib/documento-id";
import { createClient } from "@/lib/supabase/client";

type TipoGrupo = "parejas" | "jovenes" | "teens" | "hombres" | "mujeres" | "general";

interface LiderResumen {
  id: string;
  nombre: string;
  telefono: string | null;
}

interface GrupoData {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  imagen: string | null;
  dia: string | null;
  hora: string | null;
  ubicacion: string | null;
  activo: boolean;
  miembros_count: number;
  created_at: string;
  lideres: LiderResumen | null;
}

function normalizeLideres(
  raw: LiderResumen | LiderResumen[] | null | undefined
): LiderResumen | null {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

type ParticipacionEnGrupo = "miembro" | "apoyo" | "colider";

interface MiembroData {
  id: string;
  nombre: string;
  rol: string;
  estado: string;
  participacion_en_grupo: ParticipacionEnGrupo;
}

const tipoLabels: Record<string, string> = {
  parejas: "Parejas",
  jovenes: "Jóvenes",
  teens: "Teens",
  hombres: "Hombres",
  mujeres: "Mujeres",
  general: "General",
};

/** Misma lógica visual que la lista de Personas (punto pastel + chip suave). */
const estadoMiembroPill: Record<string, { dot: string; badge: string }> = {
  Activo: {
    dot: "bg-emerald-400/75 dark:bg-emerald-400/55",
    badge: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
  },
  Visitante: {
    dot: "bg-amber-300/90 dark:bg-amber-300/65",
    badge: "bg-amber-400/15 text-amber-900 dark:text-amber-100",
  },
  Inactivo: {
    dot: "bg-gray-400/85 dark:bg-gray-500/65",
    badge: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
  },
  "En seguimiento": {
    dot: "bg-sky-400/80 dark:bg-sky-400/55",
    badge: "bg-sky-500/10 text-sky-900 dark:text-sky-200",
  },
  "En servicio": {
    dot: "bg-violet-400/80 dark:bg-violet-400/55",
    badge: "bg-violet-500/12 text-violet-900 dark:text-violet-200",
  },
};

function estadoMiembroPillFor(estado: string) {
  return (
    estadoMiembroPill[estado] ?? {
      dot: "bg-gray-400/85 dark:bg-gray-500/65",
      badge: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
    }
  );
}

/**
 * Misma regla que en la lista de Personas: quien ya está en un grupo no se muestra
 * como Visitante / En seguimiento; pasa a verse como Activo salvo Inactivo.
 */
function estadoVisibleEnGrupo(estado: string): string {
  if (estado === "En servicio") return "En servicio";
  if (estado === "Visitante" || estado === "En seguimiento") return "Activo";
  return estado;
}

const rolMiembroStyles: Record<string, string> = {
  Líder: "text-gray-600 dark:text-gray-300 font-medium",
  Miembro: "text-gray-500 dark:text-gray-400",
  Visitante: "text-gray-500 dark:text-gray-400",
  Diácono: "text-violet-600/90 dark:text-violet-400/90 font-medium",
};

function etiquetaParticipacion(m: MiembroData): { texto: string; className: string } {
  if (m.participacion_en_grupo === "colider") {
    return { texto: "Co-líder", className: "text-violet-700 dark:text-violet-300 font-medium" };
  }
  if (m.participacion_en_grupo === "apoyo") {
    return { texto: "Grupo de apoyo", className: "text-violet-600/90 dark:text-violet-400/90 font-medium" };
  }
  return {
    texto: m.rol ?? "Miembro",
    className: rolMiembroStyles[m.rol] ?? "text-gray-500 dark:text-gray-400",
  };
}

function formatCreatedAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

function formatFechaCorta(dateStr: string): string {
  // dateStr viene como YYYY-MM-DD (tipo DATE en Postgres)
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function toDateStrLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function RegistroAsistenciaModal({
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

  useEffect(() => {
    if (isOpen) {
      setFecha(new Date().toISOString().slice(0, 10));
      setCedula("");
      setError(null);
      setExito(null);
    }
  }, [isOpen]);

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
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("organization_id, full_name")
        .eq("id", user.id)
        .single();
      const orgId = profile?.organization_id;
      if (profileErr || !orgId) {
        setError("No se pudo obtener tu organización.");
        setEnviando(false);
        return;
      }

      const { data: miembros, error: miembrosErr } = await supabase
        .from("personas")
        .select("id, nombre, cedula")
        .eq("grupo_id", grupoId);

      if (miembrosErr) throw miembrosErr;

      const match = (miembros ?? []).find((p) => {
        const c = (p as { cedula: string | null }).cedula;
        if (!c) return false;
        return soloDigitosDocumentoId(c) === digits;
      }) as { id: string; nombre: string; cedula: string | null } | undefined;

      if (!match) {
        setError("El documento ID ingresado no corresponde a un miembro de este grupo.");
        setEnviando(false);
        return;
      }

      const { data: yaExiste } = await supabase
        .from("persona_asistencia")
        .select("id")
        .eq("persona_id", match.id)
        .eq("grupo_id", grupoId)
        .eq("fecha", fecha)
        .maybeSingle();

      if (yaExiste) {
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

      const { error: historialErr } = await supabase.from("persona_historial").insert({
        organization_id: orgId,
        persona_id: match.id,
        fecha,
        accion: accionHistorial,
        responsable: responsableHist,
        tipo_seguimiento: "asistencia",
        resultado_seguimiento: null,
        notas: null,
      });

      if (historialErr) {
        console.error("persona_historial asistencia:", historialErr);
      }

      setExito(`Asistencia registrada: ${match.nombre}`);
      setCedula("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar la asistencia.");
    } finally {
      setEnviando(false);
    }
  }, [cedula, fecha, grupoId, grupoNombre, hayMiembrosEnGrupo, grupoActivo]);

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
              disabled={enviando || !hayMiembrosEnGrupo || !grupoActivo}
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

function AgregarPersonasModal({
  isOpen,
  onClose,
  grupoId,
  modo,
  onRefetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  grupoId: string;
  modo: "apoyo" | "miembros";
  onRefetch: () => Promise<void>;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<
    {
      id: string;
      nombre: string;
      cedula: string | null;
      rol: string;
      estado: string;
      grupo_id: string | null;
    }[]
  >([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [agregandoIds, setAgregandoIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setResultados([]);
    setError(null);
    setExito(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const q = query.trim();
    if (!q) {
      setResultados([]);
      setError(null);
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
          .select("id, nombre, cedula, rol, estado, grupo_id")
          .or(`cedula.ilike.%${qSafe}%,nombre.ilike.%${qSafe}%`)
          .limit(20);

        if (cancelled) return;
        if (qErr) throw qErr;

        const rows = (data ?? []) as {
          id: string;
          nombre: string;
          cedula: string | null;
          rol: string | null;
          estado: string | null;
          grupo_id: string | null;
        }[];

        const sinEsteGrupo = rows.filter((p) => p.grupo_id !== grupoId);

        const finales =
          digits && digits.length >= 4
            ? sinEsteGrupo.filter((p) => soloDigitosDocumentoId(p.cedula ?? "").includes(digits))
            : sinEsteGrupo;

        const ordenados = finales
          .map((p) => ({
            id: p.id,
            nombre: p.nombre,
            cedula: p.cedula,
            rol: p.rol ?? "Miembro",
            estado: p.estado ?? "Visitante",
            grupo_id: p.grupo_id ?? null,
          }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));

        setResultados(ordenados);
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
  }, [query, isOpen, grupoId, supabase]);

  const handleAgregar = async (personaId: string) => {
    setError(null);
    setExito(null);
    setAgregandoIds((prev) => ({ ...prev, [personaId]: true }));
    try {
      // Validación: una persona no puede estar en 2 grupos a la vez.
      const { data: personaRow, error: getErr } = await supabase
        .from("personas")
        .select("grupo_id")
        .eq("id", personaId)
        .single();
      if (getErr) throw getErr;
      if (personaRow?.grupo_id) {
        setError("Esa persona pertenece a otro grupo. Libérala primero para poder agregarla.");
        return;
      }

      const participacion: ParticipacionEnGrupo = modo === "apoyo" ? "apoyo" : "miembro";
      const nuevoEstado = modo === "apoyo" ? "En servicio" : "Activo";

      const { error: updErr } = await supabase.from("personas").update({
        grupo_id: grupoId,
        estado: nuevoEstado,
        participacion_en_grupo: participacion,
      }).eq("id", personaId);

      if (updErr) throw updErr;

      setExito(modo === "apoyo" ? "Persona agregada al grupo de apoyo." : "Persona agregada al grupo.");
      setResultados((prev) => prev.filter((r) => r.id !== personaId));
      await onRefetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo agregar la persona.");
    } finally {
      setAgregandoIds((prev) => ({ ...prev, [personaId]: false }));
    }
  };

  if (!isOpen) return null;

  const titulo = modo === "apoyo" ? "Agregar grupo de apoyo" : "Agregar miembros";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200/60 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-gray-200/60 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{titulo}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {modo === "apoyo"
                ? "Quedarán en la sección Grupo de apoyo y su estado será En servicio."
                : "Busca por nombre o documento ID y agrégalo como miembro del núcleo."}
            </p>
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
              placeholder="Ej: Melissa o 1102867002"
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
                {buscando ? "Un momento…" : "No hay resultados. Prueba con otro nombre o documento ID."}
              </div>
            ) : (
              <div className="scrollbar-brand max-h-[320px] divide-y divide-gray-200/50 overflow-y-auto overscroll-y-contain dark:divide-white/10">
                {resultados.map((p) => {
                  const estadoMostrado = p.estado;
                  const pill = estadoMiembroPillFor(estadoMostrado);
                  const rolClass = rolMiembroStyles[p.rol] ?? "text-gray-500 dark:text-gray-400";
                  const esAgregando = !!agregandoIds[p.id];
                  const enOtroGrupo = p.grupo_id != null;
                  return (
                    <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3 transition hover:bg-gray-200/40 dark:hover:bg-white/[0.06]">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar seed={p.nombre} size={36} />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{p.nombre}</p>
                          <p className={`text-xs truncate mt-0.5 ${rolClass}`}>{p.rol}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{p.cedula ? `Doc. ID: ${p.cedula}` : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${pill.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${pill.dot}`} />
                          {estadoMostrado}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleAgregar(p.id)}
                          disabled={esAgregando || enOtroGrupo}
                          className={`rounded-full px-3 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                            enOtroGrupo
                              ? "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                              : "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                          }`}
                        >
                          {enOtroGrupo ? "En otro grupo" : esAgregando ? "Agregando…" : "Agregar"}
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

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [grupo, setGrupo] = useState<GrupoData | null>(null);
  const [miembros, setMiembros] = useState<MiembroData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [modalAsistencia, setModalAsistencia] = useState(false);
  const [modalAgregarPersonas, setModalAgregarPersonas] = useState(false);
  const [modoAgregarPersonas, setModoAgregarPersonas] = useState<"apoyo" | "miembros">("miembros");
  const [modalInactivar, setModalInactivar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [grupoAccionLoading, setGrupoAccionLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [asistenciaMes, setAsistenciaMes] = useState<number>(0);
  const [reunionesMes, setReunionesMes] = useState<number>(0);
  const [
    ultimasReuniones,
    setUltimasReuniones,
  ] = useState<{ fecha: string; asistentes: number; nombres: string[] }[]>([]);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    Promise.all([
      supabase
        .from("grupos")
        .select("id, nombre, descripcion, tipo, imagen, dia, hora, ubicacion, activo, miembros_count, created_at, lideres(id, nombre, telefono)")
        .eq("id", id)
        .single(),
      supabase
        .from("personas")
        .select("id, nombre, rol, estado, participacion_en_grupo")
        .eq("grupo_id", id)
        .order("nombre"),
    ]).then(([grupoRes, personasRes]) => {
      if (grupoRes.error || !grupoRes.data) {
        setNotFound(true);
        setGrupo(null);
      } else {
        const g = grupoRes.data as GrupoData & { lideres?: LiderResumen | LiderResumen[] | null };
        setGrupo({
          ...g,
          lideres: normalizeLideres(g.lideres),
        });
      }
      const rows = (personasRes.data ?? []) as MiembroData[];
      setMiembros(
        rows.map((m) => ({
          ...m,
          rol: m.rol ?? "Miembro",
          participacion_en_grupo: (m.participacion_en_grupo as ParticipacionEnGrupo) ?? "miembro",
        }))
      );
      setLoading(false);
    });
  }, [id]);

  const cargarStats = useCallback(async () => {
    if (!id) return;
    const supabase = createClient();
    setStatsLoading(true);
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const startStr = toDateStrLocal(start);
      const endStr = toDateStrLocal(end);

      const { data: mesRows } = await supabase
        .from("persona_asistencia")
        .select("persona_id, fecha")
        .eq("grupo_id", id)
        .gte("fecha", startStr)
        .lt("fecha", endStr);

      const filasMes = (mesRows ?? []) as { persona_id: string; fecha: string }[];
      const personasMes = new Set(filasMes.map((r) => r.persona_id));
      const fechasMes = new Set(filasMes.map((r) => r.fecha));

      setAsistenciaMes(personasMes.size);
      setReunionesMes(fechasMes.size);

      // Últimas reuniones: top 5 fechas con al menos 1 asistencia
      const { data: ultRows } = await supabase
        .from("persona_asistencia")
        .select("persona_id, fecha")
        .eq("grupo_id", id)
        .order("fecha", { ascending: false })
        .limit(300);

      const filasUlt = (ultRows ?? []) as { persona_id: string; fecha: string }[];
      const byFecha = new Map<string, Set<string>>();
      for (const row of filasUlt) {
        if (!byFecha.has(row.fecha)) byFecha.set(row.fecha, new Set());
        byFecha.get(row.fecha)!.add(row.persona_id);
      }

      const ultFechas = Array.from(byFecha.entries())
        .map(([fecha, personas]) => ({ fecha, asistentes: personas.size }))
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
        .slice(0, 5);

      const fechasTop = ultFechas.map((u) => u.fecha);
      const { data: ultPersonasRows } = await supabase
        .from("persona_asistencia")
        .select("fecha, persona_id, personas(nombre)")
        .eq("grupo_id", id)
        .in("fecha", fechasTop);

      const byFechaNombres = new Map<string, string[]>();
      for (const row of (ultPersonasRows ?? []) as {
        fecha: string;
        persona_id: string;
        personas?: { nombre: string | null } | { nombre: string | null }[] | null;
      }[]) {
        const p = row.personas;
        const personaRow = Array.isArray(p) ? p[0] : p;
        const nombre = personaRow?.nombre ?? "";
        if (!byFechaNombres.has(row.fecha)) byFechaNombres.set(row.fecha, []);
        if (nombre && !byFechaNombres.get(row.fecha)!.includes(nombre)) {
          byFechaNombres.get(row.fecha)!.push(nombre);
        }
      }

      const ultFinal = ultFechas.map((u) => {
        const nombres = byFechaNombres.get(u.fecha) ?? [];
        const limit = 3;
        const nombresLimitados =
          nombres.length > limit ? [...nombres.slice(0, limit), `+${nombres.length - limit} más`] : nombres;
        return { ...u, nombres: nombresLimitados };
      });

      setUltimasReuniones(ultFinal);
    } finally {
      setStatsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Inicial + refresco al cambiar de grupo
    void cargarStats();
  }, [cargarStats]);

  useEffect(() => {
    // Cuando se cierre el modal (normalmente después de registrar), recargar estadísticas
    if (!modalAsistencia) void cargarStats();
  }, [modalAsistencia, cargarStats]);

  useEffect(() => {
    if (modalAsistencia && miembros.length === 0) {
      setModalAsistencia(false);
    }
  }, [modalAsistencia, miembros.length]);

  useEffect(() => {
    if (grupo && !grupo.activo) {
      setModalAgregarPersonas(false);
      setModalAsistencia(false);
    }
  }, [grupo?.activo, grupo]);

  const cargarMiembros = useCallback(async () => {
    const supabase = createClient();
    const { data: personasRes } = await supabase
      .from("personas")
      .select("id, nombre, rol, estado, participacion_en_grupo")
      .eq("grupo_id", id)
      .order("nombre");

    const rows = (personasRes ?? []) as MiembroData[];
    setMiembros(
      rows.map((m) => ({
        ...m,
        rol: m.rol ?? "Miembro",
        participacion_en_grupo: (m.participacion_en_grupo as ParticipacionEnGrupo) ?? "miembro",
      }))
    );
  }, [id]);

  const miembrosNucleo = useMemo(
    () => miembros.filter((m) => m.participacion_en_grupo !== "apoyo"),
    [miembros]
  );
  const apoyoLista = useMemo(
    () => miembros.filter((m) => m.participacion_en_grupo === "apoyo"),
    [miembros]
  );

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

  if (notFound || !grupo) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Grupo no encontrado.</p>
        <Link href="/grupos" className="font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white">
          Volver a grupos
        </Link>
      </div>
    );
  }

  const tipoLabel = tipoLabels[grupo.tipo] ?? grupo.tipo;
  const estadoLabel = grupo.activo ? "Activo" : "Inactivo";
  const proximaReunion = grupo.dia && grupo.hora ? `${grupo.dia} a las ${grupo.hora}` : "—";
  const grupoOperativo = grupo.activo !== false;
  const puedeEliminarGrupo = miembros.length === 0;

  const confirmarInactivarGrupo = async () => {
    setGrupoAccionLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("grupos").update({ activo: false }).eq("id", grupo.id);
      if (error) throw error;
      setGrupo((prev) => (prev ? { ...prev, activo: false } : null));
      setModalInactivar(false);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo inactivar el grupo.");
    } finally {
      setGrupoAccionLoading(false);
    }
  };

  const confirmarReactivarGrupo = async () => {
    setGrupoAccionLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("grupos").update({ activo: true }).eq("id", grupo.id);
      if (error) throw error;
      setGrupo((prev) => (prev ? { ...prev, activo: true } : null));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo reactivar el grupo.");
    } finally {
      setGrupoAccionLoading(false);
    }
  };

  const confirmarEliminarGrupo = async () => {
    if (miembros.length > 0) return;
    setGrupoAccionLoading(true);
    try {
      const supabase = createClient();
      const { count, error: countErr } = await supabase
        .from("personas")
        .select("id", { count: "exact", head: true })
        .eq("grupo_id", grupo.id);
      if (countErr) throw countErr;
      if ((count ?? 0) > 0) {
        window.alert(
          "Este grupo aún tiene miembros asignados. Quítalos o transfiérelos antes de eliminar."
        );
        setModalEliminar(false);
        return;
      }
      const { error } = await supabase.from("grupos").delete().eq("id", grupo.id);
      if (error) throw error;
      setModalEliminar(false);
      router.push("/grupos");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo eliminar el grupo.");
    } finally {
      setGrupoAccionLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <RegistroAsistenciaModal
        isOpen={modalAsistencia}
        onClose={() => setModalAsistencia(false)}
        grupoId={grupo.id}
        grupoNombre={grupo.nombre}
        proximaReunionText={proximaReunion}
        ubicacion={grupo.ubicacion || ""}
        hayMiembrosEnGrupo={miembros.length > 0}
        grupoActivo={grupoOperativo}
      />
      <AgregarPersonasModal
        isOpen={modalAgregarPersonas}
        onClose={() => setModalAgregarPersonas(false)}
        grupoId={grupo.id}
        modo={modoAgregarPersonas}
        onRefetch={async () => {
          await cargarMiembros();
          await cargarStats();
        }}
      />
      <div className="w-full max-w-none px-4 pt-8 md:px-6 lg:px-8">
        <div className="relative mb-8 rounded-3xl bg-gray-100/50 dark:bg-white/[0.04] p-5 md:p-6">
          <Link
            href="/grupos"
            className="absolute left-4 top-4 z-10 rounded-full p-2.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white md:left-5 md:top-5"
            title="Volver a grupos"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>

          <div className="flex flex-col items-center gap-6 pt-10 md:flex-row md:items-center md:gap-8 md:pt-4 md:pl-4">
            <div className="flex min-h-[9rem] shrink-0 items-center justify-center md:min-h-[7.5rem]">
              <GrupoAvatarCluster nombreGrupo={grupo.nombre} sizeCenter={96} sizeSide={56} />
            </div>
            <div className="min-w-0 flex-1 text-center md:text-left">
              <div className="mb-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-normal text-gray-700 shadow-sm shadow-black/[0.04] dark:bg-white/10 dark:text-gray-300 dark:shadow-none">
                  {tipoLabel}
                </span>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    grupo.activo
                      ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                      : "bg-gray-500/10 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      grupo.activo ? "bg-emerald-400/80 dark:bg-emerald-400/55" : "bg-gray-400 dark:bg-gray-500"
                    }`}
                  />
                  {estadoLabel}
                </span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                {grupo.nombre}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 md:text-base">
                {grupo.descripcion || "Sin descripción"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 md:px-6 lg:px-8">
        <div className="w-full">
          <div className="grid gap-6 lg:grid-cols-3">
            {!grupoOperativo && (
              <div className="rounded-3xl border border-amber-200/80 bg-amber-50/90 px-5 py-4 text-sm text-amber-950 dark:border-amber-800/40 dark:bg-amber-950/25 dark:text-amber-100 lg:col-span-3">
                <p className="font-semibold">Grupo inactivo</p>
                <p className="mt-1 text-amber-900/90 dark:text-amber-100/85">
                  No puedes registrar asistencia, agregar miembros ni usar acciones de gestión hasta que reactives el grupo.
                </p>
              </div>
            )}
            <div className="space-y-6 lg:col-span-2">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-3xl bg-gray-100/40 p-4 text-center dark:bg-white/[0.04]">
                  <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-3xl">{miembros.length}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Personas en el grupo</p>
                  {apoyoLista.length > 0 && (
                    <p className="mt-1 text-xs leading-tight text-gray-400 dark:text-gray-500">
                      {miembrosNucleo.length} núcleo · {apoyoLista.length} apoyo
                    </p>
                  )}
                </div>
                <div className="rounded-3xl bg-gray-100/40 p-4 text-center dark:bg-white/[0.04]">
                  <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                    {statsLoading ? "—" : asistenciaMes}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Asistencia</p>
                </div>
                <div className="rounded-3xl bg-gray-100/40 p-4 text-center dark:bg-white/[0.04]">
                  <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                    {statsLoading ? "—" : reunionesMes}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reuniones/mes</p>
                </div>
              </div>

              {/* Núcleo del grupo (miembros + co-líderes) */}
              <div
                id="miembros-del-grupo"
                className="scroll-mt-24 overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between gap-3 border-b border-gray-200/60 px-5 py-4 dark:border-white/10">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                    Miembros del grupo
                  </h3>
                  <button
                    type="button"
                    disabled={!grupoOperativo}
                    onClick={() => {
                      if (!grupoOperativo) return;
                      setModoAgregarPersonas("miembros");
                      setModalAgregarPersonas(true);
                    }}
                    title={!grupoOperativo ? "Reactiva el grupo para agregar miembros" : undefined}
                    className="shrink-0 text-sm font-medium text-gray-900 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline dark:text-white"
                  >
                    + Agregar miembro
                  </button>
                </div>
                <div className="scrollbar-brand max-h-[min(calc(12*4rem),70dvh)] divide-y divide-gray-200/50 overflow-y-auto overscroll-y-contain dark:divide-white/10">
                  {miembrosNucleo.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      {miembros.length === 0 ? (
                        <>
                          Aún no hay personas en este grupo. Pulsa <span className="font-medium text-gray-900 dark:text-white">+ Agregar miembro</span> o usa{" "}
                          <span className="font-medium text-violet-700 dark:text-violet-300">Grupo de apoyo</span> en acciones rápidas.
                        </>
                      ) : (
                        <>
                          Solo hay personas en grupo de apoyo. Agrega miembros al núcleo con{" "}
                          <span className="font-medium text-gray-900 dark:text-white">+ Agregar miembro</span>.
                        </>
                      )}
                    </div>
                  ) : (
                    miembrosNucleo.map((miembro) => {
                      const estadoMostrado = estadoVisibleEnGrupo(miembro.estado);
                      const pill = estadoMiembroPillFor(estadoMostrado);
                      const { texto: subEtiqueta, className: subClass } = etiquetaParticipacion(miembro);
                      return (
                        <div
                          key={miembro.id}
                          className="flex h-16 shrink-0 items-center justify-between gap-3 px-5 transition hover:bg-gray-200/40 dark:hover:bg-white/[0.06]"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <UserAvatar seed={miembro.nombre} size={40} />
                            <div className="min-w-0 py-1">
                              <Link
                                href={`/personas/${miembro.id}`}
                                className="block truncate font-medium leading-tight text-gray-900 transition hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                              >
                                {miembro.nombre}
                              </Link>
                              <p className={`mt-0.5 truncate text-xs leading-tight ${subClass}`}>{subEtiqueta}</p>
                            </div>
                          </div>
                          <span
                            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${pill.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${pill.dot}`} />
                            {estadoMostrado}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Próxima reunión */}
              <div className="rounded-3xl bg-gray-100/40 p-5 dark:bg-white/[0.04]">
                <div className="mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span className="text-sm font-semibold">Próxima reunión</span>
                </div>
                <p className="mb-1 text-xl font-semibold tracking-tight text-gray-900 dark:text-white">{proximaReunion}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{grupo.ubicacion || "—"}</p>
                <button
                  type="button"
                  disabled={miembros.length === 0 || !grupoOperativo}
                  onClick={() => {
                    if (miembros.length > 0 && grupoOperativo) setModalAsistencia(true);
                  }}
                  title={
                    !grupoOperativo
                      ? "El grupo está inactivo"
                      : miembros.length === 0
                        ? "Agrega miembros al grupo para registrar asistencia"
                        : undefined
                  }
                  className={`mt-4 w-full rounded-full py-2.5 text-sm font-semibold transition ${
                    miembros.length === 0 || !grupoOperativo
                      ? "cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-gray-500"
                      : "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  }`}
                >
                  Registrar asistencia
                </button>
                {miembros.length === 0 && grupoOperativo && (
                  <p className="mt-2 text-center text-xs leading-snug text-gray-500 dark:text-gray-400">
                    Agrega miembros con <span className="font-semibold text-gray-900 dark:text-white">+ Agregar miembro</span> para habilitar el registro de asistencia.
                  </p>
                )}
                {!grupoOperativo && (
                  <p className="mt-2 text-center text-xs leading-snug text-gray-500 dark:text-gray-400">
                    Reactiva el grupo en acciones rápidas para registrar asistencia.
                  </p>
                )}
              </div>

              {/* Información del grupo */}
              <div className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
                <div className="border-b border-gray-200/60 px-5 py-4 dark:border-white/10">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Información</h3>
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Día y hora</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {grupo.dia && grupo.hora ? `${grupo.dia} a las ${grupo.hora}` : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Lugar</p>
                      <p className="font-medium text-gray-900 dark:text-white">{grupo.ubicacion || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Creado</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatCreatedAt(grupo.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Líder */}
              {grupo.lideres && (
                <div className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
                  <div className="border-b border-gray-200/60 px-5 py-4 dark:border-white/10">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Liderazgo</h3>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <UserAvatar seed={grupo.lideres.nombre} size={48} />
                      <div className="flex-1">
                        <Link
                          href={`/lideres/${grupo.lideres.id}`}
                          className="font-medium text-gray-900 transition hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                        >
                          {grupo.lideres.nombre}
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Líder principal</p>
                      </div>
                      {grupo.lideres.telefono && (
                        <a
                          href={`https://wa.me/${grupo.lideres.telefono.replace(/\D/g, "")}`}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white"
                          title="WhatsApp"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Grupo de apoyo */}
              <div className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-3 border-b border-gray-200/60 px-5 py-4 dark:border-white/10">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Grupo de apoyo</h3>
                  <button
                    type="button"
                    disabled={!grupoOperativo}
                    onClick={() => {
                      if (!grupoOperativo) return;
                      setModoAgregarPersonas("apoyo");
                      setModalAgregarPersonas(true);
                    }}
                    title={!grupoOperativo ? "Reactiva el grupo para agregar apoyo" : undefined}
                    className="shrink-0 text-sm font-medium text-violet-800 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline dark:text-violet-300"
                  >
                    + Agregar apoyo
                  </button>
                </div>
                <div className="scrollbar-brand max-h-[min(20rem,50dvh)] divide-y divide-gray-200/50 overflow-y-auto overscroll-y-contain dark:divide-white/10">
                  {apoyoLista.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      Personas que apoyan al grupo sin ser del núcleo. Quedan con estado <span className="font-medium">En servicio</span>. Agrégalas desde aquí o desde la ficha de la persona.
                    </div>
                  ) : (
                    apoyoLista.map((miembro) => {
                      const estadoMostrado = estadoVisibleEnGrupo(miembro.estado);
                      const pill = estadoMiembroPillFor(estadoMostrado);
                      const { texto: subEtiqueta, className: subClass } = etiquetaParticipacion(miembro);
                      return (
                        <div
                          key={miembro.id}
                          className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-gray-200/40 dark:hover:bg-white/[0.06]"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <UserAvatar seed={miembro.nombre} size={40} />
                            <div className="min-w-0">
                              <Link
                                href={`/personas/${miembro.id}`}
                                className="block truncate font-medium text-gray-900 transition hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                              >
                                {miembro.nombre}
                              </Link>
                              <p className={`mt-0.5 truncate text-xs ${subClass}`}>{subEtiqueta}</p>
                            </div>
                          </div>
                          <span
                            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${pill.badge}`}
                          >
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${pill.dot}`} />
                            {estadoMostrado}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
                <div className="border-b border-gray-200/60 px-5 py-4 dark:border-white/10">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Últimas reuniones</h3>
                </div>
                {ultimasReuniones.length === 0 ? (
                  <div className="p-5 text-center text-sm text-gray-500 dark:text-gray-400">
                    Aún no hay asistencias registradas para este grupo.
                  </div>
                ) : (
                  <div className="scrollbar-brand max-h-[min(18rem,45dvh)] divide-y divide-gray-200/50 overflow-y-auto overscroll-y-contain dark:divide-white/10">
                    {ultimasReuniones.map((r) => (
                      <div key={r.fecha} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 sm:pr-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{formatFechaCorta(r.fecha)}</p>
                          <p className="mt-1 truncate text-xs text-gray-600 dark:text-gray-400 sm:mt-0.5">
                            {r.nombres.length > 0 ? r.nombres.join(", ") : "—"}
                          </p>
                        </div>
                        <p className="shrink-0 whitespace-nowrap text-xs font-medium text-gray-600 dark:text-gray-400">
                          {r.asistentes} {r.asistentes === 1 ? "persona" : "personas"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Acciones rápidas */}
              <div className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
                <div className="border-b border-gray-200/60 px-5 py-4 dark:border-white/10">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Acciones rápidas</h3>
                </div>
                <div className="space-y-1 p-3">
                  <button
                    type="button"
                    disabled={!grupoOperativo}
                    onClick={() => {
                      if (!grupoOperativo) return;
                      setModoAgregarPersonas("apoyo");
                      setModalAgregarPersonas(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-gray-200/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-white/[0.06] dark:disabled:hover:bg-transparent"
                  >
                    <svg className="h-5 w-5 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Agregar grupo de apoyo</span>
                  </button>
                  <button
                    type="button"
                    disabled={!grupoOperativo}
                    onClick={() => {
                      if (!grupoOperativo) return;
                      setModoAgregarPersonas("miembros");
                      setModalAgregarPersonas(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-gray-200/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-white/[0.06] dark:disabled:hover:bg-transparent"
                  >
                    <svg className="h-5 w-5 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Agregar miembros</span>
                  </button>

                  <div className="my-2 space-y-1 border-t border-gray-200/60 pt-2 dark:border-white/10">
                    {grupoOperativo ? (
                      <button
                        type="button"
                        onClick={() => setModalInactivar(true)}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-amber-50 dark:hover:bg-amber-900/15"
                      >
                        <svg className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Inactivar grupo</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={grupoAccionLoading}
                        onClick={() => void confirmarReactivarGrupo()}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-green-50 disabled:opacity-50 dark:hover:bg-green-900/15"
                      >
                        <svg className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {grupoAccionLoading ? "Reactivando…" : "Reactivar grupo"}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!puedeEliminarGrupo}
                      onClick={() => {
                        if (!puedeEliminarGrupo) return;
                        setModalEliminar(true);
                      }}
                      title={
                        !puedeEliminarGrupo
                          ? "Solo puedes eliminar el grupo cuando no tenga miembros asignados"
                          : undefined
                      }
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/15 transition text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                    >
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">Eliminar grupo</span>
                    </button>
                    {!puedeEliminarGrupo && (
                      <p className="px-3 text-xs text-gray-500 dark:text-gray-400">
                        Para eliminar, primero quita a todos los miembros del grupo.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalInactivar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={grupoAccionLoading ? undefined : () => setModalInactivar(false)}
            aria-hidden
          />
          <div
            className="relative w-full max-w-md rounded-3xl border border-gray-200/60 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900"
            role="dialog"
            aria-labelledby="inactivar-grupo-titulo"
          >
            <h3 id="inactivar-grupo-titulo" className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Inactivar grupo
            </h3>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">«{grupo.nombre}»</strong> quedará inactivo: no podrás registrar
              asistencia ni agregar miembros hasta que lo reactives. Los datos y las personas asignadas al grupo no se borran.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={grupoAccionLoading}
                onClick={() => setModalInactivar(false)}
                className="flex-1 rounded-full py-3 px-4 font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/[0.08]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={grupoAccionLoading}
                onClick={() => void confirmarInactivarGrupo()}
                className="flex-1 rounded-full bg-amber-600 py-3 px-4 font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
              >
                {grupoAccionLoading ? "Guardando…" : "Inactivar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEliminar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={grupoAccionLoading ? undefined : () => setModalEliminar(false)}
            aria-hidden
          />
          <div
            className="relative w-full max-w-md rounded-3xl border border-gray-200/60 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900"
            role="dialog"
            aria-labelledby="eliminar-grupo-titulo"
          >
            <h3 id="eliminar-grupo-titulo" className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Eliminar grupo
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Vas a eliminar permanentemente <strong className="text-gray-900 dark:text-white">«{grupo.nombre}»</strong>. Solo es
              posible si el grupo no tiene miembros. Los registros de asistencia de este grupo también se eliminarán.
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mb-6 font-medium">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={grupoAccionLoading}
                onClick={() => setModalEliminar(false)}
                className="flex-1 rounded-full py-3 px-4 font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/[0.08]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={grupoAccionLoading || !puedeEliminarGrupo}
                onClick={() => void confirmarEliminarGrupo()}
                className="flex-1 rounded-full bg-red-600 py-3 px-4 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {grupoAccionLoading ? "Eliminando…" : "Eliminar definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
