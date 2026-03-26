"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2 | 3 | 4;

const denominaciones = [
  "Evangélica",
  "Bautista",
  "Pentecostal",
  "Presbiteriana",
  "Metodista",
  "Carismática",
  "No denominacional",
  "Otra",
];

const tamanosIglesia = [
  { value: "pequena", label: "Pequeña", desc: "Menos de 50 personas" },
  { value: "mediana", label: "Mediana", desc: "50 - 200 personas" },
  { value: "grande", label: "Grande", desc: "200 - 500 personas" },
  { value: "megaiglesia", label: "Mega iglesia", desc: "Más de 500 personas" },
];

const diasServicio = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const paisesCiudades: Record<string, string[]> = {
  "Colombia": [
    "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", 
    "Pereira", "Santa Marta", "Cúcuta", "Ibagué", "Manizales", "Villavicencio",
    "Pasto", "Montería", "Neiva", "Armenia", "Valledupar", "Popayán", "Otra"
  ],
  "México": [
    "Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León",
    "Juárez", "Zapopan", "Mérida", "Cancún", "Querétaro", "Aguascalientes",
    "San Luis Potosí", "Morelia", "Toluca", "Chihuahua", "Hermosillo", "Otra"
  ],
  "Argentina": [
    "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "San Miguel de Tucumán",
    "Mar del Plata", "Salta", "Santa Fe", "San Juan", "Resistencia", "Neuquén",
    "Posadas", "Corrientes", "Bahía Blanca", "Otra"
  ],
  "Perú": [
    "Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Cusco", "Iquitos",
    "Huancayo", "Tacna", "Chimbote", "Pucallpa", "Ayacucho", "Cajamarca", "Otra"
  ],
  "Chile": [
    "Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta", "Temuco",
    "Rancagua", "Talca", "Arica", "Iquique", "Puerto Montt", "Coquimbo", "Otra"
  ],
  "Ecuador": [
    "Quito", "Guayaquil", "Cuenca", "Santo Domingo", "Machala", "Manta",
    "Portoviejo", "Ambato", "Riobamba", "Loja", "Ibarra", "Esmeraldas", "Otra"
  ],
  "Venezuela": [
    "Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay", "Ciudad Guayana",
    "Barcelona", "Maturín", "Puerto La Cruz", "San Cristóbal", "Mérida", "Otra"
  ],
  "Guatemala": [
    "Ciudad de Guatemala", "Mixco", "Villa Nueva", "Quetzaltenango", "Petapa",
    "San Juan Sacatepéquez", "Escuintla", "Chinautla", "Antigua Guatemala", "Otra"
  ],
  "Honduras": [
    "Tegucigalpa", "San Pedro Sula", "Choloma", "La Ceiba", "El Progreso",
    "Comayagua", "Choluteca", "Juticalpa", "Puerto Cortés", "Otra"
  ],
  "El Salvador": [
    "San Salvador", "Santa Ana", "San Miguel", "Mejicanos", "Soyapango",
    "Santa Tecla", "Apopa", "Delgado", "Usulután", "Otra"
  ],
  "Costa Rica": [
    "San José", "Alajuela", "Cartago", "Heredia", "Limón", "Puntarenas",
    "San Francisco", "Liberia", "Paraíso", "Otra"
  ],
  "Panamá": [
    "Ciudad de Panamá", "San Miguelito", "Colón", "David", "La Chorrera",
    "Arraiján", "Santiago", "Chitré", "Penonomé", "Otra"
  ],
  "República Dominicana": [
    "Santo Domingo", "Santiago", "San Pedro de Macorís", "La Romana", "San Cristóbal",
    "Puerto Plata", "La Vega", "San Francisco de Macorís", "Higüey", "Otra"
  ],
  "Bolivia": [
    "La Paz", "Santa Cruz", "Cochabamba", "Sucre", "Oruro", "Tarija",
    "Potosí", "Trinidad", "El Alto", "Otra"
  ],
  "Paraguay": [
    "Asunción", "Ciudad del Este", "San Lorenzo", "Luque", "Capiatá",
    "Lambaré", "Fernando de la Mora", "Encarnación", "Otra"
  ],
  "Uruguay": [
    "Montevideo", "Salto", "Paysandú", "Las Piedras", "Rivera", "Maldonado",
    "Tacuarembó", "Melo", "Otra"
  ],
  "Nicaragua": [
    "Managua", "León", "Masaya", "Matagalpa", "Chinandega", "Granada",
    "Estelí", "Tipitapa", "Otra"
  ],
  "Cuba": [
    "La Habana", "Santiago de Cuba", "Camagüey", "Holguín", "Santa Clara",
    "Guantánamo", "Bayamo", "Cienfuegos", "Otra"
  ],
  "Puerto Rico": [
    "San Juan", "Bayamón", "Carolina", "Ponce", "Caguas", "Guaynabo",
    "Mayagüez", "Arecibo", "Otra"
  ],
  "España": [
    "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga",
    "Murcia", "Palma", "Las Palmas", "Bilbao", "Alicante", "Córdoba", "Otra"
  ],
  "Estados Unidos": [
    "Miami", "Los Ángeles", "Houston", "Nueva York", "Chicago", "Dallas",
    "San Antonio", "Phoenix", "San Diego", "San José", "Austin", "Orlando", "Otra"
  ],
  "Otro": ["Otra"]
};

