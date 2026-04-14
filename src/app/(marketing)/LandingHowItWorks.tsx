"use client";

import { GrupoAvatarCluster } from "@/components/GrupoAvatarCluster";
import { UserAvatar } from "@/components/UserAvatar";

/** Vista previa estática: Mi cuenta (como /cuenta). */
function LandingStepCuentaPreview() {
  return (
    <div
      className="pointer-events-none select-none space-y-2 p-0.5 text-left"
      role="img"
      aria-label="Vista previa: pantalla Mi cuenta con perfil, pestañas y datos personales."
    >
      <div>
        <h2 className="text-sm font-medium text-gray-900 dark:text-white font-logo-soft tracking-tight">Mi cuenta</h2>
        <p className="text-[9px] font-normal text-gray-600 dark:text-gray-400">Administra tu perfil y la configuración de tu iglesia.</p>
      </div>
      <div className="rounded-2xl bg-gray-100/80 p-2.5 dark:bg-white/[0.04]">
        <div className="flex items-center gap-2">
          <UserAvatar seed="pastor·cuenta·landing" size={44} className="ring-2 ring-gray-200 dark:ring-white/10" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">Andrew Ruz</p>
            <p className="truncate text-[9px] text-gray-500 dark:text-gray-400">pastor@iglesia.org</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="rounded-full bg-violet-100 px-1.5 py-px text-[8px] font-medium text-violet-800 dark:bg-violet-500/12 dark:text-violet-200">
                Pastor principal
              </span>
              <span className="text-[8px] text-gray-500 dark:text-gray-500">Miembro desde 2024</span>
            </div>
          </div>
        </div>
      </div>
      <div className="scrollbar-brand -mx-0.5 flex gap-2 overflow-x-auto border-b border-gray-200 pb-1.5 text-[9px] font-medium text-gray-500 dark:border-white/10">
        <span className="shrink-0 border-b-2 border-gray-900 pb-1 text-gray-900 dark:border-white dark:text-white">Mi perfil</span>
        <span className="shrink-0 pb-1 text-gray-400 dark:text-gray-500">Mi iglesia</span>
        <span className="shrink-0 pb-1 text-gray-400 dark:text-gray-500">Seguridad</span>
      </div>
      <div>
        <p className="text-[9px] font-semibold text-gray-900 dark:text-white">Información personal</p>
        <div className="mt-1 space-y-1">
          <div className="h-5 rounded-lg border border-gray-200 bg-gray-50 px-2 text-[9px] leading-5 text-gray-500 dark:border-white/10 dark:bg-white/[0.04]">
            Nombre completo
          </div>
          <div className="h-5 rounded-lg border border-gray-200 bg-gray-50 px-2 text-[9px] leading-5 text-gray-500 dark:border-white/10 dark:bg-white/[0.04]">
            Teléfono
          </div>
        </div>
      </div>
    </div>
  );
}

/** Vista previa estática: detalle de grupo (como /grupos/[id]). */
function LandingStepGrupoDetallePreview() {
  return (
    <div
      className="pointer-events-none select-none space-y-2 p-0.5 text-left"
      role="img"
      aria-label="Vista previa: detalle de grupo con avatares, estado y estadísticas de miembros."
    >
      <div className="relative rounded-xl bg-gray-100/50 p-2 dark:bg-white/[0.04]">
        <div className="absolute left-1.5 top-1.5 text-gray-500 dark:text-gray-400" aria-hidden>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </div>
        <div className="flex flex-col items-center pt-2">
          <div className="flex min-h-[4.5rem] items-center justify-center">
            <GrupoAvatarCluster nombreGrupo="Zona Norte" sizeCenter={48} sizeSide={28} />
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-1">
            <span className="rounded-full bg-white/80 px-2 py-px text-[8px] font-normal text-gray-700 shadow-sm dark:bg-white/10 dark:text-gray-300 dark:shadow-none">
              Jóvenes
            </span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-px text-[8px] font-medium text-emerald-800 dark:text-emerald-200">
              <span className="h-1 w-1 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Activo
            </span>
          </div>
          <h3 className="mt-1 text-center text-sm font-semibold tracking-tight text-gray-900 dark:text-white">Zona Norte</h3>
          <p className="mt-0.5 line-clamp-2 text-center text-[9px] text-gray-500 dark:text-gray-400">Encuentro semanal y seguimiento pastoral.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="rounded-xl bg-gray-100/40 p-1.5 dark:bg-white/[0.04]">
          <p className="text-base font-semibold tabular-nums text-gray-900 dark:text-white">12</p>
          <p className="text-[8px] text-gray-500 dark:text-gray-400">Personas</p>
        </div>
        <div className="rounded-xl bg-gray-100/40 p-1.5 dark:bg-white/[0.04]">
          <p className="text-base font-semibold tabular-nums text-gray-900 dark:text-white">24</p>
          <p className="text-[8px] text-gray-500 dark:text-gray-400">Asistencia</p>
        </div>
        <div className="rounded-xl bg-gray-100/40 p-1.5 dark:bg-white/[0.04]">
          <p className="text-base font-semibold tabular-nums text-gray-900 dark:text-white">4</p>
          <p className="text-[8px] text-gray-500 dark:text-gray-400">Reuniones/mes</p>
        </div>
      </div>
    </div>
  );
}

