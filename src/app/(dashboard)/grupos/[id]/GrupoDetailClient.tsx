"use client";

import { useEffect, useState, useCallback, useMemo, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GrupoAvatarCluster } from "@/components/GrupoAvatarCluster";
import { UserAvatar } from "@/components/UserAvatar";
import { soloDigitosDocumentoId } from "@/lib/documento-id";
import { fechaHoyYYYYMMDD } from "@/lib/fecha-hoy-local";
import { ETAPA_LABELS, ETAPAS_FILTRO_LISTA, parseEtapaDb, etapaStyles, type EtapaPersonaDb } from "@/lib/persona-etapa";
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
import {
  BTN_FICHA_PRIMARIO_FLEX,
  BTN_FICHA_SECUNDARIO_FLEX,
} from "@/app/(dashboard)/personas/[id]/_lib/persona-detail-buttons";

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

/** Campos del modal de edición de grupo. */
const GRUPO_INFO_EDIT_CONTROL_CLASS =
  "w-full min-w-0 rounded-xl border border-gray-200/80 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300/40 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-white/30 dark:focus:ring-white/15 dark:[color-scheme:dark]";

const BTN_EDITAR_GRUPO =
  "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/80 px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-[#252525] dark:text-gray-100 dark:hover:bg-[#2e2e2e]";

