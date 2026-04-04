"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/UserAvatar";
import { createClient } from "@/lib/supabase/client";

type RolLider = "Pastor" | "Líder de grupo" | "Coordinador" | "Mentor" | "Diácono";
type EstadoLider = "Activo" | "En formación" | "Descanso";

const FILTER_ESTADOS: { value: EstadoLider | "Todos"; label: string }[] = [
  { value: "Todos", label: "Todos" },
  { value: "Activo", label: "Activos" },
  { value: "En formación", label: "En formación" },
  { value: "Descanso", label: "Descanso" },
];

interface Lider {
  id: string;
  nombre: string;
  cedula: string | null;
  telefono: string;
  email: string | null;
  /** Rol en BD (tabla lideres) */
  rol: RolLider | null;
  /** Texto mostrado: alinea con Mi cuenta / organizations.pastor_role para el pastor */
  rolEtiqueta: string | null;
  rolEstilo: RolLider;
  grupoAsignado: string | null;
  miembrosACargo: number;
  estado: EstadoLider;
  fechaInicio: string | null;
  personaId: string | null;
}

type OrgPastor = { pastor_email: string | null; pastor_role: string | null };

function rolVistaDesdeOrg(
  row: { email: string | null; rol: string | null },
  org: OrgPastor | null
): { etiqueta: string | null; estilo: RolLider } {
  const emailL = (row.email ?? "").trim().toLowerCase();
  const pastorEmail = (org?.pastor_email ?? "").trim().toLowerCase();
  const emailCoincidePastor = pastorEmail.length > 0 && emailL === pastorEmail;
  const rolDb = row.rol as RolLider | null;
  const esPastor = rolDb === "Pastor" || emailCoincidePastor;
  if (esPastor) {
    return {
      etiqueta: org?.pastor_role?.trim() || "Pastor",
      estilo: "Pastor",
    };
  }
  if (rolDb) return { etiqueta: rolDb, estilo: rolDb };
  return { etiqueta: null, estilo: "Líder de grupo" };
}

/** Chips de rol pastel (misma línea que tipos de evento / personas). */
const rolStyles: Record<RolLider, string> = {
  Pastor: "bg-gray-500/10 text-gray-800 dark:text-gray-200",
  "Líder de grupo": "bg-sky-500/10 text-sky-900 dark:text-sky-200",
  Coordinador: "bg-orange-500/10 text-orange-900 dark:text-orange-200",
  Mentor: "bg-violet-500/12 text-violet-900 dark:text-violet-200",
  Diácono: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
};

/** Estado con punto + fondo suave (como miembros de grupo / personas). */
const estadoStyles: Record<EstadoLider, { dot: string; badge: string }> = {
  Activo: {
    dot: "bg-emerald-400/75 dark:bg-emerald-400/55",
    badge: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
  },
  "En formación": {
    dot: "bg-amber-300/90 dark:bg-amber-300/65",
    badge: "bg-amber-400/15 text-amber-900 dark:text-amber-100",
  },
  Descanso: {
    dot: "bg-gray-400/85 dark:bg-gray-500/65",
    badge: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
  },
};

function EstadoPill({ estado }: { estado: EstadoLider }) {
  const s = estadoStyles[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${s.badge}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
      {estado}
    </span>
  );
}

