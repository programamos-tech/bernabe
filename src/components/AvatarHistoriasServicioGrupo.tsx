"use client";

import { UserAvatar } from "@/components/UserAvatar";
import type { PersonaSexo } from "@/lib/persona-sexo";

export type ParticipacionServicioGrupo = "apoyo" | "colider" | string | null | undefined;

/**
 * Aro tipo historias (gradiente + brillo) cuando la persona sirve en grupo de apoyo o como co-líder.
 * Sin rol de servicio, renderiza solo `UserAvatar`.
 */
export function AvatarHistoriasServicioGrupo({
  seed,
  sexo,
  size,
  participacion,
  grupoId,
}: {
  seed: string;
  sexo: PersonaSexo | null;
  size: number;
  participacion: ParticipacionServicioGrupo;
  grupoId: string | null | undefined;
}) {
  const rol =
    grupoId && participacion === "apoyo"
      ? "apoyo"
      : grupoId && participacion === "colider"
        ? "colider"
        : null;

  if (!rol) {
    return <UserAvatar seed={seed} sexo={sexo} size={size} />;
  }

  const gradientClass =
    rol === "apoyo"
      ? "bg-[conic-gradient(from_0deg,#5b21b6,#a78bfa,#e9d5ff,#c4b5fd,#7c3aed,#5b21b6)]"
      : "bg-[conic-gradient(from_0deg,#0f766e,#0ca6b2,#5eead4,#22d3ee,#14b8a6,#0ca6b2)]";

  const glowClass = rol === "apoyo" ? "animate-avatar-story-ring-violet" : "animate-avatar-story-ring-teal";
  const label = rol === "apoyo" ? "Sirve en grupo de apoyo" : "Co-líder del grupo";

  return (
    <span
      className={`relative inline-flex rounded-full p-[2.5px] motion-reduce:animate-none ${glowClass}`}
      title={label}
      aria-label={label}
    >
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        <span
          className={`absolute left-1/2 top-1/2 block h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2 animate-[spin_14s_linear_infinite] motion-reduce:animate-none ${gradientClass}`}
          aria-hidden
        />
      </span>
      <span className="relative z-10 rounded-full bg-white/95 p-[2px] shadow-inner shadow-black/[0.04] dark:bg-zinc-900/98 dark:shadow-white/[0.04]">
        <UserAvatar seed={seed} sexo={sexo} size={size} className="!shadow-none ring-0 dark:!ring-0" />
      </span>
    </span>
  );
}
