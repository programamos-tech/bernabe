import { redirect } from "next/navigation";
import { getDashboardOrgPlanForUser } from "@/lib/dashboard-org-plan-server";
import { isLeaderIndividualPlan } from "@/lib/organization-plan";

export default async function LideresSectionLayout({ children }: { children: React.ReactNode }) {
  const plan = await getDashboardOrgPlanForUser();
  if (isLeaderIndividualPlan(plan)) {
    redirect("/home");
  }
  return children;
}
