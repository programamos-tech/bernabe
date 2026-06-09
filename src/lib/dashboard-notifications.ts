import { buildCumpleanosEstaSemana, type PersonaCumpleRow } from "@/lib/cumpleanos-comunidad";
import { createClient } from "@/lib/supabase/client";

export type NotificacionTipo = "nuevos_miembros" | "cumpleanos" | "reuniones" | "seguimientos" | "reportes";

export type DashboardNotificacion = {
  id: string;
  tipo: NotificacionTipo;
  titulo: string;
  descripcion: string;
  href: string;
  timeLabel: string;
};

export const NOTIFICACION_CATEGORIAS = [
  { id: "nuevos_miembros" as const, label: "Nuevos miembros", desc: "Recibir notificación cuando se registre un nuevo miembro" },
  { id: "cumpleanos" as const, label: "Cumpleaños", desc: "Recordatorios de cumpleaños de los miembros" },
  { id: "reuniones" as const, label: "Reuniones", desc: "Recordatorios de reuniones y eventos programados" },
  { id: "seguimientos" as const, label: "Seguimientos pendientes", desc: "Alertas de seguimientos que necesitan atención" },
  { id: "reportes" as const, label: "Reportes semanales", desc: "Resumen semanal de actividad de la iglesia" },
];

function formatTimeAgo(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return "";

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 60) return minutes <= 1 ? "Hace 1 min" : `Hace ${minutes} min`;
  if (hours < 24) return hours === 1 ? "Hace 1 h" : `Hace ${hours} h`;
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export function diasDesde(val: string | null | undefined): number | null {
  if (!val?.trim()) return null;
  const d = new Date(val.trim().slice(0, 10));
  if (Number.isNaN(d.getTime())) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.floor((hoy.getTime() - d.getTime()) / 86400000);
}

export function necesitaSeguimiento(ultimoContacto: string | null | undefined): boolean {
  const dias = diasDesde(ultimoContacto);
  return dias === null || dias > 14;
}

const DAY_KEYS: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
};

