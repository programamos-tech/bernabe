"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { useDashboardOrgPlan } from "@/contexts/DashboardOrgPlanContext";
import { isLeaderIndividualPlan, whatsappIglesiaHref } from "@/lib/organization-plan";
import { createClient } from "@/lib/supabase/client";

const BASE_NAV = [
  { href: "/home", label: "Mi iglesia" },
  { href: "/personas", label: "Personas" },
  { href: "/grupos", label: "Grupos" },
  { href: "/eventos", label: "Eventos", churchOnly: true as const },
  { href: "/calendario", label: "Calendario" },
  { href: "/lideres", label: "Líderes", churchOnly: true as const },
  { href: "/comunidad", label: "Comunidad" },
] as const;

const MOBILE_ICONS: Record<string, JSX.Element> = {
  "/home": (
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  ),
  "/personas": (
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  ),
  "/grupos": (
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  ),
  "/eventos": (
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
  ),
  "/calendario": (
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  ),
  "/lideres": (
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  ),
  "/comunidad": (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
  ),
};

export function DashboardNavbar() {
  const pathname = usePathname();
  const plan = useDashboardOrgPlan();
  const leader = isLeaderIndividualPlan(plan);
  const [userSeed, setUserSeed] = useState<string>("Usuario");

  const navItems = useMemo(() => {
    return BASE_NAV.filter((item) => !leader || !("churchOnly" in item && item.churchOnly)).map((item) => ({
      href: item.href,
      label: item.href === "/home" ? (leader ? "Mi rebaño" : "Mi iglesia") : item.label,
    }));
  }, [leader]);

  const mobileNavItems = useMemo(
    () =>
      navItems.map((item) => ({
        href: item.href,
        label: item.label,
        icon: MOBILE_ICONS[item.href] ?? MOBILE_ICONS["/home"],
      })),
    [navItems]
  );

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserSeed(user?.email ?? user?.user_metadata?.full_name ?? "Usuario");
    });
  }, []);

  const waHref = whatsappIglesiaHref();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#111111]/95">
        <div className="flex h-14 w-full items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <Link
            href="/home"
            className="group flex min-w-0 shrink-0 items-center gap-1.5 leading-none sm:gap-2"
            aria-label="Bernabé, inicio. Que ninguna persona se pierda."
          >
            <div className="shrink-0" aria-hidden>
              <UserAvatar seed="bernabe-nav-logo" sexo="femenino" size={32} className="!ring-0 shadow-none" />
            </div>
            <span className="flex min-w-0 flex-col gap-px">
              <span className="font-logo text-lg leading-none text-gray-900 dark:text-white sm:text-xl">Bernabé</span>
              <span className="max-w-[10rem] text-[7px] font-medium leading-tight tracking-wide text-gray-500 dark:text-gray-400 sm:max-w-none sm:text-[8px]">
                Que ninguna persona se pierda
              </span>
            </span>
          </Link>

          {leader ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden shrink-0 items-center rounded-full border border-emerald-200/90 bg-emerald-50/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 transition hover:bg-emerald-100/90 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/60 md:inline-flex lg:px-3 lg:text-xs"
              title="Contactar por WhatsApp"
            >
              <span className="hidden lg:inline">Me interesa para mi iglesia</span>
              <span className="lg:hidden">WhatsApp</span>
            </a>
          ) : null}

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex">
            {navItems.map(({ href, label }) => {
              const isActive = pathname === href || (href !== "/home" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-md px-2.5 py-2 text-sm transition-colors lg:px-3 ${
                    isActive
                      ? "bg-gray-100 font-medium text-gray-900 dark:bg-white/[0.06] dark:text-white"
                      : "font-normal text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            {leader ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-md p-2 text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 md:hidden"
                aria-label="Me interesa para mi iglesia (WhatsApp)"
                title="WhatsApp"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.348.223-.646.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            ) : null}
            <ThemeToggle />
            <button
              type="button"
              className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
            <Link
              href="/cuenta"
              className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06]"
            >
              <UserAvatar seed={userSeed} size={36} />
            </Link>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/80 bg-white/95 pb-safe backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#111111]/95 md:hidden">
        <div className="scrollbar-hide flex h-14 items-center overflow-x-auto">
          <div className="flex min-w-max items-center gap-0.5 px-2">
            {mobileNavItems.map(({ href, label, icon }) => {
              const isActive = pathname === href || (href !== "/home" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors ${
                    isActive ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  <svg
                    className={`h-5 w-5 ${isActive ? "stroke-[1.75]" : "stroke-[1.5]"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {icon}
                  </svg>
                  <span className={`whitespace-nowrap text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>
                    {label}
                  </span>
                </Link>
              );
            })}
            {leader ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-emerald-700 dark:text-emerald-400"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.348.223-.646.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="whitespace-nowrap text-[10px] font-medium">Iglesia</span>
              </a>
            ) : null}
          </div>
        </div>
      </nav>
    </>
  );
}
