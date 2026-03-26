"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/UserAvatar";

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
  diasServicio: string;
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"perfil" | "iglesia" | "notificaciones" | "seguridad">("perfil");
  const [loggingOut, setLoggingOut] = useState(false);

  const usuario = initialUsuario;
  const iglesia = initialIglesia;

  const handleCerrarSesion = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

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
      label: "Mi iglesia",
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
    <div className="px-4 py-8 md:px-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#18301d] dark:text-white">Mi cuenta</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Administra tu perfil y la configuración de tu iglesia.</p>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-[#18301d] to-[#2d4a35] dark:from-[#1a1a1a] dark:to-[#252525] rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <UserAvatar
                seed={usuario?.email ?? usuario?.nombre ?? "Usuario"}
                size={80}
              />
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-[#333] rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 dark:hover:bg-[#444] transition">
                <svg className="w-4 h-4 text-[#18301d] dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </button>
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-white">{usuario?.nombre ?? "—"}</h2>
              <p className="text-white/70">{usuario?.email ?? ""}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <span className="px-3 py-1 bg-[#e64b27] text-white text-xs font-semibold rounded-full">{usuario?.rolLabel ?? ""}</span>
                <span className="text-white/60 text-sm">{usuario?.miembroDesde ? `Miembro desde ${usuario.miembroDesde}` : ""}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-100 dark:border-[#2a2a2a] overflow-x-auto scrollbar-hide">
            <div className="flex min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "border-[#0ca6b2] text-[#0ca6b2]"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-[#18301d] dark:hover:text-white"
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

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "perfil" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Información personal</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre completo</label>
                      <input
                        type="text"
                        defaultValue={usuario?.nombre ?? ""}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-white dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo electrónico</label>
                      <input
                        type="email"
                        defaultValue={usuario?.email ?? ""}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-white dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        defaultValue={usuario?.telefono ?? ""}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-white dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol en la iglesia</label>
                      <select
                        defaultValue={usuario?.rolLabel ?? "Miembro"}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-white dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent"
                      >
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
                <div className="pt-4 border-t border-gray-100 dark:border-[#2a2a2a] flex justify-end">
                  <button className="px-6 py-2.5 bg-[#0ca6b2] text-white font-semibold rounded-full hover:bg-[#0a8f9a] transition">
                    Guardar cambios
                  </button>
                </div>
              </div>
            )}

            {activeTab === "iglesia" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Información de la iglesia</h3>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#faddbf]/30 dark:bg-[#faddbf]/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-[#18301d] dark:text-white">{iglesia?.miembros ?? 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Miembros</p>
                    </div>
                    <div className="bg-[#0ca6b2]/10 dark:bg-[#0ca6b2]/20 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-[#18301d] dark:text-white">{iglesia?.grupos ?? 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Grupos</p>
                    </div>
                    <div className="bg-[#e64b27]/10 dark:bg-[#e64b27]/20 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-[#18301d] dark:text-white">{iglesia?.lideres ?? 0}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Líderes</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de la iglesia</label>
                      <input
                        type="text"
                        defaultValue={iglesia?.nombre ?? ""}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-white dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">País</label>
                      <input
                        type="text"
                        defaultValue={iglesia?.pais ?? ""}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-white dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ciudad</label>
                      <input
                        type="text"
                        defaultValue={iglesia?.ciudad ?? ""}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-white dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Denominación</label>
                      <input
                        type="text"
                        defaultValue={iglesia?.denominacion ?? ""}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-white dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tamaño congregación</label>
                      <input
                        type="text"
                        defaultValue={iglesia?.tamano ?? ""}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-white dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pastor principal</label>
                      <input
                        type="text"
                        defaultValue={iglesia?.pastorNombre ?? ""}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-white dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cargo</label>
                      <input
                        type="text"
                        defaultValue={iglesia?.pastorCargo ?? ""}
                        readOnly
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-gray-50 dark:bg-[#1a1a1a] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email del pastor</label>
                      <input
                        type="email"
                        defaultValue={iglesia?.pastorEmail ?? ""}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-white dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono / WhatsApp</label>
                      <input
                        type="tel"
                        defaultValue={iglesia?.pastorTelefono ?? ""}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-white dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Días de servicio</label>
                      <input
                        type="text"
                        defaultValue={iglesia?.diasServicio ?? ""}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-white dark:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-[#2a2a2a] flex justify-end">
                  <button className="px-6 py-2.5 bg-[#0ca6b2] text-white font-semibold rounded-full hover:bg-[#0a8f9a] transition">
                    Guardar cambios
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notificaciones" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Preferencias de notificaciones</h3>
                  <div className="space-y-4">
                    {[
                      { id: "nuevos_miembros", label: "Nuevos miembros", desc: "Recibir notificación cuando se registre un nuevo miembro" },
                      { id: "cumpleanos", label: "Cumpleaños", desc: "Recordatorios de cumpleaños de los miembros" },
                      { id: "reuniones", label: "Reuniones", desc: "Recordatorios de reuniones y eventos programados" },
                      { id: "seguimientos", label: "Seguimientos pendientes", desc: "Alertas de seguimientos que necesitan atención" },
                      { id: "reportes", label: "Reportes semanales", desc: "Resumen semanal de actividad de la iglesia" },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#252525] rounded-xl">
                        <div>
                          <p className="font-medium text-[#18301d] dark:text-white">{item.label}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-[#333] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0ca6b2]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0ca6b2]"></div>
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
                  <h3 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Cambiar contraseña</h3>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña actual</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-white dark:bg-[#252525] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva contraseña</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-white dark:bg-[#252525] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar nueva contraseña</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 border border-gray-200 dark:border-[#333] rounded-xl text-[#18301d] dark:text-white bg-white dark:bg-[#252525] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent" />
                    </div>
                    <button className="px-6 py-2.5 bg-[#0ca6b2] text-white font-semibold rounded-full hover:bg-[#0a8f9a] transition">Actualizar contraseña</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <Link href="/lideres" className="flex items-center gap-4 p-4 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] hover:shadow-lg dark:hover:shadow-[#0ca6b2]/5 transition group">
            <div className="w-12 h-12 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#0ca6b2] dark:text-[#0ca6b2] transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[#18301d] dark:text-white">Gestionar líderes</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Administra tu equipo de liderazgo</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleCerrarSesion}
            disabled={loggingOut}
            className="flex items-center gap-4 p-4 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] hover:shadow-lg dark:hover:shadow-red-500/5 transition group text-left w-full disabled:opacity-50"
          >
            <div className="w-12 h-12 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[#18301d] dark:text-white">Cerrar sesión</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{loggingOut ? "Saliendo..." : "Salir de tu cuenta"}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

