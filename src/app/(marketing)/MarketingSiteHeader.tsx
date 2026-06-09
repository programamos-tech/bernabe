"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { btnPrimaryCompact, marketingCta } from "@/app/(marketing)/landing-shared";
import { BernabeLogo } from "@/components/BernabeLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

const navLink =
  "text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white";

const navLinkActive =
  "text-sm font-semibold text-gray-900 dark:text-white underline decoration-gray-300 decoration-2 underline-offset-8 dark:decoration-white/30";

function Logo() {
  return (
    <Link href="/" className="group flex shrink-0 items-center leading-none" aria-label="Bernabé — inicio">
      <BernabeLogo variant="header" />
    </Link>
  );
}

export function MarketingSiteHeader() {
  const pathname = usePathname();
  const isRecursos = pathname === "/recursos" || pathname.startsWith("/recursos/");

  return (
    <header className="fixed left-0 right-0 top-0 z-50 bg-white/80 backdrop-blur-md dark:bg-[#111111]/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-3 py-2">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/#para-lideres" className={navLink}>
              Para líderes
            </Link>
            <Link href="/recursos" className={isRecursos ? navLinkActive : navLink}>
              Recursos
            </Link>
            <Link href="/#how-it-works" className={navLink}>
              Cómo funciona
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 underline-offset-4 hover:underline dark:text-gray-400"
            >
              {marketingCta.login}
            </Link>
            <Link href="/register" className={btnPrimaryCompact}>
              {marketingCta.start}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
