import type { SupabaseClient, User } from "@supabase/supabase-js";

export type DashboardLeaderScope = {
  /** Líder de grupo invitado: no pastor ni admin */
  isGroupLeaderOnly: boolean;
  grupoId: string | null;
  liderId: string | null;
  liderNombre: string | null;
};

export const EMPTY_DASHBOARD_LEADER_SCOPE: DashboardLeaderScope = {
  isGroupLeaderOnly: false,
  grupoId: null,
  liderId: null,
  liderNombre: null,
};

export function grupoPathForScope(scope: DashboardLeaderScope): string | null {
  return scope.grupoId ? `/grupos/${scope.grupoId}` : null;
}

export function defaultPathForGroupLeader(scope: DashboardLeaderScope): string {
  return grupoPathForScope(scope) ?? "/cuenta";
}

/** Pastor o admin de la org: acceso completo al dashboard. */
export async function userHasFullDashboardAccess(
  supabase: SupabaseClient,
  user: User,
): Promise<boolean> {
  const { data: prof } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!prof?.organization_id) return true;

  if (prof.role === "admin") return true;

  const { data: org } = await supabase
    .from("organizations")
    .select("pastor_email")
    .eq("id", prof.organization_id)
    .maybeSingle();

  const pastorEmail = (org?.pastor_email ?? "").trim().toLowerCase();
  const userEmail = (user.email ?? "").trim().toLowerCase();
  return pastorEmail.length > 0 && userEmail === pastorEmail;
}

export async function resolveDashboardLeaderScope(
  supabase: SupabaseClient,
  user: User,
): Promise<DashboardLeaderScope> {
  const hasFull = await userHasFullDashboardAccess(supabase, user);
  if (hasFull) return EMPTY_DASHBOARD_LEADER_SCOPE;

  const { data: prof } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!prof?.organization_id) return EMPTY_DASHBOARD_LEADER_SCOPE;

  const { data: lider } = await supabase
    .from("lideres")
    .select("id, nombre")
    .eq("auth_user_id", user.id)
    .eq("organization_id", prof.organization_id)
    .maybeSingle();

  if (!lider) return EMPTY_DASHBOARD_LEADER_SCOPE;

  const { data: grupo } = await supabase
    .from("grupos")
    .select("id")
    .eq("lider_id", lider.id)
    .eq("organization_id", prof.organization_id)
    .maybeSingle();

  return {
    isGroupLeaderOnly: true,
    grupoId: (grupo?.id as string | undefined) ?? null,
    liderId: lider.id as string,
    liderNombre: (lider.nombre as string) ?? null,
  };
}

export function redirectPathForGroupLeader(path: string, scope: DashboardLeaderScope): string | null {
  if (!scope.isGroupLeaderOnly) return null;

  const dest = defaultPathForGroupLeader(scope);
  const blockedPrefixes = ["/personas", "/lideres", "/eventos", "/comunidad"];
  if (blockedPrefixes.some((p) => path === p || path.startsWith(`${p}/`))) {
    return dest;
  }

  if (path === "/home" || path === "/calendario" || path.startsWith("/calendario/")) {
    return dest;
  }

  if (path === "/grupos" || path === "/grupos/nuevo" || path.startsWith("/grupos/nuevo/")) {
    return dest;
  }

  if (scope.grupoId && path.startsWith("/grupos/")) {
    const suffix = path.slice("/grupos/".length);
    const segment = suffix.split("/")[0];
    if (segment && segment !== scope.grupoId) {
      return `/grupos/${scope.grupoId}`;
    }
  }

  return null;
}
