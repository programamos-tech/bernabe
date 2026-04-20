import { DashboardOrgPlanProvider } from "@/contexts/DashboardOrgPlanContext";
import { getDashboardOrgPlanForUser } from "@/lib/dashboard-org-plan-server";
import { DashboardLayout } from "@/modules/dashboard/components/DashboardLayout";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const plan = await getDashboardOrgPlanForUser();
  return (
    <DashboardOrgPlanProvider plan={plan}>
      <DashboardLayout>{children}</DashboardLayout>
    </DashboardOrgPlanProvider>
  );
}
