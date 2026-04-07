"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/UserAvatar";
import { createClient } from "@/lib/supabase/client";
import {
  ARTICULOS_COMUNIDAD_MOCK,
  TEMAS_COMUNIDAD_MOCK,
  type ArticuloComunidadMock,
} from "@/lib/comunidad-articulos-mock";

function ArticuloCard({
  articulo,
  extraLikes,
  guardado,
  onToggleLike,
  onToggleSave,
}: {
  articulo: ArticuloComunidadMock;
  extraLikes: 0 | 1;
  guardado: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
}) {
  const likesMostrados = articulo.likes + extraLikes;

  const href = `/comunidad/${articulo.id}`;

  return (
    <article className="group bg-white dark:bg-[#141414] rounded-xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden hover:border-gray-200 dark:hover:border-[#3a3a3a] transition-colors">
      <Link
        href={href}
        className="block p-3.5 sm:p-4 rounded-t-xl rounded-b-none outline-none focus-visible:ring-2 focus-visible:ring-[#0ca6b2]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#141414] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-start gap-2.5 mb-2">
          <UserAvatar seed={articulo.autor} size={32} className="mt-0.5" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-sm font-medium text-[#18301d] dark:text-white truncate">{articulo.autor}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {articulo.fechaRelativa}
                <span className="mx-1">·</span>
                {articulo.tiempoLecturaMin} min
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#0ca6b2]/15 text-[#0d5c62] dark:text-[#5fd4df] border border-[#0ca6b2]/30"
                title="Eje del contenido"
              >
                {articulo.categoria}
              </span>
              {articulo.etiquetas.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <h2 className="text-base sm:text-lg font-normal text-[#18301d] dark:text-white leading-snug tracking-tight font-logo-soft mb-1.5 group-hover:underline underline-offset-2">
          {articulo.titulo}
        </h2>

        <p className="text-gray-600 dark:text-gray-400 text-sm leading-snug line-clamp-2">{articulo.excerpt}</p>
      </Link>

      <div className="px-3.5 sm:px-4 py-2 border-t border-gray-100 dark:border-[#2a2a2a] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-0.5 sm:gap-2">
          <button
            type="button"
            onClick={onToggleLike}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] hover:text-[#e64b27] transition-colors"
            aria-pressed={extraLikes === 1}
            aria-label="Me gusta"
          >
            <svg className="w-4 h-4" fill={extraLikes === 1 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
            <span className="text-xs tabular-nums">{likesMostrados}</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] hover:text-[#0ca6b2] transition-colors"
            aria-label="Comentar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
              />
            </svg>
            <span className="text-xs">
              Comentar
              {articulo.comentarios > 0 ? (
                <span className="text-gray-400 dark:text-gray-500"> · {articulo.comentarios}</span>
              ) : null}
            </span>
          </button>

          <button
            type="button"
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
            aria-label="Compartir"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
              />
            </svg>
            <span className="text-xs hidden sm:inline">Compartir</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleSave}
          className={`flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors ${
            guardado
              ? "text-[#0ca6b2] bg-[#0ca6b2]/10"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] hover:text-[#18301d] dark:hover:text-white"
          }`}
          aria-pressed={guardado}
          aria-label={guardado ? "Quitar de guardados" : "Guardar"}
        >
          <svg className="w-4 h-4" fill={guardado ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
            />
          </svg>
          <span className="text-xs font-medium">{guardado ? "Guardado" : "Guardar"}</span>
        </button>
      </div>
    </article>
  );
}

export default function Page() {
  const [userSeed, setUserSeed] = useState<string>("Usuario");
  const [extraLikesPorId, setExtraLikesPorId] = useState<Record<string, 0 | 1>>({});
  const [guardados, setGuardados] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserSeed(user?.email ?? user?.user_metadata?.full_name ?? "Usuario");
    });
  }, []);

  const toggleLike = useCallback((id: string) => {
    setExtraLikesPorId((prev) => ({
      ...prev,
      [id]: prev[id] === 1 ? 0 : 1,
    }));
  }, []);

  const toggleSave = useCallback((id: string) => {
    setGuardados((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const destacados = useMemo(() => ARTICULOS_COMUNIDAD_MOCK.slice(0, 3), []);

  return (
    <div className="px-4 py-4 md:py-5 md:px-6 min-h-[calc(100vh-4rem)] pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-3 md:mb-4">
          <h1 className="text-xl md:text-2xl font-medium text-[#18301d] dark:text-white font-logo-soft tracking-tight">Comunidad</h1>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 max-w-xl leading-snug">
            Para líderes: liderazgo, discipulado, apoyo mutuo y guía de personas.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-100 dark:border-[#2a2a2a] p-3">
              <div className="flex gap-2.5 items-center">
                <UserAvatar seed={userSeed} size={36} />
                <button
                  type="button"
                  className="flex-1 text-left px-3 py-2 bg-gray-50 dark:bg-[#252525] rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition text-sm"
                >
                  Escribí para otros líderes: discipulado, apoyo, guía pastoral…
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mr-1 shrink-0">
                  Enfocar en
                </span>
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525]"
                >
                  Liderazgo
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525]"
                >
                  Discipulado
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525]"
                >
                  Apoyo a líderes
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525]"
                >
                  Guiar personas
                </button>
              </div>
            </div>

            {ARTICULOS_COMUNIDAD_MOCK.map((articulo) => (
              <ArticuloCard
                key={articulo.id}
                articulo={articulo}
                extraLikes={(extraLikesPorId[articulo.id] ?? 0) as 0 | 1}
                guardado={!!guardados[articulo.id]}
                onToggleLike={() => toggleLike(articulo.id)}
                onToggleSave={() => toggleSave(articulo.id)}
              />
            ))}
          </div>

          <aside className="space-y-3 lg:sticky lg:top-16 self-start">
            <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 dark:border-[#2a2a2a]">
                <h3 className="text-sm font-medium text-[#18301d] dark:text-white">Temas de liderazgo</h3>
              </div>
              <ul className="p-2 space-y-0.5">
                {TEMAS_COMUNIDAD_MOCK.map((t) => (
                  <li key={t.etiqueta}>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#252525] transition"
                    >
                      <span>{t.etiqueta}</span>
                      <span className="text-xs text-gray-400 tabular-nums">{t.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 dark:border-[#2a2a2a]">
                <h3 className="text-sm font-medium text-[#18301d] dark:text-white">Lecturas destacadas</h3>
              </div>
              <ul className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {destacados.map((a, i) => (
                  <li key={a.id}>
                    <Link
                      href={`/comunidad/${a.id}`}
                      className="block w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-[#252525] transition"
                    >
                      <span className="text-[11px] font-medium text-[#0ca6b2]">{i + 1}</span>
                      <p className="mt-0.5 font-normal text-xs text-[#18301d] dark:text-white leading-snug line-clamp-2 font-logo-soft">{a.titulo}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{a.autor}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-dashed border-gray-200 dark:border-[#333] p-3 text-xs text-gray-600 dark:text-gray-400">
              <p className="font-medium text-[#18301d] dark:text-white mb-1">Eventos de la iglesia</p>
              <p className="leading-snug">
                Próximos eventos, reuniones y novedades las encontrás en{" "}
                <Link href="/home" className="text-[#0ca6b2] font-medium hover:underline">
                  Mi iglesia
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
