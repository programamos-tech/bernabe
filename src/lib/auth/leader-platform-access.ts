import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Quien puede generar acceso (usuario/contraseña) para un líder:
 * - perfil admin de la misma organización, o
 * - el correo de sesión coincide con organizations.pastor_email de esa iglesia.
 */
export async function userCanManageLeaderPlatformAccess(
  supabase: SupabaseClient,
  user: User,
  liderOrganizationId: string
): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (error || !profile?.organization_id || profile.organization_id !== liderOrganizationId) {
    return false;
  }

  if (profile.role === "admin") return true;

  const { data: org } = await supabase.from("organizations").select("pastor_email").eq("id", liderOrganizationId).maybeSingle();

  const pastorEmail = (org?.pastor_email ?? "").trim().toLowerCase();
  const userEmail = (user.email ?? "").trim().toLowerCase();
  return pastorEmail.length > 0 && userEmail === pastorEmail;
}
