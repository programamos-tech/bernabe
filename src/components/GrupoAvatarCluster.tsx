import { UserAvatar } from "@/components/UserAvatar";

/**
 * Composición de retratos (react-nice-avatar) para tarjetas de grupo: misma librería que Personas.
 * Semillas estables por nombre de grupo.
 */
export function GrupoAvatarCluster({
  nombreGrupo,
  sizeCenter = 84,
  sizeSide = 52,
}: {
  nombreGrupo: string;
  sizeCenter?: number;
  sizeSide?: number;
}) {
  const base = nombreGrupo.trim() || "Grupo";
  return (
    <div className="relative flex items-end justify-center pb-1 pt-2">
      <div className="flex items-end justify-center gap-0">
        <div className="z-[1] mb-1 -mr-5 translate-y-0.5">
          <UserAvatar
            seed={`${base}·comunidad·1`}
            size={sizeSide}
            className="ring-2 ring-gray-100 dark:ring-[#1a1a1a]"
          />
        </div>
        <div className="z-[2]">
          <UserAvatar
            seed={`grupo:${base}`}
            size={sizeCenter}
            className="ring-2 ring-white dark:ring-white/10"
          />
        </div>
        <div className="z-[1] mb-1 -ml-5 translate-y-0.5">
          <UserAvatar
            seed={`${base}·comunidad·2`}
            size={sizeSide}
            className="ring-2 ring-gray-100 dark:ring-[#1a1a1a]"
          />
        </div>
      </div>
    </div>
  );
}
