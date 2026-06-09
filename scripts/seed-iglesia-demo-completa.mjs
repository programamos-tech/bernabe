/**
 * Demo completa para ver la plataforma como líder de iglesia:
 * - Usuario por email (lo crea si no existe)
 * - Plan `church` (Personas, Grupos, Eventos, Líderes, Calendario)
 * - ~12 grupos con día/hora (aparecen en calendario)
 * - ~100 personas con etapas y grupos variados
 * - Eventos de iglesia (servicios, clases, especiales)
 * - Líderes de demostración
 *
 * Uso:
 *   node --env-file=.env.local scripts/seed-iglesia-demo-completa.mjs [email]
 *   npm run seed:demo -- andrewjruss7@gmail.com
 */

import { createClient } from "@supabase/supabase-js";

const DEFAULT_EMAIL = "andrewjruss7@gmail.com";
const TARGET_PERSONAS = 100;
const DEMO_PASSWORD = "BereaDemo2026!";

const GRUPOS_IGLESIA = [
  { nombre: "Hombres de valor", tipo: "hombres", descripcion: "Encuentro de varones para compartir vida, responsabilidad y fe.", dia: "Sábados", hora: "07:00 AM", ubicacion: "Salón de hombres" },
  { nombre: "Mujeres con propósito", tipo: "mujeres", descripcion: "Espacio para mujeres que buscan crecer en Dios y en comunidad.", dia: "Martes", hora: "07:00 PM", ubicacion: "Salón de mujeres" },
  { nombre: "Pequeños exploradores", tipo: "general", descripcion: "Ministerio infantil con lecciones bíblicas y juegos.", dia: "Domingos", hora: "10:00 AM", ubicacion: "Aula infantil" },
  { nombre: "Alabanza y adoración", tipo: "general", descripcion: "Equipo de música y adoración en los servicios.", dia: "Jueves", hora: "08:00 PM", ubicacion: "Auditorio principal" },
  { nombre: "Intercesión", tipo: "general", descripcion: "Oración por la iglesia, la ciudad y las familias.", dia: "Miércoles", hora: "06:00 PM", ubicacion: "Sala de oración" },
  { nombre: "Universidad cristiana", tipo: "jovenes", descripcion: "Jóvenes universitarios: fe, amistades sanas y servicio.", dia: "Viernes", hora: "08:00 PM", ubicacion: "Sala multifuncional" },
  { nombre: "Matrimonios en camino", tipo: "parejas", descripcion: "Parecas en los primeros años de matrimonio.", dia: "Domingos", hora: "05:00 PM", ubicacion: "Salón lateral" },
  { nombre: "Nuevos comienzos", tipo: "general", descripcion: "Acompañamiento a quienes recién llegan a la iglesia.", dia: "Domingos", hora: "12:00 PM", ubicacion: "Sala de bienvenida" },
  { nombre: "Tercer tiempo", tipo: "general", descripcion: "Comunidad para adultos mayores.", dia: "Jueves", hora: "10:00 AM", ubicacion: "Salón comunitario" },
  { nombre: "Teens en acción", tipo: "teens", descripcion: "Adolescentes descubriendo su propósito en Cristo.", dia: "Sábados", hora: "04:00 PM", ubicacion: "Sala de teens" },
  { nombre: "Discipulado 101", tipo: "general", descripcion: "Fundamentos de la fe para nuevos creyentes.", dia: "Martes", hora: "08:00 PM", ubicacion: "Aula 2" },
  { nombre: "Misiones locales", tipo: "general", descripcion: "Salidas de servicio y visitas en barrios cercanos.", dia: "Sábados", hora: "09:00 AM", ubicacion: "Vestíbulo" },
];

