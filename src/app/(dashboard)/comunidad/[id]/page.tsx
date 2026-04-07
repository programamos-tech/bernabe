import Link from "next/link";
import { notFound } from "next/navigation";
import { UserAvatar } from "@/components/UserAvatar";
import {
  getArticuloComunidadById,
  getArticulosRecomendados,
  type ArticuloComunidadMock,
} from "@/lib/comunidad-articulos-mock";
import { ArticuloAcciones } from "./ArticuloAcciones";

type PageProps = {
  params: { id: string };
};

function FilaRecomendada({ a }: { a: ArticuloComunidadMock }) {
  return (
    <li>
      <Link
        href={`/comunidad/${a.id}`}
        className="group flex gap-3 p-3.5 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0ca6b2]/40"
      >
        <UserAvatar seed={a.autor} size={36} className="shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {a.autor}
            <span className="mx-1">·</span>
            {a.tiempoLecturaMin} min
          </p>
          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0ca6b2]/15 text-[#0d5c62] dark:text-[#5fd4df] border border-[#0ca6b2]/30">
            {a.categoria}
          </span>
          <p className="font-logo-soft text-sm font-normal text-[#18301d] dark:text-white leading-snug line-clamp-2 group-hover:text-[#0ca6b2] transition-colors mt-1">
            {a.titulo}
          </p>
          <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">{a.excerpt}</p>
        </div>
      </Link>
    </li>
  );
}

export default function ArticuloComunidadPage({ params }: PageProps) {
  const articulo = getArticuloComunidadById(params.id);
  if (!articulo) notFound();

  const recomendados = getArticulosRecomendados(articulo.id);

  const parrafos = articulo.contenido
    .trim()
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="px-4 py-4 md:py-5 md:px-6 min-h-[calc(100vh-4rem)] pb-32 md:pb-20 lg:pb-28">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 items-start pb-8 md:pb-12">
          <div className="lg:col-span-2 min-w-0">
            <header className="mb-8">
              <div className="flex items-start gap-3 mb-4">
                <UserAvatar seed={articulo.autor} size={48} />
                <div className="min-w-0">
                  <p className="font-medium text-[#18301d] dark:text-white">{articulo.autor}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {articulo.fechaRelativa}
                    <span className="mx-1.5">·</span>
                    {articulo.tiempoLecturaMin} min de lectura
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0ca6b2]/15 text-[#0d5c62] dark:text-[#5fd4df] border border-[#0ca6b2]/30">
                      {articulo.categoria}
                    </span>
                    {articulo.etiquetas.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl leading-tight font-logo-soft font-normal text-[#18301d] dark:text-white tracking-tight">
                {articulo.titulo}
              </h1>
            </header>

            <div className="space-y-4">
              {parrafos.map((bloque, i) => (
                <p key={i} className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                  {bloque}
                </p>
              ))}
            </div>

            <ArticuloAcciones likesBase={articulo.likes} comentarios={articulo.comentarios} />
          </div>

          <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-16 self-start w-full">
            {recomendados.length > 0 ? (
              <div
                className="rounded-xl border border-gray-100 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] overflow-hidden"
                aria-labelledby="recomendados-heading"
              >
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-[#2a2a2a]">
                  <h2
                    id="recomendados-heading"
                    className="text-sm font-medium text-[#18301d] dark:text-white font-logo-soft tracking-tight"
                  >
                    Artículos recomendados
                  </h2>
                </div>
                <ul className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                  {recomendados.map((a) => (
                    <FilaRecomendada key={a.id} a={a} />
                  ))}
                </ul>
              </div>
            ) : null}

            <Link
              href="/comunidad"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] px-4 py-3.5 text-sm font-medium text-[#18301d] dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
            >
              Leer más artículos
              <svg className="w-4 h-4 text-[#0ca6b2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
