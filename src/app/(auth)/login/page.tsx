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

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push("/home");
      router.refresh();
    } catch {
      setError("Error al iniciar sesión. Intenta de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#111111]">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10">
            <Logo />
            <h1 className="mt-8 text-2xl font-bold text-[#18301d] dark:text-white">
              Bienvenido de nuevo
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Ingresa a tu cuenta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#18301d] dark:text-white mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="tu@correo.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-[#18301d] dark:text-white">
                  Contraseña
                </label>
                <a href="#" className="text-sm text-[#0ca6b2] hover:text-[#0a8f99] transition">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#0ca6b2] text-white font-semibold rounded-xl hover:bg-[#0a8f99] focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:ring-offset-2 dark:focus:ring-offset-[#111111] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Ingresando...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-semibold text-[#e64b27] hover:text-[#d4421f] transition">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:flex flex-1 bg-[#faddbf]/30 dark:bg-[#1a1a1a] items-center justify-center p-12">
        <div className="max-w-md text-center">
          <Image
            src="/chica-transparente.png"
            alt="Comunidad"
            width={400}
            height={480}
            className="w-full h-auto object-contain"
          />
          <h2 className="mt-8 text-2xl font-bold text-[#18301d] dark:text-white">
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
