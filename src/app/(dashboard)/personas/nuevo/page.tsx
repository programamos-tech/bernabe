"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/UserAvatar";
import { DatePicker } from "@/components/ui/DatePicker";
import { createClient } from "@/lib/supabase/client";

interface GrupoOption {
  id: string;
  nombre: string;
}

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
  const [grupos, setGrupos] = useState<GrupoOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("grupos")
      .select("id, nombre")
      .order("nombre")
      .then(({ data }) => setGrupos((data as GrupoOption[]) ?? []));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const nombreVal = (formData.get("nombre") as string)?.trim();
    const cedulaVal = (formData.get("cedula") as string)?.trim() || null;
    const telefonoVal = (formData.get("telefono") as string)?.trim() || null;
    const emailVal = (formData.get("email") as string)?.trim() || null;
    const estadoCivilVal = (formData.get("estadoCivil") as string) || null;
    const ocupacionVal = (formData.get("ocupacion") as string) || null;
    const direccionVal = (formData.get("direccion") as string)?.trim() || null;
    const grupoIdVal = (formData.get("grupo") as string)?.trim() || null;
    const notasVal = (formData.get("notas") as string)?.trim() || null;

    if (!nombreVal) {
      setError("El nombre es obligatorio.");
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        setError("Debes iniciar sesión para registrar una persona.");
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

      const { data: nuevaPersona, error: insertErr } = await supabase
        .from("personas")
        .insert({
          organization_id: organizationId,
          nombre: nombreVal,
          cedula: cedulaVal,
          telefono: telefonoVal,
          email: emailVal,
          fecha_nacimiento: fechaNacimiento ? fechaNacimiento.toISOString().slice(0, 10) : null,
          estado_civil: estadoCivilVal,
          ocupacion: ocupacionVal,
          direccion: direccionVal,
          grupo_id: grupoIdVal || null,
          notas: null,
          estado: grupoIdVal ? "Activo" : "Visitante",
          rol: "Miembro",
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      if (notasVal && nuevaPersona?.id) {
        const { error: notaErr } = await supabase.from("persona_notas").insert({
          organization_id: organizationId,
          persona_id: nuevaPersona.id,
          contenido: notasVal,
          created_by: user.id,
        });
        if (notaErr) throw notaErr;
      }
      router.push("/personas");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar. Intenta de nuevo.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#18301d] to-[#2d4a35] dark:from-[#1a1a1a] dark:to-[#252525] px-4 py-6 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-28 h-28 rounded-2xl bg-white dark:bg-[#2a2a2a] p-1.5 shadow-xl">
              <UserAvatar seed={nombre || "Nueva Persona"} size={100} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">Registrar nueva persona</h1>
              <p className="text-white/70">
                Agrega un nuevo visitante o miembro a la iglesia
              </p>
            </div>
            <Link href="/personas" className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition" title="Volver a personas">
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
                      placeholder="Ej: María García"
                      className="w-full bg-transparent text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />
                  </FormField>

                  <FormField icon="id" label="Cédula">
                    <input
                      type="text"
                      name="cedula"
                      placeholder="Ej: 1.023.456.789"
                      className="w-full bg-transparent text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />
                  </FormField>

                  <FormField icon="phone" label="Teléfono" required>
                    <input
                      type="tel"
                      name="telefono"
                      required
                      placeholder="+57 300 123 4567"
                      className="w-full bg-transparent text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />
                  </FormField>

                  <FormField icon="email" label="Correo electrónico">
                    <input
                      type="email"
                      name="email"
                      placeholder="correo@ejemplo.com"
                      className="w-full bg-transparent text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />
                  </FormField>
                </div>
              </div>

              {/* Información personal */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h2 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Información personal</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Fecha de nacimiento</label>
                    <DatePicker
                      id="fechaNacimiento"
                      name="fechaNacimiento"
                      value={fechaNacimiento}
                      onChange={setFechaNacimiento}
                      placeholder="Seleccionar fecha"
                    />
                  </div>

                  <FormField icon="heart" label="Estado civil">
                    <select
                      name="estadoCivil"
                      className="w-full bg-transparent text-[#18301d] dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="" className="dark:bg-[#252525]">Seleccionar...</option>
                      {estadosCiviles.map((estado) => (
                        <option key={estado} value={estado} className="dark:bg-[#252525]">
                          {estado}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField icon="work" label="Ocupación">
                    <select
                      name="ocupacion"
                      className="w-full bg-transparent text-[#18301d] dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="" className="dark:bg-[#252525]">Seleccionar...</option>
                      {ocupaciones.map((ocupacion) => (
                        <option key={ocupacion} value={ocupacion} className="dark:bg-[#252525]">
                          {ocupacion}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField icon="location" label="Dirección">
                    <input
                      type="text"
                      name="direccion"
                      placeholder="Ej: Calle 45 #12-34, Bogotá"
                      className="w-full bg-transparent text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />
                  </FormField>
                </div>
              </div>

              {/* Notas */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h2 className="text-lg font-semibold text-[#18301d] dark:text-white mb-1">Notas</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Opcional. Se guarda como primera entrada del historial de notas de la persona.
                </p>
                <textarea
                  name="notas"
                  rows={4}
                  placeholder="Ej: Petición de oración, contexto familiar, algo puntual que recordar…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#252525] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent transition resize-none"
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Asignar grupo */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Asignar a grupo</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#252525] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#333] transition">
                    <input type="radio" name="grupo" value="" defaultChecked className="w-4 h-4 text-[#0ca6b2] focus:ring-[#0ca6b2]" />
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin asignar por ahora</span>
                  </label>
                  {grupos.map((grupo) => (
                    <label key={grupo.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#252525] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#333] transition">
                      <input type="radio" name="grupo" value={grupo.id} className="w-4 h-4 text-[#0ca6b2] focus:ring-[#0ca6b2]" />
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                      <span className="text-sm font-medium text-[#18301d] dark:text-white">{grupo.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="bg-[#0ca6b2]/10 dark:bg-[#0ca6b2]/20 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0ca6b2]/20 dark:bg-[#0ca6b2]/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#0ca6b2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0ca6b2]">
                      Esta persona será registrada como visitante
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Podrás cambiar su estado después del proceso de seguimiento.
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
                        Registrar persona
                      </>
                    )}
                  </button>
                  <Link
                    href="/personas"
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
    id: <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />,
    phone: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />,
    email: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />,
    heart: <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />,
    work: <><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></>,
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
