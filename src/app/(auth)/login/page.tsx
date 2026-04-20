"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/UserAvatar";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseAuthMessage } from "@/lib/supabase-auth-messages";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-300/60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:ring-white/20";

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

function LoginHeroAvatar() {
  return (
    <div className="flex justify-center">
      <UserAvatar
        seed="bernabe-login-panel"
        sexo="femenino"
        size={112}
        className="!ring-0 shadow-none"
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerifyEmailHint, setShowVerifyEmailHint] = useState(false);

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      setShowVerifyEmailHint(p.get("verifyEmail") === "1");
    } catch {
      setShowVerifyEmailHint(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(translateSupabaseAuthMessage(signInError.message));
        setIsLoading(false);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("No se pudo obtener la sesión. Intenta de nuevo.");
        setIsLoading(false);
        return;
      }
      const { data: prof } = await supabase.from("profiles").select("organization_id").eq("id", user.id).maybeSingle();
      if (!prof?.organization_id) {
        router.push("/onboarding");
      } else {
        router.push("/home");
      }
      setIsLoading(false);
      router.refresh();
    } catch {
      setError("Error al iniciar sesión. Intenta de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#111111] lg:flex-row">
      <div className="scrollbar-brand flex flex-1 flex-col justify-center overflow-y-auto px-4 py-10 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10">
            <Logo />
            <h1 className="mt-8 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Bienvenido de nuevo</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Ingresa a tu cuenta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {showVerifyEmailHint && (
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 p-3 text-sm text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                Te enviamos un correo de verificación. Ábrelo y confirma tu cuenta; luego inicia sesión aquí para continuar con el
                registro de tu iglesia.
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-200/80 bg-red-50/90 p-3 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-800 dark:text-gray-200">
                Correo electrónico
              </label>
              <input type="email" id="email" name="email" required placeholder="tu@correo.com" className={inputClass} />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                  Contraseña
                </label>
                <a
                  href="#"
                  className="shrink-0 text-sm font-medium text-gray-600 underline-offset-4 hover:underline dark:text-gray-400"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <input type="password" id="password" name="password" required placeholder="••••••••" className={inputClass} />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 dark:focus:ring-white/30 dark:focus:ring-offset-[#111111]"
            >
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
                  Ingresando...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500 dark:text-gray-400">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-semibold text-gray-800 underline-offset-4 hover:underline dark:text-gray-200">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden flex-1 flex-col items-center justify-center p-10 lg:flex lg:rounded-l-[2rem] lg:bg-gray-100/60 dark:lg:bg-white/[0.04] xl:rounded-l-3xl xl:p-14">
        <div className="w-full max-w-md text-center">
          <div className="mb-2 rounded-3xl bg-white/70 px-6 py-10 shadow-sm shadow-black/[0.04] dark:bg-white/[0.06] dark:shadow-none">
            <LoginHeroAvatar />
          </div>
          <p className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-4 py-1.5 text-xs font-semibold text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/35 dark:text-emerald-100">
            Gratis para líderes y para iglesias
          </p>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Cuida a cada persona de tu iglesia
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Organiza grupos, da seguimiento y asegúrate de que nadie se quede sin atención.
          </p>
        </div>
      </div>
    </div>
  );
}
