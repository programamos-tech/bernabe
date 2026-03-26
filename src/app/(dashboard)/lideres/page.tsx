"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Avatar from "boring-avatars";
import { createClient } from "@/lib/supabase/client";

type RolLider = "Pastor" | "Líder de grupo" | "Coordinador" | "Mentor" | "Diácono";
type EstadoLider = "Activo" | "En formación" | "Descanso";

interface Lider {
  id: string;
  nombre: string;
  cedula: string | null;
  telefono: string;
  email: string | null;
  /** Rol en BD (tabla lideres) */
  rol: RolLider | null;
  /** Texto mostrado: alinea con Mi cuenta / organizations.pastor_role para el pastor */
  rolEtiqueta: string | null;
  rolEstilo: RolLider;
  grupoAsignado: string | null;
  miembrosACargo: number;
  estado: EstadoLider;
  fechaInicio: string | null;
  personaId: string | null;
}

type OrgPastor = { pastor_email: string | null; pastor_role: string | null };

function rolVistaDesdeOrg(
  row: { email: string | null; rol: string | null },
  org: OrgPastor | null
): { etiqueta: string | null; estilo: RolLider } {
  const emailL = (row.email ?? "").trim().toLowerCase();
  const pastorEmail = (org?.pastor_email ?? "").trim().toLowerCase();
  const emailCoincidePastor = pastorEmail.length > 0 && emailL === pastorEmail;
  const rolDb = row.rol as RolLider | null;
  const esPastor = rolDb === "Pastor" || emailCoincidePastor;
  if (esPastor) {
    return {
      etiqueta: org?.pastor_role?.trim() || "Pastor",
      estilo: "Pastor",
    };
  }
  if (rolDb) return { etiqueta: rolDb, estilo: rolDb };
  return { etiqueta: null, estilo: "Líder de grupo" };
}

const rolStyles: Record<RolLider, string> = {
  Pastor: "bg-[#18301d] dark:bg-[#0ca6b2] text-white",
  "Líder de grupo": "bg-[#0ca6b2]/10 dark:bg-[#0ca6b2]/20 text-[#0ca6b2]",
  Coordinador: "bg-[#e64b27]/10 dark:bg-[#e64b27]/20 text-[#e64b27]",
  Mentor: "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400",
  Diácono: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
};

const estadoStyles: Record<EstadoLider, { dot: string; text: string }> = {
  Activo: { dot: "bg-green-500", text: "text-green-700 dark:text-green-400" },
  "En formación": { dot: "bg-[#f9c70c]", text: "text-[#b8860b] dark:text-[#f9c70c]" },
  Descanso: { dot: "bg-gray-300 dark:bg-gray-600", text: "text-gray-500 dark:text-gray-400" },
};

