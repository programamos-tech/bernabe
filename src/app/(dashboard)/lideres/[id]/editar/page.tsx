"use client";

import { useState, useEffect, useMemo, type ReactNode, type JSX } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { DatePicker } from "@/components/ui/DatePicker";
import { soloDigitosDocumentoId } from "@/lib/documento-id";
import { createClient } from "@/lib/supabase/client";
import { ROLES_LIDERAZGO_DEFAULT, ROLES_LIDERAZGO_LEGACY } from "@/lib/lideres-roles";
import {
  BTN_FICHA_PRIMARIO_FLEX,
  BTN_FICHA_SECUNDARIO_FLEX,
} from "@/app/(dashboard)/personas/[id]/_lib/persona-detail-buttons";

type RolDb = "Pastor" | "Líder de grupo" | "Coordinador" | "Mentor" | "Diácono";
type EstadoDb = "Activo" | "En formación" | "Descanso";

const rolIdToDb: Record<string, RolDb> = {
  pastor: "Pastor",
  lider_grupo: "Líder de grupo",
  coordinador: "Coordinador",
  mentor: "Mentor",
  diacono: "Diácono",
};
const rolDbToId: Record<string, string> = {
  Pastor: "pastor",
  "Líder de grupo": "lider_grupo",
  Coordinador: "coordinador",
  Mentor: "mentor",
  Diácono: "diacono",
};

const estadoIdToDb: Record<string, EstadoDb> = {
  activo: "Activo",
  formacion: "En formación",
  descanso: "Descanso",
};
const estadoDbToId: Record<string, string> = {
  Activo: "activo",
  "En formación": "formacion",
  Descanso: "descanso",
};

const roles = [
  { id: "pastor", nombre: "Pastor", icon: "star" },
  { id: "lider_grupo", nombre: "Líder de grupo", icon: "users" },
  { id: "coordinador", nombre: "Coordinador", icon: "clipboard" },
  { id: "mentor", nombre: "Mentor", icon: "academic" },
  { id: "diacono", nombre: "Diácono", icon: "heart" },
];

const estados = [
  { id: "activo", nombre: "Activo", color: "green" },
  { id: "formacion", nombre: "En formación", color: "yellow" },
  { id: "descanso", nombre: "Descanso", color: "gray" },
];

const estadosCiviles = [
  "Soltero/a",
  "Casado/a",
  "Unión libre",
  "Divorciado/a",
  "Viudo/a",
];

const ocupaciones = [
  "Salud (Médico, Enfermero, etc.)",
  "Ingeniería y Tecnología",
  "Educación (Docente, Profesor)",
  "Administración y Negocios",
  "Finanzas y Contabilidad",
  "Derecho y Legal",
  "Comercio y Ventas",
  "Construcción y Arquitectura",
  "Transporte y Logística",
  "Hotelería y Turismo",
  "Comunicación y Marketing",
  "Arte y Diseño",
  "Agricultura y Ganadería",
  "Servicios (Belleza, Limpieza, etc.)",
  "Seguridad",
  "Estudiante",
  "Ama de casa",
  "Jubilado/Pensionado",
  "Independiente/Emprendedor",
  "Desempleado",
  "Otro",
];

const MODAL_FIELD_CLASS =
  "w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-300/50 dark:border-white/10 dark:bg-[#252525] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-white/20";

const MODAL_SELECT_CLASS = `${MODAL_FIELD_CLASS} cursor-pointer appearance-none dark:[color-scheme:dark]`;

const MODAL_TEXTAREA_CLASS = `${MODAL_FIELD_CLASS} min-h-[4.5rem] resize-y`;

