/** CTAs unificados en marketing y pantallas de auth. */
export const marketingCta = {
  start: "Empezar a cuidar",
  howItWorks: "Ver cómo funciona",
  login: "Iniciar sesión",
  hasAccount: "Ya tengo cuenta",
  resources: "Ver recursos",
  contactChurch: "Hablar con Andrew",
  backHome: "Volver al inicio",
} as const;

const btnBase =
  "inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50 focus-visible:ring-offset-2 dark:focus-visible:ring-white/25 dark:focus-visible:ring-offset-[#111111]";

/** Botón principal — landing, auth, recursos. */
export const btnPrimary = `${btnBase} bg-gray-900 px-6 py-3.5 text-sm text-white shadow-sm shadow-black/10 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:shadow-none dark:hover:bg-gray-100 sm:px-8 sm:py-4 sm:text-base`;

/** Mismo estilo, ancho completo en móvil. */
export const btnPrimaryFull = `${btnPrimary} w-full sm:w-auto`;

/** Navbar y espacios compactos. */
export const btnPrimaryCompact = `${btnBase} shrink-0 bg-gray-900 px-4 py-2 text-sm text-white shadow-sm shadow-black/10 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:shadow-none dark:hover:bg-gray-100`;

export const btnSecondary = `${btnBase} border border-gray-200 bg-white px-6 py-3.5 text-sm text-gray-900 hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1] sm:px-8 sm:py-4 sm:text-base`;

export const btnSecondaryFull = `${btnSecondary} w-full sm:w-auto`;

/** Formularios de auth: mismo estilo primario, ancho completo. */
export const btnPrimaryForm = `${btnPrimaryFull} gap-2 disabled:cursor-not-allowed disabled:opacity-50`;
