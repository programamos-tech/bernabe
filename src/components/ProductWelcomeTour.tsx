"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SHOW_PRODUCT_TOUR_SESSION_KEY } from "@/lib/product-tour";

type TourStep = {
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
};

function stepsForLeader(leader: boolean): TourStep[] {
  const base: TourStep[] = [
    {
      title: "¡Listo, ya tienes tu espacio!",
      body: "Este es tu inicio en Bernabé: un resumen de personas, grupos y actividad. Te mostramos en qué orden conviene empezar.",
    },
    {
      title: "1. Crea tu primer grupo",
      body: "Ahí organizas células, jóvenes, parejas o el nombre que uses en tu iglesia. Sin grupos, las personas pueden quedar como visitantes sin núcleo.",
      ctaHref: "/grupos/nuevo",
      ctaLabel: "Ir a crear grupo",
    },
    {
      title: "2. Registra a una persona",
      body: "Desde Personas añades nombre, contacto, etapa y si va a un grupo. Así nadie se queda solo en una hoja aparte.",
      ctaHref: "/personas/nuevo",
      ctaLabel: "Registrar persona",
    },
    {
      title: "3. Mira el calendario",
      body: "En Calendario ves reuniones y próximos encuentros según lo que vayas cargando. Te ayuda a no solapar ni olvidar.",
      ctaHref: "/calendario",
      ctaLabel: "Abrir calendario",
    },
    {
      title: "4. Seguimiento en Personas",
      body: "En la lista ves etapa y último contacto; al abrir una ficha registras notas, peticiones y próximos pasos. Ese es el corazón del seguimiento pastoral.",
      ctaHref: "/personas",
      ctaLabel: "Ir a Personas",
    },
  ];

  if (leader) return base;

  return [
    ...base,
    {
      title: "5. Líderes y eventos",
      body: "Con plan iglesia también tienes Líderes (equipo y permisos) y Eventos para actividades más grandes. Explóralo cuando ya tengas personas y grupos.",
      ctaHref: "/lideres",
      ctaLabel: "Ver Líderes",
    },
  ];
}

export function ProductWelcomeTour({ leaderIndividual }: { leaderIndividual: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const steps = useMemo(() => stepsForLeader(leaderIndividual), [leaderIndividual]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SHOW_PRODUCT_TOUR_SESSION_KEY) === "1") {
        setOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.removeItem(SHOW_PRODUCT_TOUR_SESSION_KEY);
    } catch {
      // ignore
    }
    setOpen(false);
    setIndex(0);
  }, []);

  const goCta = useCallback(
    (href: string) => {
      dismiss();
      router.push(href);
    },
    [dismiss, router]
  );

  if (!open) return null;

  const step = steps[index]!;
  const isLast = index === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-tour-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Cerrar tutorial"
        onClick={dismiss}
      />
      <div className="relative z-[101] w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-neutral-900">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Tutorial · Paso {index + 1} de {steps.length}
        </p>
        <h2 id="product-tour-title" className="mt-2 text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {step.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{step.body}</p>

        {step.ctaHref && step.ctaLabel ? (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => goCta(step.ctaHref!)}
              className="text-sm font-semibold text-gray-900 underline-offset-4 hover:underline dark:text-white"
            >
              {step.ctaLabel} →
            </button>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5 dark:border-white/10">
          <button
            type="button"
            onClick={dismiss}
            className="text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
          >
            Omitir tutorial
          </button>
          <div className="flex items-center gap-2">
            {index > 0 ? (
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/5"
              >
                Atrás
              </button>
            ) : null}
            {isLast ? (
              <button
                type="button"
                onClick={dismiss}
                className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                Entendido, empezar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIndex((i) => i + 1)}
                className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                Siguiente
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          Puedes repetir rutas desde el menú superior cuando quieras.{" "}
          <Link href="/recursos" className="font-medium text-gray-600 underline-offset-2 hover:underline dark:text-gray-300">
            Recursos
          </Link>{" "}
          con textos para equipos.
        </p>
      </div>
    </div>
  );
}
