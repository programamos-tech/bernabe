"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EventoAvatarCluster } from "@/components/EventoAvatarCluster";
import { UserAvatar } from "@/components/UserAvatar";
import { createClient } from "@/lib/supabase/client";

type TipoEvento = "reunion" | "grupo" | "clase" | "servicio" | "especial";

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

interface Evento {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: TipoEvento;
  fecha: string | null;
  fecha_fin: string | null;
  hora: string | null;
  ubicacion: string | null;
  imagen: string | null;
  asistentes_esperados: number | null;
  responsable: string | null;
  recurrente: boolean;
}

function formatFechaDisplay(fecha: string | null, fechaFin: string | null, recurrente: boolean): string {
  if (!fecha) return "—";
  if (recurrente) {
    const d = new Date(fecha + "T12:00:00");
    if (Number.isNaN(d.getTime())) return fecha;
    const name = DIAS_SEMANA[d.getDay()].toLowerCase();
    const plural = name.endsWith("o") ? name + "s" : name;
    return `Todos los ${plural}`;
  }
  const start = new Date(fecha + "T12:00:00");
  if (Number.isNaN(start.getTime())) return fecha;
  const d = start.getDate();
  const m = MESES_SHORT[start.getMonth()];
  const y = start.getFullYear();
  const startStr = `${d} ${m} ${y}`;
  if (!fechaFin) return startStr;
  const end = new Date(fechaFin + "T12:00:00");
  if (Number.isNaN(end.getTime())) return startStr;
  const endStr = `${end.getDate()} ${MESES_SHORT[end.getMonth()]} ${end.getFullYear()}`;
  return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
}

function formatFechaReferencia(fecha: string | null): string {
  if (!fecha) return "";
  const d = new Date(fecha + "T12:00:00");
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MESES_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

const tipoEventoPill: Record<TipoEvento, { dot: string; badge: string; label: string }> = {
  servicio: {
    dot: "bg-orange-400/80 dark:bg-orange-300/70",
    badge: "bg-orange-500/10 text-orange-900 dark:text-orange-200",
    label: "Servicio",
  },
  reunion: {
    dot: "bg-sky-400/80 dark:bg-sky-300/70",
    badge: "bg-sky-500/10 text-sky-900 dark:text-sky-200",
    label: "Reunión",
  },
  grupo: {
    dot: "bg-emerald-400/80 dark:bg-emerald-300/70",
    badge: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
    label: "Grupo",
  },
  clase: {
    dot: "bg-violet-400/80 dark:bg-violet-300/70",
    badge: "bg-violet-500/12 text-violet-900 dark:text-violet-200",
    label: "Clase",
  },
  especial: {
    dot: "bg-amber-400/80 dark:bg-amber-300/70",
    badge: "bg-amber-400/15 text-amber-900 dark:text-amber-100",
    label: "Especial",
  },
};

export default function Page() {
  const params = useParams();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("eventos")
      .select("id, titulo, descripcion, tipo, fecha, fecha_fin, hora, ubicacion, imagen, asistentes_esperados, responsable, recurrente")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
          setEvento(null);
        } else {
          setEvento({
            id: data.id,
            titulo: data.titulo ?? "",
            descripcion: data.descripcion ?? null,
            tipo: (data.tipo as TipoEvento) ?? "reunion",
            fecha: data.fecha ?? null,
            fecha_fin: data.fecha_fin ?? null,
            hora: data.hora ?? null,
            ubicacion: data.ubicacion ?? null,
            imagen: data.imagen ?? null,
            asistentes_esperados: data.asistentes_esperados ?? null,
            responsable: data.responsable ?? null,
            recurrente: data.recurrente ?? false,
          });
        }
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (notFound || !evento) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-600 dark:text-gray-400">Evento no encontrado.</p>
        <Link href="/eventos" className="font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white">
          Volver a eventos
        </Link>
      </div>
    );
  }

  const fechaDisplay = formatFechaDisplay(evento.fecha, evento.fecha_fin, evento.recurrente);
  const tipo = tipoEventoPill[evento.tipo];

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-none px-4 pt-8 md:px-6 lg:px-8">
        <div className="relative mb-8 rounded-3xl bg-gray-100/50 dark:bg-white/[0.04] p-5 md:p-6">
          <Link
            href="/eventos"
            className="absolute left-4 top-4 z-10 rounded-full p-2.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white md:left-5 md:top-5"
            title="Volver a eventos"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>

          <Link
            href={`/eventos/${evento.id}/editar`}
            className="absolute right-4 top-4 z-10 rounded-full p-2.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white md:right-5 md:top-5"
            title="Editar evento"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
              />
            </svg>
          </Link>

          <div className="flex flex-col items-center gap-6 pt-10 md:flex-row md:items-center md:gap-8 md:pt-4 md:pl-4">
            <div className="flex min-h-[9rem] shrink-0 items-center justify-center md:min-h-[7.5rem]">
              <div className="rounded-3xl bg-gradient-to-b from-gray-100/90 to-gray-100/45 px-4 py-3 dark:from-white/[0.08] dark:to-white/[0.03]">
                <EventoAvatarCluster titulo={evento.titulo} eventoId={evento.id} sizeCenter={96} sizeSide={56} />
              </div>
            </div>
            <div className="min-w-0 flex-1 text-center md:text-left">
              <div className="mb-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${tipo.badge}`}>
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tipo.dot}`} />
                  {tipo.label}
                </span>
                {evento.recurrente ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-gray-500/10 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                    <svg className="h-3 w-3 shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                      />
                    </svg>
                    Recurrente
                  </span>
                ) : null}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-3xl">{evento.titulo}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 md:px-6 lg:px-8">
        <div className="w-full">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {evento.asistentes_esperados != null && evento.asistentes_esperados > 0 ? (
                <div className="rounded-3xl bg-gray-100/40 p-5 text-center dark:bg-white/[0.04] sm:max-w-xs sm:text-left">
                  <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                    {evento.asistentes_esperados}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Asistentes esperados</p>
                </div>
              ) : null}

              {evento.descripcion ? (
                <div className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
                  <div className="border-b border-gray-200/60 px-5 py-4 dark:border-white/10">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Descripción</h3>
                  </div>
                  <div className="p-5">
                    <p className="leading-relaxed text-gray-600 dark:text-gray-300">{evento.descripcion}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl bg-gray-100/40 p-5 dark:bg-white/[0.04]">
                <div className="mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span className="text-sm font-semibold">Fecha y hora</span>
                </div>
                <p className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  {fechaDisplay !== "—" ? fechaDisplay : "Sin fecha definida"}
                </p>
                {evento.recurrente && evento.fecha && formatFechaReferencia(evento.fecha) ? (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Referencia: {formatFechaReferencia(evento.fecha)}</p>
                ) : null}
                <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">{evento.hora ?? "—"}</p>
              </div>

              <div className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
                <div className="border-b border-gray-200/60 px-5 py-4 dark:border-white/10">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Ubicación</h3>
                </div>
                <div className="p-5">
                  <p className="font-medium text-gray-900 dark:text-white">{evento.ubicacion || "—"}</p>
                </div>
              </div>

              {evento.responsable ? (
                <div className="overflow-hidden rounded-3xl bg-gray-100/40 dark:bg-white/[0.04]">
                  <div className="border-b border-gray-200/60 px-5 py-4 dark:border-white/10">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Responsable</h3>
                  </div>
                  <div className="flex items-center gap-3 p-5">
                    <UserAvatar seed={evento.responsable} size={48} />
                    <p className="font-medium text-gray-900 dark:text-white">{evento.responsable}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
