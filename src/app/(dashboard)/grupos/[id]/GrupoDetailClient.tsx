"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GrupoAvatarCluster } from "@/components/GrupoAvatarCluster";
import { UserAvatar } from "@/components/UserAvatar";
import { soloDigitosDocumentoId } from "@/lib/documento-id";
import { fechaHoyYYYYMMDD } from "@/lib/fecha-hoy-local";
import { ETAPA_LABELS, parseEtapaDb, etapaStyles } from "@/lib/persona-etapa";
import { createClient } from "@/lib/supabase/client";
import { nombreSoloPrimerNombre } from "@/lib/nombre-corto";
import { parsePersonaSexo } from "@/lib/persona-sexo";
import { TimePicker } from "@/components/ui/TimePicker";
import type {
  GrupoData,
  LiderResumen,
  MiembroData,
  ParticipacionEnGrupo,
  UltimaReunionAsistente,
} from "./_lib/grupo-page-model";
import { useGrupoPageData } from "./_hooks/useGrupoPageData";

const RegistroAsistenciaModal = dynamic(
  () => import("./_components/GrupoPageModals").then((m) => m.RegistroAsistenciaModal),
  { ssr: false, loading: () => null },
);
const AgregarPersonasModal = dynamic(
  () => import("./_components/GrupoPageModals").then((m) => m.AgregarPersonasModal),
  { ssr: false, loading: () => null },
);

/** Si hay más personas que esto en co-líderes o apoyo (hero), solo avatar + tooltip para no romper el layout. */
const LIDERAZGO_HERO_MAX_CON_NOMBRE = 4;

const LIDERAZGO_HERO_TOOLTIP_CLASS =
  "pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md bg-zinc-900 px-2.5 py-1.5 text-center text-xs font-medium leading-snug text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-150 break-words group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-zinc-800 dark:ring-white/5";

function LiderazgoHeroPersonaListItem({
  m,
  variant,
  soloAvatar,
}: {
  m: Pick<MiembroData, "id" | "nombre" | "sexo">;
  variant: "colider" | "apoyo";
  soloAvatar: boolean;
}) {
  if (soloAvatar) {
    const ring =
      variant === "colider"
        ? "rounded-full ring-2 ring-white/80 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:ring-[#1a1a1a]"
        : "rounded-full ring-2 ring-violet-300/60 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:ring-violet-800/80";
    return (
      <span className="group relative z-0 inline-flex">
        <Link prefetch={false} href={`/personas/${m.id}`} aria-label={m.nombre} title={m.nombre} className={ring}>
          <UserAvatar seed={m.nombre} sexo={parsePersonaSexo(m.sexo)} size={38} />
        </Link>
        <span role="tooltip" className={LIDERAZGO_HERO_TOOLTIP_CLASS}>
          {nombreSoloPrimerNombre(m.nombre)}
        </span>
      </span>
    );
  }
  const chip =
    variant === "colider"
      ? "border-gray-200/60 bg-white/50 hover:bg-white/80 dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
      : "border-violet-200/50 bg-violet-50/40 hover:bg-violet-50/80 dark:border-violet-900/35 dark:bg-violet-950/25 dark:hover:bg-violet-950/40";
  return (
    <Link
      prefetch={false}
      href={`/personas/${m.id}`}
      title={m.nombre}
      className={`flex min-w-0 max-w-[13.5rem] items-center gap-2 rounded-full border py-1 pl-0.5 pr-2.5 transition ${chip}`}
    >
      <UserAvatar seed={m.nombre} sexo={parsePersonaSexo(m.sexo)} size={32} />
      <span className="min-w-0 truncate text-left text-sm font-medium text-gray-900 dark:text-white">
        {nombreSoloPrimerNombre(m.nombre)}
      </span>
    </Link>
  );
}

function etapaPillFor(raw: string): { dot: string; badge: string; label: string } {
  const e = parseEtapaDb(raw);
  const { dot, badge } = etapaStyles(e);
  return { dot, badge, label: ETAPA_LABELS[e] };
}

const tipoLabels: Record<string, string> = {
  parejas: "Parejas",
  jovenes: "Jóvenes",
  teens: "Teens",
  hombres: "Hombres",
  mujeres: "Mujeres",
  general: "General",
};

const diasSemana = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábados",
  "Domingos",
];

/** Campos apilados (ancho completo) para el sidebar estrecho; coherente con botones teal de la ficha persona. */
const GRUPO_INFO_EDIT_CONTROL_CLASS =
  "w-full min-w-0 rounded-xl border border-gray-200/80 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#18301d] focus:outline-none focus:ring-1 focus:ring-[#18301d]/25 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-white dark:focus:ring-white/20 dark:[color-scheme:dark]";

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

/** Compara nombre de miembro con texto de búsqueda (insensible a mayúsculas y acentos). */
function nombreCoincideBusqueda(nombre: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const n = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const qq = q
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return n.includes(qq);
}

