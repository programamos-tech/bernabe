"use client";

import Link from "next/link";
import { btnPrimaryCompact, marketingCta } from "@/app/(marketing)/landing-shared";
import { BernabeLogo } from "@/components/BernabeLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

function Logo() {
  return (
    <Link href="/" className="group flex shrink-0 items-center leading-none" aria-label="Bernabé — inicio">
      <BernabeLogo variant="header" />
    </Link>
  );
}

export function MarketingSiteHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 bg-white/80 backdrop-blur-md dark:bg-[#111111]/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-3 py-2">
          <Logo />
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
