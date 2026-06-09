"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  findPersonaIdForLider,
  linkLiderToPersona,
  personaDetailHref,
} from "@/lib/lider-persona-link";

type PersonaBusqueda = { id: string; nombre: string; telefono: string | null; cedula: string | null };

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [phase, setPhase] = useState<"loading" | "redirect" | "link" | "notfound">("loading");
  const [liderNombre, setLiderNombre] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<PersonaBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const supabase = createClient();

    (async () => {
      const { data: liderRow, error: liderError } = await supabase
        .from("lideres")
        .select("id, nombre, email, cedula, persona_id, organization_id")
        .eq("id", id)
        .single();

      if (liderError || !liderRow) {
        setPhase("notfound");
        return;
      }

      setLiderNombre(liderRow.nombre ?? "");
      const orgId = (liderRow as { organization_id?: string }).organization_id ?? null;
      setOrganizationId(orgId);

      let personaId = liderRow.persona_id as string | null;

      if (!personaId && orgId) {
        const matchId = await findPersonaIdForLider(supabase, orgId, {
          email: liderRow.email,
          cedula: liderRow.cedula,
        });
        if (matchId) {
          const { error: linkErr } = await linkLiderToPersona(supabase, id, matchId);
          if (!linkErr) personaId = matchId;
        }
      }

      if (personaId) {
        setPhase("redirect");
        router.replace(personaDetailHref(personaId, id));
        return;
      }

      setPhase("link");
    })();
  }, [id, router]);

  useEffect(() => {
    if (phase !== "link" || !organizationId) return;
    const q = busqueda.trim();
    if (q.length < 2) {
      setResultados([]);
      return;
    }

    const t = window.setTimeout(() => {
      setBuscando(true);
      const supabase = createClient();
      void supabase
        .from("personas")
        .select("id, nombre, telefono, cedula")
        .eq("organization_id", organizationId)
        .or(`nombre.ilike.%${q}%,cedula.ilike.%${q}%,telefono.ilike.%${q}%`)
        .limit(8)
        .then(({ data }) => {
          setResultados(
            (data ?? []).map((r) => ({
              id: r.id,
              nombre: r.nombre ?? "",
              telefono: r.telefono ?? null,
              cedula: r.cedula ?? null,
            })),
          );
          setBuscando(false);
        });
    }, 300);

    return () => window.clearTimeout(t);
  }, [busqueda, organizationId, phase]);

  const vincular = async (personaId: string) => {
    setError(null);
    setVinculando(true);
    const supabase = createClient();
    const { error: linkErr } = await linkLiderToPersona(supabase, id, personaId);
    setVinculando(false);
    if (linkErr) {
      setError(linkErr);
      return;
    }
    router.replace(personaDetailHref(personaId, id));
  };

  if (phase === "loading" || phase === "redirect") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (phase === "notfound") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-600 dark:text-gray-400">Líder no encontrado.</p>
        <Link href="/lideres" className="font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white">
          Volver a líderes
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <div className="rounded-3xl bg-gray-100/40 p-6 dark:bg-white/[0.04]">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Vincular a un miembro</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <strong>{liderNombre}</strong> aún no está vinculado a una ficha en Personas. Los líderes deben salir de los
          miembros para ver toda su información pastoral (camino espiritual, seguimientos, notas…).
        </p>

        <label htmlFor="buscar-miembro" className="mt-5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          Buscar miembro
        </label>
        <input
          id="buscar-miembro"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Nombre, documento o teléfono…"
          className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-white/10 dark:bg-[#252525] dark:text-white"
        />

        {error ? <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <ul className="mt-3 space-y-2">
          {buscando ? (
            <li className="text-sm text-gray-500 dark:text-gray-400">Buscando…</li>
          ) : resultados.length === 0 && busqueda.trim().length >= 2 ? (
            <li className="text-sm text-gray-500 dark:text-gray-400">Sin resultados.</li>
          ) : (
            resultados.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={vinculando}
                  onClick={() => void vincular(p.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200/80 bg-white/60 px-3 py-2.5 text-left transition hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{p.nombre}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {[p.cedula, p.telefono].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-gray-600 dark:text-gray-400">Vincular</span>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="mt-6 flex flex-col gap-2 border-t border-gray-200/60 pt-4 dark:border-white/[0.08] sm:flex-row">
          <Link
            href={`/lideres/${id}/editar`}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-700 dark:border-white/10 dark:text-gray-200"
          >
            Editar datos del líder
          </Link>
          <Link
            href="/personas/nuevo"
            className="flex-1 rounded-xl bg-gray-900 px-4 py-2.5 text-center text-sm font-medium text-white dark:bg-white dark:text-gray-900"
          >
            Crear miembro nuevo
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          <Link href="/lideres" className="underline-offset-4 hover:underline">
            Volver al listado de líderes
          </Link>
        </p>
      </div>
    </div>
  );
}