function LiderEditModal({
  title,
  subtitle,
  onClose,
  guardando,
  errorLocal,
  onGuardar,
  children,
  formId,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  guardando: boolean;
  errorLocal: string | null;
  onGuardar?: () => void;
  children: ReactNode;
  formId?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 min-h-[100dvh] w-full bg-black/50 backdrop-blur-sm"
        onClick={guardando ? undefined : onClose}
        aria-hidden
      />
      <div
        className="relative z-[1] flex max-h-[min(90dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-[#2a2a2a] dark:bg-[#1a1a1a]"
        role="dialog"
        aria-labelledby="lider-edit-title"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-[#2a2a2a]">
          <div className="min-w-0">
            <h2 id="lider-edit-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-800 dark:text-gray-200">{subtitle}</span>
              </p>
            ) : null}
            {errorLocal ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorLocal}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-[#252525] dark:hover:text-white"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {formId ? (
          <div className="flex shrink-0 gap-2 border-t border-gray-100 px-5 py-4 dark:border-[#2a2a2a]">
            <button type="button" onClick={onClose} disabled={guardando} className={BTN_FICHA_SECUNDARIO_FLEX}>
              Cancelar
            </button>
            <button
              type="submit"
              form={formId}
              disabled={guardando}
              className={BTN_FICHA_PRIMARIO_FLEX}
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        ) : onGuardar ? (
          <div className="flex shrink-0 gap-2 border-t border-gray-100 px-5 py-4 dark:border-[#2a2a2a]">
            <button type="button" onClick={onClose} disabled={guardando} className={BTN_FICHA_SECUNDARIO_FLEX}>
              Cerrar
            </button>
            <button type="button" onClick={onGuardar} disabled={guardando} className={BTN_FICHA_PRIMARIO_FLEX}>
              {guardando ? "…" : "Aceptar"}
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  const [fechaInicioLiderazgo, setFechaInicioLiderazgo] = useState<Date | null>(null);
  const [estadoCivil, setEstadoCivil] = useState("");
  const [ocupacion, setOcupacion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [rol, setRol] = useState("lider_grupo");
  const [estado, setEstado] = useState("formacion");
  const [grupoAsignado, setGrupoAsignado] = useState("");
  const [notas, setNotas] = useState("");
  const [grupos, setGrupos] = useState<{ id: string; nombre: string }[]>([]);

  const rolesVisibles = useMemo(() => {
    if (rol === "mentor") return [...ROLES_LIDERAZGO_DEFAULT, ROLES_LIDERAZGO_LEGACY[0]];
    if (rol === "diacono") return [...ROLES_LIDERAZGO_DEFAULT, ROLES_LIDERAZGO_LEGACY[1]];
    return ROLES_LIDERAZGO_DEFAULT;
  }, [rol]);

  const handleClose = () => {
    router.push(`/lideres/${id}`);
  };

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    (async () => {
      const [liderRes, gruposRes, grupoActualRes] = await Promise.all([
        supabase.from("lideres").select("*").eq("id", id).single(),
        supabase.from("grupos").select("id, nombre").eq("activo", true).order("nombre"),
        supabase.from("grupos").select("id").eq("lider_id", id).maybeSingle(),
      ]);

      if (liderRes.error || !liderRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const L = liderRes.data as Record<string, unknown>;
      setNombre((L.nombre as string) ?? "");
      setCedula(soloDigitosDocumentoId((L.cedula as string) ?? ""));
      setTelefono((L.telefono as string) ?? "");
      setEmail((L.email as string) ?? "");
      setFechaNacimiento(L.fecha_nacimiento ? new Date((L.fecha_nacimiento as string) + "T12:00:00") : null);
      setFechaInicioLiderazgo(L.fecha_inicio_liderazgo ? new Date((L.fecha_inicio_liderazgo as string) + "T12:00:00") : null);
      setEstadoCivil((L.estado_civil as string) ?? "");
      setOcupacion((L.ocupacion as string) ?? "");
      setDireccion((L.direccion as string) ?? "");
      setRol(rolDbToId[L.rol as string] ?? "lider_grupo");
      setEstado(estadoDbToId[L.estado as string] ?? "formacion");
      setNotas((L.notas as string) ?? "");

      setGrupos((gruposRes.data ?? []).map((g) => ({ id: g.id, nombre: g.nombre ?? "" })));
      if (grupoActualRes.data?.id) {
        setGrupoAsignado((grupoActualRes.data as { id: string }).id);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const supabase = createClient();

    const fechaInicioStr = fechaInicioLiderazgo
      ? `${fechaInicioLiderazgo.getFullYear()}-${String(fechaInicioLiderazgo.getMonth() + 1).padStart(2, "0")}-${String(fechaInicioLiderazgo.getDate()).padStart(2, "0")}`
      : null;
    const fechaNacStr = fechaNacimiento
      ? `${fechaNacimiento.getFullYear()}-${String(fechaNacimiento.getMonth() + 1).padStart(2, "0")}-${String(fechaNacimiento.getDate()).padStart(2, "0")}`
      : null;
    const grupoNombre = grupoAsignado ? grupos.find((g) => g.id === grupoAsignado)?.nombre ?? null : null;

    const { error: updateError } = await supabase
      .from("lideres")
      .update({
        nombre: nombre.trim(),
        cedula: soloDigitosDocumentoId(cedula).trim() || null,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        fecha_nacimiento: fechaNacStr,
        estado_civil: estadoCivil.trim() || null,
        ocupacion: ocupacion.trim() || null,
        direccion: direccion.trim() || null,
        rol: rolIdToDb[rol] ?? null,
        estado: estadoIdToDb[estado] ?? "En formación",
        grupo_asignado: grupoNombre,
        fecha_inicio_liderazgo: fechaInicioStr,
        notas: notas.trim() || null,
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message || "Error al guardar.");
      setIsSubmitting(false);
      return;
    }

    await supabase.from("grupos").update({ lider_id: null }).eq("lider_id", id);
    if (grupoAsignado) {
      await supabase.from("grupos").update({ lider_id: id }).eq("id", grupoAsignado);
    }

    router.push(`/lideres/${id}`);
    router.refresh();
  };

  if (loading) {
    return (
      <LiderEditModal title="Editar líder" onClose={handleClose} guardando={false} errorLocal={null}>
        <div className="flex items-center justify-center py-16">
          <svg className="h-8 w-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </LiderEditModal>
    );
  }

  if (notFound) {
    return (
      <LiderEditModal title="Líder no encontrado" onClose={() => router.push("/lideres")} guardando={false} errorLocal={null}>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No encontramos este líder.{" "}
          <Link href="/lideres" className="font-medium text-gray-900 underline dark:text-white">
            Volver al listado
          </Link>
        </p>
      </LiderEditModal>
    );
  }

  return (
    <LiderEditModal
      title="Editar líder"
      subtitle={nombre}
      onClose={handleClose}
      guardando={isSubmitting}
      errorLocal={error}
      formId="lider-edit-form"
    >
      <form id="lider-edit-form" onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Información básica</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Nombre completo" required>
              <input
                type="text"
                name="nombre"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={MODAL_FIELD_CLASS}
              />
            </FormField>
            <FormField label="Documento ID">
              <input
                type="text"
                name="cedula"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                value={cedula}
                onChange={(e) => setCedula(soloDigitosDocumentoId(e.target.value))}
                placeholder="Solo números"
                className={MODAL_FIELD_CLASS}
              />
            </FormField>
            <FormField label="Teléfono" required>
              <input
                type="tel"
                name="telefono"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className={MODAL_FIELD_CLASS}
              />
            </FormField>
            <FormField label="Correo electrónico" required>
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={MODAL_FIELD_CLASS}
              />
            </FormField>
            <FormField label="Fecha de nacimiento">
              <DatePicker id="fechaNacimiento" value={fechaNacimiento} onChange={setFechaNacimiento} placeholder="Seleccionar fecha" />
            </FormField>
            <FormField label="Estado civil">
              <select value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)} className={MODAL_SELECT_CLASS}>
                <option value="">Seleccionar…</option>
                {estadosCiviles.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Ocupación">
              <select value={ocupacion} onChange={(e) => setOcupacion(e.target.value)} className={MODAL_SELECT_CLASS}>
                <option value="">Seleccionar…</option>
                {ocupaciones.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Dirección">
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ej: Calle 45 #12-34, Bogotá"
                className={MODAL_FIELD_CLASS}
              />
            </FormField>
            <FormField label="Fecha inicio de liderazgo">
              <DatePicker id="fechaInicioLiderazgo" value={fechaInicioLiderazgo} onChange={setFechaInicioLiderazgo} placeholder="Seleccionar fecha" />
            </FormField>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Rol en el liderazgo</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {rolesVisibles.map((r) => (
              <label key={r.id} className="relative cursor-pointer">
                <input type="radio" name="rol" value={r.id} checked={rol === r.id} onChange={() => setRol(r.id)} className="peer sr-only" />
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition peer-checked:border-gray-900 peer-checked:bg-gray-50 dark:border-white/10 dark:peer-checked:border-white dark:peer-checked:bg-white/[0.06]">
                  <span className="shrink-0">
                    <RoleIcon name={r.icon} />
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{r.nombre}</span>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Estado del líder</h3>
          <div className="space-y-2">
            {estados.map((e) => (
              <label
                key={e.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200/80 px-3 py-2.5 transition hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/[0.04]"
              >
                <input
                  type="radio"
                  name="estado"
                  value={e.id}
                  checked={estado === e.id}
                  onChange={() => setEstado(e.id)}
                  className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-400 dark:border-white/20 dark:bg-[#252525]"
                />
                <div
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${e.color === "green" ? "bg-green-500" : e.color === "yellow" ? "bg-amber-400" : "bg-gray-400"}`}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{e.nombre}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Asignar a grupo</h3>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200/80 px-3 py-2.5 transition hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/[0.04]">
              <input
                type="radio"
                name="grupo"
                value=""
                checked={grupoAsignado === ""}
                onChange={() => setGrupoAsignado("")}
                className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-400 dark:border-white/20 dark:bg-[#252525]"
              />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin asignar</span>
            </label>
            {grupos.map((g) => (
              <label
                key={g.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200/80 px-3 py-2.5 transition hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/[0.04]"
              >
                <input
                  type="radio"
                  name="grupo"
                  value={g.id}
                  checked={grupoAsignado === g.id}
                  onChange={() => setGrupoAsignado(g.id)}
                  className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-400 dark:border-white/20 dark:bg-[#252525]"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{g.nombre}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notas</h3>
          <textarea
            name="notas"
            rows={4}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className={MODAL_TEXTAREA_CLASS}
            placeholder="Observaciones sobre el líder…"
          />
        </section>
      </form>
    </LiderEditModal>
  );
}

function FormField({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-500 dark:text-gray-400">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

function RoleIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    star: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    ),
    users: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
      />
    ),
    clipboard: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
      />
    ),
    academic: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
      />
    ),
    heart: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    ),
  };
  return (
    <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {icons[name]}
    </svg>
  );
}
