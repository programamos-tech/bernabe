/**
 * Rellena la tabla `personas` para la iglesia del usuario dado (por email en auth).
 * Requiere SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_URL en el entorno
 * (p. ej. `npm run seed:personas`).
 *
 * Objetivo: ~100 personas en total (no duplica si ya hay suficientes).
 */

import { createClient } from "@supabase/supabase-js";

const TARGET_TOTAL = 100;
const DEFAULT_EMAIL = "andrew@gmail.com";

const nombres = [
  "María", "Carlos", "Ana", "Luis", "Laura", "Andrés", "Sofía", "Diego", "Valentina", "Juan",
  "Camila", "Sebastián", "Isabella", "Miguel", "Daniela", "Javier", "Paula", "Felipe", "Natalia", "Óscar",
  "Andrea", "Ricardo", "Juliana", "Fernando", "Carolina", "Alejandro", "Gabriela", "Esteban", "Mariana", "Iván",
  "Lucía", "Hugo", "Daniel", "Claudia", "Roberto", "Patricia", "Alberto", "Monica", "César", "Diana",
  "Edgar", "Liliana", "Gustavo", "Adriana", "Héctor", "Sandra", "Ramón", "Carmen", "Emilio", "Rosa",
];

const apellidos = [
  "García", "Rodríguez", "Martínez", "López", "González", "Hernández", "Pérez", "Sánchez", "Ramírez", "Torres",
  "Flores", "Rivera", "Gómez", "Díaz", "Reyes", "Morales", "Cruz", "Ortiz", "Castro", "Romero",
  "Vargas", "Mendoza", "Rojas", "Contreras", "Jiménez", "Ruiz", "Herrera", "Medina", "Aguilar", "Vega",
];

function pick(arr, i) {
  return arr[i % arr.length];
}

function randomPhone(seed) {
  const n = 1000000 + (seed * 7919) % 8999999;
  return `3${String(n).padStart(9, "0").slice(0, 9)}`;
}

function randomContactDate(seed) {
  if (seed % 7 === 0) return null;
  const day = 1 + (seed * 13) % 28;
  const month = 1 + (seed * 7) % 12;
  const year = (seed % 2 === 0 ? 2026 : 2025);
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
    if (u) return u.id;
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}

function buildRows({ organizationId, grupos, count, cedulaStart }) {
  const gIds = grupos.map((g) => g.id);
  const rows = [];

  for (let k = 0; k < count; k++) {
    const i = k + 1;
    const nombre = `${pick(nombres, k + i * 3)} ${pick(apellidos, k * 2)} ${pick(apellidos, k + 5)}`;
    const cedula = String(cedulaStart + i);
    const telefono = randomPhone(cedulaStart + i);
    const emailPersona = `demo.miembro.${cedula}@example.invalid`;

    /** @type {"visitante"|"nuevo_creyente"|"en_proceso"|"consolidado"|"lider_en_formacion"|"lider_grupo"|"en_servicio"|"inactivo"} */
    let etapa;
    /** @type {"miembro"|"apoyo"|"colider"|null} */
    let participacion_en_grupo = null;
    let grupo_id = null;

    const bucket = k % 100;
    if (bucket < 68) {
      grupo_id = gIds[k % gIds.length];
      participacion_en_grupo = "miembro";
      etapa = "consolidado";
    } else if (bucket < 80) {
      grupo_id = gIds[k % gIds.length];
      participacion_en_grupo = k % 2 === 0 ? "apoyo" : "colider";
      etapa = "en_servicio";
    } else if (bucket < 88) {
      etapa = "visitante";
    } else if (bucket < 95) {
      etapa = "en_proceso";
    } else {
      grupo_id = gIds[k % gIds.length];
      participacion_en_grupo = "miembro";
      etapa = "inactivo";
    }

    rows.push({
      organization_id: organizationId,
      cedula,
      nombre,
      telefono,
      email: emailPersona,
      grupo_id,
      participacion_en_grupo,
      rol: etapa === "visitante" ? "Visitante" : "Miembro",
      etapa,
      fecha_registro: "2025-11-01",
      ultimo_contacto: randomContactDate(k),
    });
  }

  return rows;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const seedEmail = (process.argv[2] || process.env.SEED_USER_EMAIL || DEFAULT_EMAIL).trim();

  if (!url || !serviceKey) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (usa el mismo .env.local que la app)."
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userId = await findUserIdByEmail(supabase.auth.admin, seedEmail);
  if (!userId) {
    console.error(`No se encontró ningún usuario en Auth con el email: ${seedEmail}`);
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
    console.error("Ese perfil no tiene organization_id (completa el onboarding primero).");
    process.exit(1);
  }

  const { count: existing, error: cErr } = await supabase
    .from("personas")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (cErr) throw cErr;
  const need = Math.max(0, TARGET_TOTAL - (existing ?? 0));
  if (need === 0) {
    console.log(`Ya hay ${existing} personas en la organización (objetivo ${TARGET_TOTAL}). Nada que insertar.`);
    return;
  }

  let { data: grupos, error: gErr } = await supabase
    .from("grupos")
    .select("id, nombre")
    .eq("organization_id", organizationId)
    .eq("activo", true);

  if (gErr) throw gErr;

  if (!grupos?.length) {
    const any = await supabase
      .from("grupos")
      .select("id, nombre")
      .eq("organization_id", organizationId)
      .limit(20);
    if (any.error) throw any.error;
    grupos = any.data ?? [];
  }

  if (!grupos?.length) {
    const { error: rpcErr } = await supabase.rpc("create_default_grupos_and_eventos", {
      p_organization_id: organizationId,
    });
    if (rpcErr) {
      console.error("No hay grupos y falló create_default_grupos_and_eventos:", rpcErr.message);
      process.exit(1);
    }
    const again = await supabase
      .from("grupos")
      .select("id, nombre")
      .eq("organization_id", organizationId)
      .eq("activo", true);
    if (again.error) throw again.error;
    grupos = again.data;
  }

  if (!grupos?.length) {
    console.error("No se pudieron cargar grupos para asignar miembros.");
    process.exit(1);
  }

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
  const cedulaStart = maxSeed;

  const rows = buildRows({ organizationId, grupos, count: need, cedulaStart });

  const { error: insErr } = await supabase.from("personas").insert(rows);
  if (insErr) {
    console.error("Error insertando personas:", insErr.message);
    process.exit(1);
  }

  console.log(
    `Listo: +${need} personas para la org del usuario ${seedEmail} (ahora ~${(existing ?? 0) + need} en total).`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
