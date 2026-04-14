"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { ETAPA_LABELS, parseEtapaDb } from "@/lib/persona-etapa";
import { createClient } from "@/lib/supabase/client";

type StatId = "personas" | "grupos" | "visitantes" | "lideres";

type StatItem = {
  id: StatId;
  label: string;
  value: number;
  change: string;
};

const statVisual: Record<StatId, { iconWrap: string; dot: string }> = {
  personas: {
    iconWrap: "bg-sky-500/10",
    dot: "bg-sky-400/75 dark:bg-sky-400/50",
  },
  grupos: {
    iconWrap: "bg-orange-500/10",
    dot: "bg-orange-400/75 dark:bg-orange-400/50",
  },
  visitantes: {
    iconWrap: "bg-amber-500/10",
    dot: "bg-amber-400/80 dark:bg-amber-400/55",
  },
  lideres: {
    iconWrap: "bg-emerald-500/10",
    dot: "bg-emerald-400/75 dark:bg-emerald-400/55",
  },
};

type RecentActivityItem = {
  name: string;
  action: string;
  time: string;
  group: string;
};

type UpcomingMeetingItem = {
  group: string;
  dayLabel: string;
  dayBadge: string;
  time: string;
  leader: string;
  members: number;
};

function normalizeDia(dia: string) {
  return dia.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getDayNameSpanish(d: Date) {
  const names = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return names[d.getDay()];
}

function formatTimeAgo(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return iso;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 60) return minutes <= 1 ? "Hace 1 minuto" : `Hace ${minutes} minutos`;
  if (hours < 24) return hours === 1 ? "Hace 1 hora" : `Hace ${hours} horas`;
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;

  return date.toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" });
}

function parseHoraToMinutes(hora: string) {
  const match = hora.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return null;

  const hh = parseInt(match[1], 10);
  const mm = parseInt(match[2], 10);
  const ampm = match[3];

  const hour24 = ampm === "AM" ? (hh === 12 ? 0 : hh) : hh === 12 ? 12 : hh + 12;
  return hour24 * 60 + mm;
}

const dayOrderKeys: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

