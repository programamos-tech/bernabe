import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    /** Utilidades solo en strings (p. ej. etapas teal/indigo en persona-etapa.ts) */
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
  /** Puntos/anillos teal e índigo del mapa de etapas (clases definidas en src/lib/persona-etapa). */
  safelist: [
    "bg-teal-400/80",
    "dark:bg-teal-400/55",
    "bg-indigo-400/80",
    "dark:bg-indigo-400/55",
    "border-teal-400/95",
    "bg-teal-400/12",
    "shadow-teal-900/12",
    "dark:border-teal-400/70",
    "dark:bg-teal-400/18",
    "border-indigo-400/90",
    "bg-indigo-400/10",
    "dark:border-indigo-400/60",
    "dark:bg-indigo-400/12",
    "border-teal-400/60",
    "dark:border-teal-400/50",
    "dark:bg-teal-400/14",
    "border-indigo-400/60",
    "dark:border-indigo-400/50",
    "dark:bg-indigo-400/14",
    "border-teal-400/45",
    "bg-teal-50/40",
    "dark:border-teal-400/38",
    "dark:bg-teal-950/30",
    "border-indigo-400/45",
    "bg-indigo-50/40",
    "dark:border-indigo-400/38",
    "dark:bg-indigo-950/30",
    "text-teal-900/90",
    "dark:text-teal-100/90",
    "text-indigo-900/90",
    "dark:text-indigo-100/90",
    "text-teal-700/80",
    "dark:text-teal-200/55",
    "text-indigo-700/80",
    "dark:text-indigo-200/55",
    "bg-teal-500/12",
    "text-teal-900",
    "dark:text-teal-200",
    "bg-indigo-500/12",
    "text-indigo-900",
    "dark:text-indigo-200",
  ],
};

export default config;
