"use client";

import Avatar from "boring-avatars";

const AVATAR_COLORS = ["#0ca6b2", "#18301d", "#e64b27", "#f9c70c", "#faddbf"] as const;

interface UserAvatarProps {
  /** Estable (ej. email) para que el mismo usuario tenga siempre el mismo avatar */
  seed: string;
  size?: number;
  className?: string;
}

export function UserAvatar({ seed, size = 40, className }: UserAvatarProps) {
  return (
    <Avatar
      size={size}
      name={seed || "Usuario"}
      variant="beam"
      colors={[...AVATAR_COLORS]}
      className={className}
    />
  );
}
