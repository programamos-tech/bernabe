"use client";

import Link from "next/link";
import { UserAvatar } from "@/components/UserAvatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ARTICULOS_COMUNIDAD_MOCK, CATEGORIAS_LIDERAZGO } from "@/lib/comunidad-articulos-mock";

const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-gray-900 px-8 py-4 text-center font-semibold text-white shadow-sm shadow-black/10 transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:shadow-none dark:hover:bg-gray-100";

const btnSecondary =
  "inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-8 py-4 text-center font-semibold text-gray-900 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]";

function Logo() {
  return <span className="font-logo text-3xl text-gray-900 dark:text-white">Bernabé</span>;
}

function Navbar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-md dark:border-white/[0.08] dark:bg-[#111111]/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Características
            </a>
            <a
              href="#comunidad"
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Comunidad
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Cómo funciona
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Testimonios
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 underline-offset-4 hover:underline dark:text-gray-400"
            >
              Iniciar sesión
            </Link>
            <Link href="/register" className={`${btnPrimary} px-5 py-2.5 text-sm`}>
              Comenzar gratis
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

/** Misma escala de puntos que en /personas (solo demo landing). */
const landingEstadoDot: Record<string, string> = {
  Activo: "bg-emerald-400/75 dark:bg-emerald-400/55",
  Visitante: "bg-amber-300/90 dark:bg-amber-300/65",
  "En seguimiento": "bg-sky-400/80 dark:bg-sky-400/55",
  "En servicio": "bg-violet-400/80 dark:bg-violet-400/55",
  Inactivo: "bg-gray-400/85 dark:bg-gray-500/65",
};

const LANDING_PERSONAS_DEMO = [
  {
    nombre: "María Elena Vásquez",
    telefono: "+58 424-1122334",
    grupo: "Zona Norte",
    estado: "Activo",
    contacto: "28 mar 2025",
  },
  {
    nombre: "Carlos Rivas",
    telefono: "+58 414-9988776",
    grupo: "Sin asignar",
    estado: "Visitante",
    contacto: "30 mar 2025",
  },
  {
    nombre: "Ana Lucía Méndez",
    telefono: "+58 412-5544332",
    grupo: "Jóvenes",
    estado: "En seguimiento",
    contacto: "27 mar 2025",
  },
  {
    nombre: "Roberto Díaz",
    telefono: "+58 426-2211009",
    grupo: "Matrimonios",
    estado: "Activo",
    contacto: "25 mar 2025",
  },
  {
    nombre: "Luisa Herrera",
    telefono: "+58 424-6677881",
    grupo: "Intercesión",
    estado: "En servicio",
    contacto: "22 mar 2025",
  },
] as const;

function LandingHeroPersonasPreview() {
  return (
    <div
      className="pointer-events-none select-none"
      role="img"
      aria-label="Vista previa de la pantalla Personas en Bernabé: tabla de miembros con nombre, grupo, estado y último contacto."
    >
      <div className="mb-3 min-w-0">
        <h2 className="text-base font-medium text-[#18301d] dark:text-white font-logo-soft tracking-tight sm:text-lg">Personas</h2>
        <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 leading-snug">Miembros y visitantes de la iglesia.</p>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <div className="rounded-full bg-gray-100/90 py-2 pl-9 pr-3 text-xs text-gray-400 dark:bg-white/[0.06] dark:text-gray-500">
            Buscar persona...
          </div>
        </div>
        <div className="flex h-9 w-full items-center rounded-full bg-gray-100/90 px-3 text-xs text-gray-500 dark:bg-white/[0.06] dark:text-gray-400 sm:w-44">
          Todos los estados
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-gray-100/50 dark:bg-white/[0.04] sm:rounded-3xl">
        <div className="min-w-0">
          <table className="w-full table-fixed border-collapse text-left text-[10px] sm:text-xs">
            <colgroup>
              <col className="w-[36%]" />
              <col className="w-[16%]" />
              <col className="w-[20%]" />
              <col className="w-[16%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="text-gray-500 dark:text-gray-400">
                <th className="px-1.5 pb-1.5 pt-2.5 text-left font-medium uppercase tracking-wide sm:px-2 sm:pb-2 sm:pt-3.5 sm:text-[11px]">
                  Persona
                </th>
                <th className="px-1.5 pb-1.5 pt-2.5 text-left font-medium uppercase tracking-wide sm:px-2 sm:pb-2 sm:pt-3.5 sm:text-[11px]">
                  Grupo
                </th>
                <th className="px-1.5 pb-1.5 pt-2.5 text-left font-medium uppercase tracking-wide sm:px-2 sm:pb-2 sm:pt-3.5 sm:text-[11px]">
                  Estado
                </th>
                <th className="px-1.5 pb-1.5 pt-2.5 text-left font-medium uppercase tracking-wide sm:px-2 sm:pb-2 sm:pt-3.5 sm:text-[11px]">
                  Último contacto
                </th>
                <th className="px-1.5 pb-1.5 pt-2.5 text-right font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 sm:px-2 sm:pb-2 sm:pt-3.5 sm:text-[11px]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {LANDING_PERSONAS_DEMO.map((row) => (
                <tr key={row.nombre} className="border-t border-gray-200/60 dark:border-white/[0.06]">
                  <td className="min-w-0 px-1.5 py-2 sm:px-2 sm:py-2.5">
                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                      <UserAvatar seed={row.nombre} size={28} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium leading-tight text-gray-900 dark:text-white">{row.nombre}</div>
                        <div className="truncate text-[9px] text-gray-500 dark:text-gray-400 sm:text-[10px]">{row.telefono}</div>
                      </div>
                    </div>
                  </td>
                  <td className="min-w-0 px-1.5 py-2 text-gray-600 dark:text-gray-300 sm:px-2 sm:py-2.5">
                    <span className="line-clamp-2 break-words leading-tight">{row.grupo}</span>
                  </td>
                  <td className="min-w-0 px-1.5 py-2 sm:px-2 sm:py-2.5">
                    <div className="flex items-start gap-1 sm:items-center sm:gap-1.5">
                      <span
                        className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full sm:mt-0 ${landingEstadoDot[row.estado] ?? landingEstadoDot.Activo}`}
                      />
                      <span className="min-w-0 break-words leading-tight text-gray-700 dark:text-gray-300">{row.estado}</span>
                    </div>
                  </td>
                  <td className="min-w-0 px-1.5 py-2 tabular-nums text-gray-500 dark:text-gray-400 sm:px-2 sm:py-2.5">
                    <span className="line-clamp-2 break-words leading-tight">{row.contacto}</span>
                  </td>
                  <td className="px-1 py-2 sm:px-2 sm:py-2.5">
                    <div className="flex items-center justify-end gap-0 text-gray-400">
                      <span className="rounded-full p-0.5 sm:p-1">
                        <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </span>
                      <span className="rounded-full p-0.5 sm:p-1">
                        <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                        </svg>
                      </span>
                      <span className="rounded-full p-0.5 sm:p-1">
                        <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                        </svg>
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200/60 px-3 py-2.5 text-center text-[10px] text-gray-500 dark:border-white/[0.06] dark:text-gray-400 sm:px-4 sm:text-xs sm:text-left">
          Mostrando <span className="font-medium text-gray-800 dark:text-gray-200">1</span> —{" "}
          <span className="font-medium text-gray-800 dark:text-gray-200">5</span> de{" "}
          <span className="font-medium text-gray-800 dark:text-gray-200">127</span>
        </div>
      </div>
    </div>
  );
}

function SocialProofAvatars() {
  const seeds = ["iglesia·social·1", "iglesia·social·2", "iglesia·social·3", "iglesia·social·4"];
  return (
    <div className="flex -space-x-3">
      {seeds.map((s) => (
        <div key={s} className="relative ring-2 ring-white dark:ring-[#111111]">
          <UserAvatar seed={s} size={40} />
        </div>
      ))}
    </div>
  );
}

function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-gray-100/40 to-white px-4 pb-20 pt-32 dark:from-[#111111] dark:to-[#151515] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.22fr)]">
          <div className="min-w-0">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-4 py-2 dark:bg-amber-400/10">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400/90 dark:bg-amber-300/80" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">La plataforma para pastores y líderes</span>
            </div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
              Organiza tu <span className="text-sky-700 dark:text-sky-300">iglesia</span>
              <br />y cuida a <span className="text-violet-700 dark:text-violet-300">cada persona.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              Seguimiento de miembros, cuidado pastoral y grupos organizados. Simple y efectivo desde cualquier dispositivo.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/register" className={btnPrimary}>
                Comenzar gratis
              </Link>
              <a href="#how-it-works" className={btnSecondary}>
                Ver cómo funciona
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-4 sm:gap-6">
              <SocialProofAvatars />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">+50 iglesias</span> ya usan Bernabé
              </p>
            </div>
          </div>
          <div className="relative flex w-full min-w-0 justify-center lg:justify-end">
            <div className="w-full max-w-full rounded-3xl border border-gray-200/70 bg-white/90 p-3 shadow-lg shadow-black/[0.06] dark:border-white/[0.08] dark:bg-[#181818]/95 dark:shadow-none sm:p-4">
              <LandingHeroPersonasPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
      title: "Gestión de personas",
      description: "Registra cada persona que llega a tu iglesia. Visitantes, miembros y líderes organizados.",
      iconClass: "text-sky-600/90 dark:text-sky-400/90",
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm5 15h-2v-6H9v6H7v-7.81l5-4.5 5 4.5V18z" />
        </svg>
      ),
      title: "Grupos y células",
      description: "Crea grupos por zona o afinidad. Cada líder ve su grupo y puede dar seguimiento.",
      iconClass: "text-orange-600/85 dark:text-orange-400/85",
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      ),
      title: "Seguimiento efectivo",
      description: "Asegúrate de que ningún visitante se pierda. Asigna responsables y haz seguimiento real.",
      iconClass: "text-amber-600/90 dark:text-amber-400/90",
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
        </svg>
      ),
      title: "Visión clara",
      description: "Conoce el estado de tu iglesia. Cuántas personas, grupos activos y más.",
      iconClass: "text-violet-600/90 dark:text-violet-400/90",
    },
  ];

  return (
    <section id="features" className="bg-white px-4 py-24 dark:bg-[#111111] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Todo lo que necesitas para <span className="text-sky-700 dark:text-sky-300">cuidar a tu gente</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Herramientas simples para que cada líder cuide su grupo y ninguna persona se quede sin atención.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group rounded-3xl border border-transparent bg-gray-100/40 p-6 transition-all hover:bg-gray-100/70 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
            >
              <div className={`mb-4 ${feature.iconClass}`}>{feature.icon}</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComunidadLandingSection() {
  const preview = ARTICULOS_COMUNIDAD_MOCK.slice(0, 2);

  return (
    <section
      id="comunidad"
      className="scroll-mt-24 border-y border-gray-200/60 bg-gradient-to-b from-sky-50/90 to-white px-4 py-24 dark:border-white/[0.06] dark:from-sky-950/25 dark:to-[#111111] sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800 dark:bg-sky-400/15 dark:text-sky-200">
              Dentro de Bernabé
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              <span className="font-logo-soft font-medium">Comunidad</span> para quienes{" "}
              <span className="text-sky-700 dark:text-sky-300">lideran y pastorean</span>
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              Compartí estudios, reflexiones y apoyo con otros líderes de tu red. No es otro blog genérico: está pensado para{" "}
              <strong className="font-medium text-gray-900 dark:text-white">equipos que dirigen en la iglesia local</strong>.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {CATEGORIAS_LIDERAZGO.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-sky-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-sky-900 dark:border-sky-500/25 dark:bg-white/[0.06] dark:text-sky-100"
                >
                  {cat}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/register" className={`${btnPrimary} w-full sm:w-auto`}>
                Crear cuenta y ver Comunidad
              </Link>
              <Link
                href="/login"
                className="text-center text-sm font-medium text-sky-800 underline-offset-4 hover:underline dark:text-sky-300"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-sky-400/10 blur-2xl dark:bg-sky-500/10"
              aria-hidden
            />
            <div className="relative space-y-3 rounded-2xl border border-gray-200/80 bg-white/90 p-4 shadow-lg shadow-sky-900/5 dark:border-white/[0.08] dark:bg-[#1a1a1a]/95 dark:shadow-none">
              <p className="px-1 text-xs font-medium text-gray-500 dark:text-gray-400">Vista previa del feed</p>
              {preview.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-[#2a2a2a] dark:bg-[#141414]"
                >
                  <div className="flex gap-2.5">
                    <UserAvatar seed={a.autor} size={36} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-800 dark:text-sky-200">
                          {a.categoria}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">{a.autor}</span>
                      </div>
                      <p className="mt-1 font-logo-soft text-sm font-normal leading-snug text-gray-900 dark:text-white line-clamp-2">
                        {a.titulo}
                      </p>
                      <p className="mt-1 text-xs leading-snug text-gray-600 dark:text-gray-400 line-clamp-2">{a.excerpt}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Crea tu cuenta",
      description: "Regístrate en menos de 2 minutos. Sin tarjeta de crédito.",
      seed: "onboarding·paso·1·cuenta",
    },
    {
      number: "02",
      title: "Crea tus grupos",
      description: "Organiza células, grupos de conexión y asigna líderes a cada uno.",
      seed: "onboarding·paso·2·grupos",
    },
    {
      number: "03",
      title: "Cuida a cada persona",
      description: "Registra visitantes, asigna seguimiento y ve crecer tu iglesia.",
      seed: "onboarding·paso·3·personas",
    },
  ];

  return (
    <section id="how-it-works" className="bg-gray-950 px-4 py-24 text-white dark:bg-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Comienza en <span className="text-amber-200/90">3 simples pasos</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            No necesitas ser experto en tecnología. Si puedes usar WhatsApp, puedes usar Bernabé.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="group">
              <div className="mb-6 flex flex-col items-center rounded-3xl bg-white/[0.06] px-6 pb-8 pt-10 transition-colors group-hover:bg-white/[0.09]">
                <UserAvatar seed={step.seed} size={100} className="ring-2 ring-white/15" />
                <span className="mt-6 text-5xl font-bold tabular-nums text-white/15">{step.number}</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
              <p className="text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-gray-100/50 px-4 py-24 dark:bg-white/[0.03] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Lo que dicen <span className="text-violet-700 dark:text-violet-300">nuestros usuarios</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              quote:
                "Ahora cada líder puede ver su grupo y darle seguimiento. Ya no se nos pierde nadie entre tantas personas.",
              author: "Pastor Carlos",
              church: "Iglesia Vida Nueva",
              seed: "testimonio·carlos",
            },
            {
              quote:
                "El seguimiento a visitantes cambió completamente. Antes se nos escapaban, ahora cada persona nueva tiene un responsable asignado.",
              author: "María González",
              church: "Centro Cristiano Fe",
              seed: "testimonio·maría",
            },
            {
              quote:
                "Mis líderes de célula están felices. Pueden ver sus miembros, registrar asistencia y reportar todo desde su celular.",
              author: "David Ramírez",
              church: "Iglesia Gracia",
              seed: "testimonio·david",
            },
          ].map((testimonial) => (
            <div
              key={testimonial.seed}
              className="rounded-3xl border border-gray-200/60 bg-white p-8 shadow-sm shadow-black/[0.04] transition hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.05] dark:shadow-none"
            >
              <div className="mb-4 flex items-center gap-3">
                <UserAvatar seed={testimonial.seed} size={48} />
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-5 w-5 text-amber-400/90" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="mb-6 leading-relaxed text-gray-600 dark:text-gray-300">&ldquo;{testimonial.quote}&rdquo;</p>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{testimonial.author}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.church}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="bg-white px-4 py-24 dark:bg-[#111111] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-6 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          ¿Listo para <span className="text-sky-700 dark:text-sky-300">cuidar mejor</span> a tu gente?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          Únete a más de 50 iglesias que ya usan Bernabé para organizar sus grupos, dar seguimiento y cuidar a cada persona.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/register" className={btnPrimary}>
            Comenzar gratis ahora
          </Link>
          <a href="mailto:hola@bernabe.app" className={btnSecondary}>
            Contactar ventas
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-950 px-4 py-16 dark:bg-black sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <span className="font-logo text-3xl text-white">Bernabé</span>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              La plataforma para organizar tu iglesia y cuidar a cada persona.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-400 transition hover:bg-white/20 hover:text-white"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-400 transition hover:bg-white/20 hover:text-white"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-400 transition hover:bg-white/20 hover:text-white"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Producto</h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-sm text-gray-400 transition hover:text-white">
                  Características
                </a>
              </li>
              <li>
                <a href="#comunidad" className="text-sm text-gray-400 transition hover:text-white">
                  Comunidad de líderes
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm text-gray-400 transition hover:text-white">
                  Cómo funciona
                </a>
              </li>
              <li>
                <a href="#testimonials" className="text-sm text-gray-400 transition hover:text-white">
                  Testimonios
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 transition hover:text-white">
                  Precios
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Recursos</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-gray-400 transition hover:text-white">
                  Centro de ayuda
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 transition hover:text-white">
                  Guías
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 transition hover:text-white">
                  Blog
                </a>
              </li>
              <li>
                <a href="#comunidad" className="text-sm text-gray-400 transition hover:text-white">
                  Comunidad
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                hola@bernabe.app
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                Bogotá, Colombia
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-gray-500">© 2026 Bernabé. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-gray-500 transition hover:text-white">
              Política de privacidad
            </a>
            <a href="#" className="text-sm text-gray-500 transition hover:text-white">
              Términos de servicio
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#111111]">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ComunidadLandingSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
