import { AuthHero } from "./AuthHero";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <AuthHero />
      <main className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-20 bg-white">
        {children}
      </main>
    </div>
  );
}
