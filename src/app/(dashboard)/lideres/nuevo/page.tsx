"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** Los líderes se crean promoviendo un miembro existente en Personas. */
export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/personas");
  }, [router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-gray-600 dark:text-gray-400">
        Los líderes deben salir de los miembros. Te llevamos a Personas…
      </p>
      <Link href="/personas" className="font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white">
        Ir a Personas
      </Link>
    </div>
  );
}
