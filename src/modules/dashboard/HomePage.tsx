"use client";

import Link from "next/link";
import Avatar from "boring-avatars";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type StatItem = {
  label: string;
  value: number;
  change: string;
  color: string;
};

type RecentActivityItem = {
  type: "visitor" | "member";
  name: string;
  action: string;
  time: string;
  group: string;
};

type UpcomingMeetingItem = {
  group: string;
  dayLabel: string;
  dayBadge: string; // "Hoy" | "Mañana" | otro
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
    { label: "Personas", value: 0, change: "—", color: "#0ca6b2" },
    { label: "Grupos activos", value: 0, change: "—", color: "#e64b27" },
    { label: "Visitantes nuevos", value: 0, change: "Últimos 7 días", color: "#f9c70c" },
    { label: "Líderes", value: 0, change: "Activos", color: "#18301d" },
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

        // Pastor
        const { data: orgs } = await supabase
          .from("organizations")
          .select("pastor_name")
          .limit(1);
        const pastor = orgs?.[0]?.pastor_name;
        if (alive && pastor) {
          setPastorName(pastor.split(" ")[0] || pastor);
        }

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const personasCountRes = await supabase
          .from("personas")
          .select("id", { count: "exact", head: true });
        const gruposActivosCountRes = await supabase
          .from("grupos")
          .select("id", { count: "exact", head: true })
          .eq("activo", true);
        const visitantesNuevosCountRes = await supabase
          .from("personas")
          .select("id", { count: "exact", head: true })
          .eq("estado", "Visitante")
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
            { label: "Personas", value: personasCount, change: personasCount === 0 ? "Sin registros" : "Total en tu iglesia", color: "#0ca6b2" },
            { label: "Grupos activos", value: gruposActivosCount, change: gruposActivosCount === 0 ? "Aún no hay grupos" : "Reuniones activas", color: "#e64b27" },
            { label: "Visitantes nuevos", value: visitantesNuevosCount, change: "Últimos 7 días", color: "#f9c70c" },
            { label: "Líderes", value: lideresActivosCount, change: lideresActivosCount === 0 ? "En formación" : "Activos", color: "#18301d" },
          ]);
        }

        // Actividad reciente (personas recientes)
        const { data: recientes } = await supabase
          .from("personas")
          .select("nombre,estado,created_at,grupo_id")
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

            const action =
              p.estado === "Visitante"
                ? "Nueva visitante registrada"
                : p.estado === "Activo"
                ? "Cambió a miembro activo"
                : p.estado === "En seguimiento"
                ? "Entró en seguimiento"
                : `Estado: ${p.estado}`;

            return {
              type: p.estado === "Visitante" ? "visitor" : "member",
              name: p.nombre,
              action,
              time: p.created_at ? formatTimeAgo(p.created_at as string) : "—",
              group,
            };
          });

          setRecentActivity(items);
        }

        // Próximas reuniones (grupos activos)
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
        // Si algo falla, mostramos 0/empty y no rompemos el dashboard
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
    <div className="px-4 py-8 md:px-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#18301d] dark:text-white">¡Hola, {pastorName}! 👋</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Aquí está el resumen de tu iglesia hoy.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-gray-100 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stat.color }}
                  />
                </span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.change}</span>
              </div>
              <p className="text-3xl font-bold text-[#18301d] dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
              <h2 className="font-semibold text-[#18301d] dark:text-white">Actividad reciente</h2>
              <Link href="/personas" className="text-sm text-[#0ca6b2] hover:underline">
                Ver todo
              </Link>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
              {recentActivity.length > 0 ? (
                recentActivity.map((item, i) => (
                  <div
                    key={`${item.name}-${i}`}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
                  >
                    <Avatar
                      size={40}
                      name={item.name}
                      variant="beam"
                      colors={["#0ca6b2", "#18301d", "#e64b27", "#f9c70c", "#faddbf"]}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#18301d] dark:text-white truncate">{item.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.action}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.time}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{item.group}</p>
                    </div>
                  </div>
                ))
              ) : isLoading ? (
                <div className="px-6 py-6 text-sm text-gray-500 dark:text-gray-400">Cargando actividad…</div>
              ) : (
                <div className="px-6 py-6 text-sm text-gray-500 dark:text-gray-400">Aún no hay actividad registrada.</div>
              )}
            </div>
          </div>

          {/* Upcoming Meetings */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
              <h2 className="font-semibold text-[#18301d] dark:text-white">Próximas reuniones</h2>
              <Link href="/calendario" className="text-sm text-[#0ca6b2] hover:underline">
                Ver calendario
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {upcomingMeetings.length > 0 ? (
                upcomingMeetings.map((meeting, i) => (
                  <div
                    key={`${meeting.group}-${i}`}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#252525] hover:bg-[#faddbf]/30 dark:hover:bg-[#2a2a2a] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[#18301d] dark:text-white">{meeting.group}</span>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          meeting.dayBadge === "Hoy"
                            ? "bg-[#e64b27] text-white"
                            : "bg-gray-200 dark:bg-[#333] text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {meeting.dayBadge}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {meeting.time} • {meeting.leader}
                      </span>
                      <span>{meeting.members} miembros</span>
                    </div>
                  </div>
                ))
              ) : isLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 px-4 py-6">Cargando reuniones…</div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 px-4 py-6">
                  Cuando agregues grupos, aparecerán aquí.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-[#18301d] to-[#2d4a35] dark:from-[#1a1a1a] dark:to-[#252525] dark:border dark:border-[#2a2a2a] rounded-2xl p-6 text-white">
          <h3 className="font-semibold mb-4">Acciones rápidas</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link
              href="/personas/nuevo"
              className="relative overflow-hidden px-6 py-16 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              <Image
                src="/chica-transparente.png"
                alt="Registrar visitante"
                fill
                className="absolute inset-0 object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative z-10">
                <span className="block font-medium">Registrar visitante</span>
                <span className="block text-sm text-white/70">Nuevo en la iglesia</span>
              </div>
            </Link>
            <Link
              href="/grupos"
              className="relative overflow-hidden px-6 py-16 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              <Image
                src="/fiesta.jpg"
                alt="Ver grupos"
                fill
                className="absolute inset-0 object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative z-10">
                <span className="block font-medium">Ver grupos</span>
                <span className="block text-sm text-white/70">Gestionar células</span>
              </div>
            </Link>
            <Link
              href="/personas"
              className="relative overflow-hidden px-6 py-16 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              <Image
                src="/mesaycena.jpg"
                alt="Seguimiento"
                fill
                className="absolute inset-0 object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative z-10">
                <span className="block font-medium">Seguimiento</span>
                <span className="block text-sm text-white/70">Pendientes hoy</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
