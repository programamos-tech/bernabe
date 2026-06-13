"use client";

import Link from "next/link";
import { HowItWorksSection } from "@/app/(marketing)/LandingHowItWorks";
import { MarketingSiteHeader } from "@/app/(marketing)/MarketingSiteHeader";
import { ParaLideresSection } from "@/app/(marketing)/LandingParaLideres";
import { btnPrimaryFull, btnSecondaryFull, marketingCta } from "@/app/(marketing)/landing-shared";
import { BernabeLogo } from "@/components/BernabeLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { ETAPA_LABELS, type EtapaPersonaDb, etapaDotClass } from "@/lib/persona-etapa";

const LANDING_PERSONAS_DEMO: { nombre: string; telefono: string; grupo: string; etapa: EtapaPersonaDb; contacto: string }[] =
  [
    {
      nombre: "María Elena Vásquez",
      telefono: "+58 424-1122334",
      grupo: "Zona Norte",
      etapa: "consolidado",
      contacto: "28 mar 2025",
    },
    {
      nombre: "Carlos Rivas",
      telefono: "+58 414-9988776",
      grupo: "Sin asignar",
      etapa: "visitante",
      contacto: "30 mar 2025",
    },
    {
      nombre: "Ana Lucía Méndez",
      telefono: "+58 412-5544332",
      grupo: "Jóvenes",
      etapa: "bautizado",
      contacto: "27 mar 2025",
    },
    {
      nombre: "Roberto Díaz",
      telefono: "+58 426-2211009",
      grupo: "Matrimonios",
      etapa: "consolidado",
      contacto: "25 mar 2025",
    },
    {
      nombre: "Luisa Herrera",
      telefono: "+58 424-6677881",
      grupo: "Intercesión",
      etapa: "en_servicio",
      contacto: "22 mar 2025",
    },
  ];

function LandingHeroPersonasPreview() {
  return (
    <div
      className="pointer-events-none select-none"
      role="img"
      aria-label="Vista previa de la pantalla Personas en Bernabé: tabla para el cuidado de personas, con nombre, grupo, etapa y último contacto."
    >
      <div className="mb-3 min-w-0">
        <h2 className="text-base font-medium text-[#18301d] dark:text-white font-logo-soft tracking-tight sm:text-lg">Personas</h2>
        <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 leading-snug">
          Las personas a las que tú y tu equipo dan seguimiento, su grupo y cuándo fue el último cuidado.
        </p>
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
          Todas las etapas
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
                  Etapa
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
                        className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full sm:mt-0 ${etapaDotClass[row.etapa]}`}
                      />
                      <span className="min-w-0 break-words leading-tight text-gray-700 dark:text-gray-300">
                        {ETAPA_LABELS[row.etapa]}
                      </span>
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
        <div key={s} className="relative">
          <UserAvatar seed={s} size={40} className="!ring-0 shadow-none" />
        </div>
      ))}
    </div>
  );
}

function HeroSection() {
  return (
    <section className="flex min-h-dvh flex-col bg-gradient-to-b from-gray-100/40 to-white px-4 pb-12 pt-24 dark:from-[#111111] dark:to-[#151515] sm:px-6 sm:pb-16 sm:pt-28 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.22fr)] lg:gap-12">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
              Cuida sin perder de vista a nadie.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
              Para líderes que pastorean ovejas: cada persona que acompañas, con seguimiento claro en un solo lugar,
              desde el celular o la computadora.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/register" className={btnPrimaryFull}>
                {marketingCta.start}
              </Link>
              <a href="#how-it-works" className={btnSecondaryFull}>
                {marketingCta.howItWorks}
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-4 sm:gap-6">
              <SocialProofAvatars />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">Menos listas sueltas</span>, más personas
                vistas.
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

function CTASection() {
  return (
    <section className="bg-white px-4 py-24 dark:bg-[#111111] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-6 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          ¿Quieres que <span className="text-sky-700 dark:text-sky-300">ninguna persona se pierda</span> en tu ministerio?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          Empieza a registrar a quienes pastoreas con seguimiento sencillo, oveja por oveja. Si varios líderes
          acompañan el mismo rebaño, puedes invitarlos cuando esté listo.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register" className={btnPrimaryFull}>
            {marketingCta.start}
          </Link>
          <a href="#how-it-works" className={btnSecondaryFull}>
            {marketingCta.howItWorks}
          </a>
        </div>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          ¿Dudas o sugerencias para líderes?{" "}
          <a
            href="mailto:andrewjruss7@gmail.com?subject=Bernab%C3%A9%20%28cuidado%20y%20seguimiento%29"
            className="font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
          >
            Escríbeme a andrewjruss7@gmail.com
          </a>
          .
        </p>
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
            <Link
              href="/"
              className="group inline-flex max-w-full flex-col items-start gap-1.5 leading-none"
              aria-label="Bernabé. Cuida sin perder de vista a nadie."
            >
              <BernabeLogo variant="footer" />
              <span className="max-w-[14rem] text-[9px] font-medium leading-tight tracking-wide text-gray-400 sm:max-w-none sm:text-[10px]">
                Cuida sin perder de vista a nadie
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              Herramienta sencilla para líderes: cada persona, su grupo y el próximo paso de cuidado en un solo lugar.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a
                href="https://instagram.com/andrewjruss7"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-400 transition hover:bg-white/20 hover:text-white"
                aria-label="Instagram de Andrew Russ (@andrewjruss7)"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://wa.me/573152802343"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-400 transition hover:bg-white/20 hover:text-white"
                aria-label="WhatsApp de Andrew Russ"
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
                <a href="#para-lideres" className="text-sm text-gray-400 transition hover:text-white">
                  Para líderes
                </a>
              </li>
              <li>
                <Link href="/recursos" className="text-sm text-gray-400 transition hover:text-white">
                  Recursos
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm text-gray-400 transition hover:text-white">
                  Cómo funciona
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
                <Link href="/recursos" className="text-sm text-gray-400 transition hover:text-white">
                  Recursos
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Contacto</h4>
            <ul className="space-y-3">
              <li className="text-sm text-gray-400">
                <span className="font-medium text-gray-300">Andrew Russ</span>
              </li>
              <li>
                <a
                  href="mailto:andrewjruss7@gmail.com"
                  className="flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
                >
                  <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  andrewjruss7@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/573152802343"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
                >
                  <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  +57 315 280 2343
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                Medellín, Colombia
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <div className="flex flex-col items-center gap-1 text-center md:items-start md:text-left">
            <p className="text-sm text-gray-500">© 2026 Bernabé. Todos los derechos reservados.</p>
            <p className="text-sm text-gray-500">
              Medellín, Colombia · By{" "}
              <a
                href="https://instagram.com/andrewjruss7"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-400 transition hover:text-white"
              >
                Andrew Russ
              </a>
              {" · "}
              <a
                href="https://wa.me/573152802343"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition hover:text-white"
              >
                WhatsApp
              </a>
            </p>
          </div>
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
      <MarketingSiteHeader />
      <HeroSection />
      <HowItWorksSection />
      <ParaLideresSection />
      <CTASection />
      <Footer />
    </main>
  );
}
