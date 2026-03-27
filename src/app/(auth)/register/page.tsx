"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseAuthMessage } from "@/lib/supabase-auth-messages";

function Logo() {
  return (
    <Link href="/" className="font-logo text-3xl text-[#18301d] dark:text-white">
      Bernabé
    </Link>
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
    <div className="min-h-screen flex bg-white dark:bg-[#111111]">
      <div className="hidden lg:flex flex-1 bg-[#18301d] dark:bg-[#0a1a0f] items-center justify-center p-12">
        <div className="max-w-md text-center">
          <Image
            src="/iglesia.jpg"
            alt="Iglesia"
            width={400}
            height={480}
            className="w-full h-auto object-contain rounded-2xl"
          />
          <h2 className="mt-8 text-2xl font-bold text-white">
            Organiza tu iglesia en minutos
          </h2>
          <p className="mt-3 text-gray-300">
            MVP: sin correo obligatorio. Puedes usar cuenta más adelante.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <Logo />
            <h1 className="mt-8 text-2xl font-bold text-[#18301d] dark:text-white">
              Prueba Bernabé
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Comienza sin correo ni contraseña. En Supabase activa «Allow anonymous sign-ins» (Authentication → User Signups).
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="churchName" className="block text-sm font-medium text-[#18301d] dark:text-white mb-1.5">
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent transition"
              />
            </div>
            <div>
              <label htmlFor="tuNombre" className="block text-sm font-medium text-[#18301d] dark:text-white mb-1.5">
                Tu nombre <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                id="tuNombre"
                name="tuNombre"
                placeholder="Cómo te mostramos en la app"
                value={tuNombre}
                onChange={(e) => setTuNombre(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent transition"
              />
            </div>

            {errorMessage && (
              <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3">
                {errorMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleStartMvp}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#e64b27] text-white font-semibold rounded-xl hover:bg-[#d4421f] focus:outline-none focus:ring-2 focus:ring-[#e64b27] focus:ring-offset-2 dark:focus:ring-offset-[#111111] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Entrando…
                </>
              ) : (
                "Comenzar sin correo"
              )}
            </button>
          </div>

          <details className="mt-8 group">
            <summary className="text-sm text-[#0ca6b2] cursor-pointer list-none flex items-center gap-2">
              <span className="group-open:rotate-90 transition-transform">▸</span>
              Usar correo y contraseña (opcional)
            </summary>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-[#18301d] dark:text-white mb-1.5">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder="Juan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-[#18301d] dark:text-white mb-1.5">
                    Apellido
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    placeholder="Pérez"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#18301d] dark:text-white mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#18301d] dark:text-white mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent transition"
                />
              </div>

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#0ca6b2] focus:ring-[#0ca6b2]"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                  Acepto los{" "}
                  <a href="#" className="text-[#0ca6b2] hover:underline">términos</a> y la{" "}
                  <a href="#" className="text-[#0ca6b2] hover:underline">privacidad</a>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#18301d] dark:bg-[#2a3d2f] text-white font-semibold rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {isLoading ? "Creando cuenta…" : "Crear cuenta con correo"}
              </button>
            </form>
          </details>

          <p className="mt-6 text-center text-gray-600 dark:text-gray-400 text-sm">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-semibold text-[#0ca6b2] hover:text-[#0a8f99] transition">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
