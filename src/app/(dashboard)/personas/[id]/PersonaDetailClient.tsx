"use client";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  type ReactNode,
  type SetStateAction,
} from "react";
import Link from "next/link";
import { GrupoResumenCard, type GrupoResumenCardModel } from "@/components/GrupoResumenCard";
import { AvatarHistoriasServicioGrupo } from "@/components/AvatarHistoriasServicioGrupo";
import {
  labelSituacionAcercamiento,
  labelTriBool,
  parseTriBoolForm,
  SITUACION_ACERCAMIENTO_OPTIONS,
  type SituacionAcercamiento,
} from "@/lib/personas-situacion-acercamiento";
import {
  formatEstadoCivilYPareja,
  labelSituacionLaboralEstudio,
} from "@/lib/persona-info-lider";
import { labelPersonaSexo, parsePersonaSexo, type PersonaSexo } from "@/lib/persona-sexo";
import {
  ETAPA_LABELS,
  ETAPAS_FILTRO_LISTA,
  type EtapaPersonaDb,
  etapaDotClass,
  etapaStyles,
  parseEtapaDb,
} from "@/lib/persona-etapa";
import { fechaHoyYYYYMMDD } from "@/lib/fecha-hoy-local";
import { createClient } from "@/lib/supabase/client";
import {
  buildGrupoResumenFromJoin,
  type GrupoJoinNested,
  type PersonaGrupoResumen,
} from "./_lib/grupo-resumen-persona";
import { PERSONA_DETALLE_GRUPOS_JOIN } from "./_hooks/persona-detail-selects";
import dynamic from "next/dynamic";
import { MapaCaminoEtapaPersona } from "./_components/MapaCaminoEtapaPersona";
import { etapaMostradaEnCamino } from "./_lib/persona-camino-etapas";
import { RachasCabeceraPersona } from "./_components/RachasCabeceraPersona";
import { PersonalInfoCard, ProcesoYCaminoCard } from "./_components/PersonaDetailPersonalProcesoCards";
import type { GrupoParaAsignar } from "./_components/PersonaPageModals";
import { labelParticipacionEnGrupo, type ParticipacionEnGrupo, type Rol } from "./_lib/persona-detail-participacion";
import {
  resultadoSeguimientoLabelsCorto,
  tipoSeguimientoLabelsCorto,
  type SeguimientoSavePayload,
} from "./_lib/persona-seguimiento-labels";

const PersonaDetailModals = dynamic(
  () => import("./_components/PersonaPageModals").then((m) => m.PersonaDetailModals),
  { ssr: false, loading: () => null },
);



interface NotaHistorialItem {
  id: string;
  contenido: string;
  creadoEn: string;
  autor: string;
}

/** Entrada de persona_historial que no es solo asistencia a reunión */
interface RegistroSeguimientoItem {
  id: string;
  fecha: string;
  fechaDisplay: string;
  titulo: string;
  subtitulo: string | null;
  notas: string | null;
}

interface Persona {
  id: string;
  cedula: string;
  nombre: string;
  telefono: string;
  email: string;
  /** YYYY-MM-DD desde DB; para edición inline sin reparsing del texto formateado */
  fechaNacimientoIso: string | null;
  fechaNacimiento: string;
  edad: number | null;
  estadoCivil: string;
  ocupacion: string;
  direccion: string;
  grupo: string;
  grupoId: string | null;
  grupoImagen: string | null;
  /** Datos para la misma tarjeta visual que en /grupos */
  grupoResumen: PersonaGrupoResumen | null;
  participacionEnGrupo: ParticipacionEnGrupo | null;
  rol: Rol;
  etapa: EtapaPersonaDb;
  fechaRegistro: string;
  ultimoContacto: string;
  /** YYYY-MM-DD para edición (columna o inferido desde alta). */
  fechaRegistroIso: string | null;
  ultimoContactoIso: string | null;
  /** YYYY-MM-DD ingreso al grupo actual; null sin grupo. */
  fechaIngresoGrupoIso: string | null;
  fechaCaminoBautismoIso: string | null;
  fechaBautismoIso: string | null;
  lugarBautismo: string | null;
  /** YYYY-MM-DD designación co-líder; null si no aplica. */
  coLiderDesdeIso: string | null;
  notasHistorial: NotaHistorialItem[];
  /** Peticiones de oración (misma forma que notas: texto + autor + fecha) */
  peticionesOracion: NotaHistorialItem[];
  /** Contactos pastorales (excluye asistencia a grupo) */
  registrosSeguimiento: RegistroSeguimientoItem[];
  bautizado: boolean | null;
  vieneDeOtraIglesia: boolean | null;
  nombreIglesiaAnterior: string | null;
  situacionAcercamiento: string | null;
  tienePareja: boolean | null;
  nombrePareja: string | null;
  trabajaActualmente: boolean | null;
  estudiaActualmente: boolean | null;
  condicionSalud: string | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
  /** Para avatar ilustrado y referencia; null = no indicado (el avatar sigue solo el nombre). */
  sexo: PersonaSexo | null;
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
  const fechaConAnio = d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff >= 2 && diff <= 6) return `Hace ${diff} días`;
  if (diff >= 7 && diff <= 13) return `Hace 1 semana · ${fechaConAnio}`;
  if (diff >= 14 && diff <= 29) return `Hace 2 semanas · ${fechaConAnio}`;
  if (diff >= 30 && diff <= 59) return `Hace 1 mes · ${fechaConAnio}`;
  if (diff >= 60) return `Hace más de 2 meses · ${fechaConAnio}`;
  return fechaConAnio;
}

