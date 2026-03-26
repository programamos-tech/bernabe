/** Roles ofrecidos por defecto en formularios (nuevo / editar líder). */
export const ROLES_LIDERAZGO_DEFAULT: { id: string; nombre: string; icon: string }[] = [
  { id: "pastor", nombre: "Pastor", icon: "star" },
  { id: "lider_grupo", nombre: "Líder de grupo", icon: "users" },
  { id: "coordinador", nombre: "Coordinador", icon: "clipboard" },
];

/** Solo para registros antiguos que ya tienen Mentor o Diácono en BD. */
export const ROLES_LIDERAZGO_LEGACY: { id: string; nombre: string; icon: string }[] = [
  { id: "mentor", nombre: "Mentor", icon: "academic" },
  { id: "diacono", nombre: "Diácono", icon: "heart" },
];
