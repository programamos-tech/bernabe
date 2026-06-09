import { DashboardLeaderScopeProvider } from "@/contexts/DashboardLeaderScopeContext";
import { DashboardOrgPlanProvider } from "@/contexts/DashboardOrgPlanContext";
import { getDashboardLeaderScopeForUser } from "@/lib/auth/dashboard-leader-scope-server";
import { getDashboardOrgPlanForUser } from "@/lib/dashboard-org-plan-server";
import { DashboardLayout } from "@/modules/dashboard/components/DashboardLayout";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const [plan, leaderScope] = await Promise.all([getDashboardOrgPlanForUser(), getDashboardLeaderScopeForUser()]);
  return (
    <DashboardOrgPlanProvider plan={plan}>
      <DashboardLeaderScopeProvider scope={leaderScope}>
        <DashboardLayout>{children}</DashboardLayout>
      </DashboardLeaderScopeProvider>
    </DashboardOrgPlanProvider>
  );
}