/** Vista previa estática: detalle de persona (como /personas/[id]). */
function LandingStepPersonaDetallePreview() {
  return (
    <div
      className="pointer-events-none select-none space-y-2 p-0.5 text-left"
      role="img"
      aria-label="Vista previa: perfil de miembro con cabecera, grupo y acciones."
    >
      <div className="rounded-2xl bg-gray-100/50 p-2.5 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-2.5">
            <div className="shrink-0 rounded-full bg-white/80 p-0.5 shadow-sm ring-1 ring-black/[0.04] dark:bg-white/[0.08] dark:ring-white/[0.08]">
              <UserAvatar seed="María·Elena·paso·a·paso" size={52} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">María Elena Vásquez</h3>
                <span className="rounded-full bg-gray-200/90 px-2 py-0.5 text-[8px] font-medium text-gray-800 dark:bg-white/[0.12] dark:text-gray-200">
                  Miembro
                </span>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[8px] font-medium text-emerald-800 dark:text-emerald-200">
                  <span className="h-1 w-1 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  Activo
                </span>
              </div>
              <p className="mt-0.5 text-[9px] text-gray-500 dark:text-gray-400">
                Grupo: Zona Norte <span className="mx-1">·</span> Miembro desde ene 2024
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 justify-end sm:flex-col sm:items-end">
            <div className="flex gap-0.5">
              <span className="rounded-full p-1 text-gray-500 dark:text-gray-400">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
              </span>
              <span className="rounded-full p-1 text-gray-500 dark:text-gray-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-gray-100/40 p-2 dark:bg-white/[0.04]">
        <p className="text-[9px] font-semibold text-gray-900 dark:text-white">Información personal</p>
        <div className="mt-1 grid grid-cols-2 gap-1">
          <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-1.5 py-1 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-[8px] text-gray-500">Documento ID</p>
            <p className="text-[9px] font-medium text-gray-600 dark:text-gray-400">V-12.345.678</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-1.5 py-1 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="text-[8px] text-gray-500">Teléfono</p>
            <p className="text-[9px] font-medium text-gray-600 dark:text-gray-400">+58 424-1122334</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Tu cuenta y tu iglesia",
      description:
        "Regístrate en minutos, activa la prueba de 15 días con todo habilitado y deja lista la base para que tu equipo pueda cuidar personas con orden y confianza.",
      preview: <LandingStepCuentaPreview />,
    },
    {
      number: "02",
      title: "Cada grupo con su detalle",
      description: "Cada comunidad con contexto: estado, estadísticas y miembros visibles para que el liderazgo acompañe, no solo coordine.",
      preview: <LandingStepGrupoDetallePreview />,
    },
    {
      number: "03",
      title: "El perfil de cada persona",
      description: "Desde el perfil: contacto, grupo, estado e información para un seguimiento pastoral concreto, persona por persona.",
      preview: <LandingStepPersonaDetallePreview />,
    },
  ];

  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-y border-gray-200/60 bg-gradient-to-b from-gray-50 to-white px-4 py-24 dark:border-white/[0.06] dark:from-zinc-950 dark:to-zinc-950 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Comienza en <span className="text-amber-700 dark:text-amber-200/90">3 simples pasos</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            El foco es el cuidado en la iglesia, no la técnica. Si puedes usar WhatsApp, puedes usar Bernabé Personas.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step) => (
            <div key={step.number} className="group">
              <div className="relative mb-6 min-h-[15rem] overflow-hidden rounded-2xl border border-gray-200/90 bg-gradient-to-b from-white to-gray-100/60 p-1.5 shadow-sm transition-colors dark:border-white/10 dark:from-white/[0.07] dark:to-white/[0.02] dark:shadow-inner group-hover:border-gray-300 dark:group-hover:border-white/15">
                <span
                  className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 select-none text-7xl font-black tabular-nums text-gray-200/90 dark:text-white/[0.06]"
                  aria-hidden
                >
                  {step.number}
                </span>
                <div className="relative min-h-[13.5rem] rounded-xl bg-white p-3 shadow-md shadow-gray-200/40 ring-1 ring-gray-200/80 dark:bg-[#0c0c0c] dark:shadow-lg dark:shadow-black/40 dark:ring-white/5">
                  {step.preview}
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