function GrupoInformacionEditModal({
  isOpen,
  onClose,
  onGuardar,
  errorInfo,
  infoNombre,
  setInfoNombre,
  infoDescripcion,
  setInfoDescripcion,
  infoDia,
  setInfoDia,
  infoHora,
  setInfoHora,
  infoUbicacion,
  setInfoUbicacion,
  diasSemanaOptions,
  createdAtLabel,
}: {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: () => void;
  errorInfo: string | null;
  infoNombre: string;
  setInfoNombre: (v: string) => void;
  infoDescripcion: string;
  setInfoDescripcion: (v: string) => void;
  infoDia: string;
  setInfoDia: (v: string) => void;
  infoHora: string | null;
  setInfoHora: (v: string | null) => void;
  infoUbicacion: string;
  setInfoUbicacion: (v: string) => void;
  diasSemanaOptions: string[];
  createdAtLabel: string;
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
        className="relative z-[1] flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-[#2a2a2a] dark:bg-[#1a1a1a]"
        role="dialog"
        aria-labelledby="editar-grupo-titulo"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-[#2a2a2a]">
          <div className="min-w-0">
            <h2 id="editar-grupo-titulo" className="text-lg font-semibold text-gray-900 dark:text-white">
              Editar grupo
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Nombre, descripción, día, hora y lugar de la reunión.
            </p>
            {errorInfo ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorInfo}</p> : null}
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

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
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
              rows={3}
              value={infoDescripcion}
              onChange={(e) => setInfoDescripcion(e.target.value)}
              className={`${GRUPO_INFO_EDIT_CONTROL_CLASS} min-h-[5rem] resize-y leading-relaxed`}
              placeholder="Opcional"
            />
          </div>
          <p className="border-t border-gray-200/50 pt-4 text-xs font-semibold uppercase tracking-[0.06em] text-gray-500 dark:border-white/10 dark:text-gray-400">
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
            >
              <option value="">Sin día fijo</option>
              {infoDia && !diasSemanaOptions.includes(infoDia) ? (
                <option value={infoDia}>{infoDia} (actual)</option>
              ) : null}
              {diasSemanaOptions.map((dia) => (
                <option key={dia} value={dia}>
                  {dia}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">Hora</span>
            <TimePicker id="info-hora" value={infoHora} onChange={setInfoHora} placeholder="Seleccionar hora" />
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
          <div className="border-t border-gray-200/50 pt-4 dark:border-white/10">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Creado</p>
            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{createdAtLabel}</p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-gray-100 px-5 py-4 dark:border-[#2a2a2a]">
          <button type="button" onClick={onClose} className={BTN_FICHA_SECUNDARIO_FLEX}>
            Cancelar
          </button>
          <button type="button" onClick={onGuardar} className={BTN_FICHA_PRIMARIO_FLEX}>
            Guardar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
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

function propsFilaPersonaGrupo(
  personaId: string,
  personaNombre: string,
  router: ReturnType<typeof useRouter>,
  hoverClassName: string,
) {
  const ir = () => router.push(`/personas/${personaId}`);
  return {
    role: "link" as const,
    tabIndex: 0,
    "aria-label": `Ver ficha de ${personaNombre}`,
    className: `cursor-pointer transition ${hoverClassName}`,
    onClick: (e: MouseEvent<HTMLElement>) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      ir();
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      ir();
    },
  };
}

function datosFilaMiembro(miembro: MiembroData, ultimaAsistenciaPorMiembro: Record<string, string>) {
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
  return { pill, subEtiqueta, subClass, lineaSeg, lineaAsist, clsSeg, clsAsist };
}

function MiembroGrupoMobileCard({
  miembro,
  ultimaAsistenciaPorMiembro,
  router,
  hoverClassName,
  idPrefix,
}: {
  miembro: MiembroData;
  ultimaAsistenciaPorMiembro: Record<string, string>;
  router: ReturnType<typeof useRouter>;
  hoverClassName: string;
  idPrefix: string;
}) {
  const { pill, subEtiqueta, subClass, lineaSeg, lineaAsist, clsSeg, clsAsist } = datosFilaMiembro(
    miembro,
    ultimaAsistenciaPorMiembro,
  );
  const filaProps = propsFilaPersonaGrupo(miembro.id, miembro.nombre, router, hoverClassName);

  return (
    <div id={`${idPrefix}-${miembro.id}`} {...filaProps} className={`px-4 py-3.5 ${filaProps.className}`}>
      <div className="flex gap-3">
        <UserAvatar seed={miembro.nombre} sexo={parsePersonaSexo(miembro.sexo)} size={44} />
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug text-gray-900 dark:text-white">{miembro.nombre}</p>
          <p className={`mt-0.5 text-xs ${subClass}`}>{subEtiqueta}</p>
          <div className="mt-2 space-y-1">
            <p className={`text-xs leading-snug ${clsSeg}`}>
              <span className="font-medium text-gray-600 dark:text-gray-400">Seguimiento: </span>
              {lineaSeg}
            </p>
            <p className={`text-xs leading-snug ${clsAsist}`}>
              <span className="font-medium text-gray-600 dark:text-gray-400">Últ. reunión: </span>
              {lineaAsist}
            </p>
          </div>
          <span
            className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${pill.badge}`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${pill.dot}`} />
            {pill.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function ListaMiembrosGrupoMobile({
  miembros,
  ultimaAsistenciaPorMiembro,
  router,
  hoverClassName,
  idPrefix,
  emptyMessage,
  onLimpiarFiltros,
}: {
  miembros: MiembroData[];
  ultimaAsistenciaPorMiembro: Record<string, string>;
  router: ReturnType<typeof useRouter>;
  hoverClassName: string;
  idPrefix: string;
  emptyMessage: string;
  onLimpiarFiltros: () => void;
}) {
  if (miembros.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400 lg:hidden">
        {emptyMessage}{" "}
        <button
          type="button"
          className="font-medium text-gray-900 underline-offset-2 hover:underline dark:text-white"
          onClick={onLimpiarFiltros}
        >
          Limpiar filtros
        </button>
        .
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200/50 dark:divide-white/10 lg:hidden">
      {miembros.map((miembro) => (
        <MiembroGrupoMobileCard
          key={miembro.id}
          miembro={miembro}
          ultimaAsistenciaPorMiembro={ultimaAsistenciaPorMiembro}
          router={router}
          hoverClassName={hoverClassName}
          idPrefix={idPrefix}
        />
      ))}
    </div>
  );
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
  const [filtroEtapa, setFiltroEtapa] = useState<EtapaPersonaDb | "Todos">("Todos");

  useEffect(() => {
    setEditingInformacion(false);
    setErrorInfo(null);
    setBusquedaMiembroGrupo("");
    setFiltroEtapa("Todos");
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
  const miembroPasaFiltros = useCallback(
    (m: MiembroData) => {
      if (filtroEtapa !== "Todos" && parseEtapaDb(m.etapa) !== filtroEtapa) return false;
      const q = busquedaMiembroGrupo.trim();
      if (q && !nombreCoincideBusqueda(m.nombre, q)) return false;
      return true;
    },
    [busquedaMiembroGrupo, filtroEtapa],
  );

  const miembrosNucleoFiltrados = useMemo(
    () => miembrosNucleo.filter(miembroPasaFiltros),
    [miembrosNucleo, miembroPasaFiltros],
  );
  const apoyoLista = useMemo(
    () => miembros.filter((m) => m.participacion_en_grupo === "apoyo"),
    [miembros]
  );
  const colidersLista = useMemo(
    () => miembros.filter((m) => m.participacion_en_grupo === "colider"),
    [miembros]
  );
  const apoyoListaFiltrados = useMemo(
    () => apoyoLista.filter(miembroPasaFiltros),
    [apoyoLista, miembroPasaFiltros],
  );
  const colidersListaFiltrados = useMemo(
    () => colidersLista.filter(miembroPasaFiltros),
    [colidersLista, miembroPasaFiltros],
  );

  const hayFiltrosMiembrosActivos = busquedaMiembroGrupo.trim().length > 0 || filtroEtapa !== "Todos";

  const limpiarFiltrosMiembros = useCallback(() => {
    setBusquedaMiembroGrupo("");
    setFiltroEtapa("Todos");
  }, []);

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
      "flex min-h-0 flex-col justify-center rounded-xl px-3 py-2.5 text-left";
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

  const abrirEdicionInformacion = useCallback(() => {
    if (!grupo) return;
    setInfoNombre(grupo.nombre);
    setInfoDescripcion(grupo.descripcion ?? "");
    setInfoDia(grupo.dia ?? "");
    setInfoHora(grupo.hora);
    setInfoUbicacion(grupo.ubicacion ?? "");
    setErrorInfo(null);
    setEditingInformacion(true);
  }, [grupo]);

  const cerrarEdicionInformacion = useCallback(() => {
    setEditingInformacion(false);
    setErrorInfo(null);
  }, []);

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

  const hayPersonasParaBuscar =
    miembrosNucleo.length > 0 || apoyoLista.length > 0 || colidersLista.length > 0;

  const inputBusquedaMiembros = hayPersonasParaBuscar ? (
    <div className="relative min-w-0 w-full">
      <label htmlFor="buscar-miembro-grupo" className="sr-only">
        Buscar por nombre en núcleo, co-líderes o grupo de apoyo
      </label>
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
        className="w-full rounded-full border border-gray-200/80 bg-white py-2 pl-10 pr-10 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300/40 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-white/30 dark:focus:ring-white/15"
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
  ) : null;

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
      <GrupoInformacionEditModal
        isOpen={editingInformacion}
        onClose={cerrarEdicionInformacion}
        onGuardar={() => void guardarInformacion()}
        errorInfo={errorInfo}
        infoNombre={infoNombre}
        setInfoNombre={setInfoNombre}
        infoDescripcion={infoDescripcion}
        setInfoDescripcion={setInfoDescripcion}
        infoDia={infoDia}
        setInfoDia={setInfoDia}
        infoHora={infoHora}
        setInfoHora={setInfoHora}
        infoUbicacion={infoUbicacion}
        setInfoUbicacion={setInfoUbicacion}
        diasSemanaOptions={diasSemana}
        createdAtLabel={formatCreatedAt(grupo.created_at)}
      />
      <div className="w-full pt-0 md:pt-6">
        <div className="relative mb-4 rounded-3xl bg-gray-100/50 p-3 dark:bg-white/[0.04] sm:mb-6 sm:p-5 md:pl-12">
          <Link
            href="/grupos"
            className="absolute left-2 top-2 z-10 rounded-full p-2 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white sm:left-3 sm:top-3 md:left-4 md:top-4"
            title="Volver a grupos"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>

          <div className="flex flex-col gap-4 pt-5 sm:gap-5 lg:flex-row lg:items-start lg:gap-6 md:pt-1">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
            <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:gap-5">
              <div className="flex shrink-0 justify-center sm:justify-start">
                <GrupoAvatarCluster nombreGrupo={grupo.nombre} sizeCenter={80} sizeSide={48} />
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
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
                    <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                      {grupo.nombre}
                    </h1>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                      {grupo.descripcion || "Sin descripción"}
                    </p>
                  </div>
                  {grupoOperativo ? (
                    <button type="button" onClick={abrirEdicionInformacion} className={`${BTN_EDITAR_GRUPO} mx-auto sm:mx-0`}>
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      Editar grupo
                    </button>
                  ) : null}
                </div>

                {(grupo.lideres || colidersLista.length > 0 || apoyoLista.length > 0) && (
                  <div className="mt-3 flex flex-col items-center gap-3 sm:items-start">
                    {grupo.lideres ? (
                      <div className="flex items-center gap-2.5">
                        <UserAvatar seed={grupo.lideres.nombre} sexo={parsePersonaSexo(grupo.lideres.sexo)} size={34} />
                        <div className="min-w-0 text-left">
                          <Link
                            href={`/lideres/${grupo.lideres.id}`}
                            className="text-sm font-medium text-gray-900 transition hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                          >
                            {grupo.lideres.nombre}
                          </Link>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Líder principal
                            {textoBajoNombreLiderPrincipal(grupo.lideres)
                              ? ` · ${textoBajoNombreLiderPrincipal(grupo.lideres)}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {(colidersLista.length > 0 || apoyoLista.length > 0) && (
                      <div className="flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-start">
                        {colidersLista.length > 0 ? (
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Co-líderes</span>
                            <ul className="flex flex-wrap gap-1.5">
                              {colidersLista.map((c) => (
                                <li key={c.id} className={liderazgoColidersSoloAvatar ? "shrink-0" : "min-w-0"}>
                                  <LiderazgoHeroPersonaListItem m={c} variant="colider" soloAvatar={liderazgoColidersSoloAvatar} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {apoyoLista.length > 0 ? (
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Apoyo</span>
                            <ul className="flex flex-wrap gap-1.5">
                              {apoyoLista.map((a) => (
                                <li key={a.id} className={liderazgoApoyoSoloAvatar ? "shrink-0" : "min-w-0"}>
                                  <LiderazgoHeroPersonaListItem m={a} variant="apoyo" soloAvatar={liderazgoApoyoSoloAvatar} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {hayPersonasParaBuscar ? (
              <div className="flex w-full min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
                <div className="min-w-0 w-full flex-1">{inputBusquedaMiembros}</div>
                <div className="relative w-full shrink-0 lg:w-48">
                  <label htmlFor="grupo-filtro-etapa" className="sr-only">
                    Filtrar por etapa
                  </label>
                  <select
                    id="grupo-filtro-etapa"
                    value={filtroEtapa}
                    onChange={(e) => setFiltroEtapa(e.target.value as EtapaPersonaDb | "Todos")}
                    className="w-full cursor-pointer appearance-none rounded-full border border-gray-200/80 bg-white py-2 pl-4 pr-10 text-sm text-gray-900 shadow-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300/40 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:border-white/30 dark:focus:ring-white/15"
                  >
                    {ETAPAS_FILTRO_LISTA.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            ) : null}
            </div>

            <div className="grid w-full shrink-0 grid-cols-2 gap-2 lg:w-[min(100%,19rem)]">
              <div className="flex flex-col justify-center rounded-xl border border-gray-200/60 bg-white/60 px-3 py-2.5 dark:border-white/[0.08] dark:bg-white/[0.05]">
                <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">{miembros.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Personas</p>
                {apoyoLista.length > 0 ? (
                  <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                    {miembrosNucleo.length} núcleo · {apoyoLista.length} apoyo
                  </p>
                ) : miembros.length > 0 ? (
                  <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">Todo núcleo</p>
                ) : null}
              </div>

              <div className={estiloTarjetaAsistencia.card}>
                <p className={`text-lg font-semibold tabular-nums ${estiloTarjetaAsistencia.valor}`}>
                  {statsLoading ? "—" : porcentajeAsistenciaMes === null ? "—" : `${Math.round(porcentajeAsistenciaMes)}%`}
                </p>
                <p
                  className={`text-xs ${porcentajeAsistenciaMes === null ? "text-gray-500 dark:text-gray-400" : estiloTarjetaAsistencia.detalle}`}
                >
                  Asistencia del mes
                </p>
                {!statsLoading && porcentajeAsistenciaMes !== null ? (
                  <p className={`mt-0.5 text-[11px] ${estiloTarjetaAsistencia.detalle}`}>
                    {asistenciaMes} {asistenciaMes === 1 ? "persona" : "personas"}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col justify-center rounded-xl border border-gray-200/60 bg-white/60 px-3 py-2.5 dark:border-white/[0.08] dark:bg-white/[0.05]">
                <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                  {statsLoading ? "—" : reunionesMes}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reuniones este mes</p>
              </div>

              <div className="flex flex-col justify-center rounded-xl border border-gray-200/60 bg-white/50 px-3 py-2.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
                {statsLoading ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cargando…</p>
                ) : ultimaReunionAsistencia ? (
                  <>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Última reunión</p>
                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      {formatFechaCorta(ultimaReunionAsistencia.fecha)} ·{" "}
                      {ultimaReunionAsistencia.personas.length}{" "}
                      {ultimaReunionAsistencia.personas.length === 1 ? "asistente" : "asistentes"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {ultimaReunionAsistencia.personas.map((p) => (
                        <span key={p.id} className="group relative z-0 inline-flex">
                          <Link
                            prefetch={false}
                            href={`/personas/${p.id}`}
                            aria-label={p.nombre}
                            className="rounded-full ring-2 ring-white/80 transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 dark:ring-[#1a1a1a] dark:focus-visible:outline-white/40"
                          >
                            <UserAvatar seed={p.nombre} sexo={parsePersonaSexo(p.sexo)} size={26} />
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
                  <>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Última reunión</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                      Sin asistencias registradas
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-2 md:py-4">
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
                <div className="scrollbar-brand max-h-[min(calc(25*4rem),90dvh)] overflow-y-auto overscroll-y-contain lg:overflow-x-auto">
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
                        <>
                          <ListaMiembrosGrupoMobile
                            miembros={miembrosNucleoFiltrados}
                            ultimaAsistenciaPorMiembro={ultimaAsistenciaPorMiembro}
                            router={router}
                            hoverClassName="hover:bg-gray-200/40 dark:hover:bg-white/[0.06]"
                            idPrefix="fila-miembro"
                            emptyMessage="Ninguna persona del núcleo coincide con los filtros actuales."
                            onLimpiarFiltros={limpiarFiltrosMiembros}
                          />
                        <div className="hidden min-w-[36rem] lg:block">
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
                                    Ninguna persona del núcleo coincide con los filtros actuales.{" "}
                                    <button
                                      type="button"
                                      className="font-medium text-gray-900 underline-offset-2 hover:underline dark:text-white"
                                      onClick={limpiarFiltrosMiembros}
                                    >
                                      Limpiar filtros
                                    </button>
                                    .
                                  </td>
                                </tr>
                              ) : (
                                miembrosNucleoFiltrados.map((miembro) => {
                                  const { pill, subEtiqueta, subClass, lineaSeg, lineaAsist, clsSeg, clsAsist } =
                                    datosFilaMiembro(miembro, ultimaAsistenciaPorMiembro);
                                  return (
                                    <tr
                                      key={miembro.id}
                                      id={`fila-miembro-${miembro.id}`}
                                      {...propsFilaPersonaGrupo(
                                        miembro.id,
                                        miembro.nombre,
                                        router,
                                        "hover:bg-gray-200/40 dark:hover:bg-white/[0.06]",
                                      )}
                                    >
                                      <td className="w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem] align-middle py-2.5 pl-4 pr-2">
                                        <div className="flex w-10 shrink-0 items-center justify-center">
                                          <UserAvatar seed={miembro.nombre} sexo={parsePersonaSexo(miembro.sexo)} size={40} />
                                        </div>
                                      </td>
                                      <td className="min-w-[10rem] align-middle py-2.5 pl-1 pr-3">
                                        <div className="min-w-0">
                                          <span className="block truncate font-medium leading-tight text-gray-900 dark:text-white">
                                            {miembro.nombre}
                                          </span>
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
                            {hayFiltrosMiembrosActivos ? (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {colidersListaFiltrados.length}/{colidersLista.length}
                              </span>
                            ) : null}
                          </div>
                          <ListaMiembrosGrupoMobile
                            miembros={colidersListaFiltrados}
                            ultimaAsistenciaPorMiembro={ultimaAsistenciaPorMiembro}
                            router={router}
                            hoverClassName="hover:bg-amber-100/55 dark:hover:bg-amber-950/30"
                            idPrefix="fila-colider"
                            emptyMessage="Ningún co-líder coincide con los filtros actuales."
                            onLimpiarFiltros={limpiarFiltrosMiembros}
                          />
                          <div className="hidden min-w-[36rem] lg:block">
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
                                      Ningún co-líder coincide con los filtros actuales.{" "}
                                      <button
                                        type="button"
                                        className="font-medium text-gray-900 underline-offset-2 hover:underline dark:text-white"
                                        onClick={limpiarFiltrosMiembros}
                                      >
                                        Limpiar filtros
                                      </button>
                                      .
                                    </td>
                                  </tr>
                                ) : (
                                  colidersListaFiltrados.map((miembro) => {
                                    const { pill, subEtiqueta, subClass, lineaSeg, lineaAsist, clsSeg, clsAsist } =
                                      datosFilaMiembro(miembro, ultimaAsistenciaPorMiembro);
                                    return (
                                      <tr
                                        key={miembro.id}
                                        id={`fila-colider-${miembro.id}`}
                                        {...propsFilaPersonaGrupo(
                                          miembro.id,
                                          miembro.nombre,
                                          router,
                                          "hover:bg-amber-100/55 dark:hover:bg-amber-950/30",
                                        )}
                                      >
                                        <td className="w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem] align-middle py-2.5 pl-4 pr-2">
                                          <div className="flex w-10 shrink-0 items-center justify-center">
                                            <UserAvatar seed={miembro.nombre} sexo={parsePersonaSexo(miembro.sexo)} size={40} />
                                          </div>
                                        </td>
                                        <td className="min-w-[10rem] align-middle py-2.5 pl-1 pr-3">
                                          <div className="min-w-0">
                                            <span className="block truncate font-medium leading-tight text-gray-900 dark:text-white">
                                              {miembro.nombre}
                                            </span>
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
                            {hayFiltrosMiembrosActivos ? (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {apoyoListaFiltrados.length}/{apoyoLista.length}
                              </span>
                            ) : null}
                          </div>
                          <ListaMiembrosGrupoMobile
                            miembros={apoyoListaFiltrados}
                            ultimaAsistenciaPorMiembro={ultimaAsistenciaPorMiembro}
                            router={router}
                            hoverClassName="hover:bg-violet-100/50 dark:hover:bg-violet-950/25"
                            idPrefix="fila-apoyo"
                            emptyMessage="Nadie del grupo de apoyo coincide con los filtros actuales."
                            onLimpiarFiltros={limpiarFiltrosMiembros}
                          />
                          <div className="hidden min-w-[36rem] lg:block">
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
                                      Nadie del grupo de apoyo coincide con los filtros actuales.{" "}
                                      <button
                                        type="button"
                                        className="font-medium text-gray-900 underline-offset-2 hover:underline dark:text-white"
                                        onClick={limpiarFiltrosMiembros}
                                      >
                                        Limpiar filtros
                                      </button>
                                      .
                                    </td>
                                  </tr>
                                ) : (
                                  apoyoListaFiltrados.map((miembro) => {
                                    const { pill, subEtiqueta, subClass, lineaSeg, lineaAsist, clsSeg, clsAsist } =
                                      datosFilaMiembro(miembro, ultimaAsistenciaPorMiembro);
                                    return (
                                      <tr
                                        key={miembro.id}
                                        id={`fila-apoyo-${miembro.id}`}
                                        {...propsFilaPersonaGrupo(
                                          miembro.id,
                                          miembro.nombre,
                                          router,
                                          "hover:bg-violet-100/50 dark:hover:bg-violet-950/25",
                                        )}
                                      >
                                        <td className="w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem] align-middle py-2.5 pl-4 pr-2">
                                          <div className="flex w-10 shrink-0 items-center justify-center">
                                            <UserAvatar seed={miembro.nombre} sexo={parsePersonaSexo(miembro.sexo)} size={40} />
                                          </div>
                                        </td>
                                        <td className="min-w-[10rem] align-middle py-2.5 pl-1 pr-3">
                                          <div className="min-w-0">
                                            <span className="block truncate font-medium leading-tight text-gray-900 dark:text-white">
                                              {miembro.nombre}
                                            </span>
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

              {/* Información del grupo */}
              <div className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/60 px-5 py-4 dark:border-white/10">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Información</h3>
                  {grupoOperativo ? (
                    <button
                      type="button"
                      onClick={abrirEdicionInformacion}
                      className="shrink-0 text-sm font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white"
                    >
                      Editar
                    </button>
                  ) : null}
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nombre</p>
                    <p className="font-medium text-gray-900 dark:text-white">{grupo.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Descripción</p>
                    <p className="font-medium text-gray-900 dark:text-white">{grupo.descripcion || "—"}</p>
                  </div>
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

              {/* Acciones rápidas */}
              <div className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
                <div className="border-b border-gray-200/60 px-5 py-4 dark:border-white/10">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Acciones rápidas</h3>
                </div>
                <div className="space-y-1 p-3">
                  {grupoOperativo ? (
                    <button
                      type="button"
                      onClick={abrirEdicionInformacion}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-gray-200/40 dark:hover:bg-white/[0.06]"
                    >
                      <svg className="h-5 w-5 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Editar información del grupo</span>
                    </button>
                  ) : null}
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