const paises = Object.keys(paisesCiudades);

/** Coincide con CHECK (rol) en public.lideres */
function mapCargoToRolLider(cargo: string): "Pastor" | "Coordinador" {
  if (cargo === "Pastor principal" || cargo === "Co-pastor") return "Pastor";
  return "Coordinador";
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Church info
  const [nombreIglesia, setNombreIglesia] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem("bermabe_pending_church_name") || "";
    } catch {
      return "";
    }
  });
  const [denominacion, setDenominacion] = useState("");
  const [pais, setPais] = useState("");
  const [ciudad, setCiudad] = useState("");

  const ciudadesDisponibles = pais ? paisesCiudades[pais] || [] : [];

  // Step 2: Pastor info (prefill from /register)
  const [nombrePastor, setNombrePastor] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem("bermabe_pending_pastor_full_name") || "";
    } catch {
      return "";
    }
  });
  const [emailPastor, setEmailPastor] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem("bermabe_pending_pastor_email") || "";
    } catch {
      return "";
    }
  });
  const [telefonoPastor, setTelefonoPastor] = useState("");
  const [cargo, setCargo] = useState("Pastor principal");

  // Step 3: Church structure
  const [tamano, setTamano] = useState("");
  const [tieneGrupos, setTieneGrupos] = useState<boolean | null>(null);
  const [cantidadGrupos, setCantidadGrupos] = useState("");
  const [diasServicioSeleccionados, setDiasServicioSeleccionados] = useState<string[]>(["Domingo"]);

  // Step 4: Preferences
  const [objetivoPrincipal, setObjetivoPrincipal] = useState("");

  const nextStep = () => {
    if (step < 4) setStep((step + 1) as Step);
  };

  const prevStep = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const slugify = (s: string) =>
      s
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const randomSuffix = () => Math.random().toString(16).slice(2, 8);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) throw new Error("No hay sesión activa.");

      const slugBase = slugify(nombreIglesia || "iglesia");
      const slug = `${slugBase}-${randomSuffix()}`;

      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .insert({
          name: nombreIglesia,
          slug,
          country: pais || null,
          city: ciudad || null,
          denomination: denominacion || null,
          size: tamano || null,
          service_days: diasServicioSeleccionados || [],
          pastor_name: nombrePastor || null,
          pastor_email: emailPastor || null,
          pastor_role: cargo || null,
          pastor_phone: telefonoPastor?.trim() || null,
          tiene_grupos: tieneGrupos ?? null,
          cantidad_grupos_aprox: cantidadGrupos ? parseInt(cantidadGrupos, 10) : null,
          objetivo_principal: objetivoPrincipal || null,
        })
        .select("id")
        .single();

      if (orgErr) throw orgErr;
      if (!org?.id) throw new Error("No se pudo crear la iglesia.");

      const { error: profileErr } = await supabase
        .from("profiles")
        .update({
          organization_id: org.id,
          role: "admin",
          full_name: nombrePastor?.trim() || undefined,
          phone: telefonoPastor?.trim() || undefined,
        })
        .eq("id", user.id);

      if (profileErr) throw profileErr;

      const { error: liderErr } = await supabase.from("lideres").insert({
        organization_id: org.id,
        nombre: nombrePastor.trim(),
        email: emailPastor.trim(),
        telefono: telefonoPastor?.trim() || null,
        rol: mapCargoToRolLider(cargo),
        estado: "Activo",
        grupo_asignado: null,
        miembros_a_cargo: 0,
        notas: "Cuenta principal (onboarding)",
      });
      if (liderErr) throw liderErr;

      const { error: defaultsErr } = await supabase.rpc("create_default_grupos_and_eventos", {
        p_organization_id: org.id,
      });
      if (defaultsErr) throw defaultsErr;

      router.push("/home");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error creando la iglesia.");
      setIsSubmitting(false);
    }
  };

  const toggleDiaServicio = (dia: string) => {
    setDiasServicioSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return nombreIglesia && denominacion && pais && ciudad;
      case 2:
        return nombrePastor && emailPastor;
      case 3:
        return tamano && tieneGrupos !== null;
      case 4:
        return objetivoPrincipal;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111] flex">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-96 bg-[#18301d] dark:bg-[#0a1a0f] flex-col p-8">
        <span className="font-logo text-3xl text-white mb-12">Bernabé</span>

        <div className="flex-1">
          <h2 className="text-xl font-semibold text-white mb-2">
            Configura tu iglesia
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            Solo te tomará unos minutos tener todo listo.
          </p>

          {/* Progress steps */}
          <div className="space-y-4">
            {[
              { num: 1, title: "Información de la iglesia", desc: "Nombre y ubicación" },
              { num: 2, title: "Datos del pastor", desc: "Contacto principal" },
              { num: 3, title: "Estructura", desc: "Tamaño y grupos" },
              { num: 4, title: "Objetivos", desc: "¿Qué quieres lograr?" },
            ].map((s) => (
              <div key={s.num} className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    step === s.num
                      ? "bg-[#0ca6b2] text-white"
                      : step > s.num
                      ? "bg-[#0ca6b2]/20 text-[#0ca6b2]"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {step > s.num ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>
                <div>
                  <p className={`font-medium ${step >= s.num ? "text-white" : "text-white/50"}`}>
                    {s.title}
                  </p>
                  <p className={`text-sm ${step >= s.num ? "text-gray-400" : "text-white/30"}`}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-gray-400">
              ¿Necesitas ayuda? Escríbenos a{" "}
              <a href="mailto:soporte@bernabe.app" className="text-[#0ca6b2] hover:underline">
                soporte@bernabe.app
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] p-4">
          <span className="font-logo text-2xl text-[#18301d] dark:text-white">Bernabé</span>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  step >= s ? "bg-[#0ca6b2]" : "bg-gray-200 dark:bg-[#333]"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Paso {step} de 4
          </p>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-xl">
            {/* Step 1: Church Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-[#18301d] dark:text-white">
                    ¿Cómo se llama tu iglesia?
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Cuéntanos sobre tu comunidad de fe.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    {nombreIglesia ? (
                      <>
                        <p className="block text-sm font-medium text-[#18301d] dark:text-white mb-2">
                          Tu iglesia
                        </p>
                        <div className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white">
                          {nombreIglesia}
                        </div>
                        <input type="hidden" name="nombreIglesia" value={nombreIglesia} />
                      </>
                    ) : (
                      <>
                        <label className="block text-sm font-medium text-[#18301d] dark:text-white mb-2">
                          Nombre de la iglesia *
                        </label>
                        <input
                          type="text"
                          value={nombreIglesia}
                          onChange={(e) => setNombreIglesia(e.target.value)}
                          placeholder="Ej: Iglesia Vida Nueva"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] transition"
                        />
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#18301d] dark:text-white mb-2">
                      Denominación *
                    </label>
                    <select
                      value={denominacion}
                      onChange={(e) => setDenominacion(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] transition cursor-pointer"
                    >
                      <option value="">Selecciona una opción</option>
                      {denominaciones.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#18301d] dark:text-white mb-2">
                        País *
                      </label>
                      <select
                        value={pais}
                        onChange={(e) => {
                          setPais(e.target.value);
                          setCiudad("");
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] transition cursor-pointer"
                      >
                        <option value="">Selecciona un país</option>
                        {paises.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#18301d] dark:text-white mb-2">
                        Ciudad *
                      </label>
                      <select
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        disabled={!pais}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">{pais ? "Selecciona una ciudad" : "Primero selecciona un país"}</option>
                        {ciudadesDisponibles.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Pastor Info */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-[#18301d] dark:text-white">
                    ¿Quién administrará Bernabé?
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Datos del pastor o administrador principal.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#18301d] dark:text-white mb-2">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      value={nombrePastor}
                      onChange={(e) => setNombrePastor(e.target.value)}
                      placeholder="Ej: Carlos Rodríguez"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#18301d] dark:text-white mb-2">
                      Cargo
                    </label>
                    <select
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] transition cursor-pointer"
                    >
                      <option value="Pastor principal">Pastor principal</option>
                      <option value="Co-pastor">Co-pastor</option>
                      <option value="Administrador">Administrador</option>
                      <option value="Líder de ministerio">Líder de ministerio</option>
                      <option value="Secretario/a">Secretario/a</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#18301d] dark:text-white mb-2">
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      value={emailPastor}
                      onChange={(e) => setEmailPastor(e.target.value)}
                      placeholder="pastor@iglesia.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#18301d] dark:text-white mb-2">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={telefonoPastor}
                      onChange={(e) => setTelefonoPastor(e.target.value)}
                      placeholder="+57 300 123 4567"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Church Structure */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-[#18301d] dark:text-white">
                    Cuéntanos sobre tu iglesia
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Esto nos ayuda a configurar mejor tu experiencia.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#18301d] dark:text-white mb-3">
                      ¿Cuál es el tamaño de tu congregación? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {tamanosIglesia.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setTamano(t.value)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            tamano === t.value
                              ? "border-[#0ca6b2] bg-[#0ca6b2]/5 dark:bg-[#0ca6b2]/10"
                              : "border-gray-200 dark:border-[#333] hover:border-[#0ca6b2]/50"
                          }`}
                        >
                          <p className={`font-semibold ${tamano === t.value ? "text-[#0ca6b2]" : "text-[#18301d] dark:text-white"}`}>
                            {t.label}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#18301d] dark:text-white mb-3">
                      ¿Tienen grupos o células? *
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setTieneGrupos(true)}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                          tieneGrupos === true
                            ? "border-[#0ca6b2] bg-[#0ca6b2]/5 dark:bg-[#0ca6b2]/10"
                            : "border-gray-200 dark:border-[#333] hover:border-[#0ca6b2]/50"
                        }`}
                      >
                        <p className={`font-semibold ${tieneGrupos === true ? "text-[#0ca6b2]" : "text-[#18301d] dark:text-white"}`}>
                          Sí, tenemos
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTieneGrupos(false)}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                          tieneGrupos === false
                            ? "border-[#0ca6b2] bg-[#0ca6b2]/5 dark:bg-[#0ca6b2]/10"
                            : "border-gray-200 dark:border-[#333] hover:border-[#0ca6b2]/50"
                        }`}
                      >
                        <p className={`font-semibold ${tieneGrupos === false ? "text-[#0ca6b2]" : "text-[#18301d] dark:text-white"}`}>
                          No, aún no
                        </p>
                      </button>
                    </div>
                  </div>

                  {tieneGrupos && (
                    <div>
                      <label className="block text-sm font-medium text-[#18301d] dark:text-white mb-2">
                        ¿Cuántos grupos tienen aproximadamente?
                      </label>
                      <input
                        type="number"
                        value={cantidadGrupos}
                        onChange={(e) => setCantidadGrupos(e.target.value)}
                        placeholder="Ej: 10"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] transition"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[#18301d] dark:text-white mb-3">
                      ¿Qué días tienen servicios?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {diasServicio.map((dia) => (
                        <button
                          key={dia}
                          type="button"
                          onClick={() => toggleDiaServicio(dia)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            diasServicioSeleccionados.includes(dia)
                              ? "bg-[#0ca6b2] text-white"
                              : "bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333]"
                          }`}
                        >
                          {dia}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Goals */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-[#18301d] dark:text-white">
                    ¿Qué quieres lograr con Bernabé?
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Cuéntanos tu objetivo principal para personalizar tu experiencia.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { 
                      value: "seguimiento", 
                      label: "Mejorar el seguimiento a visitantes", 
                      desc: "Que ninguna persona nueva se pierda",
                      color: "#f9c70c",
                      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    },
                    { 
                      value: "grupos", 
                      label: "Organizar mis grupos y células", 
                      desc: "Que cada líder cuide a su gente",
                      color: "#0ca6b2",
                      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    },
                    { 
                      value: "asistencia", 
                      label: "Controlar asistencia", 
                      desc: "Saber quién viene y quién falta",
                      color: "#e64b27",
                      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    },
                    { 
                      value: "comunicacion", 
                      label: "Mejorar la comunicación", 
                      desc: "Mantener informada a la congregación",
                      color: "#8b5cf6",
                      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    },
                    { 
                      value: "todo", 
                      label: "Todo lo anterior", 
                      desc: "Quiero aprovechar todas las funciones",
                      color: "#0ca6b2",
                      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                    },
                  ].map((objetivo) => (
                    <button
                      key={objetivo.value}
                      type="button"
                      onClick={() => setObjetivoPrincipal(objetivo.value)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                        objetivoPrincipal === objetivo.value
                          ? "border-[#0ca6b2] bg-[#0ca6b2]/5 dark:bg-[#0ca6b2]/10"
                          : "border-gray-200 dark:border-[#333] hover:border-[#0ca6b2]/50"
                      }`}
                    >
                      <svg 
                        className="w-6 h-6 flex-shrink-0" 
                        style={{ color: objetivo.color }}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth={1.5}
                      >
                        {objetivo.icon}
                      </svg>
                      <div>
                        <p className={`font-semibold ${objetivoPrincipal === objetivo.value ? "text-[#0ca6b2]" : "text-[#18301d] dark:text-white"}`}>
                          {objetivo.label}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{objetivo.desc}</p>
                      </div>
                      {objetivoPrincipal === objetivo.value && (
                        <svg className="w-6 h-6 text-[#0ca6b2] ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-[#2a2a2a]">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-300 font-medium hover:text-[#18301d] dark:hover:text-white transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Anterior
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-8 py-3 bg-[#0ca6b2] text-white font-semibold rounded-full hover:bg-[#0a8f99] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-[#0ca6b2]/25"
                >
                  Continuar
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 bg-[#e64b27] text-white font-semibold rounded-full hover:bg-[#d4421f] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-[#e64b27]/25"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Configurando...
                    </>
                  ) : (
                    <>
                      Comenzar a usar Bernabé
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>

            {errorMessage && (
              <div className="mt-4 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
