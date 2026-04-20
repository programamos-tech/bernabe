"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/UserAvatar";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseAuthMessage } from "@/lib/supabase-auth-messages";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-300/60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:ring-white/20";

const btnPrimaryClass =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 dark:focus:ring-white/30 dark:focus:ring-offset-[#111111]";

function Logo() {
  return (
    <Link
      href="/"
      className="group inline-flex max-w-full items-center gap-2 self-start leading-none sm:gap-2.5"
      aria-label="Bernabé, inicio. Que ninguna persona se pierda."
    >
      <div className="shrink-0" aria-hidden>
        <UserAvatar
          seed="bernabe-nav-logo"
          sexo="femenino"
          size={40}
          className="!ring-0 shadow-none"
        />
      </div>
      <span className="flex min-w-0 flex-col gap-0.5 text-left">
        <span className="font-logo text-2xl leading-none text-gray-900 dark:text-white sm:text-3xl">Bernabé</span>
        <span className="max-w-[14rem] text-[9px] font-medium leading-tight tracking-wide text-gray-500 dark:text-gray-400 sm:max-w-none sm:text-[10px]">
          Que ninguna persona se pierda
        </span>
      </span>
    </Link>
  );
}

function RegisterHeroAvatar() {
  return (
    <div className="flex justify-center">
      <UserAvatar
        seed="bernabe-register-panel"
        sexo="femenino"
        size={112}
        className="!ring-0 shadow-none"
      />
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [churchName, setChurchName] = useState("");
  const [tuNombre, setTuNombre] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartMvp = async () => {
    setErrorMessage(null);
    if (!churchName.trim()) {
      setErrorMessage("Indica el nombre de tu iglesia.");
      return;
    }
    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setErrorMessage(translateSupabaseAuthMessage(error.message));
      setIsLoading(false);
      return;
    }
    const fullName = tuNombre.trim() || "Administrador";
    try {
      window.localStorage.setItem("bermabe_pending_church_name", churchName);
      window.localStorage.setItem("bermabe_pending_pastor_full_name", fullName);
      window.localStorage.setItem("bermabe_pending_pastor_email", "");
    } catch {
      // ignore
    }
    router.push("/onboarding");
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#111111] lg:flex-row">
      <div className="scrollbar-brand flex flex-1 flex-col justify-center overflow-y-auto px-4 py-10 sm:px-6 lg:order-2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <Logo />
            <h1 className="mt-8 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Únete a Bernabé</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Gratis para líderes y para iglesias. Cuida a las personas que pastoreas con seguimiento claro, sin complicarte con
              precios desde el primer día.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="churchName" className="mb-1.5 block text-sm font-medium text-gray-800 dark:text-gray-200">
                Nombre de tu iglesia *
              </label>
              <input
                type="text"
                id="churchName"
                name="churchName"
                required
                placeholder="Ej: Iglesia Vida Nueva"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="tuNombre" className="mb-1.5 block text-sm font-medium text-gray-800 dark:text-gray-200">
                Tu nombre <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                type="text"
                id="tuNombre"
                name="tuNombre"
                placeholder="Cómo te mostramos en la app"
                value={tuNombre}
                onChange={(e) => setTuNombre(e.target.value)}
                className={inputClass}
              />
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-200">
                {errorMessage}
              </div>
            )}

            <button type="button" onClick={handleStartMvp} disabled={isLoading} className={btnPrimaryClass}>
              {isLoading ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Entrando…
                </>
              ) : (
                "Comenzar sin correo"
              )}
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-gray-800 underline-offset-4 hover:underline dark:text-gray-200">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden flex-1 flex-col items-center justify-center p-10 lg:order-1 lg:flex lg:rounded-r-[2rem] lg:bg-gray-100/60 dark:lg:bg-white/[0.04] xl:rounded-r-3xl xl:p-14">
        <div className="w-full max-w-md text-center">
          <div className="mb-2 rounded-3xl bg-white/70 px-6 py-10 shadow-sm shadow-black/[0.04] dark:bg-white/[0.06] dark:shadow-none">
            <RegisterHeroAvatar />
          </div>
          <p className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-4 py-1.5 text-xs font-semibold text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/35 dark:text-emerald-100">
            Gratis para líderes y para iglesias
          </p>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Que ninguna persona se pierda
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Personas, grupos y próximos pasos en un solo lugar. Bernabé es gratis para quien lidera solo y para la iglesia
            entera: el enfoque es el ministerio, no la caja registradora.
          </p>
        </div>
      </div>
    </div>
  );
}
