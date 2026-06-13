"use client";

import Link from "next/link";
import {
  ETAPA_LABELS,
  ETAPAS_ORDEN_CAMINO,
  etapaDotClass,
  parseEtapaDb,
  type EtapaPersonaDb,
} from "@/lib/persona-etapa";

export type PersonasResumenData = {
  total: number;
  lideres: number;
  colideres: number;
  apoyo: number;
  asistentes: number;
  miembrosNucleo: number;
  sinGrupo: number;
  porEtapa: { etapa: EtapaPersonaDb; label: string; count: number; pct: number }[];
};

const ETAPAS_LIDERAZGO_O_SERVICIO: EtapaPersonaDb[] = [
  "lider_en_formacion",
  "lider_grupo",
  "en_servicio",
];

function RolChip({
  label,
  value,
  loading,
  href,
  accent,
  className = "",
}: {
  label: string;
  value: number;
  loading: boolean;
  href?: string;
  accent?: string;
  className?: string;
}) {
  const inner = (
    <>
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-0.5 text-xl font-semibold tabular-nums ${accent ?? "text-gray-900 dark:text-white"}`}>
        {loading ? "—" : value}
      </p>
    </>
  );

  const baseClassName = `min-w-[4.75rem] flex-1 px-1 ${className}`;

  if (href && !loading) {
    return (
      <Link href={href} className={`${baseClassName} transition-opacity hover:opacity-80`}>
        {inner}
      </Link>
    );
  }

  return <div className={baseClassName}>{inner}</div>;
}

export function HomePersonasResumen({
  data,
  loading,
  title = "Personas en tu rebaño",
}: {
  data: PersonasResumenData | null;
  loading: boolean;
  title?: string;
}) {
  const total = data?.total ?? 0;
  const porEtapa = data?.porEtapa.filter((e) => e.count > 0) ?? [];
  const mayorEtapa = porEtapa.length
    ? porEtapa.reduce((a, b) => (b.count > a.count ? b : a), porEtapa[0])
    : null;

  return (
    <div>
      <div className="flex items-stretch gap-4 overflow-x-auto sm:gap-6 [-webkit-overflow-scrolling:touch]">
        <div className="min-w-[5.5rem] shrink-0 px-1">
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
            {loading ? "—" : total}
          </p>
        </div>
        <RolChip label="Líderes" value={data?.lideres ?? 0} loading={loading} href="/lideres" accent="text-indigo-700 dark:text-indigo-300" />
        <RolChip label="Co-líderes" value={data?.colideres ?? 0} loading={loading} href="/personas" />
        <RolChip label="De apoyo" value={data?.apoyo ?? 0} loading={loading} href="/personas" />
        <RolChip
          label="Asistentes"
          value={data?.asistentes ?? 0}
          loading={loading}
          href="/personas"
          accent="text-emerald-700 dark:text-emerald-300"
        />
        <RolChip label="Sin célula" value={data?.sinGrupo ?? 0} loading={loading} href="/personas" />
      </div>

      {!loading && porEtapa.length > 0 ? (
        <div className="mt-3">
          <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-600 dark:text-gray-300">Por etapa</span>
            {mayorEtapa && total > 0 ? (
              <>
                <span className="text-gray-400 dark:text-gray-500">·</span>
                <span>
                  Mayoría:{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">{mayorEtapa.label}</span>{" "}
                  ({mayorEtapa.pct}%)
                </span>
              </>
            ) : null}
          </div>

          <div
            className="flex h-2.5 overflow-hidden rounded-full bg-gray-200/60 dark:bg-white/[0.06]"
            role="img"
            aria-label="Distribución de personas por etapa"
          >
            {porEtapa.map((e) => (
              <div
                key={e.etapa}
                className={`${etapaDotClass[e.etapa]} h-full min-w-[2px]`}
                style={{ width: `${e.pct}%` }}
                title={`${e.label}: ${e.count} (${e.pct}%)`}
              />
            ))}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {porEtapa.map((e) => (
              <span
                key={e.etapa}
                className="inline-flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-300"
                title={`${e.label}: ${e.count} personas (${e.pct}%)`}
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${etapaDotClass[e.etapa]}`} />
                <span className="whitespace-nowrap">
                  {e.label}{" "}
                  <span className="tabular-nums text-gray-500 dark:text-gray-400">{e.count}</span>
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="mt-3 space-y-2">
          <div className="h-2.5 animate-pulse rounded-full bg-gray-200/80 dark:bg-white/10" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3 w-16 animate-pulse rounded bg-gray-200/60 dark:bg-white/[0.06]" />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function buildPersonasResumen(
  personas: {
    id: string;
    etapa: string | null;
    participacion_en_grupo: string | null;
    grupo_id: string | null;
  }[],
  lideresCount: number,
  liderPersonaIds: Set<string>,
): PersonasResumenData {
  const total = personas.length;
  let colideres = 0;
  let apoyo = 0;
  let asistentes = 0;
  let miembrosNucleo = 0;
  let sinGrupo = 0;
  const etapaCounts = new Map<EtapaPersonaDb, number>();

  for (const etapa of [...ETAPAS_ORDEN_CAMINO, "inactivo" as EtapaPersonaDb]) {
    etapaCounts.set(etapa, 0);
  }

  for (const p of personas) {
    const etapa = parseEtapaDb(p.etapa);
    etapaCounts.set(etapa, (etapaCounts.get(etapa) ?? 0) + 1);

    if (!p.grupo_id) {
      sinGrupo++;
      continue;
    }

    if (p.participacion_en_grupo === "colider") colideres++;
    else if (p.participacion_en_grupo === "apoyo") apoyo++;
    else miembrosNucleo++;

    const esLider = liderPersonaIds.has(p.id);
    const enLiderazgoOServicio = ETAPAS_LIDERAZGO_O_SERVICIO.includes(etapa);
    const esMiembroNucleo =
      p.participacion_en_grupo !== "colider" && p.participacion_en_grupo !== "apoyo";

    if (esMiembroNucleo && !esLider && !enLiderazgoOServicio) {
      asistentes++;
    }
  }

  const porEtapa = [...ETAPAS_ORDEN_CAMINO, "inactivo" as EtapaPersonaDb]
    .map((etapa) => {
      const count = etapaCounts.get(etapa) ?? 0;
      return {
        etapa,
        label: ETAPA_LABELS[etapa],
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    })
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    total,
    lideres: lideresCount,
    colideres,
    apoyo,
    asistentes,
    miembrosNucleo,
    sinGrupo,
    porEtapa,
  };
}
