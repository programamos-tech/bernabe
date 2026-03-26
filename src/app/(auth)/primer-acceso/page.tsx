"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { translateSupabaseAuthMessage } from "@/lib/supabase-auth-messages";

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeSlashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.243L9.88 9.88"
      />
    </svg>
  );
}

export default function PrimerAccesoPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updErr } = await supabase.auth.updateUser({ password });
      if (updErr) {
        setError(translateSupabaseAuthMessage(updErr.message));
        setLoading(false);
        return;
      }

      const clearOnce = async () =>
        fetch("/api/auth/clear-must-change-password", {
          method: "POST",
          credentials: "same-origin",
        });

      let res = await clearOnce();
      let body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((body as { error?: string }).error ?? "No se pudo finalizar el acceso.");
        setLoading(false);
        return;
      }

      const refreshOnce = async () => supabase.auth.refreshSession();

      let { error: refreshErr } = await refreshOnce();
      if (refreshErr) {
        setError(
          refreshErr.message
            ? translateSupabaseAuthMessage(refreshErr.message)
            : "No se pudo actualizar la sesión. Intenta de nuevo o cierra sesión."
        );
        setLoading(false);
        return;
      }

      /* No re-leemos el perfil aquí: el servidor ya validó el UPDATE; el cliente a veces devolvía un falso negativo (RLS/caché/timing). */

      await new Promise((r) => setTimeout(r, 200));
      window.location.replace("/home");
      return;
    } catch {
      setError("Algo salió mal. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-[#111111]">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#18301d] dark:text-white">Actualiza tu contraseña</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
          Por seguridad, define una contraseña nueva antes de continuar. La que te enviaron era temporal.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="p1" className="block text-sm font-medium text-[#18301d] dark:text-white mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="p1"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white focus:ring-2 focus:ring-[#0ca6b2]"
                required
                minLength={8}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-500 hover:text-[#0ca6b2] hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0ca6b2]"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="p2" className="block text-sm font-medium text-[#18301d] dark:text-white mb-1">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                id="p2"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#18301d] dark:text-white focus:ring-2 focus:ring-[#0ca6b2]"
                required
                minLength={8}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-500 hover:text-[#0ca6b2] hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0ca6b2]"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Ocultar confirmación" : "Mostrar confirmación de contraseña"}
                aria-pressed={showConfirm}
              >
                {showConfirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0ca6b2] text-white font-semibold hover:bg-[#0a8f99] disabled:opacity-50 transition"
          >
            {loading ? "Guardando…" : "Continuar al inicio"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <button
            type="button"
            className="text-[#0ca6b2] hover:underline"
            onClick={async () => {
              await createClient().auth.signOut();
              router.push("/login");
              router.refresh();
            }}
          >
            Cerrar sesión
          </button>
        </p>
      </div>
    </div>
  );
}
