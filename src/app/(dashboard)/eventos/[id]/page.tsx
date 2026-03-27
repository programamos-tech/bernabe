"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
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

const tipoStyles: Record<TipoEvento, { bg: string; gradient: string; label: string }> = {
  servicio: { bg: "bg-[#e64b27]", gradient: "from-[#e64b27] to-[#f97316]", label: "Servicio" },
  reunion: { bg: "bg-[#0ca6b2]", gradient: "from-[#0ca6b2] to-[#14b8a6]", label: "Reunión" },
  grupo: { bg: "bg-[#18301d]", gradient: "from-[#18301d] to-[#2d4a32]", label: "Grupo" },
  clase: { bg: "bg-purple-500", gradient: "from-purple-500 to-purple-600", label: "Clase" },
  especial: { bg: "bg-[#f9c70c]", gradient: "from-[#f9c70c] to-[#fbbf24]", label: "Especial" },
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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Cargando evento…</p>
      </div>
    );
  }

  if (notFound || !evento) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-600 dark:text-gray-400">Evento no encontrado.</p>
        <Link href="/eventos" className="text-[#0ca6b2] font-medium hover:underline">
          Volver a eventos
        </Link>
      </div>
    );
  }

  const fechaDisplay = formatFechaDisplay(evento.fecha, evento.fecha_fin, evento.recurrente);
  const imageSrc = evento.imagen || "/fiesta.jpg";

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header con imagen */}
      <div className="relative h-48 sm:h-64 md:h-80">
        <Image
          src={imageSrc}
          alt={evento.titulo}
          fill
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <Link
          href="/eventos"
          className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>

        <Link
          href={`/eventos/${evento.id}/editar`}
          className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
        </Link>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-3 py-1 text-white text-xs font-semibold rounded-full ${tipoStyles[evento.tipo].bg}`}>
                {tipoStyles[evento.tipo].label}
              </span>
              {evento.recurrente && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Recurrente
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{evento.titulo}</h1>
            {evento.descripcion && (
              <p className="text-white/80 text-sm md:text-base line-clamp-2">{evento.descripcion}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {evento.asistentes_esperados != null && evento.asistentes_esperados > 0 && (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-4 text-center max-w-xs">
                  <p className="text-2xl md:text-3xl font-bold text-[#18301d] dark:text-white">{evento.asistentes_esperados}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Asistentes esperados</p>
                </div>
              )}

              {evento.descripcion && (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-5">
                  <h3 className="font-semibold text-[#18301d] dark:text-white mb-3">Descripción</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{evento.descripcion}</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className={`bg-gradient-to-br ${tipoStyles[evento.tipo].gradient} rounded-2xl p-5 text-white`}>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span className="font-medium">Fecha y hora</span>
                </div>
                <p className="text-xl font-bold mb-1">{fechaDisplay !== "—" ? fechaDisplay : "Sin fecha definida"}</p>
                {evento.recurrente && evento.fecha && formatFechaReferencia(evento.fecha) && (
                  <p className="text-white/70 text-sm mt-0.5">Referencia: {formatFechaReferencia(evento.fecha)}</p>
                )}
                <p className="text-white/80 mt-1">{evento.hora ?? "—"}</p>
              </div>

              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
                  <h3 className="font-semibold text-[#18301d] dark:text-white">Ubicación</h3>
                </div>
                <div className="p-5">
                  <p className="text-[#18301d] dark:text-white">{evento.ubicacion || "—"}</p>
                </div>
              </div>

              {evento.responsable && (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2a2a2a]">
                    <h3 className="font-semibold text-[#18301d] dark:text-white">Responsable</h3>
                  </div>
                  <div className="p-5">
                    <p className="text-[#18301d] dark:text-white">{evento.responsable}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
