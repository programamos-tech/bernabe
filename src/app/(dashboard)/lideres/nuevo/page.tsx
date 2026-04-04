"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "boring-avatars";
import { DatePicker } from "@/components/ui/DatePicker";
import { soloDigitosDocumentoId } from "@/lib/documento-id";
import { createClient } from "@/lib/supabase/client";
import { ROLES_LIDERAZGO_DEFAULT } from "@/lib/lideres-roles";

type RolDb = "Pastor" | "Líder de grupo" | "Coordinador" | "Mentor" | "Diácono";
type EstadoDb = "Activo" | "En formación" | "Descanso";

const rolIdToDb: Record<string, RolDb> = {
  pastor: "Pastor",
  lider_grupo: "Líder de grupo",
  coordinador: "Coordinador",
  mentor: "Mentor",
  diacono: "Diácono",
};

const estadoIdToDb: Record<string, EstadoDb> = {
  activo: "Activo",
  formacion: "En formación",
  descanso: "Descanso",
};

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

export default function Page() {
  const router = useRouter();
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

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("grupos")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre")
      .then(({ data }) => {
        setGrupos(
          (data ?? []).map((g) => ({ id: g.id, nombre: g.nombre ?? "" }))
        );
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const supabase = createClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      setError("Debes iniciar sesión para registrar un líder.");
      setIsSubmitting(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    const organizationId = profile?.organization_id;
    if (!organizationId) {
      setError("No tienes una iglesia asignada. Completa el onboarding primero.");
      setIsSubmitting(false);
      return;
    }
    const fechaInicioStr = fechaInicioLiderazgo
      ? `${fechaInicioLiderazgo.getFullYear()}-${String(fechaInicioLiderazgo.getMonth() + 1).padStart(2, "0")}-${String(fechaInicioLiderazgo.getDate()).padStart(2, "0")}`
      : null;
    const fechaNacStr = fechaNacimiento
      ? `${fechaNacimiento.getFullYear()}-${String(fechaNacimiento.getMonth() + 1).padStart(2, "0")}-${String(fechaNacimiento.getDate()).padStart(2, "0")}`
      : null;
    const grupoNombre = grupoAsignado ? grupos.find((g) => g.id === grupoAsignado)?.nombre ?? grupoAsignado : null;

    const { data: newLider, error: insertError } = await supabase
      .from("lideres")
      .insert({
        organization_id: organizationId,
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
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message || "Error al guardar el líder.");
      setIsSubmitting(false);
      return;
    }

    if (grupoAsignado && newLider?.id) {
      await supabase.from("grupos").update({ lider_id: newLider.id }).eq("id", grupoAsignado);
    }

    router.push("/lideres");
    router.refresh();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#18301d] to-[#2d4a35] dark:from-[#1a1a1a] dark:to-[#252525] px-4 py-6 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-28 h-28 rounded-2xl bg-white dark:bg-[#2a2a2a] p-1.5 shadow-xl">
              <Avatar size={100} name={nombre || "Nuevo Líder"} variant="beam" colors={["#0ca6b2", "#18301d", "#e64b27", "#f9c70c", "#faddbf"]} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">Registrar nuevo líder</h1>
              <p className="text-white/70">
                Agrega un nuevo líder al equipo de la iglesia
              </p>
            </div>
            <Link href="/lideres" className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition" title="Volver a líderes">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit} className="px-4 py-6 md:px-6">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información básica */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h2 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Información básica</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField icon="user" label="Nombre completo" required>
                    <input
                      type="text"
                      name="nombre"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Carlos Rodríguez"
                      className="w-full bg-transparent text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />
                  </FormField>

                  <FormField icon="id" label="Documento ID">
                    <input
                      type="text"
                      name="cedula"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      value={cedula}
                      onChange={(e) => setCedula(soloDigitosDocumentoId(e.target.value))}
                      placeholder="Ej: 79123456"
                      className="w-full bg-transparent text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />
                  </FormField>

                  <FormField icon="phone" label="Teléfono" required>
                    <input
                      type="tel"
                      name="telefono"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+57 300 111 2222"
                      className="w-full bg-transparent text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />
                  </FormField>

                  <FormField icon="email" label="Correo electrónico" required>
                    <input
                      type="email"
                      name="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@email.com"
                      className="w-full bg-transparent text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />
                  </FormField>

                  <FormField icon="calendar" label="Fecha de nacimiento">
                    <DatePicker
                      id="fechaNacimiento"
                      value={fechaNacimiento}
                      onChange={setFechaNacimiento}
                      placeholder="Seleccionar fecha"
                    />
                  </FormField>

                  <FormField icon="heart" label="Estado civil">
                    <select
                      value={estadoCivil}
                      onChange={(e) => setEstadoCivil(e.target.value)}
                      className="w-full bg-transparent text-[#18301d] dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="" className="dark:bg-[#252525]">Seleccionar...</option>
                      {estadosCiviles.map((opcion) => (
                        <option key={opcion} value={opcion} className="dark:bg-[#252525]">
                          {opcion}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField icon="work" label="Ocupación">
                    <select
                      value={ocupacion}
                      onChange={(e) => setOcupacion(e.target.value)}
                      className="w-full bg-transparent text-[#18301d] dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="" className="dark:bg-[#252525]">Seleccionar...</option>
                      {ocupaciones.map((opcion) => (
                        <option key={opcion} value={opcion} className="dark:bg-[#252525]">
                          {opcion}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField icon="location" label="Dirección">
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Ej: Calle 45 #12-34, Bogotá"
                      className="w-full bg-transparent text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />
                  </FormField>

                  <FormField icon="calendar" label="Fecha inicio de liderazgo">
                    <DatePicker
                      id="fechaInicioLiderazgo"
                      value={fechaInicioLiderazgo}
                      onChange={setFechaInicioLiderazgo}
                      placeholder="Seleccionar fecha"
                    />
                  </FormField>
                </div>
              </div>

              {/* Rol en el liderazgo */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h2 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Rol en el liderazgo</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ROLES_LIDERAZGO_DEFAULT.map((r) => (
                    <label key={r.id} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="rol"
                        value={r.id}
                        checked={rol === r.id}
                        onChange={() => setRol(r.id)}
                        className="peer sr-only"
                      />
                      <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 dark:border-[#333] peer-checked:border-[#0ca6b2] peer-checked:bg-[#0ca6b2]/5 dark:peer-checked:bg-[#0ca6b2]/10 transition">
                        <span className="flex-shrink-0">
                          <RoleIcon name={r.icon} />
                        </span>
                        <span className="font-medium text-[#18301d] dark:text-white">{r.nombre}</span>
                      </div>
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full border-2 border-gray-300 dark:border-[#444] peer-checked:border-[#0ca6b2] peer-checked:bg-[#0ca6b2] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h2 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Notas sobre el líder</h2>
                <textarea
                  name="notas"
                  rows={4}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej: Tiene experiencia previa liderando grupos pequeños, muy comprometido con la visión de la iglesia..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#252525] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent transition resize-none"
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Estado del líder */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Estado del líder</h3>
                <div className="space-y-2">
                  {estados.map((e) => (
                    <label key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#252525] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#333] transition">
                      <input
                        type="radio"
                        name="estado"
                        value={e.id}
                        checked={estado === e.id}
                        onChange={() => setEstado(e.id)}
                        className="w-4 h-4 text-[#0ca6b2] focus:ring-[#0ca6b2]"
                      />
                      <div className={`w-3 h-3 rounded-full ${e.color === "green" ? "bg-green-500" : e.color === "yellow" ? "bg-[#f9c70c]" : "bg-gray-400"}`} />
                      <span className="text-sm font-medium text-[#18301d] dark:text-white">{e.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Asignar grupo */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Asignar a grupo</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#252525] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#333] transition">
                    <input
                      type="radio"
                      name="grupo"
                      value=""
                      checked={grupoAsignado === ""}
                      onChange={() => setGrupoAsignado("")}
                      className="w-4 h-4 text-[#0ca6b2] focus:ring-[#0ca6b2]"
                    />
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin asignar por ahora</span>
                  </label>
                  {grupos.map((g) => (
                    <label key={g.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#252525] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#333] transition">
                      <input
                        type="radio"
                        name="grupo"
                        value={g.id}
                        checked={grupoAsignado === g.id}
                        onChange={() => setGrupoAsignado(g.id)}
                        className="w-4 h-4 text-[#0ca6b2] focus:ring-[#0ca6b2]"
                      />
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                      <span className="text-sm font-medium text-[#18301d] dark:text-white">{g.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="bg-[#f9c70c]/20 dark:bg-[#f9c70c]/10 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f9c70c]/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#b8860b] dark:text-[#f9c70c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#b8860b] dark:text-[#f9c70c]">
                      Líder en formación
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Por defecto el líder iniciará en estado de formación hasta completar las capacitaciones requeridas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-[#0ca6b2] text-white font-semibold rounded-xl hover:bg-[#0a8f99] focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:ring-offset-2 dark:focus:ring-offset-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-lg shadow-[#0ca6b2]/25"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Registrar líder
                      </>
                    )}
                  </button>
                  <Link
                    href="/lideres"
                    className="w-full px-6 py-3 border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition flex items-center justify-center gap-2"
                  >
                    Cancelar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function FormField({ 
  icon, 
  label, 
  required = false,
  children 
}: { 
  icon: string; 
  label: string; 
  required?: boolean;
  children: React.ReactNode;
}) {
  const icons: Record<string, JSX.Element> = {
    user: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />,
    id: <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />,
    phone: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />,
    email: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />,
    heart: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />,
    work: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />,
    location: <><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></>,
  };

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-[#252525] focus-within:ring-2 focus-within:ring-[#0ca6b2] transition">
      <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {icons[icon]}
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
          {label} {required && <span className="text-[#e64b27]">*</span>}
        </p>
        {children}
      </div>
    </div>
  );
}

function RoleIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    star: <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />,
    clipboard: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />,
    academic: <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />,
    heart: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />,
  };

  return (
    <svg className="w-5 h-5 text-[#18301d] dark:text-[#0ca6b2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {icons[name]}
    </svg>
  );
}
