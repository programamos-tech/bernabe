"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { btnPrimaryForm, marketingCta } from "@/app/(marketing)/landing-shared";
import { AuthHeroGrupoCluster } from "@/components/AuthHeroGrupoCluster";
import { BernabeLogo } from "@/components/BernabeLogo";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseAuthMessage } from "@/lib/supabase-auth-messages";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-300/60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:ring-white/20";

function Logo() {
  return (
    <div className="py-1 sm:py-2">
      <Link
        href="/"
        className="group inline-flex shrink-0 items-center leading-none transition-opacity hover:opacity-90"
        aria-label="Bernabé — inicio"
      >
        <BernabeLogo variant="auth" />
      </Link>
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
            <p className="mt-8 text-sm text-gray-500 dark:text-gray-400 sm:mt-9">
              Crea tu espacio para cuidar con claridad: cada persona, su grupo y el próximo paso de acompañamiento en un
              solo lugar.
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

            <button type="button" onClick={handleStartMvp} disabled={isLoading} className={btnPrimaryForm}>
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
                marketingCta.start
              )}
            </button>
          </div>

          <p className="mt-8 text-left text-sm text-gray-500 dark:text-gray-400">
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
            <AuthHeroGrupoCluster />
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Cuida a cada persona de tu iglesia
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Cuida con seguimiento claro: conoce a cada persona, su etapa y cuándo fue el último contacto.
          </p>
        </div>
      </div>
    </div>
  );
}
