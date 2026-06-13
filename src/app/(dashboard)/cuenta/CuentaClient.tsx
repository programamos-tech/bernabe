"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UserAvatar } from "@/components/UserAvatar";
import { NOTIFICACION_CATEGORIAS } from "@/lib/dashboard-notifications";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-300/60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:focus:ring-white/20";

const inputReadonlyClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 focus:outline-none dark:border-white/10 dark:bg-white/[0.04] dark:text-white";

const btnPrimaryClass =
  "rounded-xl bg-gray-900 px-6 py-2.5 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100";

function rolChipClass(rol: string) {
  const r = rol.toLowerCase();
  if (r.includes("pastor")) return "bg-violet-500/12 text-violet-900 dark:text-violet-200";
  if (r.includes("admin")) return "bg-sky-500/10 text-sky-900 dark:text-sky-200";
  if (r.includes("líder") || r.includes("lider")) return "bg-orange-500/10 text-orange-900 dark:text-orange-200";
  return "bg-gray-500/10 text-gray-800 dark:text-gray-300";
}

export type UsuarioCuenta = {
  nombre: string;
  email: string;
  telefono: string;
  rolLabel: string;
  miembroDesde: string;
};

export type IglesiaCuenta = {
  nombre: string;
  pais: string;
  ciudad: string;
  denominacion: string;
  tamano: string;
  pastorNombre: string;
  pastorEmail: string;
  pastorCargo: string;
  pastorTelefono: string;
  logoUrl: string | null;
  miembros: number;
  grupos: number;
  lideres: number;
};

