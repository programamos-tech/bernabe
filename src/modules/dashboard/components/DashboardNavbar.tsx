"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/home", label: "Inicio" },
  { href: "/comunidad", label: "Comunidad" },
  { href: "/personas", label: "Personas" },
  { href: "/grupos", label: "Grupos" },
  { href: "/eventos", label: "Eventos" },
  { href: "/calendario", label: "Calendario" },
  { href: "/lideres", label: "Líderes" },
] as const;

const mobileNavItems = [
  {
    href: "/home",
    label: "Inicio",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    ),
  },
  {
    href: "/comunidad",
    label: "Comunidad",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
    ),
  },
  {
    href: "/personas",
    label: "Personas",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    ),
  },
  {
    href: "/grupos",
    label: "Grupos",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    ),
  },
  {
    href: "/eventos",
    label: "Eventos",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
    ),
  },
  {
    href: "/calendario",
    label: "Calendario",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    ),
  },
  {
    href: "/lideres",
    label: "Líderes",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    ),
  },
] as const;

export function DashboardNavbar() {
  const pathname = usePathname();
  const [userSeed, setUserSeed] = useState<string>("Usuario");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserSeed(user?.email ?? user?.user_metadata?.full_name ?? "Usuario");
    });
  }, []);

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#2a2a2a]">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <Link href="/home" className="inline-block group">
            <span className="font-logo text-2xl text-[#18301d] dark:text-white tracking-tight block">
              Bernabé
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label }) => {
              const isActive = pathname === href || (href !== "/home" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    isActive
                      ? "bg-[#0ca6b2] text-white"
                      : "text-gray-600 dark:text-gray-300 hover:text-[#18301d] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-[#18301d] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
            <Link
              href="/cuenta"
              className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              <UserAvatar seed={userSeed} size={36} />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-[#2a2a2a] pb-safe">
        <div className="flex items-center h-16 overflow-x-auto scrollbar-hide">
          <div className="flex items-center px-2 gap-1 min-w-max">
            {mobileNavItems.map(({ href, label, icon }) => {
              const isActive = pathname === href || (href !== "/home" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-colors flex-shrink-0 ${
                    isActive
                      ? "text-[#0ca6b2]"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  <svg
                    className={`w-6 h-6 ${isActive ? "stroke-[2]" : "stroke-[1.5]"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {icon}
                  </svg>
                  <span className={`text-[10px] whitespace-nowrap ${isActive ? "font-semibold" : "font-medium"}`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
