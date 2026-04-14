"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TimePicker } from "@/components/ui/TimePicker";
import { createClient } from "@/lib/supabase/client";

type TipoGrupo = "parejas" | "jovenes" | "teens" | "hombres" | "mujeres" | "general";

const tiposGrupo: { value: TipoGrupo; label: string }[] = [
  { value: "parejas", label: "Parejas" },
  { value: "jovenes", label: "Jóvenes" },
  { value: "teens", label: "Teens / Adolescentes" },
  { value: "hombres", label: "Hombres" },
  { value: "mujeres", label: "Mujeres" },
  { value: "general", label: "General / Mixto" },
];

const diasSemana = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábados",
  "Domingos",
];

const imagenesDisponibles = [
  { src: "/parejados.jpg", label: "Parejas" },
  { src: "/fiesta.jpg", label: "Jóvenes" },
  { src: "/hombre.jpg", label: "Hombres" },
  { src: "/mesaycena.jpg", label: "Reunión" },
];

interface LiderOption {
  id: string;
  nombre: string;
}

export default function Page() {
  const router = useRouter();
  const [lideres, setLideres] = useState<LiderOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoGrupo>("general");
  const [hora, setHora] = useState<string | null>(null);
  const [imagenSeleccionada, setImagenSeleccionada] = useState("/fiesta.jpg");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("lideres")
      .select("id, nombre")
      .order("nombre")
      .then(({ data }) => setLideres((data as LiderOption[]) ?? []));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const nombreVal = (formData.get("nombre") as string)?.trim();
    const descripcionVal = (formData.get("descripcion") as string)?.trim() || null;
    const diaVal = (formData.get("dia") as string)?.trim() || null;
    const ubicacionVal = (formData.get("ubicacion") as string)?.trim() || null;
    const liderIdVal = (formData.get("lider") as string)?.trim() || null;

    if (!nombreVal) {
      setError("El nombre del grupo es obligatorio.");
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        setError("Debes iniciar sesión para crear un grupo.");
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

      const { error: insertErr } = await supabase.from("grupos").insert({
        organization_id: organizationId,
        nombre: nombreVal,
        tipo,
        descripcion: descripcionVal,
        dia: diaVal,
        hora: hora || null,
        ubicacion: ubicacionVal,
        imagen: imagenSeleccionada || null,
        lider_id: liderIdVal || null,
        activo: true,
      });

      if (insertErr) throw insertErr;
      router.push("/grupos");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el grupo. Intenta de nuevo.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="relative h-48 md:h-56">
        <Image
          src={imagenSeleccionada}
          alt="Imagen del grupo"
          fill
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex flex-col justify-end pb-6 pt-4">
            <div className="flex w-full items-end justify-between gap-4">
              <div>
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-[#0ca6b2] text-white mb-3">
                  Nuevo grupo
                </span>
                <h1 className="text-3xl font-bold text-white">
                  {nombre || "Nombre del grupo"}
                </h1>
              </div>
              <Link 
                href="/grupos" 
                className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm" 
                title="Volver a grupos"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </div>
        </div>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit} className="py-6">
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
                <h2 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Información del grupo</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField icon="group" label="Nombre del grupo" required>
                    <input
                      type="text"
                      name="nombre"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Jóvenes Adultos"
                      className="w-full bg-transparent text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />
                  </FormField>

                  <FormField icon="tag" label="Tipo de grupo" required>
                    <select
                      name="tipo"
                      required
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value as TipoGrupo)}
                      className="w-full bg-transparent text-[#18301d] dark:text-white focus:outline-none cursor-pointer"
                    >
                      {tiposGrupo.map((t) => (
                        <option key={t.value} value={t.value} className="dark:bg-[#252525]">
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <div className="sm:col-span-2">
                    <FormField icon="description" label="Descripción">
                      <input
                        type="text"
                        name="descripcion"
                        placeholder="Ej: Jóvenes adultos de 18 a 30 años creciendo en fe"
                        className="w-full bg-transparent text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none"
                      />
                    </FormField>
                  </div>
                </div>
              </div>

              {/* Horario y ubicación */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h2 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Horario y ubicación</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField icon="calendar" label="Día de reunión" required>
                    <select
                      name="dia"
                      required
                      className="w-full bg-transparent text-[#18301d] dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="" className="dark:bg-[#252525]">Seleccionar día...</option>
                      {diasSemana.map((dia) => (
                        <option key={dia} value={dia} className="dark:bg-[#252525]">
                          {dia}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Hora <span className="text-[#e64b27]">*</span>
                    </label>
                    <TimePicker
                      id="hora"
                      name="hora"
                      value={hora}
                      onChange={setHora}
                      placeholder="Seleccionar hora"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <FormField icon="location" label="Ubicación" required>
                      <input
                        type="text"
                        name="ubicacion"
                        required
                        placeholder="Ej: Salón principal, Auditorio juvenil, Casa del líder"
                        className="w-full bg-transparent text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none"
                      />
                    </FormField>
                  </div>
                </div>
              </div>

              {/* Imagen */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h2 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Imagen del grupo</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {imagenesDisponibles.map((img) => (
                    <button
                      key={img.src}
                      type="button"
                      onClick={() => setImagenSeleccionada(img.src)}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition ${
                        imagenSeleccionada === img.src
                          ? "border-[#0ca6b2] ring-2 ring-[#0ca6b2]/30"
                          : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <Image src={img.src} alt={img.label} fill className="object-cover object-top" />
                      {imagenSeleccionada === img.src && (
                        <div className="absolute inset-0 bg-[#0ca6b2]/20 flex items-center justify-center">
                          <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Selecciona una imagen representativa para el grupo
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Asignar líder */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Asignar líder</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#252525] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#333] transition">
                    <input type="radio" name="lider" value="" defaultChecked className="w-4 h-4 text-[#0ca6b2] focus:ring-[#0ca6b2]" />
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin asignar por ahora</span>
                  </label>
                  {lideres.map((lider) => (
                    <label key={lider.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#252525] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#333] transition">
                      <input type="radio" name="lider" value={lider.id} className="w-4 h-4 text-[#0ca6b2] focus:ring-[#0ca6b2]" />
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <span className="text-sm font-medium text-[#18301d] dark:text-white">{lider.nombre}</span>
                    </label>
                  ))}
                  {lideres.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Crea líderes en la sección Líderes para asignarlos aquí.
                    </p>
                  )}
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
                      El grupo se creará activo
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Podrás agregar miembros después de crear el grupo.
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
                        Creando grupo...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Crear grupo
                      </>
                    )}
                  </button>
                  <Link
                    href="/grupos"
                    className="w-full px-6 py-3 border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition flex items-center justify-center gap-2"
                  >
                    Cancelar
                  </Link>
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
    group: <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />,
    tag: <><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></>,
    description: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />,
    clock: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
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