const EVENTOS_IGLESIA = [
  { titulo: "Servicio dominical", tipo: "servicio", fecha: "2026-01-04", hora: "10:00", recurrente: true, ubicacion: "Templo principal", descripcion: "Culto principal de la iglesia." },
  { titulo: "Escuela bíblica", tipo: "clase", fecha: "2026-01-07", hora: "19:00", recurrente: true, ubicacion: "Aulas", descripcion: "Formación bíblica semanal." },
  { titulo: "Noche de ayuno", tipo: "especial", fecha: "2026-01-09", hora: "06:00", recurrente: true, ubicacion: "Templo principal", descripcion: "Ayuno y oración corporativa." },
  { titulo: "Consejo de líderes", tipo: "reunion", fecha: "2026-06-10", hora: "19:30", recurrente: false, ubicacion: "Sala de juntas", descripcion: "Revisión pastoral mensual." },
  { titulo: "Retiro de jóvenes", tipo: "especial", fecha: "2026-06-14", fecha_fin: "2026-06-15", hora: "08:00", recurrente: false, ubicacion: "Centro de retiros", descripcion: "Fin de semana de jóvenes." },
  { titulo: "Bautismos", tipo: "especial", fecha: "2026-06-22", hora: "11:30", recurrente: false, ubicacion: "Templo principal", descripcion: "Celebración de bautismos." },
  { titulo: "Capacitación de líderes", tipo: "clase", fecha: "2026-06-28", hora: "09:00", recurrente: false, ubicacion: "Aula 1", descripcion: "Formación para líderes de grupo." },
  { titulo: "Noche de alabanza", tipo: "servicio", fecha: "2026-07-04", hora: "19:00", recurrente: false, ubicacion: "Auditorio", descripcion: "Adoración y testimonios." },
];

const LIDERES_IGLESIA = [
  { nombre: "Rosa Ibarra Vargas", telefono: "3001112233", cedula: "9400001001", email: "rosa.ibarra.demo@example.invalid", rol: "Líder de grupo", estado: "Activo", grupoNombre: "Mujeres con propósito", fecha_inicio_liderazgo: "2024-03-01" },
  { nombre: "Marco Díaz Londoño", telefono: "3001112234", cedula: "9400001002", email: "marco.diaz.demo@example.invalid", rol: "Líder de grupo", estado: "Activo", grupoNombre: "Hombres de valor", fecha_inicio_liderazgo: "2024-02-15" },
  { nombre: "Lucía Fernández Ortiz", telefono: "3001112235", cedula: "9400001003", email: "lucia.fernandez.demo@example.invalid", rol: "Líder de grupo", estado: "En formación", grupoNombre: "Pequeños exploradores", fecha_inicio_liderazgo: "2025-11-01" },
  { nombre: "Andrés Muñoz", telefono: "3001112236", cedula: "9400001004", email: "andres.munoz.demo@example.invalid", rol: "Coordinador", estado: "Activo", grupoNombre: "Alabanza y adoración", fecha_inicio_liderazgo: "2023-06-01" },
  { nombre: "Patricia Gómez", telefono: "3001112237", cedula: "9400001005", email: "patricia.gomez.demo@example.invalid", rol: "Líder de grupo", estado: "Activo", grupoNombre: "Intercesión", fecha_inicio_liderazgo: "2024-01-10" },
  { nombre: "Diego Salazar", telefono: "3001112238", cedula: "9400001006", email: "diego.salazar.demo@example.invalid", rol: "Líder de grupo", estado: "Activo", grupoNombre: "Universidad cristiana", fecha_inicio_liderazgo: "2024-08-20" },
];

const nombres = [
  "María", "Carlos", "Ana", "Luis", "Laura", "Andrés", "Sofía", "Diego", "Valentina", "Juan",
  "Camila", "Sebastián", "Isabella", "Miguel", "Daniela", "Javier", "Paula", "Felipe", "Natalia", "Óscar",
  "Andrea", "Ricardo", "Juliana", "Fernando", "Carolina", "Alejandro", "Gabriela", "Esteban", "Mariana", "Iván",
  "Lucía", "Hugo", "Daniel", "Claudia", "Roberto", "Patricia", "Alberto", "Mónica", "César", "Diana",
  "Edgar", "Liliana", "Gustavo", "Adriana", "Héctor", "Sandra", "Ramón", "Carmen", "Emilio", "Rosa",
];

