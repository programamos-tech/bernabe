import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ultimaAsistenciaRpcToMap } from "../_lib/asistencia-rpc";
import type {
  GrupoData,
  LiderRowFromDb,
  MiembroData,
  ParticipacionEnGrupo,
  UltimaReunionAsistente,
} from "../_lib/grupo-page-model";
import { normalizeLideres } from "../_lib/grupo-page-model";

function participacionDesdeDb(raw: string | null | undefined): ParticipacionEnGrupo {
  const s = (raw ?? "").trim().toLowerCase();
  if (s === "apoyo" || s === "colider" || s === "miembro") return s;
  return "miembro";
}

function toDateStrLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Carga inicial del grupo, miembros, última asistencia por miembro y estadísticas del mes (RPC). */
export function useGrupoPageData(grupoId: string) {
  const id = grupoId;
  const [grupo, setGrupo] = useState<GrupoData | null>(null);
  const [miembros, setMiembros] = useState<MiembroData[]>([]);
  const [ultimaAsistenciaPorMiembro, setUltimaAsistenciaPorMiembro] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [asistenciaMes, setAsistenciaMes] = useState(0);
  const [asistenciaMesRegistros, setAsistenciaMesRegistros] = useState(0);
  const [reunionesMes, setReunionesMes] = useState(0);
  const [ultimaReunionAsistencia, setUltimaReunionAsistencia] = useState<{
    fecha: string;
    personas: UltimaReunionAsistente[];
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setUltimaAsistenciaPorMiembro({});
    setLoading(true);
    const supabase = createClient();

    Promise.all([
      supabase
        .from("grupos")
        .select(
          "id, nombre, descripcion, tipo, imagen, dia, hora, ubicacion, activo, miembros_count, created_at, lideres(id, nombre, telefono, fecha_inicio_liderazgo, created_at, personas(sexo))"
        )
        .eq("id", id)
        .single(),
      supabase
        .from("personas")
        .select("id, nombre, sexo, rol, etapa, participacion_en_grupo, fecha_ingreso_grupo, co_lider_desde, ultimo_contacto")
        .eq("grupo_id", id)
        .order("nombre"),
    ]).then(([grupoRes, personasRes]) => {
      if (cancelled) return;
      if (grupoRes.error || !grupoRes.data) {
        setNotFound(true);
        setGrupo(null);
      } else {
        const g = grupoRes.data as unknown as Omit<GrupoData, "lideres"> & {
          lideres?: LiderRowFromDb | LiderRowFromDb[] | null;
        };
        setGrupo({
          ...g,
          lideres: normalizeLideres(g.lideres),
        });
      }
      const rows = (personasRes.data ?? []) as MiembroData[];
      setMiembros(
        rows.map((m) => ({
          ...m,
          rol: m.rol ?? "Miembro",
          participacion_en_grupo: participacionDesdeDb(m.participacion_en_grupo),
          fecha_ingreso_grupo: m.fecha_ingreso_grupo ?? null,
          co_lider_desde: m.co_lider_desde ?? null,
          ultimo_contacto: m.ultimo_contacto ?? null,
        }))
      );
      setLoading(false);

      void (async () => {
        try {
          const { data: ultRows, error: ultErr } = await supabase.rpc("ultima_asistencia_por_persona_grupo", {
            p_grupo_id: id,
          });
          if (cancelled) return;
          if (ultErr) throw ultErr;
          setUltimaAsistenciaPorMiembro(ultimaAsistenciaRpcToMap(ultRows ?? null));
        } catch {
          if (!cancelled) setUltimaAsistenciaPorMiembro({});
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const cargarStats = useCallback(async () => {
    if (!id) return;
    const supabase = createClient();
    setStatsLoading(true);
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const startStr = toDateStrLocal(start);
      const endStr = toDateStrLocal(end);

      const [{ data: mesAgg, error: mesErr }, { data: asistentesUlt, error: ultErr }] = await Promise.all([
        supabase.rpc("grupo_asistencia_totales_mes", {
          p_grupo_id: id,
          p_desde: startStr,
          p_hasta: endStr,
        }),
        supabase.rpc("grupo_ultima_reunion_asistentes", { p_grupo_id: id }),
      ]);

      const mesRow = mesAgg?.[0];
      if (!mesErr && mesRow) {
        const n = (v: unknown) => (typeof v === "string" ? parseInt(v, 10) : Number(v)) || 0;
        setAsistenciaMes(n(mesRow.personas_distintas));
        setAsistenciaMesRegistros(n(mesRow.registros));
        setReunionesMes(n(mesRow.fechas_distintas));
      } else {
        setAsistenciaMes(0);
        setAsistenciaMesRegistros(0);
        setReunionesMes(0);
      }

      if (!ultErr && asistentesUlt && asistentesUlt.length > 0) {
        type UltRow = { fecha: string; persona_id: string; nombre: string; sexo: string };
        const rowsUlt = asistentesUlt as UltRow[];
        const ultimaFecha = rowsUlt[0]!.fecha;
        const personasUltima: UltimaReunionAsistente[] = rowsUlt
          .filter((row: UltRow) => row.fecha === ultimaFecha && (row.nombre ?? "").trim())
          .map((row: UltRow) => ({
            id: row.persona_id,
            nombre: (row.nombre ?? "").trim(),
            sexo: row.sexo?.trim() || null,
          }))
          .sort((a: UltimaReunionAsistente, b: UltimaReunionAsistente) => a.nombre.localeCompare(b.nombre, "es"));
        setUltimaReunionAsistencia(
          personasUltima.length > 0 ? { fecha: ultimaFecha, personas: personasUltima } : null
        );
      } else {
        setUltimaReunionAsistencia(null);
      }
    } finally {
      setStatsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (!cancelled) void cargarStats();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [cargarStats]);

  const cargarMiembros = useCallback(async () => {
    const supabase = createClient();
    const [{ data: personasRes, error: personasErr }, { data: ultRows, error: ultErr }] = await Promise.all([
      supabase
        .from("personas")
        .select("id, nombre, sexo, rol, etapa, participacion_en_grupo, fecha_ingreso_grupo, co_lider_desde, ultimo_contacto")
        .eq("grupo_id", id)
        .order("nombre"),
      supabase.rpc("ultima_asistencia_por_persona_grupo", { p_grupo_id: id }),
    ]);

    if (personasErr) {
      console.error("cargarMiembros:", personasErr);
      return;
    }

    const rows = (personasRes ?? []) as MiembroData[];
    setMiembros(
      rows.map((m) => ({
        ...m,
        rol: m.rol ?? "Miembro",
        participacion_en_grupo: participacionDesdeDb(m.participacion_en_grupo),
        fecha_ingreso_grupo: m.fecha_ingreso_grupo ?? null,
        co_lider_desde: m.co_lider_desde ?? null,
        ultimo_contacto: m.ultimo_contacto ?? null,
      }))
    );
    if (!ultErr) setUltimaAsistenciaPorMiembro(ultimaAsistenciaRpcToMap(ultRows ?? null));
    else setUltimaAsistenciaPorMiembro({});
  }, [id]);

  return {
    grupo,
    setGrupo,
    miembros,
    setMiembros,
    ultimaAsistenciaPorMiembro,
    loading,
    notFound,
    statsLoading,
    asistenciaMes,
    asistenciaMesRegistros,
    reunionesMes,
    ultimaReunionAsistencia,
    cargarStats,
    cargarMiembros,
  };
}

export { ultimaAsistenciaRpcToMap } from "../_lib/asistencia-rpc";
