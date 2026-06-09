"use client";

import { UserAvatar } from "@/components/UserAvatar";
import type { PersonaSexo } from "@/lib/persona-sexo";

export type ParticipacionServicioGrupo = "apoyo" | "colider" | string | null | undefined;

type AroServicioGrupo = "lider" | "colider" | "apoyo";

function esLiderDeGrupo(etapa?: string | null, rol?: string | null): boolean {
  return etapa === "lider_grupo" || rol === "Líder";
}

export function resolveAroServicioGrupo(
  grupoId: string | null | undefined,
  participacion: ParticipacionServicioGrupo,
  etapa?: string | null,
  rol?: string | null,
): AroServicioGrupo | null {
  if (!grupoId) return null;
  if (esLiderDeGrupo(etapa, rol)) return "lider";
  if (participacion === "colider") return "colider";
  if (participacion === "apoyo") return "apoyo";
  return null;
}

/**
 * Aro tipo historias (gradiente + brillo) para líder de grupo, co-líder o grupo de apoyo.
 * Líder de grupo → morado; co-líder → teal; apoyo → morado suave.
 */
export function AvatarHistoriasServicioGrupo({
  seed,
  sexo,
  size,
  participacion,
  grupoId,
  etapa,
  rol,
}: {
  seed: string;
  sexo: PersonaSexo | null;
  size: number;
  participacion: ParticipacionServicioGrupo;
  grupoId: string | null | undefined;
  etapa?: string | null;
  rol?: string | null;
}) {
  const aro = resolveAroServicioGrupo(grupoId, participacion, etapa, rol);

  if (!aro) {
    return <UserAvatar seed={seed} sexo={sexo} size={size} />;
  }

  const gradientViolet =
    "bg-[conic-gradient(from_0deg,#5b21b6,#a78bfa,#e9d5ff,#c4b5fd,#7c3aed,#5b21b6)]";
  const gradientTeal =
    "bg-[conic-gradient(from_0deg,#0f766e,#0ca6b2,#5eead4,#22d3ee,#14b8a6,#0ca6b2)]";

  const gradientClass = aro === "colider" ? gradientTeal : gradientViolet;
  const glowClass = aro === "colider" ? "animate-avatar-story-ring-teal" : "animate-avatar-story-ring-violet";
  const label =
    aro === "lider" ? "Líder de grupo" : aro === "apoyo" ? "Sirve en grupo de apoyo" : "Co-líder del grupo";

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
