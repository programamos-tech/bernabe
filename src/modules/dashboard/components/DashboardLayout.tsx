import { DashboardNavbar } from "./DashboardNavbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/80 dark:bg-[#0a0a0a]">
      <DashboardNavbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">{children}</div>
      </main>
    </div>
  );
}
