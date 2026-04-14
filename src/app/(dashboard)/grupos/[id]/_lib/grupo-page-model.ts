export interface LiderResumen {
  id: string;
  nombre: string;
  telefono: string | null;
  /** Copiado de `personas.sexo` cuando el líder tiene `persona_id`. */
  sexo: string | null;
  fecha_inicio_liderazgo: string | null;
  created_at: string;
}

export interface GrupoData {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  imagen: string | null;
  dia: string | null;
  hora: string | null;
  ubicacion: string | null;
  activo: boolean;
  miembros_count: number;
  created_at: string;
  lideres: LiderResumen | null;
}

export type LiderRowFromDb = Omit<LiderResumen, "sexo"> & {
  sexo?: string | null;
  personas?: { sexo: string | null } | null;
};

export function normalizeLideres(raw: LiderRowFromDb | LiderRowFromDb[] | null | undefined): LiderResumen | null {
  if (!raw) return null;
  const one = Array.isArray(raw) ? raw[0] ?? null : raw;
  if (!one) return null;
  return {
    id: one.id,
    nombre: one.nombre,
    telefono: one.telefono,
    sexo: one.personas?.sexo ?? one.sexo ?? null,
    fecha_inicio_liderazgo: one.fecha_inicio_liderazgo ?? null,
    created_at: one.created_at ?? "",
  };
}

export type ParticipacionEnGrupo = "miembro" | "apoyo" | "colider";

export interface MiembroData {
  id: string;
  nombre: string;
  sexo: string | null;
  rol: string;
  etapa: string;
  participacion_en_grupo: ParticipacionEnGrupo;
  fecha_ingreso_grupo: string | null;
  co_lider_desde: string | null;
  ultimo_contacto: string | null;
}

export interface UltimaReunionAsistente {
  id: string;
  nombre: string;
  sexo: string | null;
}
