"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { GrupoAvatarCluster } from "@/components/GrupoAvatarCluster";
import { UserAvatar } from "@/components/UserAvatar";
import { tipoLabelGrupo } from "@/lib/grupo-tipo";
import { createClient } from "@/lib/supabase/client";

type RolLider = "Pastor" | "Líder de grupo" | "Coordinador" | "Mentor" | "Diácono";
type EstadoLider = "Activo" | "En formación" | "Descanso";

const FILTER_ESTADOS: { value: EstadoLider | "Todos"; label: string }[] = [
  { value: "Todos", label: "Todos los estados" },
  { value: "Activo", label: "Activos" },
  { value: "En formación", label: "En formación" },
  { value: "Descanso", label: "Descanso" },
];

interface GrupoAsignado {
  id: string;
  nombre: string;
  tipo: string;
  dia: string | null;
  hora: string | null;
  ubicacion: string | null;
  activo: boolean;
  miembrosCount: number;
}

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
  grupo: GrupoAsignado | null;
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

function LiderCardGrupo({ grupo, miembros, fallbackNombre }: { grupo: GrupoAsignado | null; miembros: number; fallbackNombre: string | null }) {
  if (!grupo && !fallbackNombre) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">Sin grupo asignado</p>
    );
  }

  const horario = [grupo?.dia, grupo?.hora].filter(Boolean).join(" · ");
  const nombre = grupo?.nombre ?? fallbackNombre ?? "Grupo";

  const inner = (
    <div className="flex gap-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-gray-100/90 to-gray-100/45 dark:from-white/[0.08] dark:to-white/[0.03]">
        <GrupoAvatarCluster nombreGrupo={nombre} sizeCenter={40} sizeSide={26} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{nombre}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {grupo ? (
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
              {tipoLabelGrupo(grupo.tipo)}
            </span>
          ) : null}
          {grupo ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                grupo.activo
                  ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                  : "bg-gray-500/10 text-gray-700 dark:text-gray-300"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${grupo.activo ? "bg-emerald-400/80" : "bg-gray-400"}`} />
              {grupo.activo ? "Activo" : "Inactivo"}
            </span>
          ) : null}
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-800 dark:text-gray-200">{miembros}</span> miembros
          </span>
        </div>
        {horario ? (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {horario}
          </p>
        ) : null}
        {grupo?.ubicacion ? (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500 dark:text-gray-400" title={grupo.ubicacion}>
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {grupo.ubicacion}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (grupo) {
    return (
      <Link
        href={`/grupos/${grupo.id}`}
        onClick={(e) => e.stopPropagation()}
        className="relative z-[2] block rounded-xl bg-white/50 p-3 transition hover:bg-white/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
      >
        {inner}
      </Link>
    );
  }

  return <div className="rounded-xl bg-white/50 p-3 dark:bg-white/[0.04]">{inner}</div>;
}

function LiderCard({ lider }: { lider: Lider }) {
  const detailHref = lider.personaId
    ? `/personas/${lider.personaId}?lider=${lider.id}`
    : `/lideres/${lider.id}`;

  return (
    <div className="group relative cursor-pointer rounded-2xl bg-gray-100/60 p-4 transition hover:bg-gray-100/80 dark:bg-white/[0.05] dark:hover:bg-white/[0.08] md:flex md:h-full md:flex-col">
      <div className="flex items-start gap-3">
        <UserAvatar seed={lider.nombre} size={44} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 transition group-hover:text-gray-600 dark:text-white dark:group-hover:text-gray-300">
            {lider.nombre}
          </p>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{lider.telefono || "—"}</p>
          {lider.cedula ? <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{lider.cedula}</p> : null}
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

      <div className="mt-5 border-t border-gray-200/50 pt-4 dark:border-white/[0.06] md:mt-auto">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Grupo a cargo</p>
        <LiderCardGrupo grupo={lider.grupo} miembros={lider.miembrosACargo} fallbackNombre={lider.grupoAsignado} />
      </div>

      <div className="relative z-[2] mt-3 flex items-center justify-end gap-1">
        <Link
          href={detailHref}
          onClick={(e) => e.stopPropagation()}
          className="rounded-full p-2 text-gray-400 transition hover:bg-white/80 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
          title="Ver perfil"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </div>

      <Link
        href={detailHref}
        className="absolute inset-0 z-[1] rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/80 dark:focus-visible:ring-white/25"
        aria-label={`Ver perfil de ${lider.nombre}`}
      />
    </div>
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
      const grupoPorLider = new Map<string, GrupoAsignado>();

      if (leaderIds.length > 0) {
        const { data: gruposRows } = await supabase
          .from("grupos")
          .select("id, lider_id, nombre, tipo, dia, hora, ubicacion, activo, miembros_count")
          .in("lider_id", leaderIds);
        const grupos = (gruposRows ?? []) as {
          id: string;
          lider_id: string | null;
          nombre: string;
          tipo: string;
          dia: string | null;
          hora: string | null;
          ubicacion: string | null;
          activo: boolean;
          miembros_count: number;
        }[];
        const grupoIds = grupos.map((g) => g.id);
        const countByGrupoId = new Map<string, number>();
        if (grupoIds.length > 0) {
          const { data: personasRows } = await supabase.from("personas").select("grupo_id").in("grupo_id", grupoIds);
          for (const p of personasRows ?? []) {
            if (p.grupo_id) {
              countByGrupoId.set(p.grupo_id, (countByGrupoId.get(p.grupo_id) ?? 0) + 1);
            }
          }
        }
        for (const g of grupos) {
          if (!g.lider_id) continue;
          const miembrosReales = countByGrupoId.get(g.id);
          const miembros = miembrosReales != null && miembrosReales > 0 ? miembrosReales : g.miembros_count ?? 0;
          miembrosPorLider.set(g.lider_id, miembros);
          grupoPorLider.set(g.lider_id, {
            id: g.id,
            nombre: g.nombre,
            tipo: g.tipo,
            dia: g.dia,
            hora: g.hora,
            ubicacion: g.ubicacion,
            activo: g.activo,
            miembrosCount: miembros,
          });
        }
      }

      setLideres(
        rows.map((row) => {
          const { etiqueta, estilo } = rolVistaDesdeOrg(row, orgPastor);
          const grupo = grupoPorLider.get(row.id) ?? null;
          return {
            id: row.id,
            nombre: row.nombre ?? "",
            cedula: row.cedula ?? null,
            telefono: row.telefono ?? "",
            email: row.email ?? null,
            rol: (row.rol as RolLider) ?? null,
            rolEtiqueta: etiqueta,
            rolEstilo: estilo,
            grupoAsignado: row.grupo_asignado ?? grupo?.nombre ?? null,
            grupo,
            miembrosACargo: miembrosPorLider.get(row.id) ?? grupo?.miembrosCount ?? 0,
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
      const blob = [
        l.nombre,
        l.telefono,
        l.cedula ?? "",
        l.grupoAsignado ?? "",
        l.grupo?.nombre ?? "",
        l.grupo?.tipo ? tipoLabelGrupo(l.grupo.tipo) : "",
        l.grupo?.dia ?? "",
        l.grupo?.hora ?? "",
        l.grupo?.ubicacion ?? "",
        l.rolEtiqueta ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [lideres, filterEstado, search]);

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full min-w-0">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between md:mb-5">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-medium text-[#18301d] dark:text-white tracking-tight">Líderes</h1>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-snug">
            Seguimiento del equipo de liderazgo. Cada líder debe estar vinculado a un miembro en Personas.
          </p>
        </div>
        <Link
          href="/personas"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-black/10 transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:shadow-none dark:hover:bg-gray-100 sm:w-auto"
        >
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Promover desde Personas
        </Link>
      </div>

      <div className="mb-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-nowrap sm:items-center md:mb-5">
        <div className="relative min-w-0 flex-1">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
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
            placeholder="Buscar por nombre, teléfono o grupo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="w-full rounded-full bg-gray-100/80 py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/40 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-white/15"
          />
        </div>
        <div className="relative w-full shrink-0 sm:w-44 md:w-48">
          <label htmlFor="lideres-filtro-estado" className="sr-only">
            Filtrar por estado
          </label>
          <select
            id="lideres-filtro-estado"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value as EstadoLider | "Todos")}
            className="w-full cursor-pointer appearance-none rounded-full bg-gray-100/80 py-2.5 pl-4 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300/40 dark:bg-white/[0.06] dark:text-white dark:focus:ring-white/15"
          >
            {FILTER_ESTADOS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
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

      {!loading && lideres.length > 0 && filtered.length > 0 ? (
        <div className="lg:hidden">
          <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {filtered.map((lider) => (
              <LiderCard key={lider.id} lider={lider} />
            ))}
          </div>
        </div>
      ) : null}

      {!loading && lideres.length > 0 && filtered.length > 0 ? (
        <div className="hidden min-w-0 overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04] lg:block">
          <div className="min-w-0 overflow-x-hidden">
            <table className="w-full min-w-0 table-fixed">
              <colgroup>
                <col style={{ width: "24%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "28%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-200/60 dark:border-white/10">
                  <th className="py-3 pl-4 pr-2 text-left text-xs font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">
                    Líder
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">
                    Documento
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">
                    Rol
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">
                    Grupo
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">
                    Miembros
                  </th>
                  <th className="py-3 pl-2 pr-4 text-left text-xs font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50 dark:divide-white/10">
                {filtered.map((lider) => (
                  <tr key={lider.id} className="transition-colors hover:bg-gray-200/30 dark:hover:bg-white/[0.05]">
                    <td className="align-top py-3 pl-4 pr-2">
                      <Link
                        href={
                          lider.personaId
                            ? `/personas/${lider.personaId}?lider=${lider.id}`
                            : `/lideres/${lider.id}`
                        }
                        className="group flex min-w-0 items-center gap-2.5"
                      >
                        <UserAvatar seed={lider.nombre} size={44} />
                        <div className="min-w-0">
                          <div className="break-words font-medium leading-snug text-gray-900 transition group-hover:text-gray-600 dark:text-white dark:group-hover:text-gray-300">
                            {lider.nombre}
                          </div>
                          <div className="truncate text-sm text-gray-500 dark:text-gray-400">{lider.telefono}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="break-words px-2 py-3 align-top text-sm tabular-nums text-gray-600 dark:text-gray-400">
                      {lider.cedula ?? "—"}
                    </td>
                    <td className="px-2 py-3 align-top">
                      {lider.rolEtiqueta ? (
                        <span
                          className={`inline-flex max-w-full rounded-full px-2 py-1 text-[11px] font-medium leading-snug sm:px-3 sm:text-xs ${rolStyles[lider.rolEstilo]}`}
                        >
                          <span className="break-words">{lider.rolEtiqueta}</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="min-w-0 px-2 py-3 align-top">
                      <div className="flex min-w-0 items-start gap-1.5">
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
                    <td className="whitespace-nowrap px-2 py-3 align-top">
                      <span className="font-semibold text-gray-900 dark:text-white">{lider.miembrosACargo}</span>
                      <span className="ml-1 text-sm text-gray-400">personas</span>
                    </td>
                    <td className="py-3 pl-2 pr-4 align-top">
                      <EstadoPill estado={lider.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!loading && lideres.length > 0 && filtered.length > 0 ? (
        <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
          ¿Quieres promover a alguien a líder?{" "}
          <Link href="/personas" className="font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white">
            Busca al miembro en Personas
          </Link>{" "}
          y usa «Promover a líder» en su ficha.
        </p>
      ) : null}
    </div>
  );
}
