import { UserAvatar } from "@/components/UserAvatar";

/**
 * Tres avatares (react-nice-avatar) para tarjetas de evento; misma librería que Personas / Grupos.
 * Semilla estable por título + id para que cada evento tenga composición propia.
 */
export function EventoAvatarCluster({
  titulo,
  eventoId,
  sizeCenter = 80,
  sizeSide = 50,
}: {
  titulo: string;
  eventoId: string;
  sizeCenter?: number;
  sizeSide?: number;
}) {
  const base = `${titulo.trim() || "Evento"}|${eventoId}`;
  return (
    <div className="relative flex items-end justify-center pb-1 pt-2">
      <div className="flex items-end justify-center gap-0">
        <div className="z-[1] mb-1 -mr-5 translate-y-0.5">
          <UserAvatar
            seed={`${base}·1`}
            size={sizeSide}
            className="ring-2 ring-gray-100 dark:ring-white/10"
          />
        </div>
        <div className="z-[2]">
          <UserAvatar
            seed={`evento:${base}`}
            size={sizeCenter}
            className="ring-2 ring-white dark:ring-white/15"
          />
        </div>
        <div className="z-[1] mb-1 -ml-5 translate-y-0.5">
          <UserAvatar
            seed={`${base}·2`}
            size={sizeSide}
            className="ring-2 ring-gray-100 dark:ring-white/10"
          />
        </div>
      </div>
    </div>
  );
}