const apellidos = [
  "García", "Rodríguez", "Martínez", "López", "González", "Hernández", "Pérez", "Sánchez", "Ramírez", "Torres",
  "Flores", "Rivera", "Gómez", "Díaz", "Reyes", "Morales", "Cruz", "Ortiz", "Castro", "Romero",
  "Vargas", "Mendoza", "Rojas", "Contreras", "Jiménez", "Ruiz", "Herrera", "Medina", "Aguilar", "Vega",
];

const ETAPAS = [
  "visitante",
  "nuevo_creyente",
  "bautizado",
  "consolidado",
  "lider_en_formacion",
  "lider_grupo",
  "en_servicio",
  "inactivo",
];

function pick(arr, i) {
  return arr[i % arr.length];
}

function randomPhone(seed) {
  const n = 1000000 + (seed * 7919) % 8999999;
  return `3${String(n).padStart(9, "0").slice(0, 9)}`;
}

function randomContactDate(seed) {
  if (seed % 6 === 0) return null;
  const day = 1 + (seed * 13) % 28;
  const month = 1 + (seed * 7) % 12;
  const year = seed % 3 === 0 ? 2026 : 2025;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

async function findUserIdByEmail(admin, email) {
  const target = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const u = users.find((x) => (x.email ?? "").toLowerCase() === target);
    if (u) return u;
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}

async function ensureUserAndOrg(supabase, email) {
  let user = await findUserIdByEmail(supabase.auth.admin, email);
  let createdUser = false;

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Andrew Russ" },
    });
    if (error) throw error;
    user = data.user;
    createdUser = true;
  }

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("organization_id, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (pErr) throw pErr;

  let organizationId = profile?.organization_id;

  if (!organizationId) {
    const slug = `iglesia-berea-demo-${Math.random().toString(16).slice(2, 8)}`;
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .insert({
        name: "Comunidad Berea Demo",
        slug,
        country: "Colombia",
        city: "Bogotá",
        denomination: "Evangélica",
        size: "mediana",
        service_days: ["Domingo"],
        pastor_name: profile?.full_name || "Andrew Russ",
        pastor_email: email,
        pastor_role: "Pastor principal",
        plan: "church",
      })
      .select("id")
      .single();
    if (orgErr) throw orgErr;
    organizationId = org.id;

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({ organization_id: organizationId, role: "admin", full_name: profile?.full_name || "Andrew Russ" })
      .eq("id", user.id);
    if (profileErr) throw profileErr;

    const { error: liderErr } = await supabase.from("lideres").insert({
      organization_id: organizationId,
      nombre: profile?.full_name || "Andrew Russ",
      email,
      rol: "Pastor",
      estado: "Activo",
      grupo_asignado: null,
      miembros_a_cargo: 0,
      notas: "Cuenta principal (seed demo)",
      auth_user_id: user.id,
    });
    if (liderErr && !String(liderErr.message).includes("duplicate")) throw liderErr;
  } else {
    await supabase.from("organizations").update({ plan: "church" }).eq("id", organizationId);
  }

  return { userId: user.id, organizationId, createdUser };
}

async function seedGrupos(supabase, organizationId) {
  const { data: existentes, error: eErr } = await supabase
    .from("grupos")
    .select("id, nombre")
    .eq("organization_id", organizationId);
  if (eErr) throw eErr;

  const nombresSet = new Set((existentes ?? []).map((r) => (r.nombre ?? "").trim().toLowerCase()));
  const aInsertar = GRUPOS_IGLESIA.filter((g) => !nombresSet.has(g.nombre.trim().toLowerCase()));

  if (aInsertar.length === 0) return existentes ?? [];

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
  if (insErr) throw insErr;

  const { data: grupos, error: gErr } = await supabase
    .from("grupos")
    .select("id, nombre, dia, hora")
    .eq("organization_id", organizationId)
    .eq("activo", true);
  if (gErr) throw gErr;
  return grupos ?? [];
}

