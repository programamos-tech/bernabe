/**
 * Inserta líderes de demostración para la organización del usuario (por email en Auth).
 * No borra nada. Omite nombres que ya existan en esa org (insensible a mayúsculas).
 * Opcionalmente asigna grupos.lider_id si el grupo existe, no tiene líder y coincide `grupoNombre`.
 *
 * Uso:
 *   pnpm run seed:lideres
 *   node --env-file=.env.local scripts/seed-lideres-iglesia.mjs [email]
 *
 * Requiere: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const DEFAULT_EMAIL = "andrew@gmail.com";

/** rol: Pastor | Líder de grupo | Coordinador | Mentor | Diácono */
const LIDERES_IGLESIA = [
  {
    nombre: "Rosa Ibarra Vargas",
    telefono: "3001112233",
    cedula: "9400001001",
    email: "rosa.ibarra.demo@example.invalid",
    rol: "Líder de grupo",
    estado: "Activo",
    grupoNombre: "Mujeres con propósito",
    fecha_inicio_liderazgo: "2024-03-01",
  },
  {
    nombre: "Marco Díaz Londoño",
    telefono: "3001112234",
    cedula: "9400001002",
    email: "marco.diaz.demo@example.invalid",
    rol: "Líder de grupo",
    estado: "Activo",
    grupoNombre: "Hombres de valor",
    fecha_inicio_liderazgo: "2024-02-15",
  },
  {
    nombre: "Lucía Fernández Ortiz",
    telefono: "3001112235",
    cedula: "9400001003",
    email: "lucia.fernandez.demo@example.invalid",
    rol: "Líder de grupo",
    estado: "En formación",
    grupoNombre: "Pequeños exploradores",
    fecha_inicio_liderazgo: "2025-11-01",
  },
  {
    nombre: "Andrés Muñoz",
    telefono: "3001112236",
    cedula: "9400001004",
    email: "andres.munoz.demo@example.invalid",
    rol: "Coordinador",
    estado: "Activo",
    grupoNombre: "Alabanza y adoración",
    fecha_inicio_liderazgo: "2023-06-01",
  },
  {
    nombre: "Patricia Gómez",
    telefono: "3001112237",
    cedula: "9400001005",
    email: "patricia.gomez.demo@example.invalid",
    rol: "Líder de grupo",
    estado: "Activo",
    grupoNombre: "Intercesión",
    fecha_inicio_liderazgo: "2024-01-10",
  },
  {
    nombre: "Diego Salazar",
    telefono: "3001112238",
    cedula: "9400001006",
    email: "diego.salazar.demo@example.invalid",
    rol: "Líder de grupo",
    estado: "Activo",
    grupoNombre: "Universidad cristiana",
    fecha_inicio_liderazgo: "2024-08-20",
  },
  {
    nombre: "Carmen Restrepo",
    telefono: "3001112239",
    cedula: "9400001007",
    email: "carmen.restrepo.demo@example.invalid",
    rol: "Mentor",
    estado: "Activo",
    grupoNombre: "Matrimonios en camino",
    fecha_inicio_liderazgo: "2022-05-01",
  },
  {
    nombre: "Javier Castaño",
    telefono: "3001112240",
    cedula: "9400001008",
    email: "javier.castano.demo@example.invalid",
    rol: "Líder de grupo",
    estado: "En formación",
    grupoNombre: "Nuevos comienzos",
    fecha_inicio_liderazgo: "2026-01-15",
  },
  {
    nombre: "Elena Vásquez",
    telefono: "3001112241",
    cedula: "9400001009",
    email: "elena.vasquez.demo@example.invalid",
    rol: "Diácono",
    estado: "Activo",
    grupoNombre: "Tercer tiempo",
    fecha_inicio_liderazgo: "2021-09-01",
  },
  {
    nombre: "Santiago Ruiz",
    telefono: "3001112242",
    cedula: "9400001010",
    email: "santiago.ruiz.demo@example.invalid",
    rol: "Líder de grupo",
    estado: "Descanso",
    grupoNombre: "Artes y creatividad",
    fecha_inicio_liderazgo: "2020-01-01",
  },
  {
    nombre: "Valentina Acosta",
    telefono: "3001112243",
    cedula: "9400001011",
    email: "valentina.acosta.demo@example.invalid",
    rol: "Líder de grupo",
    estado: "Activo",
    grupoNombre: "Misiones locales",
    fecha_inicio_liderazgo: "2025-03-10",
  },
  {
    nombre: "Felipe Rojas",
    telefono: "3001112244",
    cedula: "9400001012",
    email: "felipe.rojas.demo@example.invalid",
    rol: "Coordinador",
    estado: "Activo",
    grupoNombre: "Discipulado 101",
    fecha_inicio_liderazgo: "2023-11-01",
  },
  {
    nombre: "Gabriela Mejía",
    telefono: "3001112245",
    cedula: "9400001013",
    email: "gabriela.mejia.demo@example.invalid",
    rol: "Mentor",
    estado: "En formación",
    grupoNombre: null,
    fecha_inicio_liderazgo: "2026-02-01",
  },
  {
    nombre: "Ricardo Pineda",
    telefono: "3001112246",
    cedula: "9400001014",
    email: "ricardo.pineda.demo@example.invalid",
    rol: "Diácono",
    estado: "Activo",
    grupoNombre: null,
    fecha_inicio_liderazgo: "2024-04-01",
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
    .from("lideres")
    .select("id, nombre")
    .eq("organization_id", organizationId);

  if (eErr) throw eErr;
  const nombresSet = new Set((existentes ?? []).map((r) => (r.nombre ?? "").trim().toLowerCase()));

  const aInsertar = LIDERES_IGLESIA.filter((l) => !nombresSet.has(l.nombre.trim().toLowerCase()));

  if (aInsertar.length === 0) {
    console.log("Todos los líderes de la lista ya existen en esta organización. Nada que insertar.");
    return;
  }

  const rows = aInsertar.map((l) => ({
    organization_id: organizationId,
    nombre: l.nombre,
    cedula: l.cedula,
    telefono: l.telefono,
    email: l.email,
    rol: l.rol,
    estado: l.estado,
    grupo_asignado: l.grupoNombre,
    miembros_a_cargo: 0,
    fecha_inicio_liderazgo: l.fecha_inicio_liderazgo,
    notas: null,
    persona_id: null,
    auth_user_id: null,
  }));

  const { data: inserted, error: insErr } = await supabase.from("lideres").insert(rows).select("id, nombre, grupo_asignado");
  if (insErr) {
    console.error("Error insertando líderes:", insErr.message);
    process.exit(1);
  }

  const { data: grupos } = await supabase
    .from("grupos")
    .select("id, nombre, lider_id")
    .eq("organization_id", organizationId);

  const grupoByNombre = new Map((grupos ?? []).map((g) => [g.nombre.trim().toLowerCase(), g]));

  let linked = 0;
  for (const row of inserted ?? []) {
    const gName = row.grupo_asignado?.trim();
    if (!gName) continue;
    const g = grupoByNombre.get(gName.toLowerCase());
    if (!g || g.lider_id) continue;
    const { error: uErr } = await supabase.from("grupos").update({ lider_id: row.id }).eq("id", g.id);
    if (!uErr) {
      linked++;
      grupoByNombre.set(gName.toLowerCase(), { ...g, lider_id: row.id });
    }
  }

  console.log(`Insertados ${inserted?.length ?? 0} líderes para la org del usuario ${seedEmail}:`);
  for (const r of inserted ?? []) {
    console.log(`  - ${r.nombre}${r.grupo_asignado ? ` → ${r.grupo_asignado}` : ""}`);
  }
  if (linked > 0) {
    console.log(`Vinculados ${linked} grupos (lider_id) donde antes no había líder.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
