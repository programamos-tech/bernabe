import { DashboardNavbar } from "./DashboardNavbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#111111]">
      <DashboardNavbar />
      <main className="flex-1 pb-20 lg:pb-0">
        <div className="w-full px-4 pt-2 pb-4 sm:px-6 sm:py-5 lg:px-8 xl:px-10 2xl:px-12">{children}</div>
      </main>
    </div>
  );
}
