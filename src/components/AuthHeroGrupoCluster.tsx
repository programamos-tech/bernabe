import { GrupoAvatarCluster } from "@/components/GrupoAvatarCluster";
import { UserAvatar } from "@/components/UserAvatar";

/** Grupo de avatares para paneles hero de login/registro. */
export function AuthHeroGrupoCluster() {
  const ringBack = "ring-2 ring-gray-100 dark:ring-[#252525]";
  return (
    <div className="relative mx-auto flex w-full max-w-[17rem] items-end justify-center py-1 sm:max-w-[18.5rem]">
      <div className="absolute bottom-7 left-0 z-0 sm:bottom-8">
        <UserAvatar seed="auth·grupo·maría" sexo="femenino" size={46} className={ringBack} />
      </div>
      <div className="absolute bottom-7 right-0 z-0 sm:bottom-8">
        <UserAvatar seed="auth·grupo·carlos" sexo="masculino" size={46} className={ringBack} />
      </div>
      <div className="relative z-[1]">
        <GrupoAvatarCluster nombreGrupo="Célula Bernabé" sizeCenter={96} sizeSide={64} />
      </div>
    </div>
  );
}
