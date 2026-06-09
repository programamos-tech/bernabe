"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductWelcomeTour } from "@/components/ProductWelcomeTour";
import { fetchHomeAtencionPastoral, type HomeAtencionPastoralData } from "@/lib/home-atencion-pastoral";
import { HomeAtencionPastoral } from "@/modules/dashboard/components/HomeAtencionPastoral";
import { HomeVersiculoDelDia } from "@/modules/dashboard/components/HomeVersiculoDelDia";
import {
  HomeAsistenciaComparativa,
  type SemanaAsistenciaChart,
} from "@/modules/dashboard/components/HomeAsistenciaComparativa";
import {
  HomePersonasResumen,
  buildPersonasResumen,
  type PersonasResumenData,
} from "@/modules/dashboard/components/HomePersonasResumen";
import { useDashboardOrgPlan } from "@/contexts/DashboardOrgPlanContext";
import { inicioSemanaLunes } from "@/lib/cumpleanos-comunidad";
import { isLeaderIndividualPlan } from "@/lib/organization-plan";
import { createClient } from "@/lib/supabase/client";

type AsistenciaRow = { grupo_id: string; persona_id: string; fecha: string };

type UpcomingMeetingItem = {
  grupoId: string;
  group: string;
  dayLabel: string;
  dayBadge: string;
  time: string;
  leader: string;
  members: number;
};

function toDateStrLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function normalizeDia(dia: string) {
  return dia.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getDayNameSpanish(d: Date) {
  const names = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return names[d.getDay()];
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

function rangoSemanaLabel(inicio: Date): string {
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  return `${fmt(inicio)} – ${fmt(fin)}`;
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

/** Misma lógica que en detalle de grupo: registros / (miembros × reuniones con dato). */
function porcentajeAsistenciaEnRango(
  rows: AsistenciaRow[],
  miembrosPorGrupo: Map<string, number>,
  desdeInclusive: string,
  hastaExclusive: string,
): number | null {
  const filtered = rows.filter((r) => r.fecha >= desdeInclusive && r.fecha < hastaExclusive);
  if (filtered.length === 0) return null;

  const reunionesPorGrupo = new Map<string, Set<string>>();
  let registros = 0;
  for (const r of filtered) {
    registros++;
    if (!reunionesPorGrupo.has(r.grupo_id)) reunionesPorGrupo.set(r.grupo_id, new Set());
    reunionesPorGrupo.get(r.grupo_id)!.add(r.fecha);
  }

  let cupos = 0;
  reunionesPorGrupo.forEach((fechas, gid) => {
    const m = miembrosPorGrupo.get(gid) ?? 0;
    if (m <= 0) return;
    cupos += m * fechas.size;
  });
  if (cupos <= 0) return null;
  return Math.min(100, (registros / cupos) * 100);
}

function buildSemanasChart(
  asistenciaRows: AsistenciaRow[],
  miembrosPorGrupo: Map<string, number>,
  semanaActualInicio: Date,
): SemanaAsistenciaChart[] {
  const semanas: SemanaAsistenciaChart[] = [];
  for (let i = 3; i >= 0; i--) {
    const inicio = new Date(semanaActualInicio);
    inicio.setDate(semanaActualInicio.getDate() - i * 7);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 7);
    const semanasAtras = i;
    semanas.push({
      label: semanasAtras === 0 ? "Actual" : semanasAtras === 1 ? "Anterior" : `Hace ${semanasAtras} sem.`,
      rango: rangoSemanaLabel(inicio),
      pct: porcentajeAsistenciaEnRango(asistenciaRows, miembrosPorGrupo, toDateStrLocal(inicio), toDateStrLocal(fin)),
      esActual: semanasAtras === 0,
      esAnterior: semanasAtras === 1,
    });
  }
  return semanas;
}

export function HomePage() {
  const orgPlan = useDashboardOrgPlan();
  const leaderFree = isLeaderIndividualPlan(orgPlan);
  const [pastorName, setPastorName] = useState("Pastor");
  const [personasResumen, setPersonasResumen] = useState<PersonasResumenData | null>(null);
  const [semanasChart, setSemanasChart] = useState<SemanaAsistenciaChart[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<UpcomingMeetingItem[]>([]);
  const [atencionPastoral, setAtencionPastoral] = useState<HomeAtencionPastoralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const weekLabels = useMemo(() => {
    const today = getDayNameSpanish(new Date());
    const tomorrow = getDayNameSpanish(new Date(Date.now() + 86400000));
    return { todayKey: normalizeDia(today), tomorrowKey: normalizeDia(tomorrow) };
  }, []);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();

        const { data: orgs } = await supabase.from("organizations").select("pastor_name").limit(1);
        const pastor = orgs?.[0]?.pastor_name;
        if (alive && pastor) setPastorName(pastor.split(" ")[0] || pastor);

        const semanaActualInicio = inicioSemanaLunes(new Date());
        const chartInicio = new Date(semanaActualInicio);
        chartInicio.setDate(chartInicio.getDate() - 21);
        const chartInicioStr = toDateStrLocal(chartInicio);

        const [personasRes, lideresRes, gruposRes, personasGrupoRes, asistenciaRes, atencionRes] = await Promise.all([
          supabase.from("personas").select("id, etapa, participacion_en_grupo, grupo_id"),
          supabase.from("lideres").select("id, persona_id"),
          supabase.from("grupos").select("id,nombre,dia,hora,lider_id").eq("activo", true),
          supabase.from("personas").select("grupo_id").not("grupo_id", "is", null),
          supabase.from("persona_asistencia").select("grupo_id,persona_id,fecha").gte("fecha", chartInicioStr),
          fetchHomeAtencionPastoral(),
        ]);

        const gruposActivos = gruposRes.data ?? [];
        const activoIds = new Set(gruposActivos.map((g) => g.id));
        const miembrosPorGrupo = new Map<string, number>();
        for (const p of personasGrupoRes.data ?? []) {
          const gid = p.grupo_id as string;
          if (!activoIds.has(gid)) continue;
          miembrosPorGrupo.set(gid, (miembrosPorGrupo.get(gid) ?? 0) + 1);
        }

        const asistenciaRows = (asistenciaRes.data ?? []) as AsistenciaRow[];
        const semanas = buildSemanasChart(asistenciaRows, miembrosPorGrupo, semanaActualInicio);

        const liderIds = Array.from(new Set(gruposActivos.map((g) => g.lider_id).filter(Boolean))) as string[];
        const { data: lideres } = liderIds.length
          ? await supabase.from("lideres").select("id,nombre").in("id", liderIds)
          : { data: [] as { id: string; nombre: string }[] };
        const liderMap = new Map((lideres ?? []).map((l) => [l.id, l.nombre]));

        const meetings: UpcomingMeetingItem[] = gruposActivos
          .filter((g) => g.dia && g.hora)
          .map((g) => {
            const dayName = String(g.dia);
            const dayKey = normalizeDia(dayName);
            const dayBadge = dayKey === weekLabels.todayKey ? "Hoy" : dayKey === weekLabels.tomorrowKey ? "Mañana" : dayName;
            return {
              grupoId: g.id,
              group: g.nombre ?? "",
              dayLabel: dayName,
              dayBadge,
              time: g.hora ?? "",
              leader: g.lider_id ? liderMap.get(g.lider_id as string) ?? "Sin líder" : "Sin líder",
              members: miembrosPorGrupo.get(g.id) ?? 0,
              _sortKey: dayOrderKeys[dayKey] ?? 99,
              _minutes: parseHoraToMinutes(String(g.hora)) ?? 9999,
            } as UpcomingMeetingItem & { _sortKey: number; _minutes: number };
          })
          .sort((a, b) => a._sortKey - b._sortKey || a._minutes - b._minutes)
          .slice(0, 4)
          .map(({ _minutes, _sortKey, ...rest }) => rest);

        const liderPersonaIds = new Set(
          (lideresRes.data ?? [])
            .map((l) => l.persona_id as string | null)
            .filter((id): id is string => Boolean(id)),
        );

        if (alive) {
          setPersonasResumen(
            buildPersonasResumen(
              personasRes.data ?? [],
              lideresRes.data?.length ?? 0,
              liderPersonaIds,
            ),
          );
          setSemanasChart(semanas);
          setUpcomingMeetings(meetings);
          setAtencionPastoral(atencionRes);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, [weekLabels.todayKey, weekLabels.tomorrowKey]);

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="mb-4 min-w-0 md:mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-[#18301d] dark:text-white md:text-3xl">
          ¡Hola, {pastorName}! 👋
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,260px)] xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 overflow-hidden rounded-3xl bg-gray-100/40 p-5 dark:bg-white/[0.04] sm:p-6">
          <HomePersonasResumen
            data={personasResumen}
            loading={isLoading}
            title={leaderFree ? "Personas en tu rebaño" : "Personas en la iglesia"}
          />

          <HomeAsistenciaComparativa semanas={semanasChart} loading={isLoading} />
        </div>

        <div className="min-w-0 overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
          <div className="flex items-center justify-between border-b border-gray-200/60 px-4 py-3 dark:border-white/[0.08]">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Próximas reuniones</h2>
            <Link
              href="/calendario"
              className="text-sm font-medium text-gray-600 underline-offset-4 hover:underline dark:text-gray-400"
            >
              Calendario
            </Link>
          </div>
          <div className="space-y-2 p-3">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map((meeting) => (
                <Link
                  key={meeting.grupoId}
                  href={`/grupos/${meeting.grupoId}`}
                  className="block rounded-xl bg-white/60 p-3 transition-colors hover:bg-white/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.09]"
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <span className="min-w-0 text-sm font-medium leading-snug text-gray-900 dark:text-white">{meeting.group}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
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
                  <div className="space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                    <p className="truncate">
                      {meeting.time} · {meeting.leader}
                    </p>
                    <p className="tabular-nums">
                      {meeting.members} {meeting.members === 1 ? "miembro" : "miembros"}
                    </p>
                  </div>
                </Link>
              ))
            ) : isLoading ? (
              <div className="px-2 py-6 text-sm text-gray-500 dark:text-gray-400">Cargando…</div>
            ) : (
              <div className="px-2 py-6 text-sm text-gray-500 dark:text-gray-400">
                Cuando agregues grupos con día y hora, aparecerán aquí.
              </div>
            )}
          </div>

          <HomeVersiculoDelDia />
        </div>
      </div>

      <HomeAtencionPastoral data={atencionPastoral} loading={isLoading} />

      <ProductWelcomeTour leaderIndividual={leaderFree} />
    </div>
  );
}
