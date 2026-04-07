/**
 * Inserta grupos típicos de una iglesia para la organización del usuario (por email en Auth).
 * No borra nada: solo INSERT de filas nuevas; omite nombres que ya existan en esa org.
 *
 * Uso:
 *   node --env-file=.env.local scripts/seed-grupos-iglesia.mjs [email]
 *   SEED_USER_EMAIL=... pnpm run seed:grupos
 *
 * Requiere: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const DEFAULT_EMAIL = "andrew@gmail.com";

/** tipos permitidos en BD: parejas | jovenes | teens | hombres | mujeres | general */
const GRUPOS_IGLESIA = [
  {
    nombre: "Hombres de valor",
    tipo: "hombres",
    descripcion: "Encuentro de varones para compartir vida, responsabilidad y fe en un ambiente de confianza.",
    dia: "Sábados",
    hora: "07:00 AM",
    ubicacion: "Salón de hombres",
  },
  {
    nombre: "Mujeres con propósito",
    tipo: "mujeres",
    descripcion: "Espacio para mujeres que buscan crecer en Dios, en familia y en comunidad.",
    dia: "Martes",
    hora: "07:00 PM",
    ubicacion: "Salón de mujeres",
  },
  {
    nombre: "Pequeños exploradores",
    tipo: "general",
    descripcion: "Ministerio infantil con lecciones bíblicas, juegos y valores para niños.",
    dia: "Domingos",
    hora: "10:00 AM",
    ubicacion: "Aula infantil",
  },
  {
    nombre: "Alabanza y adoración",
    tipo: "general",
    descripcion: "Equipo que prepara la música y la atmósfera de adoración en los servicios.",
    dia: "Jueves",
    hora: "08:00 PM",
    ubicacion: "Auditorio principal",
  },
  {
    nombre: "Intercesión",
    tipo: "general",
    descripcion: "Oración por la iglesia, la ciudad y las necesidades de las familias.",
    dia: "Miércoles",
    hora: "06:00 PM",
    ubicacion: "Sala de oración",
  },
  {
    nombre: "Universidad cristiana",
    tipo: "jovenes",
    descripcion: "Jóvenes en edad universitaria: fe, amistades sanas y servicio.",
    dia: "Viernes",
    hora: "08:00 PM",
    ubicacion: "Sala multifuncional",
  },
  {
    nombre: "Matrimonios en camino",
    tipo: "parejas",
    descripcion: "Parejas en los primeros años de matrimonio: comunicación, fe y hogar.",
    dia: "Domingos",
    hora: "05:00 PM",
    ubicacion: "Salón lateral",
  },
  {
    nombre: "Nuevos comienzos",
    tipo: "general",
    descripcion: "Acompañamiento a quienes recién llegan o están conociendo la iglesia.",
    dia: "Domingos",
    hora: "12:00 PM",
    ubicacion: "Sala de bienvenida",
  },
  {
    nombre: "Tercer tiempo",
    tipo: "general",
    descripcion: "Comunidad para adultos mayores: compañía, devocional y actividades.",
    dia: "Jueves",
    hora: "10:00 AM",
    ubicacion: "Salón comunitario",
  },
  {
    nombre: "Artes y creatividad",
    tipo: "general",
    descripcion: "Teatro, danza y expresión artística al servicio del mensaje.",
    dia: "Sábados",
    hora: "04:00 PM",
    ubicacion: "Taller creativo",
  },
  {
    nombre: "Misiones locales",
    tipo: "general",
    descripcion: "Salidas de servicio, visitas y proyectos en barrios cercanos.",
    dia: "Sábados",
    hora: "09:00 AM",
    ubicacion: "Punto de salida: vestíbulo",
  },
  {
    nombre: "Discipulado 101",
    tipo: "general",
    descripcion: "Fundamentos de la fe para quienes quieren dar el siguiente paso.",
    dia: "Martes",
    hora: "08:00 PM",
    ubicacion: "Aula 2",
  },
];

async function findUserIdByEmail(admin, email) {
  const target = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const u = users.find((x) => (x.email ?? "").toLowerCase() === target);
    if (u) return u.id;
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const seedEmail = (process.argv[2] || process.env.SEED_USER_EMAIL || DEFAULT_EMAIL).trim();

  if (!url || !serviceKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userId = await findUserIdByEmail(supabase.auth.admin, seedEmail);
  if (!userId) {
    console.error(`No hay usuario en Auth con email: ${seedEmail}`);
    process.exit(1);
  }

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (pErr) throw pErr;
  const organizationId = profile?.organization_id;
  if (!organizationId) {
    console.error("El perfil no tiene organization_id (completa el onboarding).");
    process.exit(1);
  }

  const { data: existentes, error: eErr } = await supabase
    .from("grupos")
    .select("nombre")
    .eq("organization_id", organizationId);

  if (eErr) throw eErr;
  const nombresSet = new Set((existentes ?? []).map((r) => (r.nombre ?? "").trim().toLowerCase()));

  const aInsertar = GRUPOS_IGLESIA.filter((g) => !nombresSet.has(g.nombre.trim().toLowerCase()));

  if (aInsertar.length === 0) {
    console.log("Todos los grupos de la lista ya existen en esta organización. Nada que insertar.");
    return;
  }

  const rows = aInsertar.map((g) => ({
    organization_id: organizationId,
    nombre: g.nombre,
    tipo: g.tipo,
    descripcion: g.descripcion,
    dia: g.dia,
    hora: g.hora,
    ubicacion: g.ubicacion,
    imagen: null,
    activo: true,
    miembros_count: 0,
    lider_id: null,
  }));

  const { error: insErr } = await supabase.from("grupos").insert(rows);
  if (insErr) {
    console.error("Error insertando grupos:", insErr.message);
    process.exit(1);
  }

  console.log(`Insertados ${rows.length} grupos para la org del usuario ${seedEmail}:`);
  rows.forEach((r) => console.log(`  - ${r.nombre} (${r.tipo})`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
