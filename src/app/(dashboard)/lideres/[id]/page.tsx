"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Avatar from "boring-avatars";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type RolLider = "Pastor" | "Líder de grupo" | "Coordinador" | "Mentor" | "Diácono";
type EstadoLider = "Activo" | "En formación" | "Descanso";

interface Lider {
  id: string;
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  fechaNacimiento: string | null;
  edad: number | null;
  estadoCivil: string | null;
  ocupacion: string | null;
  direccion: string | null;
  rol: RolLider | null;
  estado: EstadoLider;
  grupoAsignado: string | null;
  miembrosACargo: number;
  fechaInicioLiderazgo: string | null;
  notas: string | null;
  personaId: string | null;
}

interface Grupo {
  id: string;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  miembros_count: number;
  dia: string | null;
  hora: string | null;
  ubicacion: string | null;
}

interface HistorialItem {
  id: string;
  fecha: string;
  accion: string;
  tipo_seguimiento: string | null;
  persona_nombre?: string;
}

const rolStyles: Record<string, string> = {
  Pastor: "bg-[#18301d] dark:bg-[#0ca6b2] text-white",
  "Líder de grupo": "bg-[#0ca6b2]/10 dark:bg-[#0ca6b2]/20 text-[#0ca6b2]",
  Coordinador: "bg-[#e64b27]/10 dark:bg-[#e64b27]/20 text-[#e64b27]",
  Mentor: "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400",
  Diácono: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
};

const estadoStyles: Record<EstadoLider, { bg: string; dot: string }> = {
  Activo: { bg: "bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-400", dot: "bg-green-500" },
  "En formación": { bg: "bg-[#f9c70c]/20 text-[#b8860b] dark:text-[#f9c70c]", dot: "bg-[#f9c70c]" },
  Descanso: { bg: "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400", dot: "bg-gray-300 dark:bg-gray-500" },
};

const tipoHistorialStyles: Record<string, string> = {
  reunion: "bg-[#0ca6b2]",
  capacitacion: "bg-purple-500",
  seguimiento: "bg-[#f9c70c]",
  mensaje: "bg-[#25D366]",
  llamada: "bg-[#0ca6b2]",
  visita: "bg-[#e64b27]",
  encuentro: "bg-amber-500",
  asistencia: "bg-emerald-500",
  default: "bg-gray-400",
};

