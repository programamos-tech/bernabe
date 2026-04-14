import type { GrupoResumenCardModel } from "@/components/GrupoResumenCard";

export type GrupoJoinNested = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  miembros_count: number;
  lider_id: string | null;
  dia: string | null;
  hora: string | null;
  ubicacion: string | null;
  imagen: string | null;
  activo: boolean;
  lideres: { nombre: string } | { nombre: string }[] | null;
};

export type PersonaGrupoResumen = GrupoResumenCardModel & {
  liderNombre: string | null;
  miembrosReales: number;
};

/** Sin query extra: `miembros_count` del grupo evita un ida y vuelta al abrir la ficha. */
export function buildGrupoResumenFromJoin(joined: GrupoJoinNested, _grupoId: string): PersonaGrupoResumen {
  const liderRaw = joined.lideres;
  const liderNombre =
    liderRaw == null ? null : Array.isArray(liderRaw) ? liderRaw[0]?.nombre ?? null : liderRaw.nombre;
  const miembrosReales = joined.miembros_count ?? 0;
  return {
    id: joined.id,
    nombre: joined.nombre,
    descripcion: joined.descripcion,
    tipo: joined.tipo,
    activo: joined.activo,
    miembros_count: joined.miembros_count,
    lider_id: joined.lider_id,
    dia: joined.dia,
    hora: joined.hora,
    ubicacion: joined.ubicacion,
    liderNombre,
    miembrosReales,
  };
}
