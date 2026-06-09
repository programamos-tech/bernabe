"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar, { genConfig } from "react-nice-avatar";
import type { AvatarFullConfig, Sex } from "react-nice-avatar";

interface UserAvatarProps {
  /** Estable (ej. email o nombre): mismo seed = mismo retrato ilustrado. */
  seed: string;
  /** Si se indica, fuerza el cuerpo/peinado del avatar ilustrado (evita desajuste nombre vs. figura). */
  sexo?: "masculino" | "femenino" | null;
  size?: number;
  className?: string;
}

function buildNiceAvatarConfig(seed: string, sexo?: "masculino" | "femenino" | null) {
  const name = seed?.trim() || "Usuario";
  const base = genConfig(name);
  let target: Sex | null = null;
  if (sexo === "masculino") target = "man";
  else if (sexo === "femenino") target = "woman";
  if (!target || base.sex === target) return base;

  const { hairStyle: _hair, eyeBrowStyle: _brow, sex: _ignored, ...rest } = base;
  return genConfig({ ...(rest as AvatarFullConfig), sex: target });
}

/**
 * Ilustraciones de persona (sistema Micah / Figma) vía [react-nice-avatar](https://github.com/dapi-labs/react-nice-avatar):
 * hombre/mujer, tonos de piel, pelo, ropa, etc.; diverso y determinista por `seed`.
 * Con `sexo` se recalcula pelo/cejas acorde al sexo sin perder el resto del retrato derivado del seed.
 */
export function UserAvatar({ seed, sexo = null, size = 40, className = "" }: UserAvatarProps) {
  const [mounted, setMounted] = useState(false);
  const config = useMemo(() => buildNiceAvatarConfig(seed, sexo), [seed, sexo]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sharedClassName = `shrink-0 overflow-hidden shadow-sm shadow-black/[0.06] ring-1 ring-black/[0.04] dark:shadow-none dark:ring-white/[0.08] ${className}`;
  const sharedStyle = { width: size, height: size, minWidth: size, minHeight: size };

  if (!mounted) {
    return (
      <div
        className={`rounded-full bg-gray-200/90 dark:bg-white/10 ${sharedClassName}`}
        style={sharedStyle}
        aria-hidden
      />
    );
  }

  return (
    <Avatar
      className={sharedClassName}
      style={sharedStyle}
      shape="circle"
      {...config}
    />
  );
}
