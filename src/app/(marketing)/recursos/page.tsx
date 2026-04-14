import Link from "next/link";
import { MarketingSiteHeader } from "@/app/(marketing)/MarketingSiteHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { ARTICULOS_COMUNIDAD_MOCK, CATEGORIAS_LIDERAZGO } from "@/lib/comunidad-articulos-mock";
import { btnPrimary, btnSecondary } from "@/app/(marketing)/landing-shared";

export const metadata = {
  title: "Recursos para pastores y líderes | Bernabé Personas",
  description:
    "Artículos y reflexiones gratuitas sobre liderazgo, discipulado y pastoreo en la iglesia local. Bernabé Personas ordena el cuidado de las personas; estos textos fortalecen a quienes dirigen.",
};

export default function RecursosPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      <MarketingSiteHeader />
      <main className="px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 inline-flex items-center justify-center rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800 dark:bg-sky-400/15 dark:text-sky-200">
            Gratis, sin cuenta
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Recursos para <span className="text-sky-700 dark:text-sky-300">pastores y líderes</span>
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
            Bernabé Personas ayuda a tu iglesia a cuidar a quienes asisten —miembros, visitantes, grupos y líderes— con seguimiento claro. Estos recursos
            complementan ese trabajo: contenido pensado para quienes pastorean y equipan en lo local. Leé y compartí sin iniciar sesión.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {CATEGORIAS_LIDERAZGO.map((cat) => (
              <span
                key={cat}
                className="rounded-full border border-sky-200/80 bg-sky-50/80 px-3 py-1 text-xs font-medium text-sky-900 dark:border-sky-500/25 dark:bg-white/[0.06] dark:text-sky-100"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-3xl space-y-4">
          {ARTICULOS_COMUNIDAD_MOCK.map((a) => (
            <article
              key={a.id}
              className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition hover:border-gray-300 dark:border-white/[0.08] dark:bg-[#161616] dark:hover:border-white/[0.12]"
            >
              <Link
                href={`/recursos/${a.id}`}
                className="block p-5 outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#161616] sm:p-6"
              >
                <div className="flex items-start gap-3">
                  <UserAvatar seed={a.autor} size={40} className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{a.autor}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {a.fechaRelativa}
                        <span className="mx-1">·</span>
                        {a.tiempoLecturaMin} min
                      </span>
                    </div>
                    <span className="mt-2 inline-block rounded-full border border-sky-200/80 bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-800 dark:border-sky-500/30 dark:text-sky-200">
                      {a.categoria}
                    </span>
                    <h2 className="mt-2 font-logo-soft text-lg font-normal leading-snug tracking-tight text-gray-900 dark:text-white sm:text-xl">
                      {a.titulo}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-2">{a.excerpt}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-700 dark:text-sky-300">
                      Leer artículo
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-xl rounded-2xl border border-gray-200/80 bg-gray-50/80 p-8 text-center dark:border-white/[0.08] dark:bg-white/[0.04]">
          <p className="text-base font-medium text-gray-900 dark:text-white">¿Querés la plataforma para tu iglesia?</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Con una cuenta accedés a personas, grupos, asistencia y, dentro de la app, la comunidad con interacciones.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/register" className={btnPrimary}>
              Prueba 15 días gratis
            </Link>
            <Link href="/" className={btnSecondary}>
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
