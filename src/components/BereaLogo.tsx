import Image from "next/image";

const LOGO_SRC = "/logo-berea.2.png";

const DEFAULT_BOX =
  "relative inline-block h-11 w-[9.5rem] shrink-0 overflow-hidden sm:h-12 sm:w-[11rem]";

/** Navbar landing: punto medio entre legibilidad y proporción en la cabecera. */
const HEADER_BOX =
  "relative inline-block h-11 w-[9rem] shrink-0 overflow-hidden sm:h-12 sm:w-[10.25rem]";

const HEADER_IMAGE =
  "origin-left scale-[2.65] object-contain object-left brightness-115 contrast-110 sm:scale-[2.8] dark:brightness-[2.4] dark:contrast-110";

/** Login/registro: logo centrado y más grande. */
const AUTH_BOX =
  "relative inline-block h-16 w-[13rem] shrink-0 overflow-hidden sm:h-[4.5rem] sm:w-[15rem]";

const AUTH_IMAGE =
  "origin-center scale-[3] object-contain object-center brightness-115 contrast-110 sm:scale-[3.2] dark:brightness-[2.4] dark:contrast-110";

/** Footer oscuro: aclara el trazo del PNG sin invertir el fondo negro del archivo. */
const FOOTER_BOX =
  "relative inline-block h-12 w-[10.5rem] shrink-0 overflow-hidden sm:h-14 sm:w-[12rem]";

const FOOTER_IMAGE =
  "origin-left scale-[2.65] object-contain object-left brightness-[12] contrast-110 sm:scale-[2.8]";

type BereaLogoProps = {
  /** Tamaño del contenedor (Tailwind). Por defecto cabecera. */
  boxClassName?: string;
  className?: string;
  priority?: boolean;
  /** `header`: navbar landing. `footer`: letras blancas sobre fondo oscuro. `auth`: login/registro. */
  variant?: "default" | "header" | "footer" | "auth";
};

/** Marca Berea (`public/logo-berea.2.png`). */
export function BereaLogo({
  boxClassName,
  className = "",
  priority = false,
  variant = "default",
}: BereaLogoProps) {
  const isHeader = variant === "header";
  const isFooter = variant === "footer";
  const isAuth = variant === "auth";
  const box =
    boxClassName ??
    (isHeader ? HEADER_BOX : isFooter ? FOOTER_BOX : isAuth ? AUTH_BOX : DEFAULT_BOX);
  const imageClass = isHeader
    ? `${HEADER_IMAGE} ${className}`.trim()
    : isFooter
      ? `${FOOTER_IMAGE} ${className}`.trim()
      : isAuth
        ? `${AUTH_IMAGE} ${className}`.trim()
        : `object-contain object-left ${className}`.trim();

  return (
    <span className={box} aria-hidden>
      <Image
        src={LOGO_SRC}
        alt="Berea"
        fill
        sizes={
          isHeader
            ? "(max-width: 640px) 144px, 164px"
            : isFooter
              ? "(max-width: 640px) 168px, 192px"
              : isAuth
                ? "(max-width: 640px) 208px, 240px"
                : "(max-width: 640px) 152px, 176px"
        }
        priority={priority}
        className={imageClass}
      />
    </span>
  );
}
