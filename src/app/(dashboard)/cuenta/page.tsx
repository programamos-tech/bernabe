import { createClient } from "@/lib/supabase/server";
import CuentaClient, { type IglesiaCuenta, type UsuarioCuenta } from "./CuentaClient";

const formatEsMonthYear = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
};

export default async function Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <CuentaClient initialUsuario={null} initialIglesia={null} />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, phone, created_at, organization_id")
    .eq("id", user.id)
    .single();

  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  let initialIglesia: IglesiaCuenta | null = null;
  let org: { pastor_email: string | null; pastor_role: string | null; pastor_phone: string | null } | null = null;

  if (profile?.organization_id) {
    const { data: orgData } = await supabase
      .from("organizations")
      .select("name, country, city, denomination, size, pastor_name, pastor_email, pastor_role, pastor_phone, service_days, logo_url")
      .eq("id", profile.organization_id)
      .single();

    org = orgData;

    const [miembrosRes, gruposRes, lideresRes] = await Promise.all([
      supabase.from("personas").select("id", { count: "exact", head: true }),
      supabase.from("grupos").select("id", { count: "exact", head: true }),
      supabase.from("lideres").select("id", { count: "exact", head: true }),
    ]);

    initialIglesia = {
      nombre: orgData?.name ?? "",
      pais: orgData?.country ?? "",
      ciudad: orgData?.city ?? "",
      denominacion: orgData?.denomination ?? "",
      tamano: orgData?.size ?? "",
      pastorNombre: orgData?.pastor_name ?? "",
      pastorEmail: orgData?.pastor_email ?? "",
      pastorCargo: orgData?.pastor_role ?? "",
      pastorTelefono: orgData?.pastor_phone ?? "",
      diasServicio: Array.isArray(orgData?.service_days) ? orgData.service_days.join(", ") : "",
      logoUrl: orgData?.logo_url ?? null,
      miembros: miembrosRes.count ?? 0,
      grupos: gruposRes.count ?? 0,
      lideres: lideresRes.count ?? 0,
    };
  }

  const isPastor = org?.pastor_email != null && org.pastor_email === user.email;
  const roleLabel = isPastor
    ? (org?.pastor_role ?? "Pastor")
    : profile?.role === "admin"
      ? "Administrador"
      : "Miembro";
  const telefono = (profile?.phone ?? (isPastor ? org?.pastor_phone : null)) ?? "";

  const initialUsuario: UsuarioCuenta = {
    nombre: profile?.full_name ?? meta?.full_name ?? meta?.name ?? user.email ?? "Usuario",
    email: user.email ?? "",
    telefono: telefono ?? "",
    rolLabel: roleLabel,
    miembroDesde: formatEsMonthYear(profile?.created_at ?? user.created_at),
  };

  return <CuentaClient initialUsuario={initialUsuario} initialIglesia={initialIglesia} />;
}