async function seedEventos(supabase, organizationId) {
  const { count, error: cErr } = await supabase
    .from("eventos")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if (cErr) throw cErr;
  if ((count ?? 0) >= 5) return 0;

  const { data: existentes } = await supabase
    .from("eventos")
    .select("titulo")
    .eq("organization_id", organizationId);
  const titulos = new Set((existentes ?? []).map((e) => (e.titulo ?? "").toLowerCase()));

  const rows = EVENTOS_IGLESIA.filter((e) => !titulos.has(e.titulo.toLowerCase())).map((e) => ({
    organization_id: organizationId,
    titulo: e.titulo,
    tipo: e.tipo,
    fecha: e.fecha,
    fecha_fin: e.fecha_fin ?? null,
    hora: e.hora,
    ubicacion: e.ubicacion,
    descripcion: e.descripcion,
    recurrente: e.recurrente,
    imagen: null,
    asistentes_esperados: e.recurrente ? 80 : 35,
    responsable: "Equipo pastoral",
  }));

  if (rows.length === 0) return 0;
  const { error } = await supabase.from("eventos").insert(rows);
  if (error) throw error;
  return rows.length;
}

function buildPersonasRows({ organizationId, grupos, count, cedulaStart }) {
  const gIds = grupos.map((g) => g.id);
  const rows = [];

  for (let k = 0; k < count; k++) {
    const nombre = `${pick(nombres, k + 3)} ${pick(apellidos, k * 2)} ${pick(apellidos, k + 7)}`;
    const cedula = String(cedulaStart + k + 1);
    const etapa = ETAPAS[k % ETAPAS.length];

    let grupo_id = null;
    let participacion_en_grupo = null;

    if (etapa !== "visitante" && etapa !== "inactivo") {
      grupo_id = gIds[k % gIds.length];
      if (etapa === "lider_grupo" || etapa === "lider_en_formacion") {
        participacion_en_grupo = k % 3 === 0 ? "colider" : "apoyo";
      } else {
        participacion_en_grupo = "miembro";
      }
    } else if (k % 3 === 0) {
      grupo_id = gIds[k % gIds.length];
      participacion_en_grupo = "miembro";
    }

    rows.push({
      organization_id: organizationId,
      cedula,
      nombre,
      telefono: randomPhone(cedulaStart + k),
      email: `demo.miembro.${cedula}@example.invalid`,
      grupo_id,
      participacion_en_grupo,
      rol: etapa === "visitante" ? "Visitante" : etapa === "lider_grupo" ? "Líder" : "Miembro",
      etapa,
      fecha_registro: "2025-08-01",
      ultimo_contacto: randomContactDate(k),
    });
  }

  return rows;
}

async function seedPersonas(supabase, organizationId, grupos) {
  const { count: existing, error: cErr } = await supabase
    .from("personas")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if (cErr) throw cErr;

  const need = Math.max(0, TARGET_PERSONAS - (existing ?? 0));
  if (need === 0) return 0;

  const { data: cedulasRows } = await supabase
    .from("personas")
    .select("cedula")
    .eq("organization_id", organizationId);

  let maxSeed = 9300000000;
  for (const row of cedulasRows ?? []) {
    const n = parseInt(String(row.cedula).replace(/\D/g, ""), 10);
    if (!Number.isNaN(n) && n >= 9300000000 && n < 9400000000) {
      maxSeed = Math.max(maxSeed, n);
    }
  }

  const rows = buildPersonasRows({ organizationId, grupos, count: need, cedulaStart: maxSeed });
  const { error: insErr } = await supabase.from("personas").insert(rows);
  if (insErr) throw insErr;
  return need;
}

