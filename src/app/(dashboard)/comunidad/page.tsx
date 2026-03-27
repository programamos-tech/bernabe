"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Avatar from "boring-avatars";
import { createClient } from "@/lib/supabase/client";
import {
  buildProximosEventosItems,
  formatDiaMesCorto,
  type EventoRowComunidad,
  type GrupoRowComunidad,
  type ProximoEventoItem,
} from "@/lib/proximos-eventos-comunidad";
import { buildCumpleanosEstaSemana, type CumpleanoSemanaItem } from "@/lib/cumpleanos-comunidad";
import {
  computeStatsAsistenciaGrupo,
  rangoSemanaCreatedAt,
  rangoSemanaFechasISO,
  type StatsSemanaComunidad,
} from "@/lib/estadisticas-semana-comunidad";

type TipoActividad = "evento" | "reunion" | "bautizo" | "nuevo_miembro" | "seguimiento" | "anuncio" | "cumpleanos" | "logro";

interface Actividad {
  id: string;
  tipo: TipoActividad;
  titulo: string;
  descripcion: string;
  fecha: string;
  hora?: string;
  autor?: string;
  grupo?: string;
  imagen?: string;
  personas?: string[];
  likes?: number;
}

const actividades: Actividad[] = [
  {
    id: "1",
    tipo: "anuncio",
    titulo: "Servicio especial de Semana Santa",
    descripcion: "Este domingo tendremos un servicio especial de Semana Santa a las 9:00 AM. ¡No te lo pierdas! Habrá alabanza especial y un mensaje poderoso.",
    fecha: "Hoy",
    hora: "9:00 AM",
    autor: "Pastor Carlos",
    likes: 24,
  },
  {
    id: "2",
    tipo: "bautizo",
    titulo: "¡3 nuevos bautizos!",
    descripcion: "Celebramos con gozo el bautizo de María, Juan y Pedro. ¡Bienvenidos a la familia de Cristo!",
    fecha: "Ayer",
    autor: "Pastor Carlos",
    personas: ["María García", "Juan Pérez", "Pedro López"],
    likes: 45,
  },
  {
    id: "3",
    tipo: "reunion",
    titulo: "Reunión de Jóvenes",
    descripcion: "Gran reunión de jóvenes con 38 asistentes. Tema: 'Viviendo con propósito'. Andrés lideró una dinámica increíble.",
    fecha: "Hace 2 días",
    grupo: "Jóvenes",
    autor: "Andrés Martínez",
    likes: 18,
  },
  {
    id: "4",
    tipo: "nuevo_miembro",
    titulo: "Nuevo miembro en la familia",
    descripcion: "Carlos Suárez ha decidido ser parte de nuestra iglesia después de su proceso de integración. ¡Bienvenido!",
    fecha: "Hace 3 días",
    personas: ["Carlos Suárez"],
    likes: 32,
  },
  {
    id: "5",
    tipo: "evento",
    titulo: "Retiro de Mujeres - Inscripciones abiertas",
    descripcion: "El retiro anual de mujeres será el 28 de marzo. Tema: 'Mujeres de propósito'. Cupos limitados, ¡inscríbete ya!",
    fecha: "Hace 3 días",
    hora: "8:00 AM - 5:00 PM",
    grupo: "Mujeres",
    autor: "Ana García",
    likes: 28,
  },
  {
    id: "6",
    tipo: "cumpleanos",
    titulo: "¡Feliz cumpleaños!",
    descripcion: "Hoy celebramos el cumpleaños de Laura Herrera, Sofía Díaz y Roberto Acosta. ¡Que Dios los bendiga!",
    fecha: "Hace 4 días",
    personas: ["Laura Herrera", "Sofía Díaz", "Roberto Acosta"],
    likes: 15,
  },
  {
    id: "7",
    tipo: "logro",
    titulo: "Meta alcanzada: 50 seguimientos",
    descripcion: "El equipo de seguimiento completó 50 visitas a nuevos visitantes este mes. ¡Gracias por su dedicación!",
    fecha: "Hace 5 días",
    autor: "María Rodríguez",
    likes: 22,
  },
  {
    id: "8",
    tipo: "reunion",
    titulo: "Célula de Parejas",
    descripcion: "Hermosa reunión de parejas en casa de los Rodríguez. Tema: 'Comunicación efectiva en el matrimonio'.",
    fecha: "Hace 1 semana",
    grupo: "Parejas",
    autor: "Carlos y María Rodríguez",
    likes: 19,
  },
];