/** Días enteros desde la fecha/ISO indicada hasta hoy (inicio del día local). null si no hay dato válido. */
function diasTranscurridosHastaHoyDesde(val: string | null | undefined): number | null {
  if (!val?.trim()) return null;
  const t = val.trim();
  const d =
    t.length > 10 && (t.includes("T") || t.includes(" "))
      ? new Date(t)
      : new Date(`${t.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const inicioRef = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((inicioHoy.getTime() - inicioRef.getTime()) / 86400000);
}

/** Texto relativo para listados (seguimiento / asistencia). */
function textoHaceDesde(val: string | null | undefined, sinDato: string): string {
  const days = diasTranscurridosHastaHoyDesde(val);
  if (days === null || !val?.trim()) return sinDato;
  if (days < 0) return sinDato;
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) {
    const sem = Math.floor(days / 7);
    return sem <= 1 ? "Hace 1 semana" : `Hace ${sem} semanas`;
  }
  if (days < 365) {
    const mes = Math.floor(days / 30);
    return mes <= 1 ? "Hace 1 mes" : `Hace ${mes} meses`;
  }
  const años = Math.floor(days / 365);
  return años <= 1 ? "Hace más de 1 año" : `Hace ${años} años`;
}

function classAlertaSeguimiento(ultimoContacto: string | null): string {
  const d = diasTranscurridosHastaHoyDesde(ultimoContacto);
  if (!ultimoContacto?.trim() || d === null) return "text-amber-700 dark:text-amber-300";
  if (d > 14) return "text-amber-700 dark:text-amber-300";
  return "text-gray-500 dark:text-gray-400";
}

function classAlertaAsistencia(ultimaFechaGrupo: string | undefined): string {
  if (!ultimaFechaGrupo) return "text-amber-700 dark:text-amber-300";
  const d = diasTranscurridosHastaHoyDesde(ultimaFechaGrupo);
  if (d === null) return "text-gray-500 dark:text-gray-400";
  if (d > 21) return "text-amber-700 dark:text-amber-300";
  return "text-gray-500 dark:text-gray-400";
}

function textoBajoNombreLiderPrincipal(l: LiderResumen): string | null {
  const ini = l.fecha_inicio_liderazgo?.trim().slice(0, 10);
  if (ini) return `Desde ${formatFechaCorta(ini)}`;
  const cr = l.created_at?.trim().slice(0, 10);
  if (cr) return `Desde ${formatFechaCorta(cr)}`;
  return null;
}

export default function GrupoDetailClient({
  grupoId,
  initialNombre,
}: {
  grupoId: string;
  /** Nombre desde el servidor para mostrar mientras carga el resto (opcional). */
  initialNombre?: string | null;
}) {
  const router = useRouter();
  const id = grupoId;
  const {
    grupo,
    setGrupo,
    miembros,
    setMiembros,
    ultimaAsistenciaPorMiembro,
    loading,
    notFound,
    statsLoading,
    asistenciaMes,
    asistenciaMesRegistros,
    reunionesMes,
    ultimaReunionAsistencia,
    cargarStats,
    cargarMiembros,
  } = useGrupoPageData(id);
  const [modalAsistencia, setModalAsistencia] = useState(false);
  const [modalAgregarPersonas, setModalAgregarPersonas] = useState(false);
  const [modoAgregarPersonas, setModoAgregarPersonas] = useState<"apoyo" | "miembros" | "colider">("miembros");
  const [modalInactivar, setModalInactivar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [grupoAccionLoading, setGrupoAccionLoading] = useState(false);
  const [editingInformacion, setEditingInformacion] = useState(false);
  const [infoNombre, setInfoNombre] = useState("");
  const [infoDescripcion, setInfoDescripcion] = useState("");
  const [infoDia, setInfoDia] = useState("");
  const [infoHora, setInfoHora] = useState<string | null>(null);
  const [infoUbicacion, setInfoUbicacion] = useState("");
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [busquedaMiembroGrupo, setBusquedaMiembroGrupo] = useState("");

  useEffect(() => {
    setEditingInformacion(false);
    setErrorInfo(null);
    setBusquedaMiembroGrupo("");
  }, [id]);

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

  const modalAsistenciaPrev = useRef(modalAsistencia);
  useEffect(() => {
    const wasOpen = modalAsistenciaPrev.current;
    modalAsistenciaPrev.current = modalAsistencia;
    if (wasOpen && !modalAsistencia) {
      void cargarStats();
      void cargarMiembros();
    }
  }, [modalAsistencia, cargarStats, cargarMiembros]);

  const miembrosNucleo = useMemo(
    () => miembros.filter((m) => m.participacion_en_grupo !== "apoyo"),
    [miembros]
  );
  const miembrosNucleoFiltrados = useMemo(() => {
    const q = busquedaMiembroGrupo.trim();
    if (!q) return miembrosNucleo;
    return miembrosNucleo.filter((m) => nombreCoincideBusqueda(m.nombre, q));
  }, [miembrosNucleo, busquedaMiembroGrupo]);
  const apoyoLista = useMemo(
    () => miembros.filter((m) => m.participacion_en_grupo === "apoyo"),
    [miembros]
  );
  const colidersLista = useMemo(
    () => miembros.filter((m) => m.participacion_en_grupo === "colider"),
    [miembros]
  );
  const apoyoListaFiltrados = useMemo(() => {
    const q = busquedaMiembroGrupo.trim();
    if (!q) return apoyoLista;
    return apoyoLista.filter((m) => nombreCoincideBusqueda(m.nombre, q));
  }, [apoyoLista, busquedaMiembroGrupo]);
  const colidersListaFiltrados = useMemo(() => {
    const q = busquedaMiembroGrupo.trim();
    if (!q) return colidersLista;
    return colidersLista.filter((m) => nombreCoincideBusqueda(m.nombre, q));
  }, [colidersLista, busquedaMiembroGrupo]);

  const liderazgoColidersSoloAvatar = colidersLista.length > LIDERAZGO_HERO_MAX_CON_NOMBRE;
  const liderazgoApoyoSoloAvatar = apoyoLista.length > LIDERAZGO_HERO_MAX_CON_NOMBRE;

  /** Registros del mes frente a cupos posibles (miembros × reuniones con asistencia registrada). */
  const porcentajeAsistenciaMes = useMemo(() => {
    const m = miembros.length;
    const r = reunionesMes;
    if (m <= 0 || r <= 0) return null;
    const cupos = m * r;
    return Math.min(100, (asistenciaMesRegistros / cupos) * 100);
  }, [miembros.length, reunionesMes, asistenciaMesRegistros]);

  /** Tono visual de la tarjeta de asistencia según el % del mes. */
  const estiloTarjetaAsistencia = useMemo(() => {
    const base =
      "flex min-h-[3.5rem] flex-col justify-center rounded-lg px-2 py-2 text-center sm:min-h-0 sm:px-2 sm:py-2.5";
    const neutral = {
      card: `${base} border border-gray-200/60 bg-white/60 dark:border-white/[0.08] dark:bg-white/[0.05]`,
      valor: "text-gray-900 dark:text-white",
      detalle: "text-gray-400 dark:text-gray-500",
    };
    if (statsLoading) return neutral;

    const p = porcentajeAsistenciaMes;
    if (p === null) {
      return neutral;
    }
    if (p < 40) {
      return {
        card: `${base} border border-rose-200/90 bg-rose-50/95 dark:border-rose-900/55 dark:bg-rose-950/40`,
        valor: "text-rose-700 dark:text-rose-100",
        detalle: "text-rose-600/90 dark:text-rose-200/80",
      };
    }
    if (p < 65) {
      return {
        card: `${base} border border-amber-200/90 bg-amber-50/95 dark:border-amber-800/45 dark:bg-amber-950/30`,
        valor: "text-amber-900 dark:text-amber-50",
        detalle: "text-amber-800/85 dark:text-amber-100/75",
      };
    }
    return {
      card: `${base} border border-[#18301d]/35 bg-[#18301d]/[0.09] dark:border-[#2a4a32] dark:bg-[#18301d]/22`,
      valor: "text-[#18301d] dark:text-[#b8d4bc]",
      detalle: "text-[#2d4a32] dark:text-[#9cb89f]",
    };
  }, [statsLoading, porcentajeAsistenciaMes]);

  const guardarInformacion = useCallback(async () => {
    if (!grupo) return;
    const nombreVal = infoNombre.trim();
    if (!nombreVal) {
      setErrorInfo("El nombre del grupo es obligatorio.");
      return;
    }
    const descripcionVal = infoDescripcion.trim() || null;
    const diaVal = infoDia.trim() || null;
    const horaVal = infoHora?.trim() || null;
    const ubicacionVal = infoUbicacion.trim() || null;

    const rollback = {
      nombre: grupo.nombre,
      descripcion: grupo.descripcion,
      dia: grupo.dia,
      hora: grupo.hora,
      ubicacion: grupo.ubicacion,
    };

    setErrorInfo(null);
    setGrupo((prev) =>
      prev
        ? {
            ...prev,
            nombre: nombreVal,
            descripcion: descripcionVal,
            dia: diaVal,
            hora: horaVal,
            ubicacion: ubicacionVal,
          }
        : null
    );
    setEditingInformacion(false);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("grupos")
        .update({
          nombre: nombreVal,
          descripcion: descripcionVal,
          dia: diaVal,
          hora: horaVal,
          ubicacion: ubicacionVal,
        })
        .eq("id", grupo.id)
        .select("id");
      if (error) throw error;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo guardar los cambios.";
      setGrupo((prev) =>
        prev
          ? {
              ...prev,
              nombre: rollback.nombre,
              descripcion: rollback.descripcion,
              dia: rollback.dia,
              hora: rollback.hora,
              ubicacion: rollback.ubicacion,
            }
          : null
      );
      setInfoNombre(rollback.nombre);
      setInfoDescripcion(rollback.descripcion ?? "");
      setInfoDia(rollback.dia ?? "");
      setInfoHora(rollback.hora);
      setInfoUbicacion(rollback.ubicacion ?? "");
      setEditingInformacion(true);
      setErrorInfo(msg);
    }
  }, [grupo, infoNombre, infoDescripcion, infoDia, infoHora, infoUbicacion]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-3 px-4">
        {initialNombre ? (
          <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-200">{initialNombre}</p>
        ) : null}
        <svg className="h-8 w-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24" aria-hidden>
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
      <div className="w-full pt-5 md:pt-6">
        <div className="relative mb-6 rounded-3xl bg-gray-100/50 dark:bg-white/[0.04] p-4 md:p-5">
          <Link
            href="/grupos"
            className="absolute left-3 top-3 z-10 rounded-full p-2 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white md:left-4 md:top-4"
            title="Volver a grupos"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>

          <div className="flex flex-col items-center gap-4 pt-8 md:flex-row md:items-start md:gap-5 md:pt-3 md:pl-2">
            <div className="flex min-h-[6.5rem] shrink-0 items-center justify-center md:min-h-[6rem]">
              <GrupoAvatarCluster nombreGrupo={grupo.nombre} sizeCenter={84} sizeSide={50} />
            </div>
            <div className="flex min-w-0 w-full flex-1 flex-col gap-4 md:flex-row md:items-start md:justify-start md:gap-4 lg:gap-5">
              <div className="min-w-0 flex-1 text-center md:text-left">
                <div className="mb-1.5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
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
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-[1.65rem] md:leading-snug">
                  {grupo.nombre}
                </h1>
                <p className="mt-0.5 text-sm leading-snug text-gray-500 dark:text-gray-400 md:text-[0.95rem]">
                  {grupo.descripcion || "Sin descripción"}
                </p>

                {miembrosNucleo.length > 0 || apoyoLista.length > 0 || colidersLista.length > 0 ? (
                  <div className="mx-auto mt-3 w-full max-w-md md:mx-0 md:max-w-lg">
                    <label htmlFor="buscar-miembro-grupo" className="sr-only">
                      Buscar por nombre en núcleo, co-líderes o grupo de apoyo
                    </label>
                    <div className="relative">
                      <svg
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                      <input
                        id="buscar-miembro-grupo"
                        type="text"
                        inputMode="search"
                        enterKeyHint="search"
                        value={busquedaMiembroGrupo}
                        onChange={(e) => setBusquedaMiembroGrupo(e.target.value)}
                        placeholder="Buscar en el grupo…"
                        autoComplete="off"
                        className="w-full rounded-xl border border-gray-200/80 bg-white py-2 pl-10 pr-10 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#18301d] focus:outline-none focus:ring-1 focus:ring-[#18301d]/25 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-white dark:focus:ring-white/20"
                      />
                      {busquedaMiembroGrupo.trim() ? (
                        <button
                          type="button"
                          aria-label="Limpiar búsqueda"
                          onClick={() => setBusquedaMiembroGrupo("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {(grupo.lideres || colidersLista.length > 0 || apoyoLista.length > 0) && (
                  <div className="mt-3 space-y-2 border-t border-gray-200/50 pt-3 text-center dark:border-white/10 md:mt-3.5 md:text-left">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                      Liderazgo
                    </p>
                    <div className="flex flex-col items-center gap-2.5 sm:flex-row sm:items-start sm:justify-center sm:gap-3 md:justify-start md:flex-wrap">
                      {grupo.lideres ? (
                        <div className="flex w-full max-w-xs shrink-0 items-center gap-2.5 sm:w-auto sm:max-w-none">
                          <UserAvatar seed={grupo.lideres.nombre} sexo={parsePersonaSexo(grupo.lideres.sexo)} size={36} />
                          <div className="min-w-0 flex-1 text-left">
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">Líder principal</p>
                            <Link
                              href={`/lideres/${grupo.lideres.id}`}
                              className="text-sm font-medium text-gray-900 transition hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                            >
                              {grupo.lideres.nombre}
                            </Link>
                            {textoBajoNombreLiderPrincipal(grupo.lideres) ? (
                              <p className="mt-0.5 text-[10px] leading-tight text-gray-500 dark:text-gray-400">
                                {textoBajoNombreLiderPrincipal(grupo.lideres)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                      {colidersLista.length > 0 ? (
                        <div
                          className={`min-w-0 w-full max-w-full flex-1 ${grupo.lideres ? "sm:border-l sm:border-gray-200/50 sm:pl-3 dark:sm:border-white/10" : ""}`}
                        >
                          <p className="mb-1.5 text-[11px] text-gray-500 dark:text-gray-400">Co-líderes</p>
                          <ul className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
                            {colidersLista.map((c) => (
                              <li key={c.id} className={liderazgoColidersSoloAvatar ? "shrink-0" : "min-w-0 max-w-full"}>
                                <LiderazgoHeroPersonaListItem m={c} variant="colider" soloAvatar={liderazgoColidersSoloAvatar} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {apoyoLista.length > 0 ? (
                        <div
                          className={`min-w-0 w-full max-w-full flex-1 ${
                            grupo.lideres || colidersLista.length > 0
                              ? "sm:border-l sm:border-gray-200/50 sm:pl-3 dark:sm:border-white/10"
                              : ""
                          }`}
                        >
                          <p className="mb-1.5 text-[11px] text-gray-500 dark:text-gray-400">Grupo de apoyo</p>
                          <ul className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
                            {apoyoLista.map((a) => (
                              <li key={a.id} className={liderazgoApoyoSoloAvatar ? "shrink-0" : "min-w-0 max-w-full"}>
                                <LiderazgoHeroPersonaListItem m={a} variant="apoyo" soloAvatar={liderazgoApoyoSoloAvatar} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
              <div className="mx-auto flex w-full max-w-[20rem] shrink-0 flex-col gap-2 md:mx-0 md:ml-auto md:w-[min(100%,22rem)] md:max-w-[22rem] md:shrink-0">
                <div className="grid w-full grid-cols-3 items-stretch gap-1.5">
                  <div className="flex min-h-0 flex-col justify-center rounded-lg border border-gray-200/60 bg-white/60 px-1.5 py-2 text-center dark:border-white/[0.08] dark:bg-white/[0.05] sm:px-2 sm:py-2.5">
                    <p className="text-base font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white sm:text-lg">
                      {miembros.length}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-tight text-gray-500 dark:text-gray-400">Personas en el grupo</p>
                    {apoyoLista.length > 0 ? (
                      <p className="mt-0.5 text-[9px] leading-tight text-gray-400 dark:text-gray-500">
                        {miembrosNucleo.length} núcleo · {apoyoLista.length} apoyo
                      </p>
                    ) : miembros.length > 0 ? (
                      <p className="mt-0.5 text-[9px] leading-tight text-gray-400 dark:text-gray-500">Todo núcleo</p>
                    ) : null}
                  </div>
                  <div className={estiloTarjetaAsistencia.card}>
                    <p className={`text-base font-semibold tabular-nums tracking-tight sm:text-lg ${estiloTarjetaAsistencia.valor}`}>
                      {statsLoading ? "—" : porcentajeAsistenciaMes === null ? "—" : `${Math.round(porcentajeAsistenciaMes)}%`}
                    </p>
                    <p
                      className={`mt-0.5 text-[10px] leading-tight ${porcentajeAsistenciaMes === null ? "text-gray-500 dark:text-gray-400" : estiloTarjetaAsistencia.detalle}`}
                    >
                      Asistencia del mes
                    </p>
                    {!statsLoading && porcentajeAsistenciaMes !== null ? (
                      <p className={`mt-0.5 text-[9px] leading-tight ${estiloTarjetaAsistencia.detalle}`}>
                        {asistenciaMesRegistros} de {miembros.length * reunionesMes} cupos · {asistenciaMes}{" "}
                        {asistenciaMes === 1 ? "persona" : "personas"} distintas
                      </p>
                    ) : !statsLoading && miembros.length === 0 ? (
                      <p className="mt-0.5 text-[9px] leading-tight text-gray-400 dark:text-gray-500">Agrega personas al grupo</p>
                    ) : !statsLoading && reunionesMes === 0 && miembros.length > 0 ? (
                      <p className="mt-0.5 text-[9px] leading-tight text-gray-400 dark:text-gray-500">Sin reuniones este mes</p>
                    ) : null}
                  </div>
                  <div className="flex min-h-0 flex-col justify-center rounded-lg border border-gray-200/60 bg-white/60 px-1.5 py-2 text-center dark:border-white/[0.08] dark:bg-white/[0.05] sm:px-2 sm:py-2.5">
                    <p className="text-base font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white sm:text-lg">
                      {statsLoading ? "—" : reunionesMes}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-tight text-gray-500 dark:text-gray-400">Reuniones / mes</p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200/60 bg-white/50 px-2.5 py-2 text-left dark:border-white/[0.08] dark:bg-white/[0.04] sm:px-3 sm:py-2.5">
                  {statsLoading ? (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Cargando última reunión…</p>
                  ) : ultimaReunionAsistencia ? (
                    <>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">
                          Última reunión
                        </p>
                        <p className="text-[11px] font-medium tabular-nums text-gray-900 dark:text-white">
                          {formatFechaCorta(ultimaReunionAsistencia.fecha)}
                        </p>
                      </div>
                      <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                        {ultimaReunionAsistencia.personas.length}{" "}
                        {ultimaReunionAsistencia.personas.length === 1 ? "asistente" : "asistentes"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5 overflow-visible pt-0.5">
                        {ultimaReunionAsistencia.personas.map((p) => (
                          <span key={p.id} className="group relative z-0 inline-flex">
                            <Link
                              prefetch={false}
                              href={`/personas/${p.id}`}
                              aria-label={p.nombre}
                              className="rounded-full ring-2 ring-white/80 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18301d] dark:ring-[#1a1a1a]"
                            >
                              <UserAvatar seed={p.nombre} sexo={parsePersonaSexo(p.sexo)} size={30} />
                            </Link>
                            <span
                              role="tooltip"
                              className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md bg-zinc-900 px-2 py-1 text-center text-[11px] font-medium leading-snug text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-150 break-words group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-zinc-800 dark:ring-white/5"
                            >
                              {p.nombre}
                            </span>
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                      Aún no hay asistencias registradas para este grupo.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-5 md:py-6">
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
                <div className="scrollbar-brand max-h-[min(calc(25*4rem),90dvh)] overflow-x-auto overflow-y-auto overscroll-y-contain">
                  {miembros.length === 0 ? (
                    <div className="divide-y divide-gray-200/50 dark:divide-white/10">
                      <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        Aún no hay personas en este grupo. Pulsa <span className="font-medium text-gray-900 dark:text-white">+ Agregar miembro</span> o usa{" "}
                        <span className="font-medium text-violet-700 dark:text-violet-300">Grupo de apoyo</span> en acciones rápidas.
                      </div>
                    </div>
                  ) : (
                    <>
                      {miembrosNucleo.length > 0 ? (
                        <div className="min-w-[36rem]">
                          <table className="w-full table-fixed border-collapse text-left">
                            <thead className="sticky top-0 z-[1] border-b border-gray-200/60 bg-gray-100/95 backdrop-blur-sm dark:border-white/10 dark:bg-[#141414]/95">
                              <tr>
                                <th
                                  scope="col"
                                  className="w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem] py-2.5 pl-4 pr-2 align-middle"
                                  aria-hidden
                                />
                                <th
                                  scope="col"
                                  className="min-w-[10rem] py-2.5 pl-1 pr-3 align-middle text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400"
                                >
                                  Persona
                                </th>
                                <th
                                  scope="col"
                                  className="w-[24%] py-2.5 pr-3 align-middle text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400"
                                >
                                  Seguimiento
                                </th>
                                <th
                                  scope="col"
                                  className="w-[24%] py-2.5 pr-3 align-middle text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400"
                                  title="Última asistencia a una reunión de este grupo"
                                >
                                  Últ. reunión
                                </th>
                                <th
                                  scope="col"
                                  className="w-[9.5rem] py-2.5 pl-2 pr-5 align-middle text-end text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400"
                                >
                                  Etapa
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/50 dark:divide-white/10">
                              {miembrosNucleoFiltrados.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                                  >
                                    Nadie del núcleo coincide con «{busquedaMiembroGrupo.trim()}». Prueba con otro nombre o{" "}
                                    <button
                                      type="button"
                                      className="font-medium text-gray-900 underline-offset-2 hover:underline dark:text-white"
                                      onClick={() => setBusquedaMiembroGrupo("")}
                                    >
                                      limpia la búsqueda
                                    </button>
                                    .
                                  </td>
                                </tr>
                              ) : (
                                miembrosNucleoFiltrados.map((miembro) => {
                                  const pill = etapaPillFor(miembro.etapa);
                                  const { texto: subEtiqueta, className: subClass } = etiquetaParticipacion(miembro);
                                  const ultimaAsist = ultimaAsistenciaPorMiembro[miembro.id];
                                  const txtSeguimiento = textoHaceDesde(miembro.ultimo_contacto, "Sin contacto");
                                  const txtAsistencia = textoHaceDesde(ultimaAsist, "Sin asistencia");
                                  const clsSeg = classAlertaSeguimiento(miembro.ultimo_contacto);
                                  const clsAsist = classAlertaAsistencia(ultimaAsist);
                                  const fechaSeg = miembro.ultimo_contacto?.trim()
                                    ? formatFechaCorta(miembro.ultimo_contacto.trim().slice(0, 10))
                                    : null;
                                  const fechaAsist = ultimaAsist ? formatFechaCorta(ultimaAsist) : null;
                                  const lineaSeg = fechaSeg ? `${txtSeguimiento} · ${fechaSeg}` : txtSeguimiento;
                                  const lineaAsist = fechaAsist ? `${txtAsistencia} · ${fechaAsist}` : txtAsistencia;
                                  return (
                                    <tr
                                      key={miembro.id}
                                      id={`fila-miembro-${miembro.id}`}
                                      className="transition hover:bg-gray-200/40 dark:hover:bg-white/[0.06]"
                                    >
                                      <td className="w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem] align-middle py-2.5 pl-4 pr-2">
                                        <div className="flex w-10 shrink-0 items-center justify-center">
                                          <UserAvatar seed={miembro.nombre} sexo={parsePersonaSexo(miembro.sexo)} size={40} />
                                        </div>
                                      </td>
                                      <td className="min-w-[10rem] align-middle py-2.5 pl-1 pr-3">
                                        <div className="min-w-0">
                                          <Link
                                            prefetch={false}
                                            href={`/personas/${miembro.id}`}
                                            className="block truncate font-medium leading-tight text-gray-900 transition hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                                          >
                                            {miembro.nombre}
                                          </Link>
                                          <p className={`mt-0.5 truncate text-xs leading-tight ${subClass}`}>{subEtiqueta}</p>
                                        </div>
                                      </td>
                                      <td className="min-w-0 align-middle py-2.5 pr-3">
                                        <p
                                          className={`truncate text-xs tabular-nums leading-snug ${clsSeg}`}
                                          title={lineaSeg}
                                        >
                                          {lineaSeg}
                                        </p>
                                      </td>
                                      <td className="min-w-0 align-middle py-2.5 pr-3">
                                        <p
                                          className={`truncate text-xs tabular-nums leading-snug ${clsAsist}`}
                                          title={lineaAsist}
                                        >
                                          {lineaAsist}
                                        </p>
                                      </td>
                                      <td className="align-middle py-2.5 pl-2 pr-5 text-end">
                                        <span
                                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${pill.badge}`}
                                        >
                                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${pill.dot}`} />
                                          {pill.label}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="border-b border-gray-200/60 bg-gray-100/40 px-5 py-3 text-center text-sm text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300">
                          Nadie en el núcleo. Los listados de{" "}
                          {colidersLista.length > 0 ? <span className="font-medium">co-líderes</span> : null}
                          {colidersLista.length > 0 && apoyoLista.length > 0 ? " y " : null}
                          {apoyoLista.length > 0 ? <span className="font-medium">grupo de apoyo</span> : null} están abajo.
                          Suma al núcleo con{" "}
                          <span className="font-medium text-gray-900 dark:text-white">+ Agregar miembro</span>.
                        </div>
                      )}
                      {colidersLista.length > 0 ? (
                        <>
                          <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-amber-200/60 bg-amber-50/95 px-4 py-2.5 backdrop-blur-sm dark:border-amber-900/45 dark:bg-amber-950/45">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-950 dark:text-amber-100">
                              Co-líderes
                            </span>
                            {busquedaMiembroGrupo.trim() ? (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {colidersListaFiltrados.length}/{colidersLista.length}
                              </span>
                            ) : null}
                          </div>
                          <div className="min-w-[36rem]">
                            <table className="w-full table-fixed border-collapse text-left">
                              <thead className="sticky top-0 z-[1] border-b border-gray-200/60 bg-amber-50/90 backdrop-blur-sm dark:border-white/10 dark:bg-amber-950/40">
                                <tr>
                                  <th
                                    scope="col"
                                    className="w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem] py-2.5 pl-4 pr-2 align-middle"
                                    aria-hidden
                                  />
                                  <th
                                    scope="col"
                                    className="min-w-[10rem] py-2.5 pl-1 pr-3 align-middle text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400"
                                  >
                                    Persona
                                  </th>
                                  <th
                                    scope="col"
                                    className="w-[24%] py-2.5 pr-3 align-middle text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400"
                                  >
                                    Seguimiento
                                  </th>
                                  <th
                                    scope="col"
                                    className="w-[24%] py-2.5 pr-3 align-middle text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400"
                                    title="Última asistencia a una reunión de este grupo"
                                  >
                                    Últ. reunión
                                  </th>
                                  <th
                                    scope="col"
                                    className="w-[9.5rem] py-2.5 pl-2 pr-5 align-middle text-end text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400"
                                  >
                                    Etapa
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200/50 dark:divide-white/10">
                                {colidersListaFiltrados.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                      Ningún co-líder coincide con «{busquedaMiembroGrupo.trim()}».{" "}
                                      <button
                                        type="button"
                                        className="font-medium text-gray-900 underline-offset-2 hover:underline dark:text-white"
                                        onClick={() => setBusquedaMiembroGrupo("")}
                                      >
                                        Limpia la búsqueda
                                      </button>
                                      .
                                    </td>
                                  </tr>
                                ) : (
                                  colidersListaFiltrados.map((miembro) => {
                                    const pill = etapaPillFor(miembro.etapa);
                                    const { texto: subEtiqueta, className: subClass } = etiquetaParticipacion(miembro);
                                    const ultimaAsist = ultimaAsistenciaPorMiembro[miembro.id];
                                    const txtSeguimiento = textoHaceDesde(miembro.ultimo_contacto, "Sin contacto");
                                    const txtAsistencia = textoHaceDesde(ultimaAsist, "Sin asistencia");
                                    const clsSeg = classAlertaSeguimiento(miembro.ultimo_contacto);
                                    const clsAsist = classAlertaAsistencia(ultimaAsist);
                                    const fechaSeg = miembro.ultimo_contacto?.trim()
                                      ? formatFechaCorta(miembro.ultimo_contacto.trim().slice(0, 10))
                                      : null;
                                    const fechaAsist = ultimaAsist ? formatFechaCorta(ultimaAsist) : null;
                                    const lineaSeg = fechaSeg ? `${txtSeguimiento} · ${fechaSeg}` : txtSeguimiento;
                                    const lineaAsist = fechaAsist ? `${txtAsistencia} · ${fechaAsist}` : txtAsistencia;
                                    return (
                                      <tr
                                        key={miembro.id}
                                        id={`fila-colider-${miembro.id}`}
                                        className="transition hover:bg-amber-100/55 dark:hover:bg-amber-950/30"
                                      >
                                        <td className="w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem] align-middle py-2.5 pl-4 pr-2">
                                          <div className="flex w-10 shrink-0 items-center justify-center">
                                            <UserAvatar seed={miembro.nombre} sexo={parsePersonaSexo(miembro.sexo)} size={40} />
                                          </div>
                                        </td>
                                        <td className="min-w-[10rem] align-middle py-2.5 pl-1 pr-3">
                                          <div className="min-w-0">
                                            <Link
                                              prefetch={false}
                                              href={`/personas/${miembro.id}`}
                                              className="block truncate font-medium leading-tight text-gray-900 transition hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                                            >
                                              {miembro.nombre}
                                            </Link>
                                            <p className={`mt-0.5 truncate text-xs leading-tight ${subClass}`}>{subEtiqueta}</p>
                                          </div>
                                        </td>
                                        <td className="min-w-0 align-middle py-2.5 pr-3">
                                          <p
                                            className={`truncate text-xs tabular-nums leading-snug ${clsSeg}`}
                                            title={lineaSeg}
                                          >
                                            {lineaSeg}
                                          </p>
                                        </td>
                                        <td className="min-w-0 align-middle py-2.5 pr-3">
                                          <p
                                            className={`truncate text-xs tabular-nums leading-snug ${clsAsist}`}
                                            title={lineaAsist}
                                          >
                                            {lineaAsist}
                                          </p>
                                        </td>
                                        <td className="align-middle py-2.5 pl-2 pr-5 text-end">
                                          <span
                                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${pill.badge}`}
                                          >
                                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${pill.dot}`} />
                                            {pill.label}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : null}
                      {apoyoLista.length > 0 ? (
                        <>
                          <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-violet-200/60 bg-violet-50/95 px-4 py-2.5 backdrop-blur-sm dark:border-violet-900/40 dark:bg-violet-950/40">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-900 dark:text-violet-200">
                              Grupo de apoyo
                            </span>
                            {busquedaMiembroGrupo.trim() ? (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {apoyoListaFiltrados.length}/{apoyoLista.length}
                              </span>
                            ) : null}
                          </div>
                          <div className="min-w-[36rem]">
                            <table className="w-full table-fixed border-collapse text-left">
                              <thead className="sticky top-0 z-[1] border-b border-gray-200/60 bg-violet-50/90 backdrop-blur-sm dark:border-white/10 dark:bg-violet-950/35">
                                <tr>
                                  <th
                                    scope="col"
                                    className="w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem] py-2.5 pl-4 pr-2 align-middle"
                                    aria-hidden
                                  />
                                  <th
                                    scope="col"
                                    className="min-w-[10rem] py-2.5 pl-1 pr-3 align-middle text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400"
                                  >
                                    Persona
                                  </th>
                                  <th
                                    scope="col"
                                    className="w-[24%] py-2.5 pr-3 align-middle text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400"
                                  >
                                    Seguimiento
                                  </th>
                                  <th
                                    scope="col"
                                    className="w-[24%] py-2.5 pr-3 align-middle text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400"
                                    title="Última asistencia a una reunión de este grupo"
                                  >
                                    Últ. reunión
                                  </th>
                                  <th
                                    scope="col"
                                    className="w-[9.5rem] py-2.5 pl-2 pr-5 align-middle text-end text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400"
                                  >
                                    Etapa
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200/50 dark:divide-white/10">
                                {apoyoListaFiltrados.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                      Nadie del grupo de apoyo coincide con «{busquedaMiembroGrupo.trim()}».{" "}
                                      <button
                                        type="button"
                                        className="font-medium text-gray-900 underline-offset-2 hover:underline dark:text-white"
                                        onClick={() => setBusquedaMiembroGrupo("")}
                                      >
                                        Limpia la búsqueda
                                      </button>
                                      .
                                    </td>
                                  </tr>
                                ) : (
                                  apoyoListaFiltrados.map((miembro) => {
                                    const pill = etapaPillFor(miembro.etapa);
                                    const { texto: subEtiqueta, className: subClass } = etiquetaParticipacion(miembro);
                                    const ultimaAsist = ultimaAsistenciaPorMiembro[miembro.id];
                                    const txtSeguimiento = textoHaceDesde(miembro.ultimo_contacto, "Sin contacto");
                                    const txtAsistencia = textoHaceDesde(ultimaAsist, "Sin asistencia");
                                    const clsSeg = classAlertaSeguimiento(miembro.ultimo_contacto);
                                    const clsAsist = classAlertaAsistencia(ultimaAsist);
                                    const fechaSeg = miembro.ultimo_contacto?.trim()
                                      ? formatFechaCorta(miembro.ultimo_contacto.trim().slice(0, 10))
                                      : null;
                                    const fechaAsist = ultimaAsist ? formatFechaCorta(ultimaAsist) : null;
                                    const lineaSeg = fechaSeg ? `${txtSeguimiento} · ${fechaSeg}` : txtSeguimiento;
                                    const lineaAsist = fechaAsist ? `${txtAsistencia} · ${fechaAsist}` : txtAsistencia;
                                    return (
                                      <tr
                                        key={miembro.id}
                                        id={`fila-apoyo-${miembro.id}`}
                                        className="transition hover:bg-violet-100/50 dark:hover:bg-violet-950/25"
                                      >
                                        <td className="w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem] align-middle py-2.5 pl-4 pr-2">
                                          <div className="flex w-10 shrink-0 items-center justify-center">
                                            <UserAvatar seed={miembro.nombre} sexo={parsePersonaSexo(miembro.sexo)} size={40} />
                                          </div>
                                        </td>
                                        <td className="min-w-[10rem] align-middle py-2.5 pl-1 pr-3">
                                          <div className="min-w-0">
                                            <Link
                                              prefetch={false}
                                              href={`/personas/${miembro.id}`}
                                              className="block truncate font-medium leading-tight text-gray-900 transition hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                                            >
                                              {miembro.nombre}
                                            </Link>
                                            <p className={`mt-0.5 truncate text-xs leading-tight ${subClass}`}>{subEtiqueta}</p>
                                          </div>
                                        </td>
                                        <td className="min-w-0 align-middle py-2.5 pr-3">
                                          <p
                                            className={`truncate text-xs tabular-nums leading-snug ${clsSeg}`}
                                            title={lineaSeg}
                                          >
                                            {lineaSeg}
                                          </p>
                                        </td>
                                        <td className="min-w-0 align-middle py-2.5 pr-3">
                                          <p
                                            className={`truncate text-xs tabular-nums leading-snug ${clsAsist}`}
                                            title={lineaAsist}
                                          >
                                            {lineaAsist}
                                          </p>
                                        </td>
                                        <td className="align-middle py-2.5 pl-2 pr-5 text-end">
                                          <span
                                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${pill.badge}`}
                                          >
                                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${pill.dot}`} />
                                            {pill.label}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </>
                      ) : null}
                    </>
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

              {/* Información del grupo: lectura = card lateral habitual; edición = mismo patrón que ficha persona */}
              {editingInformacion ? (
                <div className="rounded-2xl border border-gray-200/50 bg-gray-50/40 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Información</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Nombre, descripción, día, hora y lugar de la reunión.
                    </p>
                    {errorInfo ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorInfo}</p> : null}
                  </div>

                  <div className="mt-6 min-w-0 space-y-5">
                    <div className="space-y-1.5">
                      <label htmlFor="info-nombre" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Nombre del grupo
                      </label>
                      <input
                        id="info-nombre"
                        type="text"
                        value={infoNombre}
                        onChange={(e) => setInfoNombre(e.target.value)}
                        className={GRUPO_INFO_EDIT_CONTROL_CLASS}
                        placeholder="Ej. Parejas jóvenes"
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="info-desc" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Descripción
                      </label>
                      <textarea
                        id="info-desc"
                        rows={4}
                        value={infoDescripcion}
                        onChange={(e) => setInfoDescripcion(e.target.value)}
                        className={`${GRUPO_INFO_EDIT_CONTROL_CLASS} min-h-[5.5rem] resize-y leading-relaxed`}
                        placeholder="Opcional"
                      />
                    </div>

                    <p className="border-t border-gray-200/50 pt-5 text-xs font-semibold uppercase tracking-[0.06em] text-gray-500 dark:border-white/10 dark:text-gray-400">
                      Reunión
                    </p>

                    <div className="space-y-1.5">
                      <label htmlFor="info-dia" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Día
                      </label>
                      <select
                        id="info-dia"
                        value={infoDia}
                        onChange={(e) => setInfoDia(e.target.value)}
                        className={GRUPO_INFO_EDIT_CONTROL_CLASS}
                        aria-label="Día de reunión"
                      >
                        <option value="">Sin día fijo</option>
                        {infoDia && !diasSemana.includes(infoDia) ? (
                          <option value={infoDia}>{infoDia} (actual)</option>
                        ) : null}
                        {diasSemana.map((dia) => (
                          <option key={dia} value={dia}>
                            {dia}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">Hora</span>
                      <div className="min-w-0">
                        <TimePicker
                          id="info-hora"
                          value={infoHora}
                          onChange={setInfoHora}
                          placeholder="Seleccionar hora"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="info-ubic" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Lugar
                      </label>
                      <input
                        id="info-ubic"
                        type="text"
                        value={infoUbicacion}
                        onChange={(e) => setInfoUbicacion(e.target.value)}
                        className={GRUPO_INFO_EDIT_CONTROL_CLASS}
                        placeholder="Dirección o referencia"
                      />
                    </div>

                    <div className="space-y-4 border-t border-gray-200/50 pt-4 dark:border-white/10">
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Creado</p>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{formatCreatedAt(grupo.created_at)}</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingInformacion(false);
                            setErrorInfo(null);
                          }}
                          className="rounded-xl border border-gray-200/80 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-white dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/[0.06]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => void guardarInformacion()}
                          className="rounded-xl bg-[#18301d] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#142818] dark:bg-[#18301d] dark:hover:bg-[#1f3d28]"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/60 px-5 py-4 dark:border-white/10">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Información</h3>
                    {grupoOperativo ? (
                      <button
                        type="button"
                        onClick={() => {
                          setInfoNombre(grupo.nombre);
                          setInfoDescripcion(grupo.descripcion ?? "");
                          setInfoDia(grupo.dia ?? "");
                          setInfoHora(grupo.hora);
                          setInfoUbicacion(grupo.ubicacion ?? "");
                          setErrorInfo(null);
                          setEditingInformacion(true);
                        }}
                        className="shrink-0 text-sm font-medium text-violet-800 underline-offset-4 hover:underline dark:text-violet-300"
                      >
                        Editar
                      </button>
                    ) : null}
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
              )}

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
                    <svg className="h-5 w-5 shrink-0 text-violet-500 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Agregar grupo de apoyo</span>
                  </button>
                  <button
                    type="button"
                    disabled={!grupoOperativo}
                    onClick={() => {
                      if (!grupoOperativo) return;
                      setModoAgregarPersonas("colider");
                      setModalAgregarPersonas(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-gray-200/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-white/[0.06] dark:disabled:hover:bg-transparent"
                  >
                    <svg className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.21.017.396.13.498.303a.562.562 0 01-.034.648l-4.15 3.56a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.576 0L6.348 20.001a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.15-3.56a.562.562 0 01-.033-.647.563.563 0 00.497-.303l5.518-.441a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Designar co-líder</span>
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
