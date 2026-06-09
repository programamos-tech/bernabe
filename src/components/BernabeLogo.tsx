type BernabeLogoProps = {
  className?: string;
  /** `header`: navbar del dashboard. `auth`: login/registro. `footer`: pie oscuro. */
  variant?: "header" | "default" | "auth" | "footer";
};

/** Arco suave: B inclinada abajo, final hacia arriba (como mirando al cielo). */
const LETTER_ARC: { rotate: number; yEm: number }[] = [
  { rotate: -9, yEm: 0.11 },
  { rotate: -5.5, yEm: 0.07 },
  { rotate: -2.5, yEm: 0.035 },
  { rotate: 0, yEm: 0 },
  { rotate: 2.5, yEm: -0.025 },
  { rotate: 5.5, yEm: -0.055 },
  { rotate: 9, yEm: -0.09 },
];

const WORD = "Bernabé";

/** Marca tipográfica Bernabé (Damion). */
export function BernabeLogo({ className = "", variant = "default" }: BernabeLogoProps) {
  const size =
    variant === "auth"
      ? "text-[2.125rem] sm:text-[2.875rem]"
      : variant === "header"
        ? "text-[1.35rem] sm:text-[1.5rem]"
        : variant === "footer"
          ? "text-xl sm:text-2xl"
          : "text-2xl";

  const arcScale =
    variant === "auth" ? 1 : variant === "header" ? 0.72 : variant === "footer" ? 0.85 : 0.88;

  const colorClass =
    variant === "footer" ? "text-white" : "text-gray-900 dark:text-white";

  return (
    <span
      className={`inline-flex items-end font-bernabe-logo leading-none tracking-[-0.04em] ${colorClass} ${size} ${className}`}
      aria-hidden
    >
      {WORD.split("").map((char, i) => {
        const arc = LETTER_ARC[i] ?? { rotate: 0, yEm: 0 };
        const rotate = arc.rotate * arcScale;
        const yEm = arc.yEm * arcScale;
        return (
          <span
            key={`${char}-${i}`}
            className="inline-block origin-[50%_88%] will-change-transform"
            style={{
              transform: `rotate(${rotate}deg) translateY(${yEm}em)`,
            }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}
