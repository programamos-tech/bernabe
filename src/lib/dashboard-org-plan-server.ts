import { createClient } from "@/lib/supabase/server";
import { parseOrganizationPlan, type OrganizationPlan } from "@/lib/organization-plan";

export async function getDashboardOrgPlanForUser(): Promise<OrganizationPlan> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "church";

    const { data: prof } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!prof?.organization_id) return "church";

    const { data: org } = await supabase
      .from("organizations")
      .select("plan")
      .eq("id", prof.organization_id)
      .maybeSingle();

    return parseOrganizationPlan(org?.plan as string | undefined);
  } catch {
    return "church";
  }
}