const tipoStyles: Record<TipoActividad, { color: string; bg: string; icon: JSX.Element; label: string }> = {
  evento: {
    color: "text-[#e64b27]",
    bg: "bg-[#e64b27]",
    label: "Evento",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />,
  },
  reunion: {
    color: "text-[#0ca6b2]",
    bg: "bg-[#0ca6b2]",
    label: "Reunión",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />,
  },
  bautizo: {
    color: "text-blue-500",
    bg: "bg-blue-500",
    label: "Bautizo",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
  },
  nuevo_miembro: {
    color: "text-green-500",
    bg: "bg-green-500",
    label: "Nuevo miembro",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />,
  },
  seguimiento: {
    color: "text-[#f9c70c]",
    bg: "bg-[#f9c70c]",
    label: "Seguimiento",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />,
  },
  anuncio: {
    color: "text-[#18301d] dark:text-[#0ca6b2]",
    bg: "bg-[#18301d] dark:bg-[#0ca6b2]",
    label: "Anuncio",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />,
  },
  cumpleanos: {
    color: "text-pink-500",
    bg: "bg-pink-500",
    label: "Cumpleaños",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12" />,
  },
  logro: {
    color: "text-purple-500",
    bg: "bg-purple-500",
    label: "Logro",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />,
  },
};