export default function Page() {
  const [lideres, setLideres] = useState<Lider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: lideresData, error: lideresErr } = await supabase
        .from("lideres")
        .select("id, nombre, cedula, telefono, email, rol, grupo_asignado, estado, fecha_inicio_liderazgo, persona_id")
        .order("nombre");
      const lideresRes = { data: lideresData, error: lideresErr };

      if (lideresRes.error) {
        console.error("Error cargando líderes:", lideresRes.error);
        setLideres([]);
        setLoading(false);
        return;
      }

      const rows = (lideresRes.data ?? []) as { id: string; nombre: string; cedula: string | null; telefono: string | null; email: string | null; rol: string | null; grupo_asignado: string | null; estado: string; fecha_inicio_liderazgo: string | null; persona_id: string | null }[];

      let orgPastor: OrgPastor | null = null;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).maybeSingle();
        if (profile?.organization_id) {
          const { data: orgRow } = await supabase
            .from("organizations")
            .select("pastor_email, pastor_role")
            .eq("id", profile.organization_id)
            .maybeSingle();
          orgPastor = orgRow ?? null;
        }
      }

      const leaderIds = rows.map((r) => r.id);
      const miembrosPorLider = new Map<string, number>();

      if (leaderIds.length > 0) {
        const { data: gruposRows } = await supabase
          .from("grupos")
          .select("id, lider_id")
          .in("lider_id", leaderIds);
        const grupos = gruposRows ?? [];
        const grupoIds = grupos.map((g) => g.id);
        if (grupoIds.length > 0) {
          const { data: personasRows } = await supabase
            .from("personas")
            .select("grupo_id")
            .in("grupo_id", grupoIds);
          const countByGrupoId = new Map<string, number>();
          for (const p of personasRows ?? []) {
            if (p.grupo_id) {
              countByGrupoId.set(p.grupo_id, (countByGrupoId.get(p.grupo_id) ?? 0) + 1);
            }
          }
          for (const g of grupos) {
            if (g.lider_id) {
              miembrosPorLider.set(g.lider_id, countByGrupoId.get(g.id) ?? 0);
            }
          }
        }
      }

      setLideres(
        rows.map((row) => {
          const { etiqueta, estilo } = rolVistaDesdeOrg(row, orgPastor);
          return {
            id: row.id,
            nombre: row.nombre ?? "",
            cedula: row.cedula ?? null,
            telefono: row.telefono ?? "",
            email: row.email ?? null,
            rol: (row.rol as RolLider) ?? null,
            rolEtiqueta: etiqueta,
            rolEstilo: estilo,
            grupoAsignado: row.grupo_asignado ?? null,
            miembrosACargo: miembrosPorLider.get(row.id) ?? 0,
            estado: (row.estado as EstadoLider) ?? "Activo",
            fechaInicio: row.fecha_inicio_liderazgo ?? null,
            personaId: row.persona_id ?? null,
          };
        })
      );
      setLoading(false);
    })();
  }, []);

  const totalLideres = lideres.length;
  const lideresActivos = lideres.filter((l) => l.estado === "Activo").length;
  const enFormacion = lideres.filter((l) => l.estado === "En formación").length;

  return (
    <div className="px-4 py-8 md:px-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#18301d] dark:text-white">Líderes</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Seguimiento y gestión del equipo de liderazgo.
            </p>
          </div>
          <Link
            href="/lideres/nuevo"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#18301d] dark:bg-[#0ca6b2] text-white font-semibold rounded-full hover:bg-[#2d4a35] dark:hover:bg-[#0995a0] transition shadow-lg shadow-[#18301d]/25 dark:shadow-[#0ca6b2]/25 sm:w-auto w-full"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nuevo líder
          </Link>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-5">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-[#0ca6b2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <div>
                <p className="text-2xl font-bold text-[#18301d] dark:text-white">{totalLideres}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total líderes</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-5">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-2xl font-bold text-[#18301d] dark:text-white">{lideresActivos}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Activos</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-5">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-[#f9c70c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
              <div>
                <p className="text-2xl font-bold text-[#18301d] dark:text-white">{enFormacion}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">En formación</p>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <svg className="w-10 h-10 animate-spin text-[#0ca6b2]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}

        {/* Search - Mobile */}
        <div className="relative mb-4 md:hidden">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar líder..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-full text-sm text-[#18301d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
          <button className="px-3 sm:px-4 py-2 bg-[#18301d] dark:bg-[#0ca6b2] text-white text-sm font-medium rounded-full">
            Todos
          </button>
          <button className="px-3 sm:px-4 py-2 bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 text-sm font-medium rounded-full border border-gray-200 dark:border-[#2a2a2a] hover:border-[#0ca6b2] hover:text-[#0ca6b2] transition">
            Activos
          </button>
          <button className="px-3 sm:px-4 py-2 bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 text-sm font-medium rounded-full border border-gray-200 dark:border-[#2a2a2a] hover:border-[#f9c70c] hover:text-[#b8860b] dark:hover:text-[#f9c70c] transition">
            En formación
          </button>
          <button className="px-3 sm:px-4 py-2 bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 text-sm font-medium rounded-full border border-gray-200 dark:border-[#2a2a2a] hover:border-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            Descanso
          </button>
          <div className="hidden md:block flex-1" />
          <div className="relative hidden md:block">
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar líder..."
              className="pl-10 pr-4 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-full text-sm text-[#18301d] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0ca6b2] focus:border-transparent w-64"
            />
          </div>
        </div>

        {/* Mobile Cards */}
        {!loading && lideres.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a]">
            <p className="text-gray-500 dark:text-gray-400">Aún no hay líderes registrados.</p>
            <Link href="/lideres/nuevo" className="inline-block mt-3 text-[#0ca6b2] font-medium hover:underline">Agregar primer líder</Link>
          </div>
        )}
        <div className="md:hidden space-y-3">
          {!loading && lideres.map((lider) => (
            <div key={lider.id} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-4">
              <div className="flex items-start gap-3">
                <Avatar
                  size={48}
                  name={lider.nombre}
                  variant="beam"
                  colors={["#0ca6b2", "#18301d", "#e64b27", "#f9c70c", "#faddbf"]}
                />
                <div className="flex-1 min-w-0">
                  <Link href={`/lideres/${lider.id}`} className="font-medium text-[#18301d] dark:text-white hover:text-[#0ca6b2] transition">
                    {lider.nombre}
                  </Link>
                  {lider.cedula && <p className="text-xs text-gray-500 dark:text-gray-400">Cédula: {lider.cedula}</p>}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{lider.telefono}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {lider.rolEtiqueta && (
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${rolStyles[lider.rolEstilo]}`}>
                        {lider.rolEtiqueta}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${estadoStyles[lider.estado].dot}`} />
                      <span className={`text-xs font-medium ${estadoStyles[lider.estado].text}`}>{lider.estado}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Info row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-gray-100 dark:border-[#2a2a2a]">
                <div className="flex items-start gap-1.5 min-w-0 flex-1">
                  <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                  <span className="text-xs text-gray-600 dark:text-gray-300 break-words leading-snug">{lider.grupoAsignado ?? "—"}</span>
                </div>
                <div className="text-xs shrink-0">
                  <span className="font-semibold text-[#18301d] dark:text-white">{lider.miembrosACargo}</span>
                  <span className="text-gray-400 ml-1">personas</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1 mt-3">
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-[#0ca6b2] transition">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-[#0ca6b2] transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </button>
                <Link
                  href={`/lideres/${lider.id}`}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-[#18301d] dark:hover:text-white transition"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        {!loading && lideres.length === 0 && (
          <div className="hidden md:flex justify-center py-12 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a]">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">Aún no hay líderes registrados.</p>
              <Link href="/lideres/nuevo" className="inline-block mt-3 text-[#0ca6b2] font-medium hover:underline">Agregar primer líder</Link>
            </div>
          </div>
        )}
        {!loading && lideres.length > 0 && (
        <div className="hidden md:block bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
          <div className="scrollbar-hide overflow-x-auto">
            <table className="w-full min-w-[860px] table-fixed">
              <colgroup>
                <col style={{ width: "24%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "32%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "auto", minWidth: "132px" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#252525]">
                  <th className="text-left px-4 lg:px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Líder
                  </th>
                  <th className="text-left px-3 lg:px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Cédula
                  </th>
                  <th className="text-left px-3 lg:px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="text-left px-3 lg:px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Grupo asignado
                  </th>
                  <th className="text-left px-3 lg:px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Miembros
                  </th>
                  <th className="text-left px-3 lg:px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-3 lg:px-6 py-4 w-32" aria-label="Acciones" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                {lideres.map((lider) => (
                  <tr key={lider.id} className="hover:bg-[#faddbf]/20 dark:hover:bg-[#252525] transition-colors">
                    <td className="px-4 lg:px-6 py-4 align-top">
                      <Link href={`/lideres/${lider.id}`} className="flex items-center gap-3 group min-w-0">
                        <Avatar
                          size={44}
                          name={lider.nombre}
                          variant="beam"
                          colors={["#0ca6b2", "#18301d", "#e64b27", "#f9c70c", "#faddbf"]}
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-[#18301d] dark:text-white group-hover:text-[#0ca6b2] transition break-words leading-snug">
                            {lider.nombre}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {lider.telefono}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-600 dark:text-gray-400 align-top whitespace-nowrap">
                      {lider.cedula ?? "—"}
                    </td>
                    <td className="px-3 lg:px-6 py-4 align-top">
                      {lider.rolEtiqueta ? (
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${rolStyles[lider.rolEstilo]}`}
                        >
                          {lider.rolEtiqueta}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 lg:px-6 py-4 align-top min-w-0">
                      <div className="flex items-start gap-2 min-w-0">
                        <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300 break-words leading-snug">{lider.grupoAsignado ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 align-top">
                      <span className="font-semibold text-[#18301d] dark:text-white">{lider.miembrosACargo}</span>
                      <span className="text-gray-400 text-sm ml-1">personas</span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 align-top">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${estadoStyles[lider.estado].dot}`}
                        />
                        <span className={`text-sm font-medium ${estadoStyles[lider.estado].text}`}>
                          {lider.estado}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 align-top">
                      <div className="flex items-center gap-1">
                        <button
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-[#0ca6b2] transition"
                          title="Enviar mensaje"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                          </svg>
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-[#0ca6b2] transition"
                          title="WhatsApp"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                          </svg>
                        </button>
                        <Link
                          href={`/lideres/${lider.id}`}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] text-gray-400 hover:text-[#18301d] dark:hover:text-white transition"
                          title="Ver perfil"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Footer note */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            ¿Quieres promover a alguien a líder?{" "}
            <Link href="/lideres/nuevo" className="text-[#0ca6b2] font-medium hover:underline">
              Agregar nuevo líder
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