function normalizeDia(dia: string): string {
  return dia
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function dayBadgeForGrupo(dia: string): string {
  const hoy = new Date().getDay();
  const key = normalizeDia(dia);
  const idx = DAY_KEYS[key];
  if (idx === undefined) return dia;
  if (idx === hoy) return "Hoy";
  if (idx === (hoy + 1) % 7) return "Mañana";
  return dia;
}

export async function fetchDashboardNotifications(leaderFree: boolean): Promise<DashboardNotificacion[]> {
  const supabase = createClient();
  const notificaciones: DashboardNotificacion[] = [];
  const hoy = new Date();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weekStart = new Date(hoy);
  weekStart.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1));
  weekStart.setHours(0, 0, 0, 0);
  const weekStartIso = weekStart.toISOString().slice(0, 10);

  const queries: Promise<void>[] = [];

  queries.push(
    (async () => {
      const { data } = await supabase
        .from("personas")
        .select("id, nombre, created_at")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(5);

      for (const p of data ?? []) {
        notificaciones.push({
          id: `nuevo-${p.id}`,
          tipo: "nuevos_miembros",
          titulo: p.nombre ?? "Nueva persona",
          descripcion: "Nuevo miembro registrado",
          href: `/personas/${p.id}`,
          timeLabel: p.created_at ? formatTimeAgo(p.created_at) : "",
        });
      }
    })(),
  );

  queries.push(
    (async () => {
      const { data } = await supabase.from("personas").select("id, nombre, fecha_nacimiento").not("fecha_nacimiento", "is", null);
      const cumples = buildCumpleanosEstaSemana((data ?? []) as PersonaCumpleRow[], hoy).slice(0, 5);

      for (const c of cumples) {
        notificaciones.push({
          id: `cumple-${c.id}-${c.fecha.toISOString().slice(0, 10)}`,
          tipo: "cumpleanos",
          titulo: c.nombre,
          descripcion: `Cumpleaños ${c.etiqueta.toLowerCase()}`,
          href: `/personas/${c.id}`,
          timeLabel: c.etiqueta,
        });
      }
    })(),
  );

  queries.push(
    (async () => {
      const { data: grupos } = await supabase
        .from("grupos")
        .select("id, nombre, dia, hora")
        .eq("activo", true)
        .not("dia", "is", null)
        .limit(20);

      for (const g of grupos ?? []) {
        const badge = dayBadgeForGrupo(String(g.dia));
        if (badge !== "Hoy" && badge !== "Mañana") continue;
        notificaciones.push({
          id: `grupo-${g.id}`,
          tipo: "reuniones",
          titulo: g.nombre ?? "Reunión de grupo",
          descripcion: `Grupo ${badge.toLowerCase()}${g.hora ? ` · ${g.hora}` : ""}`,
          href: `/grupos/${g.id}`,
          timeLabel: badge,
        });
      }

      if (!leaderFree) {
        const hoyIso = hoy.toISOString().slice(0, 10);
        const enSiete = new Date(hoy);
        enSiete.setDate(hoy.getDate() + 7);
        const finIso = enSiete.toISOString().slice(0, 10);

        const { data: eventos } = await supabase
          .from("eventos")
          .select("id, titulo, fecha, hora")
          .gte("fecha", hoyIso)
          .lte("fecha", finIso)
          .order("fecha")
          .limit(5);

        for (const e of eventos ?? []) {
          const fecha = e.fecha ? new Date(`${e.fecha}T12:00:00`) : null;
          const timeLabel = fecha
            ? fecha.toDateString() === hoy.toDateString()
              ? "Hoy"
              : fecha.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" })
            : "";
          notificaciones.push({
            id: `evento-${e.id}`,
            tipo: "reuniones",
            titulo: e.titulo ?? "Evento",
            descripcion: `Evento programado${e.hora ? ` · ${e.hora}` : ""}`,
            href: "/calendario",
            timeLabel,
          });
        }
      }
    })(),
  );

  queries.push(
    (async () => {
      const { data } = await supabase
        .from("personas")
        .select("id, nombre, ultimo_contacto, etapa")
        .order("ultimo_contacto", { ascending: true, nullsFirst: true })
        .limit(40);

      const pendientes = (data ?? []).filter((p) => necesitaSeguimiento(p.ultimo_contacto)).slice(0, 5);

      for (const p of pendientes) {
        const dias = diasDesde(p.ultimo_contacto);
        const descripcion =
          dias === null ? "Sin contacto registrado" : dias > 14 ? `Sin contacto hace ${dias} días` : "Requiere seguimiento";
        notificaciones.push({
          id: `seg-${p.id}`,
          tipo: "seguimientos",
          titulo: p.nombre ?? "Persona",
          descripcion,
          href: `/personas/${p.id}`,
          timeLabel: dias === null ? "Pendiente" : dias > 14 ? `${dias} días` : "",
        });
      }
    })(),
  );

  queries.push(
    (async () => {
      const [{ count: nuevosSemana }, { count: gruposActivos }, { count: totalPersonas }] = await Promise.all([
        supabase.from("personas").select("id", { count: "exact", head: true }).gte("created_at", `${weekStartIso}T00:00:00`),
        supabase.from("grupos").select("id", { count: "exact", head: true }).eq("activo", true),
        supabase.from("personas").select("id", { count: "exact", head: true }),
      ]);

      const partes: string[] = [];
      if ((nuevosSemana ?? 0) > 0) partes.push(`${nuevosSemana} nueva${nuevosSemana === 1 ? "" : "s"} persona${nuevosSemana === 1 ? "" : "s"}`);
      partes.push(`${totalPersonas ?? 0} personas en total`);
      partes.push(`${gruposActivos ?? 0} grupo${gruposActivos === 1 ? "" : "s"} activo${gruposActivos === 1 ? "" : "s"}`);

      notificaciones.push({
        id: `reporte-${weekStartIso}`,
        tipo: "reportes",
        titulo: "Resumen semanal",
        descripcion: partes.join(" · "),
        href: "/home",
        timeLabel: "Esta semana",
      });
    })(),
  );

  await Promise.all(queries);

  const ordenTipo: Record<NotificacionTipo, number> = {
    seguimientos: 0,
    reuniones: 1,
    cumpleanos: 2,
    nuevos_miembros: 3,
    reportes: 4,
  };

  return notificaciones.sort((a, b) => ordenTipo[a.tipo] - ordenTipo[b.tipo]);
}

export function iconPathForNotificacionTipo(tipo: NotificacionTipo): string {
  switch (tipo) {
    case "nuevos_miembros":
      return "M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z";
    case "cumpleanos":
      return "M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z";
    case "reuniones":
      return "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5";
    case "seguimientos":
      return "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z";
    case "reportes":
      return "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z";
  }
}

export function labelForNotificacionTipo(tipo: NotificacionTipo): string {
  return NOTIFICACION_CATEGORIAS.find((c) => c.id === tipo)?.label ?? tipo;
}

export function iconColorClassForNotificacionTipo(tipo: NotificacionTipo): string {
  switch (tipo) {
    case "nuevos_miembros":
      return "text-emerald-600 dark:text-emerald-400";
    case "cumpleanos":
      return "text-rose-500 dark:text-rose-400";
    case "reuniones":
      return "text-sky-600 dark:text-sky-400";
    case "seguimientos":
      return "text-amber-600 dark:text-amber-400";
    case "reportes":
      return "text-violet-600 dark:text-violet-400";
  }
}