export default function Page() {
  const [proximosEventos, setProximosEventos] = useState<ProximoEventoItem[]>([]);
  const [proximosLoading, setProximosLoading] = useState(true);
  const [cumpleanosSemana, setCumpleanosSemana] = useState<CumpleanoSemanaItem[]>([]);
  const [cumpleanosLoading, setCumpleanosLoading] = useState(true);
  const [statsSemana, setStatsSemana] = useState<StatsSemanaComunidad | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { desde, hasta } = rangoSemanaFechasISO();
      const { desde: desdeTs, hastaExclusive } = rangoSemanaCreatedAt();

      const [eventosRes, gruposRes, personasRes, visitantesRes, seguimientosRes] = await Promise.all([
        supabase
          .from("eventos")
          .select("id, titulo, tipo, fecha, fecha_fin, hora, ubicacion, recurrente, imagen, grupo_id")
          .order("fecha"),
        supabase.from("grupos").select("id, nombre, dia, hora, ubicacion, imagen").eq("activo", true),
        supabase.from("personas").select("id, nombre, fecha_nacimiento").not("fecha_nacimiento", "is", null),
        supabase
          .from("personas")
          .select("*", { count: "exact", head: true })
          .eq("estado", "Visitante")
          .gte("created_at", desdeTs)
          .lt("created_at", hastaExclusive),
        supabase
          .from("persona_historial")
          .select("*", { count: "exact", head: true })
          .gte("fecha", desde)
          .lte("fecha", hasta)
          .not("tipo_seguimiento", "is", null)
          .neq("tipo_seguimiento", "asistencia"),
      ]);

      const asistenciaRows: { grupo_id: string; fecha: string }[] = [];
      const pageSize = 1000;
      let offset = 0;
      for (;;) {
        const { data: chunk, error: asistErr } = await supabase
          .from("persona_asistencia")
          .select("grupo_id, fecha")
          .gte("fecha", desde)
          .lte("fecha", hasta)
          .order("fecha", { ascending: true })
          .order("grupo_id", { ascending: true })
          .range(offset, offset + pageSize - 1);
        if (asistErr) {
          console.error("persona_asistencia semana:", asistErr);
          break;
        }
        if (!chunk?.length) break;
        asistenciaRows.push(...(chunk as { grupo_id: string; fecha: string }[]));
        if (chunk.length < pageSize) break;
        offset += pageSize;
      }

      const items = buildProximosEventosItems(
        (eventosRes.data ?? []) as EventoRowComunidad[],
        (gruposRes.data ?? []) as GrupoRowComunidad[],
        { limit: 8, horizonDays: 90 }
      );
      setProximosEventos(items);
      setProximosLoading(false);

      const cumple = buildCumpleanosEstaSemana(personasRes.data ?? []);
      setCumpleanosSemana(cumple);
      setCumpleanosLoading(false);

      const { asistenciasEnGrupos, reunionesDeGrupo } = computeStatsAsistenciaGrupo(asistenciaRows);
      setStatsSemana({
        asistenciasEnGrupos,
        reunionesDeGrupo,
        nuevosVisitantes: visitantesRes.count ?? 0,
        seguimientos: seguimientosRes.count ?? 0,
      });
      setStatsLoading(false);
    })();
  }, []);

  return (
    <div className="px-4 py-8 md:px-6 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#18301d] dark:text-white">Comunidad</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Todo lo que está pasando en nuestra iglesia.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Feed Principal */}
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Post */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-4">
              <div className="flex gap-3">
                <Avatar size={44} name="Pastor" variant="beam" colors={["#0ca6b2", "#18301d", "#e64b27", "#f9c70c", "#faddbf"]} />
                <button className="flex-1 text-left px-4 py-3 bg-gray-50 dark:bg-[#252525] rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition">
                  ¿Qué está pasando en la iglesia?
                </button>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-[#2a2a2a]">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition">
                  <svg className="w-5 h-5 text-[#e64b27]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Evento
                </button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition">
                  <svg className="w-5 h-5 text-[#18301d] dark:text-[#0ca6b2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
                  </svg>
                  Anuncio
                </button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition">
                  <svg className="w-5 h-5 text-[#0ca6b2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  Foto
                </button>
              </div>
            </div>

            {/* Feed Items */}
            {actividades.map((actividad) => (
              <div key={actividad.id} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden hover:shadow-lg transition">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <svg className={`w-6 h-6 ${tipoStyles[actividad.tipo].color} flex-shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      {tipoStyles[actividad.tipo].icon}
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${tipoStyles[actividad.tipo].bg}`}>
                          {tipoStyles[actividad.tipo].label}
                        </span>
                        {actividad.grupo && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#333] text-gray-600 dark:text-gray-300">
                            {actividad.grupo}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-[#18301d] dark:text-white mt-1">{actividad.titulo}</h3>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{actividad.fecha}</span>
                  </div>

                  {/* Content */}
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{actividad.descripcion}</p>

                  {/* Personas mencionadas */}
                  {actividad.personas && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex -space-x-2">
                        {actividad.personas.slice(0, 3).map((persona, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#1a1a1a]">
                            <Avatar size={28} name={persona} variant="beam" colors={["#0ca6b2", "#18301d", "#e64b27", "#f9c70c", "#faddbf"]} />
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {actividad.personas.join(", ")}
                      </span>
                    </div>
                  )}

                  {/* Autor */}
                  {actividad.autor && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-[#2a2a2a]">
                      <Avatar size={24} name={actividad.autor} variant="beam" colors={["#0ca6b2", "#18301d", "#e64b27", "#f9c70c", "#faddbf"]} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Publicado por <span className="font-medium text-[#18301d] dark:text-white">{actividad.autor}</span></span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-5 py-3 bg-gray-50 dark:bg-[#252525] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-[#e64b27] transition">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                      <span className="text-sm">{actividad.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-[#0ca6b2] transition">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                      </svg>
                      <span className="text-sm">Comentar</span>
                    </button>
                  </div>
                  <button className="text-gray-400 hover:text-[#18301d] dark:hover:text-white transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Próximos eventos (datos reales: eventos + grupos) */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
                <h3 className="font-semibold text-[#18301d] dark:text-white">Próximos eventos</h3>
                <Link href="/calendario" className="text-sm text-[#0ca6b2] hover:underline">
                  Ver todos
                </Link>
              </div>
              <div className="p-4">
                {proximosLoading ? (
                  <div className="flex justify-center py-8">
                    <svg className="w-8 h-8 animate-spin text-[#0ca6b2]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                ) : proximosEventos.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6 px-2">
                    No hay eventos próximos. Crea eventos en Calendario o revisa tus grupos.
                  </p>
                ) : (
                  <div
                    className="max-h-[min(20rem,38vh)] md:max-h-80 overflow-y-auto overscroll-contain space-y-2 touch-pan-y scrollbar-hide"
                    role="region"
                    aria-label="Lista de próximos eventos"
                  >
                    {proximosEventos.map((evento) => (
                      <Link
                        key={evento.key}
                        href={evento.href}
                        className="flex items-start gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition"
                      >
                        <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#252525]">
                          {evento.imagen ? (
                            <Image
                              src={evento.imagen}
                              alt=""
                              fill
                              className="object-cover object-top"
                              sizes="48px"
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0ca6b2]/15 dark:bg-[#0ca6b2]/25">
                              <span className="text-[10px] font-semibold text-[#0ca6b2] leading-none">
                                {formatDiaMesCorto(evento.fecha).split(" ")[0]}
                              </span>
                              <span className="text-sm font-bold text-[#0ca6b2] leading-tight">
                                {evento.fecha.getDate()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="font-medium text-[#18301d] dark:text-white text-sm leading-snug line-clamp-2">{evento.titulo}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={evento.etiqueta}>
                            {evento.etiqueta}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {formatDiaMesCorto(evento.fecha)} · {evento.hora}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cumpleaños de la semana (fecha_nacimiento en personas) */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center gap-2">
                <svg className="w-5 h-5 text-pink-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12" />
                </svg>
                <h3 className="font-semibold text-[#18301d] dark:text-white">Cumpleaños esta semana</h3>
              </div>
              <div className="p-4">
                {cumpleanosLoading ? (
                  <div className="flex justify-center py-8">
                    <svg className="w-8 h-8 animate-spin text-pink-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                ) : cumpleanosSemana.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6 px-2">
                    Nadie cumple esta semana. Añade fecha de nacimiento en las fichas de personas.
                  </p>
                ) : (
                  <div
                    className="max-h-[min(18rem,36vh)] md:max-h-72 overflow-y-auto overscroll-contain space-y-1 touch-pan-y scrollbar-hide"
                    role="region"
                    aria-label="Cumpleaños de la semana"
                  >
                    {cumpleanosSemana.map((persona) => (
                      <Link
                        key={persona.id}
                        href={`/personas/${persona.id}`}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition"
                      >
                        <Avatar size={36} name={persona.nombre} variant="beam" colors={["#0ca6b2", "#18301d", "#e64b27", "#f9c70c", "#faddbf"]} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#18301d] dark:text-white text-sm truncate">{persona.nombre}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{persona.etiqueta}</p>
                        </div>
                        <span className="p-2 rounded-lg text-gray-400 dark:text-gray-500 shrink-0" aria-hidden>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                          </svg>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas rápidas (datos reales, semana lun–dom local) */}
            <div className="bg-gradient-to-br from-[#18301d] to-[#2d4a35] dark:from-[#1a1a1a] dark:to-[#252525] dark:border dark:border-[#2a2a2a] rounded-2xl p-5 text-white">
              <h3 className="font-semibold mb-4">Esta semana</h3>
              {statsLoading || !statsSemana ? (
                <div className="flex justify-center py-10">
                  <svg className="w-8 h-8 animate-spin text-white/80" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-3xl font-bold tabular-nums">{statsSemana.asistenciasEnGrupos}</p>
                    <p className="text-sm text-white/70 leading-snug">Asistencias registradas</p>
                    <p className="text-xs text-white/50 mt-0.5 leading-snug">Reuniones de grupos</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold tabular-nums">{statsSemana.reunionesDeGrupo}</p>
                    <p className="text-sm text-white/70">Reuniones de grupo</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold tabular-nums">{statsSemana.nuevosVisitantes}</p>
                    <p className="text-sm text-white/70">Nuevos visitantes</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold tabular-nums">{statsSemana.seguimientos}</p>
                    <p className="text-sm text-white/70">Seguimientos</p>
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
