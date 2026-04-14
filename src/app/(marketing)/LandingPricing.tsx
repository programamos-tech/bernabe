"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { btnPrimary, btnSecondary } from "@/app/(marketing)/landing-shared";

/** Formato de moneda en pesos colombianos (COP). */
function formatCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}

function PricingCheck({ children }: { children: ReactNode }) {
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

/** Referencia TRM ~4.000 COP por USD (valores comerciales redondeados). */
const PRECIO_COP = {
  mes150: 80_000,
  anual150: 796_000,
  ahorroAnual150: 164_000,
  mes300: 120_000,
  anual300: 1_196_000,
  ahorroAnual300: 244_000,
} as const;

export function PricingSection() {
  return (
    <section
      id="precios"
      className="scroll-mt-24 border-y border-gray-200/60 bg-gradient-to-b from-white to-gray-50/80 px-4 py-24 dark:border-white/[0.06] dark:from-[#111111] dark:to-[#0d0d0d] sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-3 inline-flex items-center justify-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">
            Licencias
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Licencias para el cuidado de tu <span className="text-emerald-700 dark:text-emerald-400">gente en la iglesia</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Empiezas con 15 días con todo habilitado para acompañar miembros, visitantes, grupos y líderes. Los precios están en{" "}
            <strong className="font-medium text-gray-900 dark:text-gray-200">pesos colombianos (COP)</strong>.
          </p>
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-4">
          <div className="flex flex-col rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Prueba</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">15 días gratis</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Sin tarjeta para empezar.</p>
            <ul className="mt-4 flex flex-1 flex-col gap-2.5">
              <PricingCheck>Acceso completo a Bernabé Personas durante la prueba</PricingCheck>
              <PricingCheck>Grupos ilimitados</PricingCheck>
              <PricingCheck>Registro de asistencia y reuniones</PricingCheck>
              <PricingCheck>Seguimiento pastoral y estados</PricingCheck>
              <PricingCheck>Roles para pastores y líderes</PricingCheck>
            </ul>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">Al terminar, elegís un plan de pago o un plan a medida.</p>
            <Link href="/register" className={`${btnPrimary} mt-6 w-full`}>
              Empezar prueba
            </Link>
          </div>

          <div className="flex flex-col rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Iglesia pequeña</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
              {formatCop(PRECIO_COP.mes150)}
              <span className="text-base font-normal text-gray-500">/mes</span>
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">{formatCop(PRECIO_COP.anual150)}/año</span> — ahorrás{" "}
              <span className="tabular-nums">{formatCop(PRECIO_COP.ahorroAnual150)}</span> frente a 12 meses al precio mensual
            </p>
            <ul className="mt-4 flex flex-1 flex-col gap-2.5">
              <PricingCheck>
                Hasta <strong className="font-semibold text-gray-800 dark:text-gray-200">150 miembros</strong> en total (personas y líderes cuentan en el mismo tope)
              </PricingCheck>
              <PricingCheck>Grupos ilimitados</PricingCheck>
              <PricingCheck>Registro de asistencia y reuniones</PricingCheck>
              <PricingCheck>Seguimiento pastoral y estados</PricingCheck>
              <PricingCheck>Roles para pastores y líderes</PricingCheck>
            </ul>
            <Link href="/register" className={`${btnSecondary} mt-6 w-full`}>
              Elegir al registrarte
            </Link>
          </div>

          <div className="relative flex flex-col rounded-3xl border-2 border-emerald-500/35 bg-emerald-50/40 p-6 shadow-md dark:border-emerald-500/30 dark:bg-emerald-950/20">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white dark:bg-emerald-500">
              Recomendado
            </span>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Iglesia mediana</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">
              {formatCop(PRECIO_COP.mes300)}
              <span className="text-base font-normal text-gray-500 dark:text-gray-400">/mes</span>
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">{formatCop(PRECIO_COP.anual300)}/año</span> — ahorrás{" "}
              <span className="tabular-nums">{formatCop(PRECIO_COP.ahorroAnual300)}</span> frente a 12 meses al precio mensual
            </p>
            <ul className="mt-4 flex flex-1 flex-col gap-2.5">
              <PricingCheck>
                Hasta <strong className="font-semibold text-gray-800 dark:text-gray-100">300 miembros</strong> en total (personas y líderes cuentan en el mismo tope)
              </PricingCheck>
              <PricingCheck>Grupos ilimitados</PricingCheck>
              <PricingCheck>Registro de asistencia y reuniones</PricingCheck>
              <PricingCheck>Seguimiento pastoral y estados</PricingCheck>
              <PricingCheck>Roles para pastores y líderes</PricingCheck>
            </ul>
            <Link href="/register" className={`${btnPrimary} mt-6 w-full`}>
              Elegir al registrarte
            </Link>
          </div>

          <div className="flex flex-col rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Grandes redes</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">A medida</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Más de 300 miembros o necesidades especiales.</p>
            <ul className="mt-4 flex flex-1 flex-col gap-2.5">
              <PricingCheck>Límites y condiciones según tu organización</PricingCheck>
              <PricingCheck>Grupos ilimitados y funciones completas</PricingCheck>
              <PricingCheck>Facturación y documentación a convenir</PricingCheck>
              <PricingCheck>Soporte y acompañamiento dedicado</PricingCheck>
            </ul>
            <a href="mailto:hola@bernabe.app?subject=Licencia%20Bernab%C3%A9%20%28m%C3%A1s%20de%20300%20personas%29" className={`${btnSecondary} mt-6 w-full`}>
              Hablar con nosotros
            </a>
          </div>
        </div>

        <p className="text-center text-xs leading-relaxed text-gray-500 dark:text-gray-500">
          Precios referidos en COP; equivalencia orientativa con TRM cercana a $4.000 por USD. El valor final puede ajustarse según la TRM del día de facturación.
        </p>
      </div>
    </section>
  );
}