function formatHistorialFecha(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function mapHistorialRowToRegistro(row: {
  id: string;
  fecha: string;
  accion: string;
  tipo_seguimiento: string | null;
  resultado_seguimiento: string | null;
  notas: string | null;
}): RegistroSeguimientoItem | null {
  if (row.tipo_seguimiento === "asistencia") return null;

  const tipoKey = row.tipo_seguimiento;
  const resKey = row.resultado_seguimiento;
  let titulo: string;
  let subtitulo: string | null;

  if (tipoKey && tipoSeguimientoLabelsCorto[tipoKey]) {
    titulo = tipoSeguimientoLabelsCorto[tipoKey];
    subtitulo = resKey ? resultadoSeguimientoLabelsCorto[resKey] ?? resKey : null;
  } else {
    titulo = row.accion;
    subtitulo = null;
  }

  return {
    id: row.id,
    fecha: row.fecha,
    fechaDisplay: formatHistorialFecha(row.fecha),
    titulo,
    subtitulo,
    notas: (row.notas ?? "").trim() || null,
  };
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

type AuthInsertContext = {
  userId: string;
  organizationId: string;
  fullName: string;
};

export default function PersonaDetailClient({
  personaId,
  initialNombre,
  initialEtapaLabel,
}: {
  personaId: string;
  initialNombre?: string | null;
  initialEtapaLabel?: string | null;
}) {
  const id = personaId;

  /** Sesión + org para inserts sin repetir getUser() + profile en cada guardado */
  const authInsertCtxRef = useRef<AuthInsertContext | null>(null);
  const notaInsertInFlightRef = useRef(false);
  const peticionInsertInFlightRef = useRef(false);
  const seguimientoInsertInFlightRef = useRef(false);
  const seguimientoRecoverRef = useRef<{
    etapa: EtapaPersonaDb;
    ultimoContacto: string;
    registrosSeguimiento: RegistroSeguimientoItem[];
  } | null>(null);

  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSeguimientoModal, setShowSeguimientoModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);
  const showAppToast = useCallback((message: string, variant: "success" | "error" = "success") => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 3000);
  }, []);
  const [rachaAsistencia, setRachaAsistencia] = useState<number>(0);
  const [ultimaAsistencia, setUltimaAsistencia] = useState<string | null>(null);
  const [nuevaNota, setNuevaNota] = useState("");
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [errorNota, setErrorNota] = useState<string | null>(null);
  const [nuevaPeticion, setNuevaPeticion] = useState("");
  const [guardandoPeticion, setGuardandoPeticion] = useState(false);
  const [errorPeticion, setErrorPeticion] = useState<string | null>(null);
  const [showLiberarGrupoModal, setShowLiberarGrupoModal] = useState(false);
  const [liberandoGrupo, setLiberandoGrupo] = useState(false);
  const [showAsignarGrupoModal, setShowAsignarGrupoModal] = useState(false);
  const [showPasarApoyoModal, setShowPasarApoyoModal] = useState(false);
  const [showDesignarColiderModal, setShowDesignarColiderModal] = useState(false);
  const [showCambiarEtapaModal, setShowCambiarEtapaModal] = useState(false);
  const [showRegistrarBautismoModal, setShowRegistrarBautismoModal] = useState(false);
  /** El SELECT de detalle incluyó columnas de info para líder (pareja, trabajo, salud, emergencia). */
  const [detalleIncludesInfoLider, setDetalleIncludesInfoLider] = useState(true);
  /** Incluye bautismo, situación de acercamiento y otra iglesia (SELECT sin columnas espirituales = false). */
  const [detalleIncludesSpiritual, setDetalleIncludesSpiritual] = useState(true);

  const rachaSeguimiento = useMemo(() => {
    if (!persona) return 0;
    return calcularRacha(persona.registrosSeguimiento.map((r) => r.fecha));
  }, [persona]);

  /** Registrar bautismo: al menos 1 asistencia al grupo + 1 seguimiento pastoral (no cuenta solo asistencia en historial). */
  const puedeRegistrarBautismo = useMemo(() => {
    if (!persona) return false;
    if (persona.bautizado === true) return false;
    return rachaAsistencia >= 1 && persona.registrosSeguimiento.length >= 1;
  }, [persona, rachaAsistencia]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setPersona(null);
    setLoadError(null);
    setNotFound(false);
    const supabase = createClient();
    (async () => {
      /** En paralelo con el SELECT de persona: el perfil no bloquea la primera pintura de datos. */
      const authPromise = (async () => {
        try {
          const {
            data: { session },
            error: sessErr,
          } = await supabase.auth.getSession();
          if (cancelled) return;
          const uid = session?.user?.id;
          if (!sessErr && uid) {
            const cached = authInsertCtxRef.current;
            if (cached?.userId === uid) {
              // mismo usuario: evita otro round-trip a profiles en cada cambio de ficha
            } else {
              const { data: prof } = await supabase
                .from("profiles")
                .select("organization_id, full_name")
                .eq("id", uid)
                .maybeSingle();
              if (cancelled) return;
              if (prof?.organization_id) {
                authInsertCtxRef.current = {
                  userId: uid,
                  organizationId: prof.organization_id,
                  fullName: ((prof.full_name as string | null) ?? "").trim(),
                };
              }
            }
          }
        } catch {
          /* no limpiar authInsertCtxRef: inserts pueden seguir usando caché */
        }
      })();

      const gruposJoin = PERSONA_DETALLE_GRUPOS_JOIN;
      const personaBaseCols =
        "id, cedula, nombre, telefono, email, fecha_nacimiento, edad, estado_civil, ocupacion, direccion, sexo, grupo_id, participacion_en_grupo, rol, etapa, fecha_registro, ultimo_contacto, notas, created_at, fecha_ingreso_grupo, co_lider_desde";
      const personaBase = `${personaBaseCols}, fecha_camino_bautismo, fecha_bautismo, lugar_bautismo`;
      const personaSpiritual =
        "bautizado, viene_de_otra_iglesia, nombre_iglesia_anterior, situacion_acercamiento";
      const personaLider =
        "tiene_pareja, nombre_pareja, trabaja_actualmente, estudia_actualmente, condicion_salud, contacto_emergencia_nombre, contacto_emergencia_telefono";
      /** SELECT completo en producción; fallbacks si falta alguna columna (DB antigua). */
      const selectAttempts = [
        `${personaBase}, ${personaSpiritual}, ${personaLider}, ${gruposJoin}`,
        `${personaBaseCols}, ${personaSpiritual}, ${personaLider}, ${gruposJoin}`,
        `${personaBase}, ${gruposJoin}`,
        `${personaBaseCols}, ${gruposJoin}`,
      ];

      let row: Record<string, unknown> | null = null;
      let lastError: { message?: string; code?: string } | null = null;
      let successfulSelectIndex = 0;
      for (let si = 0; si < selectAttempts.length; si++) {
        const sel = selectAttempts[si];
        const res = await supabase.from("personas").select(sel).eq("id", id).single();
        if (cancelled) return;
        if (!res.error) {
          row = res.data as unknown as Record<string, unknown>;
          successfulSelectIndex = si;
          break;
        }
        lastError = res.error;
        if (res.error.code === "PGRST116") {
          if (!cancelled) {
            setNotFound(true);
            setLoading(false);
          }
          void authPromise;
          return;
        }
        const msg = res.error.message ?? "";
        const missingColumn = /column|does not exist|42703|PGRST204|schema cache|unknown column|could not find/i.test(
          msg
        );
        if (!missingColumn) {
          console.error("personas detalle:", res.error);
          if (!cancelled) {
            setLoadError(msg || "No se pudo cargar la persona.");
            setLoading(false);
          }
          void authPromise;
          return;
        }
      }

      if (!row) {
        if (!cancelled) {
          if (lastError?.code === "PGRST116") {
            setNotFound(true);
          } else {
            console.error("personas detalle:", lastError);
            setLoadError(lastError?.message || "No se pudo cargar la persona.");
          }
          setLoading(false);
        }
        void authPromise;
        return;
      }

      const r = row as unknown as Record<string, unknown> & {
        grupos?: GrupoJoinNested | GrupoJoinNested[] | null;
      };
      const gJoin = r.grupos;
      const grupoJoinedRaw =
        gJoin == null ? null : Array.isArray(gJoin) ? gJoin[0] ?? null : gJoin;
      const grupoNombre = grupoJoinedRaw?.nombre ?? null;
      const grupoImagen = grupoJoinedRaw?.imagen ?? null;
      const grupoIdVal = (r.grupo_id as string) ?? null;
      let grupoResumen: PersonaGrupoResumen | null = null;
      if (grupoIdVal && grupoJoinedRaw) {
        try {
          grupoResumen = buildGrupoResumenFromJoin(grupoJoinedRaw as GrupoJoinNested, grupoIdVal);
        } catch {
          grupoResumen = null;
        }
      }
      const participacionRaw = r.participacion_en_grupo as string | null | undefined;
      const participacionEnGrupo: ParticipacionEnGrupo | null = grupoIdVal
        ? ((participacionRaw as ParticipacionEnGrupo) ?? "miembro")
        : null;
      const fechaNac = (r.fecha_nacimiento as string) ?? null;
      const edad = (r.edad as number) ?? calcularEdad(fechaNac);
      const created = (r.created_at as string) ?? "";
      const fechaCol = ((r.fecha_registro as string | null) ?? "").trim();
      const fechaRegistroIso =
        fechaCol && /^\d{4}-\d{2}-\d{2}/.test(fechaCol)
          ? fechaCol.slice(0, 10)
          : created
            ? new Date(created).toISOString().slice(0, 10)
            : null;
      const fechaRegistro =
        fechaRegistroIso != null ? formatFechaNacimiento(fechaRegistroIso) : "—";

      const [
        ,
        { data: historialRowsFull },
        { data: asistenciasRows },
        { data: notasRows, error: notasErr },
        { data: peticionesRows, error: peticionesErr },
      ] = await Promise.all([
        authPromise,
        supabase
          .from("persona_historial")
          .select("id, fecha, accion, responsable, tipo_seguimiento, resultado_seguimiento, notas, created_at")
          .eq("persona_id", id)
          .order("fecha", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(80),
        supabase
          .from("persona_asistencia")
          .select("fecha")
          .eq("persona_id", id)
          .order("fecha", { ascending: false })
          .limit(400),
        supabase
          .from("persona_notas")
          .select("id, contenido, created_at, created_by, profiles(full_name)")
          .eq("persona_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("persona_peticiones_oracion")
          .select("id, contenido, created_at, created_by, profiles(full_name)")
          .eq("persona_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;

      const ultimoCol = ((r.ultimo_contacto as string | null) ?? "").trim() || null;
      const ultimoFromHistorial =
        !ultimoCol && historialRowsFull?.[0] ? (historialRowsFull[0] as { fecha: string }).fecha : null;
      const ultimoSource = ultimoCol || ultimoFromHistorial;
      const ultimoContactoIso =
        ultimoSource && /^\d{4}-\d{2}-\d{2}/.test(ultimoSource) ? ultimoSource.slice(0, 10) : null;
      const ultimoContacto = formatUltimoContacto(ultimoSource);

      const registrosSeguimiento: RegistroSeguimientoItem[] = (historialRowsFull ?? [])
        .map((row) =>
          mapHistorialRowToRegistro(
            row as {
              id: string;
              fecha: string;
              accion: string;
              tipo_seguimiento: string | null;
              resultado_seguimiento: string | null;
              notas: string | null;
            }
          )
        )
        .filter((item): item is RegistroSeguimientoItem => item !== null);

      const fechasAsistencia = (asistenciasRows ?? []).map((a) => (a as { fecha: string }).fecha);
      setRachaAsistencia(calcularRacha(fechasAsistencia));
      setUltimaAsistencia(fechasAsistencia.length > 0 ? fechasAsistencia[0] : null);

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

      const peticionesOracion: NotaHistorialItem[] = !peticionesErr
        ? (peticionesRows ?? []).map((row) => {
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

      if (peticionesErr) {
        console.error("persona_peticiones_oracion:", peticionesErr);
      }

      const fechaIngresoRaw = ((r.fecha_ingreso_grupo as string | null | undefined) ?? "").trim();
      const fechaIngresoGrupoIso =
        fechaIngresoRaw && /^\d{4}-\d{2}-\d{2}/.test(fechaIngresoRaw) ? fechaIngresoRaw.slice(0, 10) : null;
      const coLiderRaw = ((r.co_lider_desde as string | null | undefined) ?? "").trim();
      const coLiderDesdeIso =
        coLiderRaw && /^\d{4}-\d{2}-\d{2}/.test(coLiderRaw) ? coLiderRaw.slice(0, 10) : null;
      const fechaCaminoRaw = ((r.fecha_camino_bautismo as string | null | undefined) ?? "").trim();
      const fechaCaminoBautismoIso =
        fechaCaminoRaw && /^\d{4}-\d{2}-\d{2}/.test(fechaCaminoRaw) ? fechaCaminoRaw.slice(0, 10) : null;
      const fechaBautismoRaw = ((r.fecha_bautismo as string | null | undefined) ?? "").trim();
      const fechaBautismoIso =
        fechaBautismoRaw && /^\d{4}-\d{2}-\d{2}/.test(fechaBautismoRaw) ? fechaBautismoRaw.slice(0, 10) : null;
      const lugarBautismo = ((r.lugar_bautismo as string | null | undefined) ?? "").trim() || null;

      setDetalleIncludesInfoLider(successfulSelectIndex === 0);
      setDetalleIncludesSpiritual(successfulSelectIndex === 0);

      setPersona({
        id: (r.id as string) ?? id,
        cedula: (r.cedula as string) ?? "",
        nombre: (r.nombre as string) ?? "",
        telefono: (r.telefono as string) ?? "",
        email: (r.email as string) ?? "",
        fechaNacimientoIso: fechaNac,
        fechaNacimiento: formatFechaNacimiento(fechaNac),
        edad,
        estadoCivil: (r.estado_civil as string) ?? "",
        ocupacion: (r.ocupacion as string) ?? "",
        direccion: (r.direccion as string) ?? "",
        grupo: grupoNombre ?? "Sin asignar",
        grupoId: grupoIdVal,
        grupoImagen,
        grupoResumen,
        participacionEnGrupo,
        rol: (r.rol as Rol) ?? "Miembro",
        etapa: parseEtapaDb(r.etapa as string),
        fechaRegistro,
        ultimoContacto,
        fechaRegistroIso,
        ultimoContactoIso,
        fechaIngresoGrupoIso,
        fechaCaminoBautismoIso,
        fechaBautismoIso,
        lugarBautismo,
        coLiderDesdeIso,
        notasHistorial,
        peticionesOracion,
        registrosSeguimiento,
        bautizado: (r.bautizado as boolean | null | undefined) ?? null,
        vieneDeOtraIglesia: (r.viene_de_otra_iglesia as boolean | null | undefined) ?? null,
        nombreIglesiaAnterior: ((r.nombre_iglesia_anterior as string) ?? "").trim() || null,
        situacionAcercamiento: (r.situacion_acercamiento as string) ?? null,
        tienePareja: (r.tiene_pareja as boolean | null | undefined) ?? null,
        nombrePareja: ((r.nombre_pareja as string | null | undefined) ?? "").trim() || null,
        trabajaActualmente: (r.trabaja_actualmente as boolean | null | undefined) ?? null,
        estudiaActualmente: (r.estudia_actualmente as boolean | null | undefined) ?? null,
        condicionSalud: ((r.condicion_salud as string | null | undefined) ?? "").trim() || null,
        contactoEmergenciaNombre: ((r.contacto_emergencia_nombre as string | null | undefined) ?? "").trim() || null,
        contactoEmergenciaTelefono: ((r.contacto_emergencia_telefono as string | null | undefined) ?? "").trim() || null,
        sexo: parsePersonaSexo(r.sexo),
      });
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSaveSeguimiento = (data: SeguimientoSavePayload) => {
    if (!persona || seguimientoInsertInFlightRef.current) return;
    seguimientoInsertInFlightRef.current = true;

    const today = new Date();
    const fechaIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const tipoTxt = tipoSeguimientoLabelsCorto[data.tipo] ?? data.tipo;
    const resTxt = resultadoSeguimientoLabelsCorto[data.resultado] ?? data.resultado;
    const accion = `${tipoTxt} · ${resTxt}`;
    const notasTrim = data.notas.trim() || null;

    const tempId = `temp-seguimiento-${Date.now()}`;
    const optimistic: RegistroSeguimientoItem = {
      id: tempId,
      fecha: fechaIso,
      fechaDisplay: formatHistorialFecha(fechaIso),
      titulo: tipoTxt,
      subtitulo: resTxt,
      notas: notasTrim,
    };

    setPersona((prev) => {
      if (!prev) return prev;
      seguimientoRecoverRef.current = {
        etapa: prev.etapa,
        ultimoContacto: prev.ultimoContacto,
        registrosSeguimiento: prev.registrosSeguimiento,
      };
      return {
        ...prev,
        ultimoContacto: "Hoy",
        registrosSeguimiento: [optimistic, ...prev.registrosSeguimiento],
      };
    });

    void (async () => {
      const supabase = createClient();
      try {
        const ctx = await resolveAuthInsertContext(supabase);
        if (!ctx) {
          const snap = seguimientoRecoverRef.current;
          if (snap) {
            setPersona((prev) =>
              prev
                ? {
                    ...prev,
                    etapa: snap.etapa,
                    ultimoContacto: snap.ultimoContacto,
                    registrosSeguimiento: snap.registrosSeguimiento,
                  }
                : prev
            );
          }
          const {
            data: { session: s },
          } = await supabase.auth.getSession();
          showAppToast(
            s?.user ? "No se pudo obtener tu organización." : "Debes iniciar sesión para registrar seguimiento.",
            "error"
          );
          return;
        }

        const { data: histIns, error: histErr } = await supabase
          .from("persona_historial")
          .insert({
            organization_id: ctx.organizationId,
            persona_id: id,
            fecha: fechaIso,
            accion,
            tipo_seguimiento: data.tipo,
            resultado_seguimiento: data.resultado,
            notas: notasTrim,
          })
          .select("id, fecha, accion, tipo_seguimiento, resultado_seguimiento, notas")
          .single();

        if (histErr) throw histErr;
        if (!histIns) throw new Error("Sin respuesta al guardar");

        const nuevoRegistro = mapHistorialRowToRegistro(
          histIns as {
            id: string;
            fecha: string;
            accion: string;
            tipo_seguimiento: string | null;
            resultado_seguimiento: string | null;
            notas: string | null;
          }
        );
        if (!nuevoRegistro) throw new Error("Registro inválido");

        await Promise.all([
          supabase.from("lideres").update({ ultimo_seguimiento: fechaIso }).eq("persona_id", id),
          supabase.from("personas").update({ ultimo_contacto: fechaIso }).eq("id", id),
        ]);

        setPersona((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            registrosSeguimiento: [
              nuevoRegistro,
              ...prev.registrosSeguimiento.filter((r) => r.id !== tempId && r.id !== nuevoRegistro.id),
            ],
          };
        });

        showAppToast("Seguimiento registrado", "success");
      } catch (e) {
        console.error("persona_historial insert:", e);
        const snap = seguimientoRecoverRef.current;
        if (snap) {
          setPersona((prev) =>
            prev
              ? {
                  ...prev,
                  etapa: snap.etapa,
                  ultimoContacto: snap.ultimoContacto,
                  registrosSeguimiento: snap.registrosSeguimiento,
                }
              : prev
          );
        }
        showAppToast(e instanceof Error ? e.message : "No se pudo guardar el seguimiento.", "error");
      } finally {
        seguimientoInsertInFlightRef.current = false;
      }
    })();
  };

  const handleConfirmarLiberarGrupo = async () => {
    if (!persona?.grupoId) return;
    setLiberandoGrupo(true);
    try {
      const supabase = createClient();
      const { error: updErr } = await supabase
        .from("personas")
        .update({
          grupo_id: null,
          etapa: "nuevo_creyente",
          participacion_en_grupo: null,
          fecha_ingreso_grupo: null,
          co_lider_desde: null,
        })
        .eq("id", id);

      if (updErr) throw updErr;

      setPersona((prev) =>
        prev
          ? {
              ...prev,
              grupoId: null,
              grupo: "Sin asignar",
              grupoImagen: null,
              grupoResumen: null,
              participacionEnGrupo: null,
              etapa: "nuevo_creyente",
              fechaIngresoGrupoIso: null,
              coLiderDesdeIso: null,
            }
          : prev
      );
      setShowLiberarGrupoModal(false);
      showAppToast("Persona quitada del grupo", "success");
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
            grupoResumen: null,
            participacionEnGrupo: "miembro",
            etapa: "nuevo_creyente",
            fechaIngresoGrupoIso: fechaHoyYYYYMMDD(),
            coLiderDesdeIso: null,
          }
        : prev
    );
    void (async () => {
      const supabase = createClient();
      const { data: g, error } = await supabase
        .from("grupos")
        .select(
          "id, nombre, descripcion, tipo, miembros_count, lider_id, dia, hora, ubicacion, imagen, activo, lideres(nombre)"
        )
        .eq("id", grupo.id)
        .maybeSingle();
      if (error || !g) return;
      const joined = g as GrupoJoinNested;
      const res = buildGrupoResumenFromJoin(joined, grupo.id);
      setPersona((prev) =>
        prev && prev.grupoId === grupo.id
          ? { ...prev, grupoResumen: res, grupoImagen: joined.imagen ?? prev.grupoImagen }
          : prev
      );
    })();
    showAppToast("Grupo asignado correctamente", "success");
  };

  async function resolveAuthInsertContext(
    supabase: ReturnType<typeof createClient>
  ): Promise<AuthInsertContext | null> {
    if (authInsertCtxRef.current) return authInsertCtxRef.current;
    const {
      data: { session },
      error: sErr,
    } = await supabase.auth.getSession();
    if (sErr || !session?.user) return null;
    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", session.user.id)
      .maybeSingle();
    if (pErr || !prof?.organization_id) return null;
    const ctx: AuthInsertContext = {
      userId: session.user.id,
      organizationId: prof.organization_id,
      fullName: ((prof.full_name as string | null) ?? "").trim(),
    };
    authInsertCtxRef.current = ctx;
    return ctx;
  }

  const persistPersonaInformacionPersonal = useCallback(
    async (updatePayload: Record<string, unknown>) => {
      const supabase = createClient();
      const ctx = await resolveAuthInsertContext(supabase);
      if (!ctx) {
        const {
          data: { session: s },
        } = await supabase.auth.getSession();
        return {
          ok: false as const,
          message: s?.user ? "No se pudo obtener tu organización." : "Debes iniciar sesión.",
        };
      }
      const { error } = await supabase
        .from("personas")
        .update(updatePayload)
        .eq("id", id)
        .eq("organization_id", ctx.organizationId);
      if (error) {
        return { ok: false as const, message: error.message, code: error.code };
      }
      return { ok: true as const };
    },
    [id]
  );

  const handleAgregarNota = async () => {
    const texto = nuevaNota.trim();
    if (!texto || !persona || notaInsertInFlightRef.current) return;
    setErrorNota(null);
    const supabase = createClient();
    notaInsertInFlightRef.current = true;
    setGuardandoNota(true);
    let tempNotaId: string | null = null;
    try {
      const ctx = await resolveAuthInsertContext(supabase);
      if (!ctx) {
        const {
          data: { session: s },
        } = await supabase.auth.getSession();
        setErrorNota(
          s?.user ? "No se pudo obtener tu organización." : "Debes iniciar sesión para agregar una nota."
        );
        return;
      }

      const tempId = `temp-nota-${Date.now()}`;
      tempNotaId = tempId;
      const autorLabel = ctx.fullName || "Tú";
      const optimistic: NotaHistorialItem = {
        id: tempId,
        contenido: texto,
        creadoEn: formatNotaTimestamp(new Date().toISOString()),
        autor: autorLabel,
      };

      setNuevaNota("");
      setPersona((prev) => {
        if (!prev) return prev;
        const rest = prev.notasHistorial.filter((n) => n.id !== "legacy");
        return { ...prev, notasHistorial: [optimistic, ...rest] };
      });
      setGuardandoNota(false);

      const { data: inserted, error: insertErr } = await supabase
        .from("persona_notas")
        .insert({
          organization_id: ctx.organizationId,
          persona_id: id,
          contenido: texto,
          created_by: ctx.userId,
        })
        .select("id, contenido, created_at")
        .single();
      if (insertErr) throw insertErr;
      if (!inserted) throw new Error("Sin respuesta al guardar");
      const item: NotaHistorialItem = {
        id: (inserted as { id: string }).id,
        contenido: (inserted as { contenido: string }).contenido,
        creadoEn: formatNotaTimestamp((inserted as { created_at: string }).created_at),
        autor: autorLabel,
      };
      setPersona((prev) => {
        if (!prev) return prev;
        const rest = prev.notasHistorial.filter((n) => n.id !== tempId && n.id !== "legacy");
        return { ...prev, notasHistorial: [item, ...rest] };
      });
    } catch (e) {
      setNuevaNota(texto);
      if (tempNotaId) {
        setPersona((prev) => {
          if (!prev) return prev;
          return { ...prev, notasHistorial: prev.notasHistorial.filter((n) => n.id !== tempNotaId) };
        });
      }
      setErrorNota(e instanceof Error ? e.message : "No se pudo guardar la nota.");
    } finally {
      notaInsertInFlightRef.current = false;
      setGuardandoNota(false);
    }
  };

  const handleAgregarPeticion = async () => {
    const texto = nuevaPeticion.trim();
    if (!texto || !persona || peticionInsertInFlightRef.current) return;
    setErrorPeticion(null);
    const supabase = createClient();
    peticionInsertInFlightRef.current = true;
    setGuardandoPeticion(true);
    let tempPeticionId: string | null = null;
    try {
      const ctx = await resolveAuthInsertContext(supabase);
      if (!ctx) {
        const {
          data: { session: s },
        } = await supabase.auth.getSession();
        setErrorPeticion(
          s?.user ? "No se pudo obtener tu organización." : "Debes iniciar sesión para agregar una petición."
        );
        return;
      }

      const tempId = `temp-peticion-${Date.now()}`;
      tempPeticionId = tempId;
      const autorLabel = ctx.fullName || "Tú";
      const optimistic: NotaHistorialItem = {
        id: tempId,
        contenido: texto,
        creadoEn: formatNotaTimestamp(new Date().toISOString()),
        autor: autorLabel,
      };

      setNuevaPeticion("");
      setPersona((prev) => (prev ? { ...prev, peticionesOracion: [optimistic, ...prev.peticionesOracion] } : prev));
      setGuardandoPeticion(false);

      const { data: inserted, error: insertErr } = await supabase
        .from("persona_peticiones_oracion")
        .insert({
          organization_id: ctx.organizationId,
          persona_id: id,
          contenido: texto,
          created_by: ctx.userId,
        })
        .select("id, contenido, created_at")
        .single();
      if (insertErr) throw insertErr;
      if (!inserted) throw new Error("Sin respuesta al guardar");
      const item: NotaHistorialItem = {
        id: (inserted as { id: string }).id,
        contenido: (inserted as { contenido: string }).contenido,
        creadoEn: formatNotaTimestamp((inserted as { created_at: string }).created_at),
        autor: autorLabel,
      };
      setPersona((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          peticionesOracion: [item, ...prev.peticionesOracion.filter((n) => n.id !== tempId)],
        };
      });
    } catch (e) {
      setNuevaPeticion(texto);
      if (tempPeticionId) {
        setPersona((prev) => {
          if (!prev) return prev;
          return { ...prev, peticionesOracion: prev.peticionesOracion.filter((n) => n.id !== tempPeticionId) };
        });
      }
      setErrorPeticion(e instanceof Error ? e.message : "No se pudo guardar la petición.");
    } finally {
      peticionInsertInFlightRef.current = false;
      setGuardandoPeticion(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-3 px-4">
        {initialNombre ? (
          <div className="text-center">
            <p className="text-base font-semibold text-gray-900 dark:text-white">{initialNombre}</p>
            {initialEtapaLabel ? (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{initialEtapaLabel}</p>
            ) : null}
          </div>
        ) : null}
        <svg className="h-8 w-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24" aria-hidden>
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
  const etapaCabecera = etapaMostradaEnCamino(persona.etapa, persona.participacionEnGrupo);
  const etapaVisual = etapaStyles(etapaCabecera);

  return (
    <>
      <PersonaDetailModals
        personaId={id}
        personaNombre={persona.nombre}
        personaTelefono={persona.telefono?.trim() || null}
        personaGrupoId={persona.grupoId}
        personaGrupo={persona.grupo}
        personaEtapa={persona.etapa}
        showSeguimientoModal={showSeguimientoModal}
        showLiberarGrupoModal={showLiberarGrupoModal}
        liberandoGrupo={liberandoGrupo}
        showAsignarGrupoModal={showAsignarGrupoModal}
        showPasarApoyoModal={showPasarApoyoModal}
        showDesignarColiderModal={showDesignarColiderModal}
        showCambiarEtapaModal={showCambiarEtapaModal}
        showRegistrarBautismoModal={showRegistrarBautismoModal}
        onCloseSeguimiento={() => setShowSeguimientoModal(false)}
        onSaveSeguimiento={handleSaveSeguimiento}
        onCloseLiberar={() => !liberandoGrupo && setShowLiberarGrupoModal(false)}
        onConfirmLiberar={handleConfirmarLiberarGrupo}
        onCloseAsignar={() => setShowAsignarGrupoModal(false)}
        onAssignedGrupo={handleAsignadoGrupo}
        onClosePasarApoyo={() => setShowPasarApoyoModal(false)}
        onCloseDesignarColider={() => setShowDesignarColiderModal(false)}
        onCloseRegistrarBautismo={() => setShowRegistrarBautismoModal(false)}
        onParticipacionGrupoActualizada={(p, etapa) => {
          setPersona((prev) =>
            prev
              ? {
                  ...prev,
                  participacionEnGrupo: p,
                  etapa,
                  coLiderDesdeIso: p === "colider" ? fechaHoyYYYYMMDD() : null,
                }
              : prev,
          );
          showAppToast(
            p === "apoyo" ? "Pasada a grupo de apoyo." : "Designada co-líder.",
            "success",
          );
        }}
        onCloseEtapa={() => setShowCambiarEtapaModal(false)}
        onSavedEtapa={(etapa, opts) => {
          setPersona((prev) =>
            prev
              ? {
                  ...prev,
                  etapa,
                  fechaCaminoBautismoIso:
                    opts?.fechaCaminoBautismoIso !== undefined
                      ? opts.fechaCaminoBautismoIso
                      : prev.fechaCaminoBautismoIso,
                }
              : prev
          );
          showAppToast("Etapa actualizada", "success");
        }}
        onSavedBautismo={(payload) => {
          setPersona((prev) =>
            prev
              ? {
                  ...prev,
                  etapa: "bautizado",
                  bautizado: true,
                  fechaBautismoIso: payload.fechaBautismoIso,
                  lugarBautismo: payload.lugarBautismo,
                  fechaCaminoBautismoIso: payload.fechaBautismoIso,
                }
              : prev
          );
          showAppToast("Bautismo registrado", "success");
        }}
        registrosSeguimientoCount={persona.registrosSeguimiento.length}
      />

      {/* Toast (éxito / error) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div
            className={`flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium shadow-lg shadow-black/15 dark:shadow-none ${
              toast.variant === "error"
                ? "bg-red-600 text-white dark:bg-red-700"
                : "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
            }`}
          >
            {toast.variant === "error" ? (
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    <div className="w-full min-h-[calc(100vh-4rem)] py-8">
      {/* Cabecera — misma familia visual que la tabla (superficie suave, sin gradiente). */}
      <div className="mb-8 rounded-3xl bg-gray-100/50 p-5 dark:bg-white/[0.04] md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
            <div
              className={
                persona.grupoId &&
                (persona.participacionEnGrupo === "apoyo" || persona.participacionEnGrupo === "colider")
                  ? "shrink-0"
                  : "shrink-0 rounded-full bg-white/80 p-1 shadow-sm shadow-black/[0.06] ring-1 ring-black/[0.04] dark:bg-white/[0.08] dark:shadow-none dark:ring-white/[0.08]"
              }
            >
              <AvatarHistoriasServicioGrupo
                seed={persona.nombre}
                sexo={persona.sexo}
                size={104}
                participacion={persona.participacionEnGrupo}
                grupoId={persona.grupoId}
              />
            </div>
            <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-2xl">
                  {persona.nombre}
                </h1>
                {persona.rol !== "Visitante" && (
                  <span className="rounded-full bg-gray-200/90 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-white/[0.12] dark:text-gray-200">
                    {persona.rol}
                  </span>
                )}
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${etapaVisual.badge}`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${etapaVisual.dot}`} />
                  {ETAPA_LABELS[etapaCabecera]}
                </span>
                {persona.grupoId && persona.participacionEnGrupo === "apoyo" ? (
                  <span
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-violet-400/35 bg-violet-500/12 px-3 py-1 text-xs font-semibold text-violet-900 shadow-sm shadow-violet-900/5 dark:border-violet-400/25 dark:bg-violet-500/15 dark:text-violet-100 dark:shadow-none"
                    title="Participación actual en este grupo"
                  >
                    <svg className="h-3.5 w-3.5 shrink-0 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Sirve en grupo de apoyo
                    {persona.grupo ? (
                      <span className="max-w-[10rem] truncate font-medium opacity-95 sm:max-w-[14rem]">«{persona.grupo}»</span>
                    ) : null}
                  </span>
                ) : null}
                {persona.grupoId && persona.participacionEnGrupo === "colider" ? (
                  <span
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#0ca6b2]/40 bg-[#0ca6b2]/12 px-3 py-1 text-xs font-semibold text-teal-950 shadow-sm shadow-teal-900/10 dark:border-[#0ca6b2]/35 dark:bg-[#0ca6b2]/18 dark:text-teal-50 dark:shadow-none"
                    title="Participación actual en este grupo"
                  >
                    <svg className="h-3.5 w-3.5 shrink-0 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    Co-líder del grupo
                    {persona.grupo ? (
                      <span className="max-w-[10rem] truncate font-medium opacity-95 sm:max-w-[14rem]">«{persona.grupo}»</span>
                    ) : null}
                  </span>
                ) : null}
                <div className="ml-1 flex items-center gap-1">
                  {whatsappLink && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
                      title="WhatsApp"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                    </a>
                  )}
                  {persona.telefono && (
                    <a
                      href={`tel:${persona.telefono}`}
                      className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
                      title="Llamar"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </a>
                  )}
                  <Link
                    href="/personas"
                    className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
                    title="Volver"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Link>
                </div>
              </div>
              <div className="w-full shrink-0 text-right sm:w-auto">
                <RachasCabeceraPersona
                  variante="header"
                  tieneGrupo={!!persona.grupoId}
                  rachaAsistencia={rachaAsistencia}
                  ultimaAsistencia={ultimaAsistencia}
                  rachaSeguimiento={rachaSeguimiento}
                  registrosSeguimiento={persona.registrosSeguimiento}
                />
              </div>
            </div>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
              {persona.grupoId ? (
                <Link
                  prefetch={false}
                  href={`/grupos/${persona.grupoId}`}
                  className="inline-flex items-center gap-1.5 font-medium text-gray-700 underline-offset-4 transition hover:text-gray-900 hover:underline dark:text-gray-300 dark:hover:text-white"
                >
                  <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z"
                    />
                  </svg>
                  {persona.grupo}
                </Link>
              ) : (
                <span>Sin grupo asignado</span>
              )}
              <span className="text-gray-300 dark:text-gray-600" aria-hidden>
                •
              </span>
              <span>Miembro desde {persona.fechaRegistro}</span>
            </p>
            <div className="mt-4 w-full">
              <MapaCaminoEtapaPersona
                etapaActual={persona.etapa}
                fechaRegistroIso={persona.fechaRegistroIso}
                fechaIngresoGrupoIso={persona.fechaIngresoGrupoIso}
                fechaCaminoBautismoIso={persona.fechaCaminoBautismoIso}
                fechaBautismoIso={persona.fechaBautismoIso}
                bautizado={persona.bautizado}
                coLiderDesdeIso={persona.coLiderDesdeIso}
                participacionEnGrupo={persona.participacionEnGrupo}
                grupoNombre={persona.grupoId ? persona.grupo : null}
              />
            </div>
            {persona.etapa === "visitante" && (
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
            {persona.etapa === "bautizado" && persona.bautizado !== true && (
              <p className="mt-2 flex items-center gap-2 text-sm text-sky-800 dark:text-sky-200/90">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                En preparación al bautismo. Acompaña el proceso hasta consolidar.
              </p>
            )}
            {persona.etapa === "bautizado" && persona.bautizado === true && (
              <p className="mt-2 flex items-center gap-2 text-sm text-sky-800 dark:text-sky-200/90">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25L15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Bautismo registrado. Acompaña hacia la consolidación.
              </p>
            )}
            </div>
          </div>

        </div>
      </div>

      <div>
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              <PersonalInfoCard
                persona={persona}
                setPersona={setPersona}
                personaId={id}
                includesInfoLider={detalleIncludesInfoLider}
                persistUpdate={persistPersonaInformacionPersonal}
                showAppToast={showAppToast}
              />

              <ProcesoYCaminoCard
                persona={persona}
                setPersona={setPersona}
                personaId={id}
                persistUpdate={persistPersonaInformacionPersonal}
                showAppToast={showAppToast}
                detalleIncludesSpiritual={detalleIncludesSpiritual}
              />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
              {/* Notas pastorales — persona_notas (independientes de cada contacto) */}
              <div className="min-w-0 rounded-2xl border border-gray-200/50 bg-gray-50/40 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notas pastorales</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Ideas o contexto que quieras ver siempre, sin atarlo a una sola visita.
                </p>
                <div className="mt-4 space-y-3">
                  <textarea
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    placeholder="Escribe una nota pastoral…"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200/60 bg-white/70 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-300/40 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-white/15"
                  />
                  {errorNota && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errorNota}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleAgregarNota()}
                    disabled={guardandoNota || !nuevaNota.trim()}
                    className="rounded-xl border border-gray-200/70 bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  >
                    {guardandoNota ? "Guardando…" : "Agregar nota pastoral"}
                  </button>
                </div>
                {persona.notasHistorial.length === 0 ? (
                  <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
                    Aún no hay notas pastorales. Agrega la primera con el formulario.
                  </p>
                ) : (
                  <ul className="mt-6 divide-y divide-gray-200/50 dark:divide-white/[0.06]">
                    {persona.notasHistorial.map((n) => (
                      <li key={n.id} className="py-4 first:pt-0">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-white">{n.contenido}</p>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {n.creadoEn}
                          {n.autor && n.autor !== "—" ? ` · ${n.autor}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Peticiones de oración — misma fila que notas en desktop */}
              <div className="min-w-0 rounded-2xl border border-gray-200/50 bg-gray-50/40 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Peticiones de oración</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Motivos para orar por esta persona, con fecha, para ti y para el equipo.
                </p>
                <div className="mt-4 space-y-3">
                  <textarea
                    value={nuevaPeticion}
                    onChange={(e) => setNuevaPeticion(e.target.value)}
                    placeholder="Escribe una petición…"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200/60 bg-white/80 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-300/40 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-white/15"
                  />
                  {errorPeticion && (
                    <p className="text-xs text-red-600 dark:text-red-400">{errorPeticion}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleAgregarPeticion()}
                    disabled={guardandoPeticion || !nuevaPeticion.trim()}
                    className="w-full rounded-xl border border-gray-200/70 bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  >
                    {guardandoPeticion ? "Guardando…" : "Agregar petición"}
                  </button>
                </div>
                {persona.peticionesOracion.length === 0 ? (
                  <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">Aún no hay peticiones.</p>
                ) : (
                  <ul className="mt-5 max-h-[min(50vh,22rem)] divide-y divide-gray-200/50 overflow-y-auto dark:divide-white/[0.06]">
                    {persona.peticionesOracion.map((n) => (
                      <li key={n.id} className="py-3 first:pt-0">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-white">{n.contenido}</p>
                        <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                          {n.creadoEn}
                          {n.autor && n.autor !== "—" ? ` · ${n.autor}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {persona.grupoId ? (
                <>
                  {persona.grupoResumen ? (
                      <GrupoResumenCard
                        grupo={{
                          id: persona.grupoResumen.id,
                          nombre: persona.grupoResumen.nombre,
                          descripcion: persona.grupoResumen.descripcion,
                          tipo: persona.grupoResumen.tipo,
                          activo: persona.grupoResumen.activo,
                          miembros_count: persona.grupoResumen.miembros_count,
                          lider_id: persona.grupoResumen.lider_id,
                          dia: persona.grupoResumen.dia,
                          hora: persona.grupoResumen.hora,
                          ubicacion: persona.grupoResumen.ubicacion,
                        }}
                        liderNombre={persona.grupoResumen.liderNombre}
                        miembrosCount={persona.grupoResumen.miembrosReales}
                        compact
                        rolEnGrupo={
                          persona.participacionEnGrupo === "apoyo"
                            ? "Tu participación: Grupo de apoyo"
                            : persona.participacionEnGrupo === "colider"
                              ? "Tu participación: Co-líder"
                              : "Tu participación: Miembro del núcleo"
                        }
                      />
                    ) : (
                      <div className="rounded-3xl bg-gray-100/40 px-4 py-4 dark:bg-white/[0.04]">
                        <Link
                          prefetch={false}
                          href={`/grupos/${persona.grupoId}`}
                          className="text-sm font-semibold text-gray-900 underline-offset-4 hover:underline dark:text-white"
                        >
                          {persona.grupo}
                        </Link>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          No se pudieron cargar los datos del grupo. Abre la ficha o recarga la página.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-3xl bg-gray-100/40 px-5 py-5 dark:bg-white/[0.04]">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Todavía no pertenece a ningún grupo de célula.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAsignarGrupoModal(true)}
                      className="mt-4 w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                    >
                      Asignar a un grupo
                    </button>
                  </div>
                )}

              {/* Acciones rápidas — justo después del grupo (prioridad en móvil y desktop) */}
              <div className="rounded-3xl bg-gray-100/40 p-6 dark:bg-white/[0.04]">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Acciones rápidas
                </h3>
                <div className="space-y-2">
                  {persona.grupoId && persona.etapa === "nuevo_creyente" ? (
                    <button
                      type="button"
                      onClick={() => setShowRegistrarBautismoModal(true)}
                      disabled={!puedeRegistrarBautismo}
                      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-gray-200/40 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/[0.06]"
                      title={
                        persona.bautizado
                          ? "Ya tiene bautismo registrado."
                          : rachaAsistencia < 1
                            ? "Necesita al menos 1 asistencia al grupo registrada."
                            : persona.registrosSeguimiento.length < 1
                              ? "Necesita al menos 1 seguimiento pastoral (mensaje, llamada, visita…); la asistencia sola no cuenta."
                              : undefined
                      }
                    >
                      <svg className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75c3.106 0 5.625 2.519 5.625 5.625 0 2.368-1.463 4.393-3.536 5.219L12 20.25l-2.089-5.656A5.625 5.625 0 016.375 9.375 5.625 5.625 0 0112 3.75z" />
                      </svg>
                      <div className="min-w-0">
                        <span className="block text-sm font-medium text-gray-900 dark:text-white">Registrar bautismo</span>
                        {persona.bautizado === true ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">Ya registrado.</span>
                        ) : rachaAsistencia < 1 ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">Se habilita con al menos 1 asistencia al grupo.</span>
                        ) : persona.registrosSeguimiento.length < 1 ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Se habilita con al menos 1 seguimiento pastoral (además de asistencia).
                          </span>
                        ) : null}
                      </div>
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setShowSeguimientoModal(true)}
                    className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-gray-200/40 dark:hover:bg-white/[0.06]"
                  >
                    <svg className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Registrar seguimiento</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCambiarEtapaModal(true)}
                    className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-gray-200/40 dark:hover:bg-white/[0.06]"
                  >
                    <svg
                      className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Cambiar etapa</span>
                  </button>
                  {!persona.grupoId ? (
                    <button
                      type="button"
                      onClick={() => setShowAsignarGrupoModal(true)}
                      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-gray-200/40 dark:hover:bg-white/[0.06]"
                    >
                      <svg className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Asignar a un grupo</span>
                    </button>
                  ) : null}
                  {persona.grupoId && persona.participacionEnGrupo === "miembro" ? (
                    <button
                      type="button"
                      onClick={() => setShowPasarApoyoModal(true)}
                      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-gray-200/40 dark:hover:bg-white/[0.06]"
                    >
                      <svg className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.813-3.024A9.337 9.337 0 0112 21c-2.292 0-4.396-.825-6.021-2.197M15 19.128v.003a9.337 9.337 0 01-3 0v-.003m0 0a9.38 9.38 0 00-2.625-.372m6.25 0a9.38 9.38 0 00-2.625.372m0 0a9.337 9.337 0 01-3 0M6.021 18.803A9.337 9.337 0 0112 21c2.292 0 4.396-.825 6.021-2.197M6.021 18.803v-.001m0 0A9.337 9.337 0 0112 18c1.657 0 3.156.434 4.279 1.145" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Pasar a grupo de apoyo</span>
                    </button>
                  ) : null}
                  {persona.grupoId && persona.participacionEnGrupo === "apoyo" ? (
                    <button
                      type="button"
                      onClick={() => setShowDesignarColiderModal(true)}
                      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-gray-200/40 dark:hover:bg-white/[0.06]"
                    >
                      <svg className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Designar co-líder</span>
                    </button>
                  ) : null}
                  {persona.grupoId ? (
                    <button
                      type="button"
                      onClick={() => setShowLiberarGrupoModal(true)}
                      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left text-red-700 transition hover:bg-red-50/80 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25V9m12 0v10.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V9m15.75 0H4.5" />
                      </svg>
                      <span className="text-sm font-medium">Quitar del grupo</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Registros de seguimiento — debajo de Acciones rápidas */}
              <div
                id="registros-seguimiento"
                className="min-w-0 scroll-mt-24 rounded-3xl border border-gray-200/50 bg-gray-100/40 p-5 dark:border-white/[0.06] dark:bg-white/[0.04] sm:p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Registros de seguimiento</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Cada contacto queda con fecha, qué pasó y las notas solo de esa conversación.
                </p>
                {persona.registrosSeguimiento.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Aún no hay registros. Usa{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-300">Registrar seguimiento</span> arriba para
                    crear el primero.
                  </p>
                ) : (
                  <ul className="mt-5 space-y-4">
                    {persona.registrosSeguimiento.map((reg, i) => (
                      <li key={reg.id} className="flex gap-3">
                        <div className="flex w-6 shrink-0 flex-col items-center pt-1.5">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#0ca6b2] ring-4 ring-[#0ca6b2]/15 dark:ring-[#0ca6b2]/20" />
                          {i < persona.registrosSeguimiento.length - 1 ? (
                            <span className="mt-1 min-h-[1rem] w-px flex-1 bg-gradient-to-b from-[#0ca6b2]/35 to-transparent dark:from-[#0ca6b2]/30" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1 rounded-xl border border-gray-200/70 bg-white/60 p-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {reg.titulo}
                              {reg.subtitulo ? (
                                <span className="font-normal text-gray-600 dark:text-gray-400"> · {reg.subtitulo}</span>
                              ) : null}
                            </p>
                            <time className="shrink-0 text-xs font-medium tabular-nums text-[#0ca6b2]">
                              {reg.fechaDisplay}
                            </time>
                          </div>
                          {reg.notas ? (
                            <div className="mt-3 border-t border-gray-100 pt-3 dark:border-white/[0.08]">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Notas de esta conversación
                              </p>
                              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                {reg.notas}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
    </>
  );
}