function formatFechaCorta(fechaStr: string): string {
  const d = new Date(fechaStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return fechaStr;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function formatFechaNacimiento(fechaStr: string | null): string {
  if (!fechaStr) return "—";
  const d = new Date(fechaStr + "T12:00:00");
  if (Number.isNaN(d.getTime())) return fechaStr;
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

/** Copia síncrona desde un clic (funciona sin HTTPS en muchos entornos donde `navigator.clipboard` falla). */
function copyTextToClipboardSync(text: string): boolean {
  if (typeof document === "undefined") return false;
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [lider, setLider] = useState<Lider | null>(null);
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [asistenciaGrupo, setAsistenciaGrupo] = useState<number | null>(null);
  const [reunionesLideradas, setReunionesLideradas] = useState(0);
  const [seguimientosRealizados, setSeguimientosRealizados] = useState(0);
  const [miembrosEnGrupoCount, setMiembrosEnGrupoCount] = useState<number | null>(null);
  const [actividadReciente, setActividadReciente] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  /** Texto del chip (p. ej. "Pastor principal" desde organizations) + clave para estilos */
  const [rolVista, setRolVista] = useState<{ texto: string; claseKey: RolLider } | null>(null);
  const [esPastorIglesia, setEsPastorIglesia] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  /** Admin de perfil o correo de sesión = pastor_email de la organización */
  const [puedeDarAccesoLider, setPuedeDarAccesoLider] = useState(false);
  const [accesoModal, setAccesoModal] = useState<{ email: string; password: string } | null>(null);
  const [accesoLoading, setAccesoLoading] = useState(false);
  const [accesoError, setAccesoError] = useState<string | null>(null);
  const [credencialesCopiadas, setCredencialesCopiadas] = useState(false);

  useEffect(() => {
    if (accesoModal) setCredencialesCopiadas(false);
  }, [accesoModal]);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();

    (async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      const { data: liderRow, error: liderError } = await supabase
        .from("lideres")
        .select(
          "id, nombre, cedula, telefono, email, fecha_nacimiento, estado_civil, ocupacion, direccion, rol, estado, grupo_asignado, miembros_a_cargo, fecha_inicio_liderazgo, notas, persona_id, organization_id, auth_user_id"
        )
        .eq("id", id)
        .single();

      if (liderError || !liderRow) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const fechaNac = (liderRow as { fecha_nacimiento?: string }).fecha_nacimiento ?? null;
      const liderData: Lider = {
        id: liderRow.id,
        nombre: liderRow.nombre ?? "",
        cedula: liderRow.cedula ?? null,
        telefono: liderRow.telefono ?? null,
        email: liderRow.email ?? null,
        fechaNacimiento: fechaNac,
        edad: calcularEdad(fechaNac),
        estadoCivil: (liderRow as { estado_civil?: string }).estado_civil ?? null,
        ocupacion: (liderRow as { ocupacion?: string }).ocupacion ?? null,
        direccion: (liderRow as { direccion?: string }).direccion ?? null,
        rol: (liderRow.rol as RolLider) ?? null,
        estado: (liderRow.estado as EstadoLider) ?? "Activo",
        grupoAsignado: liderRow.grupo_asignado ?? null,
        miembrosACargo: liderRow.miembros_a_cargo ?? 0,
        fechaInicioLiderazgo: liderRow.fecha_inicio_liderazgo ?? null,
        notas: liderRow.notas ?? null,
        personaId: liderRow.persona_id ?? null,
      };
      setLider(liderData);
      setAuthUserId((liderRow as { auth_user_id?: string | null }).auth_user_id ?? null);

      const orgId = (liderRow as { organization_id?: string }).organization_id;
      let orgPastor: { pastor_email: string | null; pastor_role: string | null } | null = null;
      if (orgId) {
        const { data: orgRow } = await supabase
          .from("organizations")
          .select("pastor_email, pastor_role")
          .eq("id", orgId)
          .maybeSingle();
        orgPastor = orgRow ?? null;
      }

      let puedeAcceso = false;
      if (authUser && orgId) {
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", authUser.id).maybeSingle();
        const esAdmin = (prof as { role?: string } | null)?.role === "admin";
        const emailSesion = (authUser.email ?? "").trim().toLowerCase();
        const emailPastorOrg = (orgPastor?.pastor_email ?? "").trim().toLowerCase();
        const esCuentaPastor = emailPastorOrg.length > 0 && emailSesion === emailPastorOrg;
        puedeAcceso = esAdmin || esCuentaPastor;
      }
      setPuedeDarAccesoLider(puedeAcceso);

      const emailL = (liderData.email ?? "").trim().toLowerCase();
      const emailPastor = (orgPastor?.pastor_email ?? "").trim().toLowerCase();
      const emailCoincidePastor = emailPastor.length > 0 && emailL === emailPastor;
      const rolDb = liderData.rol;
      const esPastor =
        rolDb === "Pastor" || emailCoincidePastor;

      if (esPastor) {
        setEsPastorIglesia(true);
        const texto = orgPastor?.pastor_role?.trim() || "Pastor";
        setRolVista({ texto, claseKey: "Pastor" });
      } else if (rolDb) {
        setEsPastorIglesia(false);
        setRolVista({ texto: rolDb, claseKey: rolDb });
      } else {
        setEsPastorIglesia(false);
        setRolVista(null);
      }

      const { data: grupoRow } = await supabase
        .from("grupos")
        .select("id, nombre, descripcion, imagen, miembros_count, dia, hora, ubicacion")
        .eq("lider_id", id)
        .maybeSingle();

      if (grupoRow) {
        setGrupo({
          id: grupoRow.id,
          nombre: grupoRow.nombre ?? "",
          descripcion: grupoRow.descripcion ?? null,
          imagen: grupoRow.imagen ?? null,
          miembros_count: grupoRow.miembros_count ?? 0,
          dia: grupoRow.dia ?? null,
          hora: grupoRow.hora ?? null,
          ubicacion: grupoRow.ubicacion ?? null,
        });

        const { count: eventosCount } = await supabase
          .from("eventos")
          .select("id", { count: "exact", head: true })
          .eq("grupo_id", grupoRow.id);
        setReunionesLideradas(eventosCount ?? 0);

        const { data: personasEnGrupo } = await supabase
          .from("personas")
          .select("id")
          .eq("grupo_id", grupoRow.id);
        const personaIds = (personasEnGrupo ?? []).map((p) => p.id);
        setMiembrosEnGrupoCount(personaIds.length);
        if (personaIds.length > 0) {
          const { count: segCount } = await supabase
            .from("persona_historial")
            .select("id", { count: "exact", head: true })
            .in("persona_id", personaIds);
          setSeguimientosRealizados(segCount ?? 0);

          const { data: historial } = await supabase
            .from("persona_historial")
            .select("id, fecha, accion, tipo_seguimiento")
            .in("persona_id", personaIds)
            .order("fecha", { ascending: false })
            .limit(15);
          const items: HistorialItem[] = (historial ?? []).map((h) => ({
            id: h.id,
            fecha: h.fecha,
            accion: h.accion,
            tipo_seguimiento: h.tipo_seguimiento ?? "seguimiento",
          }));
          setActividadReciente(items);
        }
      } else {
        setMiembrosEnGrupoCount(0);
        const segCount = liderRow.persona_id
          ? (await supabase.from("persona_historial").select("id", { count: "exact", head: true }).eq("persona_id", liderRow.persona_id)).count ?? 0
          : 0;
        setSeguimientosRealizados(segCount);
        if (liderRow.persona_id) {
          const { data: hist } = await supabase
            .from("persona_historial")
            .select("id, fecha, accion, tipo_seguimiento")
            .eq("persona_id", liderRow.persona_id)
            .order("fecha", { ascending: false })
            .limit(15);
          setActividadReciente((hist ?? []).map((h) => ({ id: h.id, fecha: h.fecha, accion: h.accion, tipo_seguimiento: h.tipo_seguimiento })));
        }
      }

      setAsistenciaGrupo(null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <svg className="w-10 h-10 animate-spin text-[#0ca6b2]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (notFound || !lider) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-600 dark:text-gray-400">Líder no encontrado.</p>
        <Link href="/lideres" className="text-[#0ca6b2] font-medium hover:underline">Volver a líderes</Link>
      </div>
    );
  }

  const grupoNombre = grupo?.nombre ?? lider.grupoAsignado ?? "Sin asignar";
  const miembrosCount = miembrosEnGrupoCount ?? grupo?.miembros_count ?? 0;
  const whatsappLink = lider.telefono ? `https://wa.me/${lider.telefono.replace(/\D/g, "")}` : null;

  const generarAccesoPlataforma = async () => {
    setAccesoError(null);
    setAccesoLoading(true);
    try {
      const res = await fetch(`/api/lideres/${id}/crear-acceso`, { method: "POST" });
      const data = (await res.json()) as { error?: string; email?: string; temporaryPassword?: string; userId?: string };
      if (!res.ok) {
        setAccesoError(data.error ?? "No se pudo crear el acceso.");
        return;
      }
      if (data.email && data.temporaryPassword) {
        setAccesoModal({ email: data.email, password: data.temporaryPassword });
      }
      if (data.userId) setAuthUserId(data.userId);
    } finally {
      setAccesoLoading(false);
    }
  };

  const nuevaContrasenaTemporal = async () => {
    setAccesoError(null);
    setAccesoLoading(true);
    try {
      const res = await fetch(`/api/lideres/${id}/reset-acceso-temporal`, { method: "POST" });
      const data = (await res.json()) as { error?: string; email?: string; temporaryPassword?: string };
      if (!res.ok) {
        setAccesoError(data.error ?? "No se pudo generar la contraseña.");
        return;
      }
      if (data.email && data.temporaryPassword) {
        setAccesoModal({ email: data.email, password: data.temporaryPassword });
      }
    } finally {
      setAccesoLoading(false);
    }
  };

  const copiarCredencialesWhatsApp = () => {
    if (!accesoModal) return;
    const texto = `Acceso Bernabé\nCorreo: ${accesoModal.email}\nContraseña temporal: ${accesoModal.password}\n\nAl entrar te pedirá cambiar la contraseña. Entra en: ${typeof window !== "undefined" ? window.location.origin : ""}/login`;

    if (copyTextToClipboardSync(texto)) {
      setCredencialesCopiadas(true);
      window.setTimeout(() => setCredencialesCopiadas(false), 2500);
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(texto).then(
        () => {
          setCredencialesCopiadas(true);
          window.setTimeout(() => setCredencialesCopiadas(false), 2500);
        },
        () => {
          window.alert("No se pudo copiar. Copia el correo y la contraseña manualmente.");
        }
      );
      return;
    }

    window.alert("No se pudo copiar. Copia el correo y la contraseña manualmente.");
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("grupos").update({ lider_id: null }).eq("lider_id", id);
    await supabase.from("lideres").delete().eq("id", id);
    router.push("/lideres");
    router.refresh();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#18301d] to-[#2d4a35] dark:from-[#1a1a1a] dark:to-[#252525] px-4 py-6 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-28 h-28 rounded-2xl bg-white dark:bg-[#2a2a2a] p-1.5 shadow-xl overflow-hidden">
              <Avatar size={100} name={lider.nombre} variant="beam" colors={["#0ca6b2", "#18301d", "#e64b27", "#f9c70c", "#faddbf"]} />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{lider.nombre}</h1>
                {rolVista && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${rolStyles[rolVista.claseKey] ?? rolStyles["Líder de grupo"]}`}>
                    {rolVista.texto}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${estadoStyles[lider.estado].bg}`}>
                  <span className={`w-2 h-2 rounded-full ${estadoStyles[lider.estado].dot}`} />
                  {lider.estado}
                </span>
              </div>
              <p className="text-white/80">
                {esPastorIglesia ? (
                  <>
                    <span className="text-white/90">Pastoría</span>
                    <span className="mx-2">•</span>
                    Grupo celular: <span className="font-medium">{grupoNombre}</span>
                    <span className="mx-2">•</span>
                    {miembrosCount} {miembrosCount === 1 ? "persona" : "personas"} en el grupo
                  </>
                ) : (
                  <>
                    Lidera: <span className="font-medium">{grupoNombre}</span>
                    <span className="mx-2">•</span>
                    {miembrosCount} miembros a cargo
                  </>
                )}
                {lider.fechaInicioLiderazgo && (
                  <>
                    <span className="mx-2">•</span>
                    Desde {lider.fechaInicioLiderazgo}
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-3 items-center">
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-[#0ca6b2] hover:text-[#0ca6b2]/80 transition" title="WhatsApp">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z" />
                  </svg>
                </a>
              )}
              {lider.telefono && (
                <a href={`tel:${lider.telefono}`} className="text-white/70 hover:text-white transition" title="Llamar">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                </a>
              )}
              <Link href={`/lideres/${id}/editar`} className="text-white/70 hover:text-white transition" title="Editar">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-white/70 hover:text-red-300 transition"
                title="Eliminar líder"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
              <Link href="/lideres" className="text-white/70 hover:text-white transition" title="Volver">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Metrics */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-5">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-[#0ca6b2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <div>
                  <p className="text-2xl font-bold text-[#18301d] dark:text-white">
                    {asistenciaGrupo != null ? `${asistenciaGrupo}%` : "—"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Asistencia del grupo</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-5">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-[#e64b27]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <div>
                  <p className="text-2xl font-bold text-[#18301d] dark:text-white">{reunionesLideradas}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reuniones lideradas</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-5">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-[#f9c70c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
                <div>
                  <p className="text-2xl font-bold text-[#18301d] dark:text-white">{seguimientosRealizados}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Seguimientos realizados</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información personal (misma que persona) */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h2 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Información personal</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {lider.cedula && <InfoItem icon="id" color="blue" label="Cédula" value={lider.cedula} />}
                  {lider.telefono && <InfoItem icon="phone" color="teal" label="Teléfono" value={lider.telefono} />}
                  {lider.email && <InfoItem icon="email" color="coral" label="Email" value={lider.email} />}
                  {(lider.fechaNacimiento || lider.edad != null) && (
                    <InfoItem
                      icon="cake"
                      color="yellow"
                      label="Fecha de nacimiento"
                      value={lider.fechaNacimiento ? `${formatFechaNacimiento(lider.fechaNacimiento)}${lider.edad != null ? ` (${lider.edad} años)` : ""}` : `${lider.edad} años`}
                    />
                  )}
                  {lider.estadoCivil && <InfoItem icon="heart" color="pink" label="Estado civil" value={lider.estadoCivil} />}
                  {lider.ocupacion && <InfoItem icon="work" color="purple" label="Ocupación" value={lider.ocupacion} />}
                  {lider.direccion && <InfoItem icon="location" color="green" label="Dirección" value={lider.direccion} />}
                </div>
              </div>

              {/* Actividad reciente */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h2 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Actividad reciente</h2>
                {actividadReciente.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Aún no hay actividad registrada.</p>
                ) : (
                  <div className="space-y-4">
                    {actividadReciente.map((item, i) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${tipoHistorialStyles[item.tipo_seguimiento ?? "default"] ?? tipoHistorialStyles.default}`} />
                          {i < actividadReciente.length - 1 && <div className="flex-1 w-0.5 bg-gray-200 dark:bg-[#333] mt-1 min-h-[8px]" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium text-[#18301d] dark:text-white">{item.accion}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatFechaCorta(item.fecha)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notas */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#18301d] dark:text-white">Notas</h2>
                  <Link href={`/lideres/${id}/editar`} className="text-sm text-[#0ca6b2] font-medium hover:underline">Editar</Link>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{lider.notas || "Sin notas."}</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Grupo asignado */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-6 pt-6 pb-2">Grupo asignado</h3>
                {grupo ? (
                  <Link href={`/grupos/${grupo.id}#miembros-del-grupo`} className="block p-4 hover:bg-gray-50 dark:hover:bg-[#252525] transition">
                    <div className="relative h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#252525] mb-3">
                      {grupo.imagen ? (
                        <Image src={grupo.imagen} alt={grupo.nombre} fill className="object-cover object-top" sizes="320px" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-[#18301d] dark:text-white">{grupo.nombre}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{miembrosCount} miembros</p>
                  </Link>
                ) : (
                  <div className="px-6 pb-6">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{grupoNombre}</p>
                    <p className="text-xs text-gray-400 mt-1">{miembrosCount} miembros a cargo</p>
                  </div>
                )}
              </div>

              {/* Acciones rápidas */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Acciones rápidas</h3>
                <div className="space-y-2">
                  {grupo && (
                    <Link
                      href={`/grupos/${grupo.id}#miembros-del-grupo`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition text-left w-full"
                    >
                      <svg className="w-5 h-5 text-[#0ca6b2] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                      </svg>
                      <span className="text-sm font-medium text-[#18301d] dark:text-white">Ver miembros del grupo</span>
                    </Link>
                  )}
                  <Link href="/eventos/nuevo" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition text-left w-full">
                    <svg className="w-5 h-5 text-[#e64b27] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <span className="text-sm font-medium text-[#18301d] dark:text-white">Agendar reunión</span>
                  </Link>
                  <Link
                    href={grupo ? `/grupos/${grupo.id}#miembros-del-grupo` : "/personas"}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition text-left w-full"
                  >
                    <svg className="w-5 h-5 text-[#f9c70c] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                    <span className="text-sm font-medium text-[#18301d] dark:text-white">Hacer seguimiento a personas</span>
                  </Link>
                  <div className="border-t border-gray-100 dark:border-[#2a2a2a] pt-3 mt-3 space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Dar acceso a la plataforma</p>
                    {puedeDarAccesoLider ? (
                      <>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Se crea un usuario con contraseña temporal. Cópiala y envíala por WhatsApp; al primer inicio deberá elegir una contraseña nueva.
                        </p>
                        {authUserId ? (
                          <div className="space-y-2">
                            <p className="text-xs text-green-700 dark:text-green-400 font-medium">Cuenta creada · ya puede iniciar sesión</p>
                            <button
                              type="button"
                              onClick={() => void nuevaContrasenaTemporal()}
                              disabled={accesoLoading}
                              className="w-full text-sm py-2.5 px-3 rounded-xl border border-[#0ca6b2] text-[#0ca6b2] hover:bg-[#0ca6b2]/10 disabled:opacity-50 transition"
                            >
                              {accesoLoading ? "Generando…" : "Nueva contraseña temporal"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void generarAccesoPlataforma()}
                            disabled={accesoLoading || !lider.email?.trim()}
                            className="w-full text-sm py-2.5 px-3 rounded-xl bg-[#0ca6b2] text-white font-medium hover:bg-[#0a8f99] disabled:opacity-50 transition"
                          >
                            {accesoLoading ? "Creando…" : "Generar acceso (correo + contraseña)"}
                          </button>
                        )}
                        {!lider.email?.trim() && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">Añade un correo al líder en “Editar” para poder generar acceso.</p>
                        )}
                        {accesoError && <p className="text-xs text-red-600 dark:text-red-400">{accesoError}</p>}
                      </>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Solo el administrador o la cuenta con el correo del pastor de la iglesia (como en el onboarding)
                        pueden generar acceso. Si eres el pastor, revisa que tu sesión use el mismo correo que
                        configuraste para la iglesia.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Contacto</h3>
                <div className="space-y-3">
                  {lider.telefono && (
                    <a href={`tel:${lider.telefono}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition">
                      <svg className="w-5 h-5 text-[#0ca6b2] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Teléfono</p>
                        <p className="font-medium text-[#18301d] dark:text-white">{lider.telefono}</p>
                      </div>
                    </a>
                  )}
                  {lider.email && (
                    <a href={`mailto:${lider.email}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition">
                      <svg className="w-5 h-5 text-[#e64b27] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                        <p className="font-medium text-[#18301d] dark:text-white">{lider.email}</p>
                      </div>
                    </a>
                  )}
                  {!lider.telefono && !lider.email && <p className="text-sm text-gray-500 dark:text-gray-400">Sin datos de contacto</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal confirmar eliminar */}
      {accesoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setAccesoModal(null)}
          role="presentation"
        >
          <div
            className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100 dark:border-[#2a2a2a]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="acceso-titulo"
          >
            <h3 id="acceso-titulo" className="text-lg font-semibold text-[#18301d] dark:text-white mb-2">
              Credenciales (solo esta vez)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Guarda o copia estos datos. La contraseña no se volverá a mostrar. Al iniciar sesión se pedirá cambiarla.
            </p>
            <div className="space-y-2 rounded-xl bg-gray-50 dark:bg-[#252525] p-3 text-sm break-all">
              <p>
                <span className="text-gray-500">Correo:</span>{" "}
                <strong className="text-[#18301d] dark:text-white">{accesoModal.email}</strong>
              </p>
              <p>
                <span className="text-gray-500">Contraseña temporal:</span>{" "}
                <strong className="text-[#18301d] dark:text-white">{accesoModal.password}</strong>
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAccesoModal(null);
                }}
                className="w-full sm:w-auto py-2 px-4 rounded-lg border border-gray-200 dark:border-[#333] text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  copiarCredencialesWhatsApp();
                }}
                className="w-full sm:w-auto py-2 px-4 rounded-lg text-sm font-medium border border-[#25D366]/80 text-[#128C44] dark:text-[#4ade80] bg-[#25D366]/5 hover:bg-[#25D366]/12 dark:hover:bg-[#25D366]/15 transition"
              >
                {credencialesCopiadas ? "Copiado" : "Copiar texto para WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100 dark:border-[#2a2a2a]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-[#18301d] dark:text-white mb-2">Eliminar líder</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              ¿Estás seguro de que quieres eliminar a <strong>{lider.nombre}</strong>? Se desvinculará del grupo asignado. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Eliminando...
                  </>
                ) : (
                  "Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ icon, color, label, value }: { icon: string; color: string; label: string; value: string }) {
  const colors: Record<string, string> = {
    teal: "text-[#0ca6b2]",
    coral: "text-[#e64b27]",
    yellow: "text-[#f9c70c]",
    blue: "text-blue-500",
    pink: "text-pink-500",
    purple: "text-purple-500",
    green: "text-[#18301d] dark:text-[#0ca6b2]",
  };

  const icons: Record<string, JSX.Element> = {
    id: <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />,
    phone: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />,
    email: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />,
    cake: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12" />,
    heart: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />,
    work: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />,
    location: <><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></>,
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#252525]">
      <svg className={`w-5 h-5 ${colors[color]} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {icons[icon]}
      </svg>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-medium text-[#18301d] dark:text-white">{value}</p>
      </div>
    </div>
  );
}
