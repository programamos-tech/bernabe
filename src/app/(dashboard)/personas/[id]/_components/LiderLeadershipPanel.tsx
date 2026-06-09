"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export type LiderVinculado = {
  id: string;
  rol: string | null;
  estado: string;
  fechaInicioLiderazgo: string | null;
  grupoAsignado: string | null;
  authUserId: string | null;
  grupoId: string | null;
  grupoNombre: string | null;
  miembrosCount: number;
};

const estadoStyles: Record<string, { dot: string; badge: string }> = {
  Activo: {
    dot: "bg-emerald-400/75",
    badge: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
  },
  "En formación": {
    dot: "bg-amber-300/90",
    badge: "bg-amber-400/15 text-amber-900 dark:text-amber-100",
  },
  Descanso: {
    dot: "bg-gray-400/85",
    badge: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
  },
};

function copyTextToClipboardSync(text: string): boolean {
  if (typeof document === "undefined") return false;
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function LiderLeadershipPanel({
  lider,
  personaEmail,
  onAuthUserIdChange,
}: {
  lider: LiderVinculado;
  personaEmail: string;
  onAuthUserIdChange?: (userId: string) => void;
}) {
  const [puedeDarAcceso, setPuedeDarAcceso] = useState(false);
  const [authUserId, setAuthUserId] = useState(lider.authUserId);
  const [accesoLoading, setAccesoLoading] = useState(false);
  const [accesoError, setAccesoError] = useState<string | null>(null);
  const [accesoModal, setAccesoModal] = useState<{ email: string; password: string } | null>(null);
  const [credencialesCopiadas, setCredencialesCopiadas] = useState(false);

  useEffect(() => {
    setAuthUserId(lider.authUserId);
  }, [lider.authUserId]);

  useEffect(() => {
    if (accesoModal) setCredencialesCopiadas(false);
  }, [accesoModal]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).maybeSingle();
      const orgId = (prof as { organization_id?: string } | null)?.organization_id;
      if (!orgId) return;
      const { data: org } = await supabase.from("organizations").select("pastor_email").eq("id", orgId).maybeSingle();
      const esAdmin = (prof as { role?: string } | null)?.role === "admin";
      const emailSesion = (user.email ?? "").trim().toLowerCase();
      const emailPastor = ((org as { pastor_email?: string } | null)?.pastor_email ?? "").trim().toLowerCase();
      setPuedeDarAcceso(esAdmin || (emailPastor.length > 0 && emailSesion === emailPastor));
    })();
  }, []);

  const estadoStyle = estadoStyles[lider.estado] ?? estadoStyles.Activo;
  const grupoNombre = lider.grupoNombre ?? lider.grupoAsignado ?? "Sin asignar";

  const generarAcceso = async () => {
    setAccesoError(null);
    setAccesoLoading(true);
    try {
      const res = await fetch(`/api/lideres/${lider.id}/crear-acceso`, { method: "POST" });
      const data = (await res.json()) as { error?: string; email?: string; temporaryPassword?: string; userId?: string };
      if (!res.ok) {
        setAccesoError(data.error ?? "No se pudo crear el acceso.");
        return;
      }
      if (data.email && data.temporaryPassword) {
        setAccesoModal({ email: data.email, password: data.temporaryPassword });
      }
      if (data.userId) {
        setAuthUserId(data.userId);
        onAuthUserIdChange?.(data.userId);
      }
    } finally {
      setAccesoLoading(false);
    }
  };

  const nuevaContrasena = async () => {
    setAccesoError(null);
    setAccesoLoading(true);
    try {
      const res = await fetch(`/api/lideres/${lider.id}/reset-acceso-temporal`, { method: "POST" });
      const data = (await res.json()) as { error?: string; email?: string; temporaryPassword?: string };
      if (!res.ok) {
        setAccesoError(data.error ?? "No se pudo generar la contraseña.");
        return;
      }
      if (data.email && data.temporaryPassword) {
        setAccesoModal({ email: data.email, password: data.temporaryPassword });
      }
    } finally {
      setAccesoLoading(false);
    }
  };

  const copiarCredenciales = () => {
    if (!accesoModal) return;
    const texto = `Acceso Berea\nCorreo: ${accesoModal.email}\nContraseña temporal: ${accesoModal.password}\n\nAl entrar te pedirá cambiar la contraseña. Entra en: ${typeof window !== "undefined" ? window.location.origin : ""}/login`;
    if (copyTextToClipboardSync(texto)) {
      setCredencialesCopiadas(true);
      window.setTimeout(() => setCredencialesCopiadas(false), 2500);
      return;
    }
    void navigator.clipboard?.writeText(texto);
  };

  return (
    <>
      <div className="rounded-3xl bg-gray-100/40 p-4 dark:bg-white/[0.04] sm:p-6">
        <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Liderazgo</h3>
          <Link
            href={`/lideres/${lider.id}/editar`}
            className="text-xs font-medium text-gray-600 underline-offset-4 hover:underline dark:text-gray-400"
          >
            Editar rol
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {lider.rol ? (
            <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-900 dark:text-sky-200">
              {lider.rol}
            </span>
          ) : null}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${estadoStyle.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${estadoStyle.dot}`} />
            {lider.estado}
          </span>
        </div>

        {lider.grupoId ? (
          <Link
            href={`/grupos/${lider.grupoId}#miembros-del-grupo`}
            className="mb-4 block rounded-2xl border border-gray-200/60 bg-white/50 p-3 transition hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">Grupo a cargo</p>
            <p className="mt-0.5 font-medium text-gray-900 dark:text-white">{grupoNombre}</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {lider.miembrosCount} {lider.miembrosCount === 1 ? "miembro" : "miembros"}
            </p>
          </Link>
        ) : (
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Grupo: <span className="font-medium text-gray-900 dark:text-white">{grupoNombre}</span>
          </p>
        )}

        {lider.fechaInicioLiderazgo ? (
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            Liderando desde {lider.fechaInicioLiderazgo}
          </p>
        ) : null}

        <div className="space-y-2 border-t border-gray-200/60 pt-4 dark:border-white/[0.08]">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Acceso a la plataforma</p>
          {puedeDarAcceso ? (
            <>
              {authUserId ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Cuenta activa</p>
                  <button
                    type="button"
                    onClick={() => void nuevaContrasena()}
                    disabled={accesoLoading}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-white/60 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/[0.06]"
                  >
                    {accesoLoading ? "Generando…" : "Nueva contraseña temporal"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void generarAcceso()}
                  disabled={accesoLoading || !personaEmail.trim()}
                  className="w-full rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  {accesoLoading ? "Creando…" : "Generar acceso"}
                </button>
              )}
              {!personaEmail.trim() ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">Añade un correo al miembro para generar acceso.</p>
              ) : null}
              {accesoError ? <p className="text-xs text-red-600 dark:text-red-400">{accesoError}</p> : null}
            </>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Solo el administrador o el pastor de la iglesia puede generar acceso.
            </p>
          )}
        </div>
      </div>

      {accesoModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setAccesoModal(null)} role="presentation">
          <div
            className="relative w-full max-w-md rounded-2xl border border-gray-200/60 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#1a1a1a]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Credenciales (solo esta vez)</h3>
            <div className="space-y-2 rounded-xl bg-gray-50 p-3 text-sm dark:bg-[#252525]">
              <p>
                <span className="text-gray-500">Correo:</span> <strong>{accesoModal.email}</strong>
              </p>
              <p>
                <span className="text-gray-500">Contraseña:</span> <strong>{accesoModal.password}</strong>
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setAccesoModal(null)} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm dark:border-white/10">
                Cerrar
              </button>
              <button
                type="button"
                onClick={copiarCredenciales}
                className="flex-1 rounded-xl bg-gray-900 py-2 text-sm font-medium text-white dark:bg-white dark:text-gray-900"
              >
                {credencialesCopiadas ? "Copiado" : "Copiar para WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
