"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BernabeLogo } from "@/components/BernabeLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { useDashboardLeaderScope } from "@/contexts/DashboardLeaderScopeContext";
import { useDashboardOrgPlan } from "@/contexts/DashboardOrgPlanContext";
import { defaultPathForGroupLeader, grupoPathForScope } from "@/lib/auth/dashboard-leader-scope";
import { FEATURE_COMUNIDAD_VISIBLE, FEATURE_EVENTOS_VISIBLE } from "@/lib/feature-flags";
import { isLeaderIndividualPlan } from "@/lib/organization-plan";
import { createClient } from "@/lib/supabase/client";
import { DashboardNotifications } from "@/modules/dashboard/components/DashboardNotifications";

const BASE_NAV = [
  { href: "/home", label: "Mi rebaño" },
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

/** Pestañas principales en la barra inferior móvil/tablet. */
const MOBILE_TAB_HREFS = ["/home", "/personas", "/grupos", "/calendario"] as const;

function navHrefIsActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href.startsWith("/grupos/") && pathname.startsWith(href)) return true;
  if (href === "/home") return pathname === "/home";
  if (!href.startsWith("/grupos/") && pathname.startsWith(href)) return true;
  return false;
}

async function resolveUserRoleLabel(
  supabase: ReturnType<typeof createClient>,
  userEmail: string | undefined,
  profileRole: string | null | undefined,
  organizationId: string | null | undefined,
  leaderPlan: boolean,
): Promise<string> {
  if (organizationId && userEmail) {
    const { data: org } = await supabase
      .from("organizations")
      .select("pastor_email, pastor_role")
      .eq("id", organizationId)
      .maybeSingle();
    if (org?.pastor_email === userEmail) {
      return org.pastor_role?.trim() || "Pastor";
    }
  }
  if (profileRole === "admin") return "Administrador";
  if (leaderPlan) return "Líder";
  return "Miembro";
}

export function DashboardNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const plan = useDashboardOrgPlan();
  const leaderScope = useDashboardLeaderScope();
  const leader = isLeaderIndividualPlan(plan);
  const groupLeaderOnly = leaderScope.isGroupLeaderOnly;
  const homeHref = groupLeaderOnly ? defaultPathForGroupLeader(leaderScope) : "/home";
  const miGrupoHref = grupoPathForScope(leaderScope);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userSeed, setUserSeed] = useState<string>("Usuario");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleNotificationsOpenChange = (open: boolean) => {
    setNotificationsOpen(open);
    if (open) setMenuOpen(false);
  };

  const navItems = useMemo(() => {
    if (groupLeaderOnly) {
      if (miGrupoHref) {
        return [{ href: miGrupoHref, label: "Mi grupo" }];
      }
      return [{ href: "/cuenta", label: "Mi cuenta" }];
    }
    return BASE_NAV.filter((item) => {
      if (!FEATURE_EVENTOS_VISIBLE && item.href === "/eventos") return false;
      if (!FEATURE_COMUNIDAD_VISIBLE && item.href === "/comunidad") return false;
      if (leader && "churchOnly" in item && item.churchOnly) return false;
      return true;
    }).map((item) => ({
      href: item.href,
      label: item.href === "/home" ? "Mi rebaño" : item.label,
    }));
  }, [groupLeaderOnly, leader, miGrupoHref]);

  const mobileNavItems = useMemo(() => {
    const source = groupLeaderOnly
      ? navItems
      : navItems.filter((item) => MOBILE_TAB_HREFS.includes(item.href as (typeof MOBILE_TAB_HREFS)[number]));

    return source.map((item) => ({
      href: item.href,
      label: item.label,
      icon:
        item.href.startsWith("/grupos/") ? MOBILE_ICONS["/grupos"] : (MOBILE_ICONS[item.href] ?? MOBILE_ICONS["/home"]),
    }));
  }, [navItems, groupLeaderOnly]);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role, organization_id")
        .eq("id", user.id)
        .maybeSingle();
      const name = profile?.full_name ?? meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "Usuario";
      const role = groupLeaderOnly
        ? "Líder de grupo"
        : await resolveUserRoleLabel(
            supabase,
            user.email,
            profile?.role,
            profile?.organization_id,
            leader,
          );
      setUserName(name);
      setUserRole(role);
      setUserSeed(user.email ?? name);
    });
  }, [groupLeaderOnly, leader]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const handleCerrarSesion = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setMenuOpen(false);
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white backdrop-blur-sm dark:bg-[#111111]">
        <div className="flex h-14 w-full items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <Link href={homeHref} className="group flex shrink-0 items-center leading-none" aria-label="Bernabé — inicio">
            <BernabeLogo variant="header" />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:gap-2 xl:flex">
            {navItems.map(({ href, label }) => {
              const isActive = navHrefIsActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`whitespace-nowrap px-2 py-2 text-sm transition-colors xl:px-3 ${
                    isActive
                      ? "font-medium text-gray-900 dark:text-white"
                      : "font-normal text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <DashboardNotifications
              leaderFree={leader}
              open={notificationsOpen}
              onOpenChange={handleNotificationsOpenChange}
            />
            <ThemeToggle />
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(false);
                  setMenuOpen((isOpen) => !isOpen);
                }}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Menú de cuenta"
                className="flex max-w-[3rem] items-center gap-2 rounded-md py-1 pl-1 pr-1 text-left transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06] lg:max-w-[14rem] lg:pr-2"
              >
                <UserAvatar seed={userSeed} size={36} />
                {userName ? (
                  <span className="hidden min-w-0 flex-1 flex-col lg:flex">
                    <span className="truncate text-sm font-medium leading-tight text-gray-900 dark:text-white">
                      {userName}
                    </span>
                    {userRole ? (
                      <span className="truncate text-xs leading-tight text-gray-500 dark:text-gray-400">{userRole}</span>
                    ) : null}
                  </span>
                ) : null}
                <svg
                  className={`hidden h-4 w-4 shrink-0 text-gray-400 transition-transform lg:block ${menuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-gray-200/80 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#1a1a1a]"
                >
                  <div className="border-b border-gray-100 px-4 py-3 dark:border-white/10 lg:hidden">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{userName || "Usuario"}</p>
                    {userRole ? <p className="truncate text-xs text-gray-500 dark:text-gray-400">{userRole}</p> : null}
                  </div>
                  <Link
                    href="/cuenta"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50 dark:text-white dark:hover:bg-white/[0.06]"
                  >
                    Mi cuenta
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={loggingOut}
                    onClick={() => void handleCerrarSesion()}
                    className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/80 bg-white/95 pb-safe backdrop-blur-md dark:border-white/[0.06] dark:bg-[#111111]/95 xl:hidden"
        aria-label="Navegación principal"
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch px-2 sm:max-w-none sm:px-3">
          {mobileNavItems.map(({ href, label, icon }) => {
            const isActive = navHrefIsActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-colors ${
                  isActive
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    isActive ? "bg-gray-900/10 dark:bg-white/10" : ""
                  }`}
                >
                  <svg
                    className={`h-5 w-5 shrink-0 ${isActive ? "stroke-[1.75]" : "stroke-[1.5]"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    {icon}
                  </svg>
                </span>
                <span
                  className={`max-w-full truncate text-center text-[10px] leading-none sm:text-[11px] ${isActive ? "font-semibold" : "font-medium"}`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