export default function Page() {
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<EstadoLider | "Todos">("Todos");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: lideresData, error: lideresErr } = await supabase
        .from("lideres")
        .select("id, nombre, cedula, telefono, email, rol, grupo_asignado, estado, fecha_inicio_liderazgo, persona_id")
        .order("nombre");
      const lideresRes = { data: lideresData, error: lideresErr };

      if (lideresRes.error) {
        console.error("Error cargando líderes:", lideresRes.error);
        setLideres([]);
        setLoading(false);
        return;
      }

      const rows = (lideresRes.data ?? []) as {
        id: string;
        nombre: string;
        cedula: string | null;
        telefono: string | null;
        email: string | null;
        rol: string | null;
        grupo_asignado: string | null;
        estado: string;
        fecha_inicio_liderazgo: string | null;
        persona_id: string | null;
      }[];

      let orgPastor: OrgPastor | null = null;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).maybeSingle();
        if (profile?.organization_id) {
          const { data: orgRow } = await supabase
            .from("organizations")
            .select("pastor_email, pastor_role")
            .eq("id", profile.organization_id)
            .maybeSingle();
          orgPastor = orgRow ?? null;
        }
      }

      const leaderIds = rows.map((r) => r.id);
      const miembrosPorLider = new Map<string, number>();

      if (leaderIds.length > 0) {
        const { data: gruposRows } = await supabase.from("grupos").select("id, lider_id").in("lider_id", leaderIds);
        const grupos = gruposRows ?? [];
        const grupoIds = grupos.map((g) => g.id);
        if (grupoIds.length > 0) {
          const { data: personasRows } = await supabase.from("personas").select("grupo_id").in("grupo_id", grupoIds);
          const countByGrupoId = new Map<string, number>();
          for (const p of personasRows ?? []) {
            if (p.grupo_id) {
              countByGrupoId.set(p.grupo_id, (countByGrupoId.get(p.grupo_id) ?? 0) + 1);
            }
          }
          for (const g of grupos) {
            if (g.lider_id) {
              miembrosPorLider.set(g.lider_id, countByGrupoId.get(g.id) ?? 0);
            }
          }
        }
      }

      setLideres(
        rows.map((row) => {
          const { etiqueta, estilo } = rolVistaDesdeOrg(row, orgPastor);
          return {
            id: row.id,
            nombre: row.nombre ?? "",
            cedula: row.cedula ?? null,
            telefono: row.telefono ?? "",
            email: row.email ?? null,
            rol: (row.rol as RolLider) ?? null,
            rolEtiqueta: etiqueta,
            rolEstilo: estilo,
            grupoAsignado: row.grupo_asignado ?? null,
            miembrosACargo: miembrosPorLider.get(row.id) ?? 0,
            estado: (row.estado as EstadoLider) ?? "Activo",
            fechaInicio: row.fecha_inicio_liderazgo ?? null,
            personaId: row.persona_id ?? null,
          };
        })
      );
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lideres.filter((l) => {
      if (filterEstado !== "Todos" && l.estado !== filterEstado) return false;
      if (!q) return true;
      const blob = `${l.nombre} ${l.telefono} ${l.cedula ?? ""} ${l.grupoAsignado ?? ""} ${l.rolEtiqueta ?? ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [lideres, filterEstado, search]);

  const totalLideres = lideres.length;
  const lideresActivos = lideres.filter((l) => l.estado === "Activo").length;
  const enFormacion = lideres.filter((l) => l.estado === "En formación").length;

  const searchInputClass =
    "w-full rounded-full border border-gray-200/80 bg-gray-100/80 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/40 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-white/15 md:w-64";

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full max-w-none px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Líderes</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Seguimiento y gestión del equipo de liderazgo.</p>
        </div>
        <Link
          href="/lideres/nuevo"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-black/10 transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:shadow-none dark:hover:bg-gray-100 sm:w-auto"
        >
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo líder
        </Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-gray-100/40 p-5 dark:bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{totalLideres}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total líderes</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl bg-gray-100/40 p-5 dark:bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{lideresActivos}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Activos</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl bg-gray-100/40 p-5 dark:bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
              />
            </svg>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{enFormacion}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">En formación</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="h-8 w-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      ) : null}

      {!loading && lideres.length > 0 ? (
        <div className="mb-6 flex min-w-0 flex-col gap-3 md:flex-row md:flex-nowrap md:items-center">
          <div className="scrollbar-brand flex shrink-0 flex-wrap items-center gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] md:flex-1">
            {FILTER_ESTADOS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilterEstado(value)}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  filterEstado === value
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-gray-100/90 text-gray-700 hover:bg-gray-200/80 dark:bg-white/[0.08] dark:text-gray-200 dark:hover:bg-white/[0.12]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative min-w-0 md:shrink-0">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <label htmlFor="lideres-buscar" className="sr-only">
              Buscar líder
            </label>
            <input
              id="lideres-buscar"
              type="search"
              placeholder="Buscar líder…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              className={searchInputClass}
            />
          </div>
        </div>
      ) : null}

      {!loading && lideres.length === 0 ? (
        <div className="rounded-3xl bg-gray-100/50 p-12 text-center dark:bg-white/[0.04]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Aún no hay líderes registrados.</p>
          <Link href="/lideres/nuevo" className="mt-4 inline-block text-sm font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white">
            Agregar primer líder
          </Link>
        </div>
      ) : null}

      {!loading && lideres.length > 0 && filtered.length === 0 ? (
        <div className="rounded-3xl bg-gray-100/50 p-12 text-center dark:bg-white/[0.04]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ningún líder coincide con la búsqueda o el filtro.</p>
        </div>
      ) : null}

      <div className="space-y-3 md:hidden">
        {!loading &&
          filtered.map((lider) => (
            <div key={lider.id} className="rounded-3xl bg-gray-100/40 p-4 dark:bg-white/[0.04]">
              <div className="flex items-start gap-3">
                <UserAvatar seed={lider.nombre} size={48} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/lideres/${lider.id}`}
                    className="font-medium text-gray-900 transition hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                  >
                    {lider.nombre}
                  </Link>
                  {lider.cedula ? <p className="text-xs text-gray-500 dark:text-gray-400">Doc. ID: {lider.cedula}</p> : null}
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{lider.telefono}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {lider.rolEtiqueta ? (
                      <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${rolStyles[lider.rolEstilo]}`}>
                        {lider.rolEtiqueta}
                      </span>
                    ) : null}
                    <EstadoPill estado={lider.estado} />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-200/60 pt-3 dark:border-white/10">
                <div className="flex min-w-0 flex-1 items-start gap-1.5">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                  <span className="break-words text-xs leading-snug text-gray-600 dark:text-gray-300">{lider.grupoAsignado ?? "—"}</span>
                </div>
                <div className="shrink-0 text-xs">
                  <span className="font-semibold text-gray-900 dark:text-white">{lider.miembrosACargo}</span>
                  <span className="ml-1 text-gray-400">personas</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-1">
                <button
                  type="button"
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:hover:bg-white/[0.08] dark:hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:hover:bg-white/[0.08] dark:hover:text-white"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </button>
                <Link
                  href={`/lideres/${lider.id}`}
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:hover:bg-white/[0.08] dark:hover:text-white"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
      </div>

      {!loading && lideres.length > 0 && filtered.length > 0 ? (
        <div className="hidden overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04] md:block">
          <div className="scrollbar-brand overflow-x-auto">
            <table className="min-w-[860px] w-full table-fixed">
              <colgroup>
                <col style={{ width: "24%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "32%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "auto", minWidth: "132px" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-200/60 dark:border-white/10">
                  <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400 lg:px-6">
                    Líder
                  </th>
                  <th className="whitespace-nowrap px-3 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400 lg:px-6">
                    Documento ID
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400 lg:px-6">Rol</th>
                  <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400 lg:px-6">
                    Grupo asignado
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400 lg:px-6">
                    Miembros
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400 lg:px-6">Estado</th>
                  <th className="w-32 px-3 py-4 lg:px-6" aria-label="Acciones" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50 dark:divide-white/10">
                {filtered.map((lider) => (
                  <tr key={lider.id} className="transition-colors hover:bg-gray-200/30 dark:hover:bg-white/[0.05]">
                    <td className="align-top px-4 py-4 lg:px-6">
                      <Link href={`/lideres/${lider.id}`} className="group flex min-w-0 items-center gap-3">
                        <UserAvatar seed={lider.nombre} size={44} />
                        <div className="min-w-0">
                          <div className="break-words font-medium leading-snug text-gray-900 transition group-hover:text-gray-600 dark:text-white dark:group-hover:text-gray-300">
                            {lider.nombre}
                          </div>
                          <div className="truncate text-sm text-gray-500 dark:text-gray-400">{lider.telefono}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 align-top text-sm text-gray-600 dark:text-gray-400 lg:px-6">{lider.cedula ?? "—"}</td>
                    <td className="px-3 py-4 align-top lg:px-6">
                      {lider.rolEtiqueta ? (
                        <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${rolStyles[lider.rolEstilo]}`}>
                          {lider.rolEtiqueta}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="min-w-0 px-3 py-4 align-top lg:px-6">
                      <div className="flex min-w-0 items-start gap-2">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                          />
                        </svg>
                        <span className="break-words leading-snug text-gray-700 dark:text-gray-300">{lider.grupoAsignado ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 align-top lg:px-6">
                      <span className="font-semibold text-gray-900 dark:text-white">{lider.miembrosACargo}</span>
                      <span className="ml-1 text-sm text-gray-400">personas</span>
                    </td>
                    <td className="px-3 py-4 align-top lg:px-6">
                      <EstadoPill estado={lider.estado} />
                    </td>
                    <td className="px-3 py-4 align-top lg:px-6">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:hover:bg-white/[0.08] dark:hover:text-white"
                          title="Enviar mensaje"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:hover:bg-white/[0.08] dark:hover:text-white"
                          title="WhatsApp"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                          </svg>
                        </button>
                        <Link
                          href={`/lideres/${lider.id}`}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:hover:bg-white/[0.08] dark:hover:text-white"
                          title="Ver perfil"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!loading && lideres.length > 0 && filtered.length > 0 ? (
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          ¿Quieres promover a alguien a líder?{" "}
          <Link href="/lideres/nuevo" className="font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white">
            Agregar nuevo líder
          </Link>
        </p>
      ) : null}
    </div>
  );
}
