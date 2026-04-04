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

const btnSecondaryClass =
  "flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300/60 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1] dark:focus:ring-white/20";

function Logo() {
  return (
    <Link href="/" className="font-logo text-3xl text-gray-900 dark:text-white">
      Bernabé
    </Link>
  );
}

function RegisterCommunityAvatars() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(100%,20rem)]">
      <div className="absolute left-[8%] top-1/2 z-20 -translate-y-1/2">
        <UserAvatar seed="registro·iglesia·nueva" size={96} className="ring-4 ring-white/90 dark:ring-white/10" />
      </div>
      <div className="absolute right-[6%] top-[18%] z-10">
        <UserAvatar seed="registro·equipo·1" size={76} className="ring-2 ring-gray-100 dark:ring-white/[0.08]" />
      </div>
      <div className="absolute bottom-[16%] right-[12%] z-10">
        <UserAvatar seed="registro·comunidad·2" size={68} className="ring-2 ring-gray-100 dark:ring-white/[0.08]" />
      </div>
      <div className="absolute left-[22%] top-[8%] z-[8]">
        <UserAvatar seed="registro·grupo·3" size={58} className="opacity-95 ring-2 ring-gray-100 dark:ring-white/[0.08]" />
      </div>
      <div className="absolute bottom-[8%] left-[18%] z-[8] hidden sm:block">
        <UserAvatar seed="registro·visita·4" size={54} className="opacity-90 ring-2 ring-gray-100 dark:ring-white/[0.08]" />
      </div>
      <div className="absolute right-[20%] bottom-[28%] z-[5] hidden sm:block">
        <UserAvatar seed="registro·pastor·5" size={48} className="opacity-85 ring-2 ring-gray-100 dark:ring-white/[0.08]" />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [churchName, setChurchName] = useState("");
  const [tuNombre, setTuNombre] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim() || !password || password.length < 8) {
      setErrorMessage("Usa un correo válido y contraseña de al menos 8 caracteres.");
      return;
    }
    setIsLoading(true);

    const supabase = createClient();
    const fullName = `${firstName} ${lastName}`.trim() || email.split("@")[0];

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          church_name: churchName,
        },
      },
    });

    if (error) {
      setErrorMessage(translateSupabaseAuthMessage(error.message));
      setIsLoading(false);
      return;
    }

    try {
      window.localStorage.setItem("bermabe_pending_church_name", churchName);
      window.localStorage.setItem("bermabe_pending_pastor_full_name", fullName);
      window.localStorage.setItem("bermabe_pending_pastor_email", email);
    } catch {
      // ignore
    }

    if (data.session) {
      router.push("/onboarding");
    } else {
      router.push("/login?verifyEmail=1");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#111111] lg:flex-row">
      <div className="scrollbar-brand flex flex-1 flex-col justify-center overflow-y-auto px-4 py-10 sm:px-6 lg:order-2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <Logo />
            <h1 className="mt-8 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Prueba Bernabé</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Comienza sin correo ni contraseña. En Supabase activa «Allow anonymous sign-ins» (Authentication → User Signups).
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

          <details className="mt-8 group">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-gray-600 underline-offset-4 hover:underline dark:text-gray-400">
              <span className="transition-transform group-open:rotate-90">▸</span>
              Usar correo y contraseña (opcional)
            </summary>
            <form
              onSubmit={handleSubmit}
              className="mt-4 space-y-4 border-t border-gray-200/80 pt-4 dark:border-white/[0.08]"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-gray-800 dark:text-gray-200">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder="Juan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-gray-800 dark:text-gray-200">
                    Apellido
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    placeholder="Pérez"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-800 dark:text-gray-200">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-800 dark:text-gray-200">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  className="mt-1 h-4 w-4 rounded border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-gray-300/60 dark:border-white/20 dark:bg-white/[0.06] dark:text-white dark:focus:ring-white/20"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                  Acepto los{" "}
                  <a href="#" className="font-medium text-gray-800 underline-offset-4 hover:underline dark:text-gray-200">
                    términos
                  </a>{" "}
                  y la{" "}
                  <a href="#" className="font-medium text-gray-800 underline-offset-4 hover:underline dark:text-gray-200">
                    privacidad
                  </a>
                </label>
              </div>

              <button type="submit" disabled={isLoading} className={btnSecondaryClass}>
                {isLoading ? "Creando cuenta…" : "Crear cuenta con correo"}
              </button>
            </form>
          </details>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
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
            <RegisterCommunityAvatars />
          </div>
          <h2 className="mt-8 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Organiza tu iglesia en minutos
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            MVP: sin correo obligatorio. Puedes usar cuenta más adelante.
          </p>
        </div>
      </div>
    </div>
  );
}
