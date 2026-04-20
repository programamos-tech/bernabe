import Link from "next/link";
import type { ReactNode } from "react";
import { btnPrimary, btnSecondary } from "@/app/(marketing)/landing-shared";

function Check({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5 text-sm leading-snug text-gray-600 dark:text-gray-400">
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300"
        aria-hidden
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  );
}

export function LandingPropuestaAcceso() {
  return (
    <section
      id="propuesta"
      className="scroll-mt-24 border-y border-gray-200/60 bg-gradient-to-b from-gray-50/90 to-white px-4 py-20 dark:border-white/[0.06] dark:from-[#0c0c0c] dark:to-[#111111] sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Propuesta de acceso
        </p>
        <h2 className="mx-auto mt-2 max-w-3xl text-center text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          Dos caminos, una misma plataforma de seguimiento pastoral
        </h2>

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <article className="flex flex-col rounded-3xl border border-emerald-200/70 bg-emerald-50/50 p-6 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:shadow-none sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-200">
              Gratis, siempre
            </p>
            <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              Líderes individuales
            </h3>
            <p className="mt-2 text-base font-medium leading-snug text-emerald-900/90 dark:text-emerald-100/90">
              Ese es tu ministerio, tu semilla, tu distribución.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              Con tu cuenta puedes registrar personas, crear grupos ilimitados y llevar etapas, notas y último contacto
              sin topes artificiales para lo que Dios te encomendó con nombre propio.
            </p>
            <ul className="mt-5 flex flex-col gap-2.5">
              <Check>Personas y perfiles de seguimiento</Check>
              <Check>Grupos ilimitados</Check>
              <Check>Asistencia y reuniones</Check>
              <Check>Desde el celular o la computadora</Check>
            </ul>
            <Link href="/register" className={`${btnPrimary} mt-8 w-full sm:w-auto`}>
              Crear cuenta
            </Link>
          </article>

          <article className="flex flex-col rounded-3xl border border-violet-200/70 bg-violet-50/40 p-6 shadow-sm dark:border-violet-500/25 dark:bg-violet-950/20 dark:shadow-none sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-900 dark:text-violet-200">
              Para la congregación
            </p>
            <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">Iglesias</h3>
            <p className="mt-2 text-base font-medium leading-snug text-violet-900/90 dark:text-violet-100/90">
              Precio justo, accesible, sin culpa.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              Eso es lo que te permite seguir: cuando varios líderes y muchas vidas comparten el mismo hogar espiritual,
              un aporte claro y honesto sostiene el servicio para todos, sin sorpresas ni vergüenza al hablar de
              presupuesto.
            </p>
            <ul className="mt-5 flex flex-col gap-2.5">
              <Check>Mismo producto para todo el equipo</Check>
              <Check>Roles y permisos para pastores y líderes</Check>
              <Check>Escalabilidad cuando crece la iglesia</Check>
              <Check>Te explicamos números con calma, sin presión</Check>
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="mailto:hola@bernabe.app?subject=Planes%20para%20iglesia%20%28Bernab%C3%A9%29"
                className={`${btnPrimary} w-full justify-center sm:w-auto`}
              >
                Escríbenos por tu iglesia
              </a>
              <Link href="/register" className={`${btnSecondary} w-full justify-center sm:w-auto`}>
                Crear cuenta
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
