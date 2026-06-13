import {
  computeStatsAsistenciaGrupo,
  rangoSemanaCreatedAt,
  rangoSemanaFechasISO,
} from "@/lib/estadisticas-semana-comunidad";
import { inicioSemanaLunes } from "@/lib/cumpleanos-comunidad";
import { createClient } from "@/lib/supabase/client";

export const VICTORIA_TIPOS = [
  "contactos_semana",
  "asistencias_semana",
  "nuevos_visitantes",
  "racha_grupo",
  "primer_grupo",
  "manual",
] as const;

export type VictoriaTipo = (typeof VICTORIA_TIPOS)[number];

export const REACCION_TIPOS = ["animo", "oracion", "gusto"] as const;
export type ReaccionTipo = (typeof REACCION_TIPOS)[number];

export const REACCION_LABELS: Record<ReaccionTipo, string> = {
  animo: "Ánimo",
  oracion: "Oración",
  gusto: "Me gusta",
};

export type VictoriaSugerencia = {
  tipo: VictoriaTipo;
  titulo: string;
  metricValue: number | null;
};

export type VictoriaFeedItem = {
  id: string;
  profileId: string;
  tipo: VictoriaTipo;
  titulo: string;
  metricValue: number | null;
  autorNombre: string;
  autorCiudad: string | null;
  autorAvatarSeed: string;
  createdAt: string;
  esPropia: boolean;
  reacciones: Record<ReaccionTipo, number>;
  misReacciones: ReaccionTipo[];
};

export const PLANTILLAS_VICTORIA_MANUAL = [
  "Esta semana pastoreé con fidelidad a quienes Dios puso a mi cargo",
  "Retomé contacto con alguien que llevaba tiempo alejado",
  "Celebramos un paso importante en el camino de fe de alguien del rebaño",
  "Mi grupo tuvo una reunión muy edificante esta semana",
] as const;

function toFechaISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function semanaKeyDesdeFecha(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00`);
  return toFechaISO(inicioSemanaLunes(d));
}

function rachaSemanasConsecutivas(semanasConActividad: Set<string>, ref: Date = new Date()): number {
  const inicio = inicioSemanaLunes(ref);
  let count = 0;
  const cursor = new Date(inicio);
  while (true) {
    const key = toFechaISO(inicioSemanaLunes(cursor));
    if (!semanasConActividad.has(key)) break;
    count += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return count;
}

export function formatVictoriaRelativa(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" });
}

function parseCiudadMostrada(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  // Compatibilidad: antes se guardaba "ciudad, país"
  const ciudad = raw.split(",")[0]?.trim();
  return ciudad || null;
}

async function resolveAutorContext(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  userEmail?: string | null,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, organization_id")
    .eq("id", userId)
    .maybeSingle();

  const orgId = profile?.organization_id ?? null;
  let ciudad: string | null = null;
  if (orgId) {
    const { data: orgRow } = await supabase.from("organizations").select("city").eq("id", orgId).maybeSingle();
    const trimmed = orgRow?.city?.trim();
    ciudad = trimmed || null;
  }

  const nombre = profile?.full_name?.trim() || "Un líder";
  const avatarSeed = userEmail?.trim() || nombre || userId;

  return {
    organizationId: orgId,
    autorNombre: nombre,
    autorCiudad: ciudad,
    autorAvatarSeed: avatarSeed,
  };
}

async function tiposCompartidosEstaSemana(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  periodoDesde: string,
): Promise<Set<VictoriaTipo>> {
  const { data } = await supabase
    .from("victorias_compartidas")
    .select("tipo")
    .eq("profile_id", userId)
    .eq("periodo_desde", periodoDesde);

  return new Set((data ?? []).map((r) => r.tipo as VictoriaTipo));
}

export async function fetchVictoriaSugerencias(): Promise<VictoriaSugerencia[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const orgId = (await supabase.from("profiles").select("organization_id").eq("id", user.id).maybeSingle()).data
    ?.organization_id;
  if (!orgId) return [];

  const { desde, hasta } = rangoSemanaFechasISO();
  const { desde: createdDesde, hastaExclusive } = rangoSemanaCreatedAt();
  const yaCompartidos = await tiposCompartidosEstaSemana(supabase, user.id, desde);

  const [historialRes, asistenciaRes, visitantesRes, gruposRes, asistenciaAllRes] = await Promise.all([
    supabase
      .from("persona_historial")
      .select("persona_id, tipo_seguimiento")
      .eq("organization_id", orgId)
      .gte("fecha", desde)
      .lte("fecha", hasta),
    supabase
      .from("persona_asistencia")
      .select("grupo_id, fecha")
      .eq("organization_id", orgId)
      .gte("fecha", desde)
      .lte("fecha", hasta),
    supabase
      .from("personas")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("etapa", "visitante")
      .gte("created_at", createdDesde)
      .lt("created_at", hastaExclusive),
    supabase.from("grupos").select("id, nombre, created_at").eq("organization_id", orgId),
    supabase.from("persona_asistencia").select("grupo_id, fecha").eq("organization_id", orgId),
  ]);

  const sugerencias: VictoriaSugerencia[] = [];

  const seguimientos = (historialRes.data ?? []).filter((r) => r.tipo_seguimiento !== "asistencia");
  const contactosUnicos = new Set(seguimientos.map((r) => r.persona_id)).size;
  if (contactosUnicos >= 3 && !yaCompartidos.has("contactos_semana")) {
    sugerencias.push({
      tipo: "contactos_semana",
      titulo: `Esta semana contacté a ${contactosUnicos} ovejas`,
      metricValue: contactosUnicos,
    });
  }

  const statsAsistencia = computeStatsAsistenciaGrupo(asistenciaRes.data ?? []);
  if (statsAsistencia.reunionesDeGrupo >= 1 && !yaCompartidos.has("asistencias_semana")) {
    const n = statsAsistencia.reunionesDeGrupo;
    sugerencias.push({
      tipo: "asistencias_semana",
      titulo:
        n === 1
          ? "Registré asistencia en una reunión de grupo esta semana"
          : `Registré asistencia en ${n} reuniones de grupo esta semana`,
      metricValue: n,
    });
  }

  const nuevosVisitantes = visitantesRes.count ?? 0;
  if (nuevosVisitantes >= 1 && !yaCompartidos.has("nuevos_visitantes")) {
    sugerencias.push({
      tipo: "nuevos_visitantes",
      titulo:
        nuevosVisitantes === 1
          ? "Recibí un visitante nuevo esta semana"
          : `Recibí ${nuevosVisitantes} visitantes nuevos esta semana`,
      metricValue: nuevosVisitantes,
    });
  }

  const semanasPorGrupo = new Map<string, Set<string>>();
  for (const row of asistenciaAllRes.data ?? []) {
    const gid = row.grupo_id as string;
    if (!semanasPorGrupo.has(gid)) semanasPorGrupo.set(gid, new Set());
    semanasPorGrupo.get(gid)!.add(semanaKeyDesdeFecha(row.fecha as string));
  }

  let mejorRacha = 0;
  let nombreGrupoRacha = "";
  for (const g of gruposRes.data ?? []) {
    const semanas = semanasPorGrupo.get(g.id as string);
    if (!semanas?.size) continue;
    const racha = rachaSemanasConsecutivas(semanas);
    if (racha > mejorRacha) {
      mejorRacha = racha;
      nombreGrupoRacha = (g.nombre as string) || "Mi grupo";
    }
  }

  if (mejorRacha >= 4 && !yaCompartidos.has("racha_grupo")) {
    sugerencias.push({
      tipo: "racha_grupo",
      titulo: `${nombreGrupoRacha}: ${mejorRacha} semanas seguidas con reunión`,
      metricValue: mejorRacha,
    });
  }

  const grupos = gruposRes.data ?? [];
  const gruposEstaSemana = grupos.filter((g) => {
    const created = g.created_at as string;
    return created >= createdDesde && created < hastaExclusive;
  });
  if (grupos.length === 1 && gruposEstaSemana.length === 1 && !yaCompartidos.has("primer_grupo")) {
    sugerencias.push({
      tipo: "primer_grupo",
      titulo: "Creé mi primer grupo en Bernabé",
      metricValue: 1,
    });
  }

  return sugerencias;
}

export async function compartirVictoria(input: {
  tipo: VictoriaTipo;
  titulo: string;
  metricValue?: number | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inicia sesión para compartir" };

  const ctx = await resolveAutorContext(supabase, user.id, user.email);
  if (!ctx.organizationId) return { ok: false, error: "Completa el onboarding antes de compartir" };

  const titulo = input.titulo.trim();
  if (!titulo || titulo.length > 200) return { ok: false, error: "El texto debe tener entre 1 y 200 caracteres" };

  const { desde, hasta } = rangoSemanaFechasISO();

  const { data, error } = await supabase
    .from("victorias_compartidas")
    .insert({
      profile_id: user.id,
      organization_id: ctx.organizationId,
      tipo: input.tipo,
      titulo,
      metric_value: input.metricValue ?? null,
      emoji: "",
      autor_nombre: ctx.autorNombre,
      autor_ubicacion: ctx.autorCiudad,
      autor_avatar_seed: ctx.autorAvatarSeed,
      periodo_desde: input.tipo === "manual" ? null : desde,
      periodo_hasta: input.tipo === "manual" ? null : hasta,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id as string };
}

export async function fetchVictoriasFeed(limit = 40): Promise<VictoriaFeedItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: victorias, error } = await supabase
    .from("victorias_compartidas")
    .select(
      "id, profile_id, tipo, titulo, metric_value, autor_nombre, autor_ubicacion, autor_avatar_seed, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !victorias?.length) return [];

  const ids = victorias.map((v) => v.id as string);
  const { data: reacciones } = await supabase
    .from("victoria_reacciones")
    .select("victoria_id, profile_id, emoji")
    .in("victoria_id", ids);

  return victorias.map((v) => {
    const rows = (reacciones ?? []).filter((r) => r.victoria_id === v.id);
    const counts: Record<ReaccionTipo, number> = { animo: 0, oracion: 0, gusto: 0 };
    const mis: ReaccionTipo[] = [];
    for (const r of rows) {
      const tipo = r.emoji as ReaccionTipo;
      if (REACCION_TIPOS.includes(tipo)) counts[tipo] += 1;
      if (user && r.profile_id === user.id && !mis.includes(tipo)) mis.push(tipo);
    }
    const ciudad = parseCiudadMostrada(v.autor_ubicacion as string | null);
    return {
      id: v.id as string,
      profileId: v.profile_id as string,
      tipo: v.tipo as VictoriaTipo,
      titulo: v.titulo as string,
      metricValue: v.metric_value as number | null,
      autorNombre: v.autor_nombre as string,
      autorCiudad: ciudad,
      autorAvatarSeed: (v.autor_avatar_seed as string | null)?.trim() || (v.profile_id as string),
      createdAt: v.created_at as string,
      esPropia: user?.id === v.profile_id,
      reacciones: counts,
      misReacciones: mis,
    };
  });
}

export async function toggleVictoriaReaccion(
  victoriaId: string,
  tipo: ReaccionTipo,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inicia sesión" };

  const { data: existing } = await supabase
    .from("victoria_reacciones")
    .select("id")
    .eq("victoria_id", victoriaId)
    .eq("profile_id", user.id)
    .eq("emoji", tipo)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("victoria_reacciones").delete().eq("id", existing.id);
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  const { error } = await supabase.from("victoria_reacciones").insert({
    victoria_id: victoriaId,
    profile_id: user.id,
    emoji: tipo,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}
