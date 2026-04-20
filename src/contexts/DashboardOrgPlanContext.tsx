"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { OrganizationPlan } from "@/lib/organization-plan";

const DashboardOrgPlanContext = createContext<OrganizationPlan>("church");

export function DashboardOrgPlanProvider({
  plan,
  children,
}: {
  plan: OrganizationPlan;
  children: ReactNode;
}) {
  return <DashboardOrgPlanContext.Provider value={plan}>{children}</DashboardOrgPlanContext.Provider>;
}

export function useDashboardOrgPlan(): OrganizationPlan {
  return useContext(DashboardOrgPlanContext);
}
