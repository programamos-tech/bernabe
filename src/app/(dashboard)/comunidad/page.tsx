"use client";

import { useCallback, useEffect, useState } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { BTN_FICHA_PRIMARIO } from "@/app/(dashboard)/personas/[id]/_lib/persona-detail-buttons";
import { createClient } from "@/lib/supabase/client";
import {
  compartirVictoria,
  fetchVictoriaSugerencias,
  fetchVictoriasFeed,
  formatVictoriaRelativa,
  PLANTILLAS_VICTORIA_MANUAL,
  REACCION_LABELS,
  REACCION_TIPOS,
  toggleVictoriaReaccion,
  type ReaccionTipo,
  type VictoriaFeedItem,
  type VictoriaSugerencia,
} from "@/lib/comunidad-victorias";

function VictoriaSugeridaCard({
  sugerencia,
  compartiendo,
  onCompartir,
  onDescartar,
}: {
  sugerencia: VictoriaSugerencia;
  compartiendo: boolean;
  onCompartir: () => void;
  onDescartar: () => void;
}) {
  return (
    <div className="shrink-0 w-[min(100%,280px)] snap-start rounded-xl border border-gray-200 bg-gray-50 p-3.5 dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Tu victoria esta semana
      </p>
      <p className="mt-1.5 text-sm font-medium text-[#18301d] dark:text-white leading-snug">{sugerencia.titulo}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={compartiendo}
          onClick={onCompartir}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${BTN_FICHA_PRIMARIO}`}
        >
          {compartiendo ? "Compartiendo…" : "Compartir"}
        </button>
        <button
          type="button"
          disabled={compartiendo}
          onClick={onDescartar}
          className="rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-white/60 dark:text-gray-300 dark:hover:bg-white/5 transition"
        >
          Ahora no
        </button>
      </div>
    </div>
  );
}

function VictoriaFeedCard({
  item,
  onReaccion,
  reaccionando,
}: {
  item: VictoriaFeedItem;
  onReaccion: (tipo: ReaccionTipo) => void;
  reaccionando: string | null;
}) {
  const totalReacciones = REACCION_TIPOS.reduce((n, t) => n + item.reacciones[t], 0);

  return (
    <article className="rounded-xl border border-gray-100 bg-white dark:border-[#2a2a2a] dark:bg-[#141414] overflow-hidden">
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start gap-2.5">
          <UserAvatar seed={item.autorAvatarSeed} size={40} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-sm font-medium text-[#18301d] dark:text-white">{item.autorNombre}</p>
              {item.autorCiudad ? (
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.autorCiudad}</p>
              ) : null}
              <p className="text-[11px] text-gray-400 dark:text-gray-500">{formatVictoriaRelativa(item.createdAt)}</p>
            </div>
            <p className="mt-2 text-sm sm:text-base text-[#18301d] dark:text-white leading-snug">{item.titulo}</p>
          </div>
        </div>
      </div>

      <div className="px-3.5 sm:px-4 py-2 border-t border-gray-100 dark:border-[#2a2a2a] flex flex-wrap items-center gap-1.5">
        {REACCION_TIPOS.map((tipo) => {
          const count = item.reacciones[tipo];
          const activa = item.misReacciones.includes(tipo);
          const busy = reaccionando === `${item.id}:${tipo}`;
          return (
            <button
              key={tipo}
              type="button"
              disabled={!!reaccionando}
              onClick={() => onReaccion(tipo)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                activa
                  ? "bg-gray-900/10 text-gray-900 ring-1 ring-gray-900/20 dark:bg-white/10 dark:text-white dark:ring-white/20"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-[#252525]"
              } ${busy ? "opacity-60" : ""}`}
              aria-pressed={activa}
            >
              {REACCION_LABELS[tipo]}
              {count > 0 ? <span className="tabular-nums text-gray-500 dark:text-gray-400">{count}</span> : null}
            </button>
          );
        })}
        {totalReacciones === 0 ? (
          <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500">Animá a un líder</span>
        ) : null}
      </div>
    </article>
  );
}