export function HomePage() {
  const [pastorName, setPastorName] = useState<string>("Pastor");
  const [stats, setStats] = useState<StatItem[]>([
    { id: "personas", label: "Personas", value: 0, change: "—" },
    { id: "grupos", label: "Grupos activos", value: 0, change: "—" },
    { id: "visitantes", label: "Visitantes nuevos", value: 0, change: "Últimos 7 días" },
    { id: "lideres", label: "Líderes", value: 0, change: "Activos" },
  ]);

  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<UpcomingMeetingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const weekLabels = useMemo(() => {
    const today = getDayNameSpanish(new Date());
    const tomorrow = getDayNameSpanish(new Date(Date.now() + 24 * 60 * 60 * 1000));
    return {
      todayKey: normalizeDia(today),
      tomorrowKey: normalizeDia(tomorrow),
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();

        const { data: orgs } = await supabase.from("organizations").select("pastor_name").limit(1);
        const pastor = orgs?.[0]?.pastor_name;
        if (alive && pastor) {
          setPastorName(pastor.split(" ")[0] || pastor);
        }

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const personasCountRes = await supabase.from("personas").select("id", { count: "exact", head: true });
        const gruposActivosCountRes = await supabase
          .from("grupos")
          .select("id", { count: "exact", head: true })
          .eq("activo", true);
        const visitantesNuevosCountRes = await supabase
          .from("personas")
          .select("id", { count: "exact", head: true })
          .eq("etapa", "visitante")
          .gte("created_at", sevenDaysAgo);
        const lideresActivosCountRes = await supabase
          .from("lideres")
          .select("id", { count: "exact", head: true })
          .eq("estado", "Activo");

        const personasCount = personasCountRes.count ?? 0;
        const gruposActivosCount = gruposActivosCountRes.count ?? 0;
        const visitantesNuevosCount = visitantesNuevosCountRes.count ?? 0;
        const lideresActivosCount = lideresActivosCountRes.count ?? 0;

        if (alive) {
          setStats([
            {
              id: "personas",
              label: "Personas",
              value: personasCount,
              change: personasCount === 0 ? "Sin registros" : "Total en tu iglesia",
            },
            {
              id: "grupos",
              label: "Grupos activos",
              value: gruposActivosCount,
              change: gruposActivosCount === 0 ? "Aún no hay grupos" : "Reuniones activas",
            },
            { id: "visitantes", label: "Visitantes nuevos", value: visitantesNuevosCount, change: "Últimos 7 días" },
            {
              id: "lideres",
              label: "Líderes",
              value: lideresActivosCount,
              change: lideresActivosCount === 0 ? "En formación" : "Activos",
            },
          ]);
        }

        const { data: recientes } = await supabase
          .from("personas")
          .select("nombre,etapa,created_at,grupo_id")
          .order("created_at", { ascending: false })
          .limit(6);

        const groupIds = Array.from(new Set((recientes ?? []).map((p) => p.grupo_id).filter(Boolean)));
        const { data: grupos } = groupIds.length
          ? await supabase.from("grupos").select("id,nombre").in("id", groupIds)
          : { data: [] as { id: string; nombre: string }[] };

        const grupoMap = new Map((grupos ?? []).map((g) => [g.id, g.nombre]));

        if (alive) {
          const items: RecentActivityItem[] = (recientes ?? []).map((p) => {
            const group = p.grupo_id ? grupoMap.get(p.grupo_id as string) ?? "Sin asignar" : "Sin asignar";

            const etapa = parseEtapaDb(p.etapa as string);
            const action =
              etapa === "visitante"
                ? "Nueva visitante registrada"
                : etapa === "nuevo_creyente"
                  ? "Nuevo creyente registrado"
                  : etapa === "bautizado"
                    ? "En camino al bautismo"
                    : etapa === "consolidado"
                      ? "Persona consolidada en grupo"
                      : etapa === "lider_en_formacion"
                        ? "Líder en formación"
                        : etapa === "lider_grupo"
                          ? "Líder de grupo"
                          : etapa === "en_servicio"
                            ? "Reconocida como buen siervo"
                            : etapa === "inactivo"
                              ? "Marcada como inactiva"
                              : `Etapa: ${ETAPA_LABELS[etapa]}`;

            return {
              name: p.nombre,
              action,
              time: p.created_at ? formatTimeAgo(p.created_at as string) : "—",
              group,
            };
          });

          setRecentActivity(items);
        }

        const { data: gruposActivos } = await supabase
          .from("grupos")
          .select("id,nombre,dia,hora,lider_id")
          .eq("activo", true)
          .limit(20);

        const grupoIdsHome = (gruposActivos ?? []).map((g) => g.id);
        const { data: personasPorGrupo } = grupoIdsHome.length
          ? await supabase.from("personas").select("grupo_id").in("grupo_id", grupoIdsHome)
          : { data: [] as { grupo_id: string | null }[] };

        const miembrosPorGrupoId = new Map<string, number>();
        for (const p of personasPorGrupo ?? []) {
          if (p.grupo_id) {
            miembrosPorGrupoId.set(p.grupo_id, (miembrosPorGrupoId.get(p.grupo_id) ?? 0) + 1);
          }
        }

        const liderIds = Array.from(new Set((gruposActivos ?? []).map((g) => g.lider_id).filter(Boolean))) as string[];
        const { data: lideres } = liderIds.length
          ? await supabase.from("lideres").select("id,nombre").in("id", liderIds)
          : { data: [] as { id: string; nombre: string }[] };

        const liderMap = new Map((lideres ?? []).map((l) => [l.id, l.nombre]));

        const todayKey = weekLabels.todayKey;
        const tomorrowKey = weekLabels.tomorrowKey;

        const meetings: UpcomingMeetingItem[] = (gruposActivos ?? [])
          .filter((g) => g.dia && g.hora)
          .map((g) => {
            const dayName = String(g.dia);
            const dayKey = normalizeDia(dayName);
            const dayBadge = dayKey === todayKey ? "Hoy" : dayKey === tomorrowKey ? "Mañana" : dayName;
            const dayIndex = dayOrderKeys[dayKey] ?? 99;

            return {
              group: g.nombre,
              dayLabel: dayName,
              dayBadge,
              time: g.hora ?? "",
              leader: g.lider_id ? liderMap.get(g.lider_id as string) ?? "Sin líder" : "Sin líder",
              members: miembrosPorGrupoId.get(g.id) ?? 0,
              _sortKey: dayIndex,
              _minutes: parseHoraToMinutes(String(g.hora)) ?? 9999,
            } as unknown as UpcomingMeetingItem & { _sortKey: number; _minutes: number };
          })
          .sort((a, b) => a._sortKey - b._sortKey || a._minutes - b._minutes)
          .slice(0, 3)
          .map(({ _minutes, _sortKey, ...rest }) => rest);

        if (alive) {
          setUpcomingMeetings(meetings);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [weekLabels.todayKey, weekLabels.tomorrowKey]);

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8">
      <div className="w-full">
        <div className="mb-8 min-w-0">
          <h1 className="text-xl md:text-2xl font-medium text-[#18301d] dark:text-white font-logo-soft tracking-tight">
            ¡Hola, {pastorName}! 👋
          </h1>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-snug">
            Aquí está el resumen de tu iglesia hoy.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const v = statVisual[stat.id];
            return (
              <div
                key={stat.id}
                className="rounded-3xl bg-gray-100/40 p-5 transition-colors hover:bg-gray-100/55 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${v.iconWrap}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${v.dot}`} />
                  </span>
                  <span className="max-w-[55%] text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                    {stat.change}
                  </span>
                </div>
                <p className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04] lg:col-span-2">
            <div className="flex items-center justify-between border-b border-gray-200/60 px-5 py-4 dark:border-white/[0.08]">
              <h2 className="font-semibold text-gray-900 dark:text-white">Actividad reciente</h2>
              <Link
                href="/personas"
                className="text-sm font-medium text-gray-600 underline-offset-4 hover:underline dark:text-gray-400"
              >
                Ver todo
              </Link>
            </div>
            <div className="divide-y divide-gray-200/50 dark:divide-white/[0.06]">
              {recentActivity.length > 0 ? (
                recentActivity.map((item, i) => (
                  <div
                    key={`${item.name}-${i}`}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/40 dark:hover:bg-white/[0.04]"
                  >
                    <UserAvatar seed={item.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.action}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.time}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{item.group}</p>
                    </div>
                  </div>
                ))
              ) : isLoading ? (
                <div className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">Cargando actividad…</div>
              ) : (
                <div className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">Aún no hay actividad registrada.</div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between border-b border-gray-200/60 px-5 py-4 dark:border-white/[0.08]">
              <h2 className="font-semibold text-gray-900 dark:text-white">Próximas reuniones</h2>
              <Link
                href="/calendario"
                className="text-sm font-medium text-gray-600 underline-offset-4 hover:underline dark:text-gray-400"
              >
                Ver calendario
              </Link>
            </div>
            <div className="space-y-3 p-4">
              {upcomingMeetings.length > 0 ? (
                upcomingMeetings.map((meeting, i) => (
                  <div
                    key={`${meeting.group}-${i}`}
                    className="rounded-2xl bg-white/60 p-4 transition-colors hover:bg-white/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.09]"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-medium text-gray-900 dark:text-white">{meeting.group}</span>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          meeting.dayBadge === "Hoy"
                            ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200"
                            : meeting.dayBadge === "Mañana"
                              ? "bg-sky-500/10 text-sky-900 dark:text-sky-200"
                              : "bg-gray-500/10 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {meeting.dayBadge}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="min-w-0">
                        {meeting.time} · {meeting.leader}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {meeting.members} {meeting.members === 1 ? "miembro" : "miembros"}
                      </span>
                    </div>
                  </div>
                ))
              ) : isLoading ? (
                <div className="px-2 py-6 text-sm text-gray-500 dark:text-gray-400">Cargando reuniones…</div>
              ) : (
                <div className="px-2 py-6 text-sm text-gray-500 dark:text-gray-400">
                  Cuando agregues grupos, aparecerán aquí.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Acciones rápidas
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/personas/nuevo"
              className="rounded-3xl bg-gray-100/40 p-6 transition-colors hover:bg-gray-100/60 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-gray-600 shadow-sm shadow-black/[0.04] dark:bg-white/[0.08] dark:text-gray-300 dark:shadow-none">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-2.418C3 16.676 4.676 15 6.75 15h2.25m13.5 0c2.071 0 3.75 1.679 3.75 3.75v2.418M6.75 15h6.75M6.75 15l-.857.857a2.25 2.25 0 01-1.591.659H4.5" />
                </svg>
              </div>
              <span className="block font-semibold text-gray-900 dark:text-white">Registrar visitante</span>
              <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">Nuevo en la iglesia</span>
            </Link>
            <Link
              href="/grupos"
              className="rounded-3xl bg-gray-100/40 p-6 transition-colors hover:bg-gray-100/60 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-gray-600 shadow-sm shadow-black/[0.04] dark:bg-white/[0.08] dark:text-gray-300 dark:shadow-none">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <span className="block font-semibold text-gray-900 dark:text-white">Ver grupos</span>
              <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">Gestionar células</span>
            </Link>
            <Link
              href="/personas"
              className="rounded-3xl bg-gray-100/40 p-6 transition-colors hover:bg-gray-100/60 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-gray-600 shadow-sm shadow-black/[0.04] dark:bg-white/[0.08] dark:text-gray-300 dark:shadow-none">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="block font-semibold text-gray-900 dark:text-white">Seguimiento</span>
              <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">Personas y pendientes</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