async function updateMiembrosCount(supabase, organizationId) {
  const { data: grupos, error: gErr } = await supabase
    .from("grupos")
    .select("id")
    .eq("organization_id", organizationId);
  if (gErr) throw gErr;

  for (const g of grupos ?? []) {
    const { count, error: cErr } = await supabase
      .from("personas")
      .select("id", { count: "exact", head: true })
      .eq("grupo_id", g.id);
    if (cErr) throw cErr;
    await supabase.from("grupos").update({ miembros_count: count ?? 0 }).eq("id", g.id);
  }
}

async function seedLideres(supabase, organizationId) {
  const { data: existentes, error: eErr } = await supabase
    .from("lideres")
    .select("nombre")
    .eq("organization_id", organizationId);
  if (eErr) throw eErr;

  const nombresSet = new Set((existentes ?? []).map((r) => (r.nombre ?? "").trim().toLowerCase()));
  const { data: grupos } = await supabase
    .from("grupos")
    .select("id, nombre, lider_id")
    .eq("organization_id", organizationId);

  const grupoByName = new Map((grupos ?? []).map((g) => [g.nombre.trim().toLowerCase(), g]));
  let inserted = 0;

  for (const l of LIDERES_IGLESIA) {
    if (nombresSet.has(l.nombre.trim().toLowerCase())) continue;

    const { data: lider, error: insErr } = await supabase
      .from("lideres")
      .insert({
        organization_id: organizationId,
        nombre: l.nombre,
        telefono: l.telefono,
        cedula: l.cedula,
        email: l.email,
        rol: l.rol,
        estado: l.estado,
        grupo_asignado: l.grupoNombre,
        fecha_inicio_liderazgo: l.fecha_inicio_liderazgo,
        miembros_a_cargo: 0,
        notas: "Líder demo",
      })
      .select("id")
      .single();
    if (insErr) throw insErr;
    inserted += 1;

    const grupo = grupoByName.get(l.grupoNombre.trim().toLowerCase());
    if (grupo && !grupo.lider_id) {
      await supabase.from("grupos").update({ lider_id: lider.id }).eq("id", grupo.id);
    }
  }

  return inserted;
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

  console.log(`\n🌱 Seed demo iglesia para: ${seedEmail}\n`);

  const { organizationId, createdUser } = await ensureUserAndOrg(supabase, seedEmail);
  console.log(`✓ Organización: ${organizationId} (plan church)`);
  if (createdUser) {
    console.log(`✓ Usuario creado. Contraseña demo: ${DEMO_PASSWORD}`);
  }

  const grupos = await seedGrupos(supabase, organizationId);
  console.log(`✓ Grupos activos: ${grupos.length} (con día/hora para calendario)`);

  const eventosN = await seedEventos(supabase, organizationId);
  console.log(`✓ Eventos insertados: ${eventosN}`);

  const personasN = await seedPersonas(supabase, organizationId, grupos);
  console.log(`✓ Personas insertadas: ${personasN} (objetivo total: ${TARGET_PERSONAS})`);

  await updateMiembrosCount(supabase, organizationId);
  console.log("✓ Contadores de miembros por grupo actualizados");

  const lideresN = await seedLideres(supabase, organizationId);
  console.log(`✓ Líderes insertados: ${lideresN}`);

  const { count: totalPersonas } = await supabase
    .from("personas")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  console.log(`\n✅ Listo. Inicia sesión con ${seedEmail} y revisa Personas, Grupos, Calendario y Líderes.\n`);
  if (createdUser) {
    console.log(`   Email: ${seedEmail}`);
    console.log(`   Contraseña: ${DEMO_PASSWORD}\n`);
  }
  console.log(`   Total personas en la iglesia: ${totalPersonas ?? 0}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
