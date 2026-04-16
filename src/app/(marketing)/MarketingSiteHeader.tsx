"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const navLink =
  "text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white";

const navLinkActive =
  "text-sm font-semibold text-gray-900 dark:text-white underline decoration-gray-300 decoration-2 underline-offset-8 dark:decoration-white/30";

function Logo() {
  return (
    <Link
      href="/"
      className="group flex shrink-0 items-center self-stretch leading-none"
      aria-label="Bernabé, inicio"
    >
      <span className="flex items-center gap-0.5 font-logo text-3xl leading-none text-gray-900 dark:text-white">
        <Image
          src="/ceiling.png"
          alt=""
          width={72}
          height={104}
          sizes="1.875rem"
          className="block h-[1em] w-auto shrink-0 object-contain object-center opacity-95 transition-opacity group-hover:opacity-100 dark:opacity-90 dark:group-hover:opacity-100"
          priority
        />
        Bernabé
      </span>
    </Link>
  );
}

export function MarketingSiteHeader() {
  const pathname = usePathname();
  const isRecursos = pathname === "/recursos" || pathname.startsWith("/recursos/");

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-md dark:border-white/[0.08] dark:bg-[#111111]/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/#features" className={navLink}>
              Características
            </Link>
            <Link href="/#precios" className={navLink}>
              Precios
            </Link>
            <Link href="/#recursos" className={navLink}>
              Comunidad
            </Link>
            <Link href="/recursos" className={isRecursos ? navLinkActive : navLink}>
              Recursos
            </Link>
            <Link href="/#how-it-works" className={navLink}>
              Cómo funciona
            </Link>
            <Link href="/#testimonials" className={navLink}>
              Testimonios
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 underline-offset-4 hover:underline dark:text-gray-400"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-gray-900 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm shadow-black/10 transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:shadow-none dark:hover:bg-gray-100"
            >
              Prueba 15 días
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
