"use client";

import { UserAvatar } from "@/components/UserAvatar";

const ROLES: {
  title: string;
  description: string;
  seed: string;
  sexo: "masculino" | "femenino";
}[] = [
  {
    title: "Pastoral de jóvenes",
    description: "Adolescentes y jóvenes con nombre, etapa y último contacto: menos improvisación, más cercanía.",
    seed: "bernabe·rol·jóvenes",
    sexo: "masculino",
  },
  {
    title: "Liderazgo de alabanza",
    description: "Quienes sirven en el equipo, con seguimiento claro sin depender de chats perdidos o hojas sueltas.",
    seed: "bernabe·rol·alabanza",
    sexo: "femenino",
  },
  {
    title: "Líder de comunidad o célula",
    description: "Las personas que te tocan a ti, en un solo lugar: visitantes, nuevos y consolidados.",
    seed: "bernabe·rol·célula",
    sexo: "femenino",
  },
  {
    title: "Mentoría y discipulado",
    description: "Acompaña discípulos y nuevos creyentes con contexto compartido cuando hace falta coordinar con otros.",
    seed: "bernabe·rol·mentor",
    sexo: "masculino",
  },
];

export function ParaLideresSection() {
  return (
    <section
      id="para-lideres"
      className="scroll-mt-24 border-y border-gray-200/60 bg-gradient-to-b from-white to-sky-50/40 px-4 py-24 dark:border-white/[0.06] dark:from-[#111111] dark:to-sky-950/20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-3 inline-flex items-center justify-center rounded-full bg-sky-500/12 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-900 dark:bg-sky-400/15 dark:text-sky-200">
            Para líderes
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Una plataforma sencilla para quienes{" "}
            <span className="text-sky-700 dark:text-sky-300">cuidan personas</span>, en cada rol de la iglesia
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Bernabé está pensado para que{" "}
            <strong className="font-medium text-gray-900 dark:text-gray-200">cada líder</strong> lleve el cuidado de
            sus personas con claridad: quien dirige jóvenes, alabanza, una comunidad, y así sucesivamente. El acceso
            individual es gratuito; cuando la iglesia entera camina junta, el sostenimiento se platica con{" "}
            <strong className="font-medium text-gray-900 dark:text-gray-200">precio justo y sin culpa</strong>.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {ROLES.map((r) => (
            <div
              key={r.seed}
              className="flex gap-4 rounded-3xl border border-gray-200/80 bg-white/90 p-5 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-none sm:p-6"
            >
              <UserAvatar seed={r.seed} sexo={r.sexo} size={52} className="shrink-0 ring-2 ring-sky-100 dark:ring-sky-900/40" />
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{r.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
