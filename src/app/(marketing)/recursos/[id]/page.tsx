import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingSiteHeader } from "@/app/(marketing)/MarketingSiteHeader";
import { UserAvatar } from "@/components/UserAvatar";
import { btnPrimary, btnSecondary } from "@/app/(marketing)/landing-shared";
import {
  getArticuloComunidadById,
  getArticulosRecomendados,
  type ArticuloComunidadMock,
} from "@/lib/comunidad-articulos-mock";

type PageProps = {
  params: { id: string };
};

function FilaRecomendada({ a }: { a: ArticuloComunidadMock }) {
  return (
    <li>
      <Link
        href={`/recursos/${a.id}`}
        className="group flex gap-3 p-3.5 outline-none transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500/40 dark:hover:bg-white/[0.04]"
      >
        <UserAvatar seed={a.autor} size={36} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {a.autor}
            <span className="mx-1">·</span>
            {a.tiempoLecturaMin} min
          </p>
          <span className="mt-1 inline-block rounded border border-sky-200/80 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800 dark:border-sky-500/30 dark:text-sky-200">
            {a.categoria}
          </span>
          <p className="mt-1 font-logo-soft text-sm font-normal leading-snug text-gray-900 line-clamp-2 transition-colors group-hover:text-sky-700 dark:text-white dark:group-hover:text-sky-300">
            {a.titulo}
          </p>
          <p className="text-[11px] leading-relaxed text-gray-600 line-clamp-2 dark:text-gray-400">{a.excerpt}</p>
        </div>
      </Link>
    </li>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const articulo = getArticuloComunidadById(params.id);
  if (!articulo) return { title: "Artículo | Bernabé" };
  return {
    title: `${articulo.titulo} | Recursos Bernabé`,
    description: articulo.excerpt,
  };
}

export default function RecursoArticuloPage({ params }: PageProps) {
  const articulo = getArticuloComunidadById(params.id);
  if (!articulo) notFound();

  const recomendados = getArticulosRecomendados(articulo.id);

  const parrafos = articulo.contenido
    .trim()
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      <MarketingSiteHeader />
      <main className="px-4 pb-24 pt-24 md:px-6">
        <div className="mx-auto max-w-7xl">
          <nav className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/recursos" className="font-medium text-sky-700 hover:underline dark:text-sky-300">
              Recursos
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span className="line-clamp-1 text-gray-600 dark:text-gray-300">{articulo.titulo}</span>
          </nav>

          <div className="grid items-start gap-8 lg:grid-cols-3 lg:gap-10">
            <article className="min-w-0 lg:col-span-2">
              <header className="mb-8">
                <div className="mb-4 flex items-start gap-3">
                  <UserAvatar seed={articulo.autor} size={48} />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">{articulo.autor}</p>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {articulo.fechaRelativa}
                      <span className="mx-1.5">·</span>
                      {articulo.tiempoLecturaMin} min de lectura
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-sky-200/80 bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-800 dark:border-sky-500/30 dark:text-sky-200">
                        {articulo.categoria}
                      </span>
                      {articulo.etiquetas.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/[0.08] dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <h1 className="font-logo-soft text-2xl font-normal leading-tight tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                  {articulo.titulo}
                </h1>
              </header>

              <div className="space-y-4">
                {parrafos.map((bloque, i) => (
                  <p key={i} className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
                    {bloque}
                  </p>
                ))}
              </div>

              <div className="mt-10 rounded-2xl border border-gray-200/80 bg-gray-50/80 p-6 dark:border-white/[0.08] dark:bg-white/[0.04]">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Este contenido es <strong className="text-gray-900 dark:text-white">gratuito y abierto</strong>. Si creás una cuenta en Bernabé, además
                  podés usar la plataforma para tu iglesia y participar en la comunidad dentro de la app (me gusta, comentarios y más).
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Link href="/register" className={`${btnPrimary} w-full justify-center sm:w-auto`}>
                    Crear cuenta (prueba 15 días)
                  </Link>
                  <Link href="/recursos" className={`${btnSecondary} w-full justify-center sm:w-auto`}>
                    Ver más recursos
                  </Link>
                </div>
              </div>
            </article>

            <aside className="space-y-4 lg:sticky lg:top-24">
              {recomendados.length > 0 ? (
                <div
                  className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#161616]"
                  aria-labelledby="recomendados-heading"
                >
                  <div className="border-b border-gray-200/80 px-4 py-2.5 dark:border-white/[0.08]">
                    <h2 id="recomendados-heading" className="font-logo-soft text-sm font-medium tracking-tight text-gray-900 dark:text-white">
                      Más recursos
                    </h2>
                  </div>
                  <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                    {recomendados.map((a) => (
                      <FilaRecomendada key={a.id} a={a} />
                    ))}
                  </ul>
                </div>
              ) : null}
              <Link
                href="/recursos"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200/80 bg-white px-4 py-3.5 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 dark:border-white/[0.08] dark:bg-[#161616] dark:text-white dark:hover:bg-white/[0.06]"
              >
                Todos los artículos
                <svg className="h-4 w-4 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
