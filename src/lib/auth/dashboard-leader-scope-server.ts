import {
  EMPTY_DASHBOARD_LEADER_SCOPE,
  resolveDashboardLeaderScope,
  type DashboardLeaderScope,
} from "@/lib/auth/dashboard-leader-scope";
import { createClient } from "@/lib/supabase/server";

export async function getDashboardLeaderScopeForUser(): Promise<DashboardLeaderScope> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return EMPTY_DASHBOARD_LEADER_SCOPE;
    return resolveDashboardLeaderScope(supabase, user);
  } catch {
    return EMPTY_DASHBOARD_LEADER_SCOPE;
  }
}
