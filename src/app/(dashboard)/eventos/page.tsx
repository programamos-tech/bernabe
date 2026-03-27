"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

type TipoEvento = "reunion" | "grupo" | "clase" | "servicio" | "especial";

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: TipoEvento;
  fecha: string;
  fechaFin: string | null;
  hora: string;
  ubicacion: string;
  imagen: string | null;
  asistentesEsperados?: number;
  responsable?: string;
  recurrente?: boolean;
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

const tipoStyles: Record<TipoEvento, { bg: string; color: string; label: string }> = {
  servicio: { bg: "bg-[#e64b27]", color: "text-[#e64b27]", label: "Servicio" },
  reunion: { bg: "bg-[#0ca6b2]", color: "text-[#0ca6b2]", label: "Reunión" },
  grupo: { bg: "bg-[#18301d] dark:bg-[#0ca6b2]", color: "text-[#18301d] dark:text-[#0ca6b2]", label: "Grupo" },
  clase: { bg: "bg-purple-500", color: "text-purple-500", label: "Clase" },
  especial: { bg: "bg-[#f9c70c]", color: "text-[#f9c70c]", label: "Especial" },
};

function EventoCard({ evento }: { evento: Evento }) {
  const imageSrc = evento.imagen || "/fiesta.jpg";
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden hover:shadow-xl dark:hover:shadow-[#0ca6b2]/10 transition-shadow group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={imageSrc}
          alt={evento.titulo}
          fill
          className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${tipoStyles[evento.tipo].bg}`}>
            {tipoStyles[evento.tipo].label}
          </span>
          {evento.recurrente && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
              Recurrente
            </span>
          )}
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white">{evento.titulo}</h3>
          <p className="text-white/80 text-sm mt-1 line-clamp-2">{evento.descripcion}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Schedule */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#f9c70c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span className="text-sm text-[#18301d] dark:text-white font-medium">{formatFechaDisplay(evento.fecha, evento.fechaFin, evento.recurrente ?? false)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#0ca6b2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-400">{evento.hora}</span>
          </div>
          {evento.asistentesEsperados && (
            <>
              <div className="h-4 w-px bg-gray-200 dark:bg-[#2a2a2a]" />
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#0ca6b2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">{evento.asistentesEsperados} esperados</span>
              </div>
            </>
          )}
        </div>

        {/* Responsable */}
        {evento.responsable && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#252525] rounded-xl mb-4">
            <div className="w-10 h-10 rounded-full bg-[#18301d] dark:bg-[#0ca6b2] flex items-center justify-center text-white text-sm font-semibold">
              {evento.responsable.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Responsable</p>
              <p className="text-sm font-medium text-[#18301d] dark:text-white">{evento.responsable}</p>
            </div>
          </div>
        )}

        {/* Location & Link */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#2a2a2a]">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {evento.ubicacion || "—"}
          </div>
          <Link
            href={`/eventos/${evento.id}`}
            className="flex items-center gap-1 text-sm font-medium text-[#0ca6b2] hover:text-[#0a8f99] transition"
          >
            Ver detalles
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("eventos")
      .select("id, titulo, descripcion, tipo, fecha, fecha_fin, hora, ubicacion, imagen, asistentes_esperados, responsable, recurrente")
      .order("titulo")
      .then(({ data, error }) => {
        if (error) {
          setEventos([]);
        } else {
          setEventos(
            (data ?? []).map((row) => ({
              id: row.id,
              titulo: row.titulo ?? "",
              descripcion: row.descripcion ?? "",
              tipo: (row.tipo as TipoEvento) ?? "reunion",
              fecha: row.fecha ?? "",
              fechaFin: row.fecha_fin ?? null,
              hora: row.hora ?? "—",
              ubicacion: row.ubicacion ?? "",
              imagen: row.imagen ?? null,
              asistentesEsperados: row.asistentes_esperados ?? undefined,
              responsable: row.responsable ?? undefined,
              recurrente: row.recurrente ?? false,
            }))
          );
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="px-4 py-8 md:px-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#18301d] dark:text-white">Eventos</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Todos los eventos y actividades de nuestra iglesia.
            </p>
          </div>
          <Link
            href="/eventos/nuevo"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#e64b27] text-white font-semibold rounded-full hover:bg-[#d4421f] transition shadow-lg shadow-[#e64b27]/25 w-full sm:w-auto flex-shrink-0 whitespace-nowrap"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo evento
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button className="px-4 py-2 bg-[#18301d] dark:bg-[#0ca6b2] text-white text-sm font-medium rounded-full">
            Todos
          </button>
          <button className="px-4 py-2 bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 text-sm font-medium rounded-full border border-gray-200 dark:border-[#2a2a2a] hover:border-[#e64b27] hover:text-[#e64b27] transition">
            Servicios
          </button>
          <button className="px-4 py-2 bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 text-sm font-medium rounded-full border border-gray-200 dark:border-[#2a2a2a] hover:border-[#0ca6b2] hover:text-[#0ca6b2] transition">
            Reuniones
          </button>
          <button className="px-4 py-2 bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 text-sm font-medium rounded-full border border-gray-200 dark:border-[#2a2a2a] hover:border-[#0ca6b2] hover:text-[#0ca6b2] transition">
            Grupos
          </button>
          <button className="px-4 py-2 bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 text-sm font-medium rounded-full border border-gray-200 dark:border-[#2a2a2a] hover:border-purple-500 hover:text-purple-500 transition">
            Clases
          </button>
          <button className="px-4 py-2 bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 text-sm font-medium rounded-full border border-gray-200 dark:border-[#2a2a2a] hover:border-[#f9c70c] hover:text-[#f9c70c] transition">
            Especiales
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Cargando eventos…</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {eventos.map((evento) => (
              <EventoCard key={evento.id} evento={evento} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            ¿Planeas un nuevo evento?{" "}
            <Link href="/eventos/nuevo" className="text-[#0ca6b2] font-medium hover:underline">
              Crear nuevo evento
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
