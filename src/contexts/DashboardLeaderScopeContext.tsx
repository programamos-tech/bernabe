"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  EMPTY_DASHBOARD_LEADER_SCOPE,
  type DashboardLeaderScope,
} from "@/lib/auth/dashboard-leader-scope";

const DashboardLeaderScopeContext = createContext<DashboardLeaderScope>(EMPTY_DASHBOARD_LEADER_SCOPE);

export function DashboardLeaderScopeProvider({
  scope,
  children,
}: {
  scope: DashboardLeaderScope;
  children: ReactNode;
}) {
  return (
    <DashboardLeaderScopeContext.Provider value={scope}>{children}</DashboardLeaderScopeContext.Provider>
  );
}

export function useDashboardLeaderScope(): DashboardLeaderScope {
  return useContext(DashboardLeaderScopeContext);
}