export default function CuentaClient({
  initialUsuario,
  initialIglesia,
}: {
  initialUsuario: UsuarioCuenta | null;
  initialIglesia: IglesiaCuenta | null;
}) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab =
    tabParam === "notificaciones" || tabParam === "iglesia" || tabParam === "seguridad" ? tabParam : "perfil";
  const [activeTab, setActiveTab] = useState<"perfil" | "iglesia" | "notificaciones" | "seguridad">(initialTab);

  useEffect(() => {
    if (tabParam === "notificaciones" || tabParam === "iglesia" || tabParam === "seguridad") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const usuario = initialUsuario;
  const iglesia = initialIglesia;

  const tabs = [
    {
      id: "perfil",
      label: "Mi perfil",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        />
      ),
    },
    {
      id: "iglesia",
      label: "Mi rebaño",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
        />
      ),
    },
    {
      id: "notificaciones",
      label: "Notificaciones",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      ),
    },
    {
      id: "seguridad",
      label: "Seguridad",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      ),
    },
  ] as const;

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-24 md:pb-6">
      <div className="w-full">
        <div className="mb-3 md:mb-4">
          <h1 className="text-xl md:text-2xl font-medium text-[#18301d] dark:text-white tracking-tight">Mi cuenta</h1>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-snug">
            Administra tu perfil y la configuración de tu rebaño.
          </p>
        </div>

        <div className="mb-6 rounded-3xl bg-gray-100/50 p-6 dark:bg-white/[0.04]">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              <UserAvatar seed={usuario?.email ?? usuario?.nombre ?? "Usuario"} size={80} className="ring-2 ring-white/90 dark:ring-white/10" />
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md shadow-black/[0.08] transition hover:bg-gray-50 dark:bg-white/10 dark:shadow-none dark:hover:bg-white/[0.14]"
                aria-label="Cambiar foto"
              >
                <svg className="h-4 w-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </button>
            </div>

            <div className="min-w-0 text-center sm:text-left">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">{usuario?.nombre ?? "—"}</h2>
              <p className="mt-0.5 text-gray-500 dark:text-gray-400">{usuario?.email ?? ""}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {usuario?.rolLabel ? (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${rolChipClass(usuario.rolLabel)}`}>{usuario.rolLabel}</span>
                ) : null}
                {usuario?.miembroDesde ? (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Miembro desde {usuario.miembroDesde}</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
          <div className="scrollbar-brand overflow-x-auto border-b border-gray-200/60 dark:border-white/[0.08]">
            <div className="flex min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 border-b-2 px-5 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-gray-900 text-gray-900 dark:border-white dark:text-white"
                      : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    {tab.icon}
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === "perfil" && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Información personal</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre completo</label>
                      <input type="text" defaultValue={usuario?.nombre ?? ""} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Correo electrónico</label>
                      <input type="email" defaultValue={usuario?.email ?? ""} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                      <input type="tel" defaultValue={usuario?.telefono ?? ""} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Rol como líder</label>
                      <select defaultValue={usuario?.rolLabel ?? "Miembro"} className={inputClass}>
                        <option value="Pastor principal">Pastor principal</option>
                        <option value="Co-pastor">Co-pastor</option>
                        <option value="Administrador">Administrador</option>
                        <option value="Líder de ministerio">Líder de ministerio</option>
                        <option value="Secretario/a">Secretario/a</option>
                        <option value="Miembro">Miembro</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end border-t border-gray-200/60 pt-4 dark:border-white/[0.08]">
                  <button type="button" className={btnPrimaryClass}>
                    Guardar cambios
                  </button>
                </div>
              </div>
            )}

            {activeTab === "iglesia" && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Información de tu rebaño</h3>

                  <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="rounded-3xl bg-white/60 p-4 text-center dark:bg-white/[0.06]">
                      <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{iglesia?.miembros ?? 0}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Miembros</p>
                    </div>
                    <div className="rounded-3xl bg-white/60 p-4 text-center dark:bg-white/[0.06]">
                      <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{iglesia?.grupos ?? 0}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Grupos</p>
                    </div>
                    <div className="rounded-3xl bg-white/60 p-4 text-center dark:bg-white/[0.06]">
                      <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">{iglesia?.lideres ?? 0}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Líderes</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de tu rebaño</label>
                      <input type="text" defaultValue={iglesia?.nombre ?? ""} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">País</label>
                      <input type="text" defaultValue={iglesia?.pais ?? ""} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Ciudad</label>
                      <input type="text" defaultValue={iglesia?.ciudad ?? ""} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Denominación</label>
                      <input type="text" defaultValue={iglesia?.denominacion ?? ""} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tamaño congregación</label>
                      <input type="text" defaultValue={iglesia?.tamano ?? ""} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Pastor principal</label>
                      <input type="text" defaultValue={iglesia?.pastorNombre ?? ""} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Cargo</label>
                      <input type="text" defaultValue={iglesia?.pastorCargo ?? ""} readOnly className={inputReadonlyClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email del pastor</label>
                      <input type="email" defaultValue={iglesia?.pastorEmail ?? ""} className={inputClass} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono / WhatsApp</label>
                      <input type="tel" defaultValue={iglesia?.pastorTelefono ?? ""} className={inputClass} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end border-t border-gray-200/60 pt-4 dark:border-white/[0.08]">
                  <button type="button" className={btnPrimaryClass}>
                    Guardar cambios
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notificaciones" && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Preferencias de notificaciones</h3>
                  <div className="space-y-3">
                    {NOTIFICACION_CATEGORIAS.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 rounded-2xl bg-white/60 p-4 dark:bg-white/[0.06]"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center shrink-0">
                          <input type="checkbox" defaultChecked className="peer sr-only" />
                          <div className="relative h-6 w-11 shrink-0 rounded-full bg-gray-200 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:bg-gray-900 peer-checked:after:translate-x-5 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-300/50 dark:bg-white/10 dark:peer-checked:bg-white dark:peer-focus:ring-white/20 dark:peer-checked:after:bg-gray-900" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "seguridad" && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Cambiar contraseña</h3>
                  <div className="max-w-md space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña actual</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className={`${inputClass} placeholder:text-gray-400`}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nueva contraseña</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className={`${inputClass} placeholder:text-gray-400`}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar nueva contraseña</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className={`${inputClass} placeholder:text-gray-400`}
                      />
                    </div>
                    <button type="button" className={btnPrimaryClass}>
                      Actualizar contraseña
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

