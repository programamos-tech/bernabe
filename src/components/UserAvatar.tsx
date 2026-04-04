"use client";

import { useMemo } from "react";
import Avatar, { genConfig } from "react-nice-avatar";

interface UserAvatarProps {
  /** Estable (ej. email o nombre): mismo seed = mismo retrato ilustrado. */
  seed: string;
  size?: number;
  className?: string;
}

/**
 * Ilustraciones de persona (sistema Micah / Figma) vía [react-nice-avatar](https://github.com/dapi-labs/react-nice-avatar):
 * hombre/mujer, tonos de piel, pelo, ropa, etc.; diverso y determinista por `seed`.
 */
export function UserAvatar({ seed, size = 40, className = "" }: UserAvatarProps) {
  const name = seed?.trim() || "Usuario";

  const config = useMemo(() => genConfig(name), [name]);

  return (
    <Avatar
      className={`shrink-0 shadow-sm shadow-black/[0.06] ring-1 ring-black/[0.04] dark:shadow-none dark:ring-white/[0.08] ${className}`}
      style={{ width: size, height: size }}
      shape="circle"
      {...config}
    />
  );
}