export default function ComunidadVictoriasPage() {
  const [sugerencias, setSugerencias] = useState<VictoriaSugerencia[]>([]);
  const [feed, setFeed] = useState<VictoriaFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [compartiendoTipo, setCompartiendoTipo] = useState<string | null>(null);
  const [reaccionando, setReaccionando] = useState<string | null>(null);
  const [manualTexto, setManualTexto] = useState("");
  const [manualAbierto, setManualAbierto] = useState(false);
  const [userAvatarSeed, setUserAvatarSeed] = useState("Usuario");
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sug, items] = await Promise.all([fetchVictoriaSugerencias(), fetchVictoriasFeed()]);
      setSugerencias(sug);
      setFeed(items);
    } catch {
      setError("No pudimos cargar la comunidad. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const name = profile?.full_name ?? meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "Usuario";
      setUserAvatarSeed(user.email ?? name);
    });
  }, []);

  const handleCompartirSugerencia = async (s: VictoriaSugerencia) => {
    setCompartiendoTipo(s.tipo);
    setError(null);
    const res = await compartirVictoria({
      tipo: s.tipo,
      titulo: s.titulo,
      metricValue: s.metricValue,
    });
    setCompartiendoTipo(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSugerencias((prev) => prev.filter((x) => x.tipo !== s.tipo));
    await recargar();
  };

  const handleCompartirManual = async () => {
    const titulo = manualTexto.trim();
    if (!titulo) return;
    setCompartiendoTipo("manual");
    setError(null);
    const res = await compartirVictoria({ tipo: "manual", titulo });
    setCompartiendoTipo(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setManualTexto("");
    setManualAbierto(false);
    await recargar();
  };

  const handleReaccion = async (victoriaId: string, tipo: ReaccionTipo) => {
    const key = `${victoriaId}:${tipo}`;
    setReaccionando(key);
    await toggleVictoriaReaccion(victoriaId, tipo);
    setReaccionando(null);
    await recargar();
  };

  const descartarSugerencia = (tipo: string) => {
    setSugerencias((prev) => prev.filter((s) => s.tipo !== tipo));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-24 md:pb-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-medium text-[#18301d] dark:text-white tracking-tight">Comunidad</h1>
        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 leading-snug">
          Victorias de líderes que pastorean con fidelidad. Celebrá y animá a quienes cuidan su rebaño.
        </p>
      </div>

      {error ? (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {sugerencias.length > 0 ? (
        <section className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Listas para compartir
          </h2>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1 scrollbar-thin">
            {sugerencias.map((s) => (
              <VictoriaSugeridaCard
                key={s.tipo}
                sugerencia={s}
                compartiendo={compartiendoTipo === s.tipo}
                onCompartir={() => void handleCompartirSugerencia(s)}
                onDescartar={() => descartarSugerencia(s.tipo)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-4">
        <div className="rounded-xl border border-gray-100 bg-white dark:border-[#2a2a2a] dark:bg-[#141414] p-3">
          <div className="flex gap-2.5 items-start">
            <UserAvatar seed={userAvatarSeed} size={36} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              {!manualAbierto ? (
                <button
                  type="button"
                  onClick={() => setManualAbierto(true)}
                  className="w-full text-left px-3 py-2.5 bg-gray-50 dark:bg-[#252525] rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition text-sm"
                >
                  Compartí una victoria con otros líderes…
                </button>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={manualTexto}
                    onChange={(e) => setManualTexto(e.target.value.slice(0, 200))}
                    rows={3}
                    placeholder="Ej.: Esta semana pastoreé con fidelidad…"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300/40 dark:border-white/10 dark:bg-[#252525] dark:text-white dark:placeholder:text-gray-500 resize-none"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {PLANTILLAS_VICTORIA_MANUAL.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setManualTexto(t)}
                        className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 hover:bg-gray-50 dark:border-[#333] dark:text-gray-300 dark:hover:bg-[#252525] transition text-left max-w-full truncate"
                      >
                        {t.length > 42 ? `${t.slice(0, 42)}…` : t}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!manualTexto.trim() || compartiendoTipo === "manual"}
                      onClick={() => void handleCompartirManual()}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50 ${BTN_FICHA_PRIMARIO}`}
                    >
                      {compartiendoTipo === "manual" ? "Compartiendo…" : "Compartir victoria"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setManualAbierto(false);
                        setManualTexto("");
                      }}
                      className="rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525]"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Victorias recientes
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl border border-gray-100 bg-white animate-pulse dark:border-[#2a2a2a] dark:bg-[#141414]"
              />
            ))}
          </div>
        ) : feed.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-[#333] p-8 text-center">
            <p className="text-sm font-medium text-[#18301d] dark:text-white">Aún no hay victorias compartidas</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Sé el primero en celebrar tu trabajo pastoral con otros líderes de Bernabé.
            </p>
          </div>
        ) : (
          feed.map((item) => (
            <VictoriaFeedCard
              key={item.id}
              item={item}
              reaccionando={reaccionando}
              onReaccion={(tipo) => void handleReaccion(item.id, tipo)}
            />
          ))
        )}
      </section>
    </div>
  );
}
