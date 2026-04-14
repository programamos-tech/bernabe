export type Rol = "Líder" | "Miembro" | "Visitante" | "Diácono";

export type ParticipacionEnGrupo = "miembro" | "apoyo" | "colider";

export function labelParticipacionEnGrupo(
  participacion: ParticipacionEnGrupo | null,
  grupoId: string | null
): string {
  if (!grupoId) return "—";
  if (participacion === "colider") return "Co-líder";
  if (participacion === "apoyo") return "Grupo de apoyo";
  return "Miembro del núcleo";
}
