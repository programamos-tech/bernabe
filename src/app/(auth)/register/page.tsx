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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    setErrorMessage(null);

    const supabase = createClient();
    const fullName = `${firstName} ${lastName}`.trim();

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

    // Pasamos la info al onboarding cuando ya haya sesión (o tras confirmar correo + login).
    try {
      window.localStorage.setItem("bermabe_pending_church_name", churchName);
      window.localStorage.setItem("bermabe_pending_pastor_full_name", fullName);
      window.localStorage.setItem("bermabe_pending_pastor_email", email);
    } catch {
      // Ignorado (por ejemplo, si el navegador bloquea localStorage)
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
      {/* Left side - Image */}
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
            Únete a más de 50 iglesias
          </h2>
          <p className="mt-3 text-gray-300">
            que ya organizan sus grupos y cuidan a cada persona con Bernabé.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <Logo />
            <h1 className="mt-8 text-2xl font-bold text-[#18301d] dark:text-white">
              Crea tu cuenta gratis
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Comienza a organizar tu iglesia en minutos
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="churchName" className="block text-sm font-medium text-[#18301d] dark:text-white mb-1.5">
                Nombre de tu iglesia
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-[#18301d] dark:text-white mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
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
                  required
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
                required
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
                required
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent transition"
              />
            </div>

            {errorMessage && (
              <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3">
                {errorMessage}
              </div>
            )}

            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                required
                className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#0ca6b2] focus:ring-[#0ca6b2]"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                Acepto los{" "}
                <a href="#" className="text-[#0ca6b2] hover:underline">términos de servicio</a>
                {" "}y la{" "}
                <a href="#" className="text-[#0ca6b2] hover:underline">política de privacidad</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#e64b27] text-white font-semibold rounded-xl hover:bg-[#d4421f] focus:outline-none focus:ring-2 focus:ring-[#e64b27] focus:ring-offset-2 dark:focus:ring-offset-[#111111] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creando cuenta...
                </>
              ) : (
                "Crear cuenta gratis"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
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
