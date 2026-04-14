"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DatePicker } from "@/components/ui/DatePicker";

type TipoEvento = "reunion" | "grupo" | "clase" | "servicio" | "especial";

const tiposEvento: { value: TipoEvento; label: string; color: string }[] = [
  { value: "servicio", label: "Servicio", color: "text-[#e64b27]" },
  { value: "reunion", label: "Reunión", color: "text-[#0ca6b2]" },
  { value: "grupo", label: "Grupo", color: "text-[#18301d] dark:text-[#0ca6b2]" },
  { value: "clase", label: "Clase", color: "text-purple-500" },
  { value: "especial", label: "Evento especial", color: "text-[#f9c70c]" },
];

/** Convierte hora de DB "10:00" o "19:00" a value para input type="time" (HH:mm) */
function horaToTimeInput(hora: string | null): string {
  if (!hora) return "";
  const match = hora.trim().match(/^(\d{1,2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  return "";
}

function FormField({ 
  icon, 
  label, 
  children 
}: { 
  icon: React.ReactNode; 
  label: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-[#252525]">
      <div className="mt-0.5">
        {icon}
      </div>
      <div className="flex-1">
        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{label}</label>
        {children}
      </div>
    </div>
  );
}

interface GrupoRow {
  id: string;
  nombre: string;
}

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const eventoId = params.id as string;

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<TipoEvento>("reunion");
  const [fecha, setFecha] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [hora, setHora] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [recurrente, setRecurrente] = useState(false);
  const [grupoId, setGrupoId] = useState("");
  const [gruposDisponibles, setGruposDisponibles] = useState<GrupoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("eventos").select("id, titulo, descripcion, tipo, fecha, fecha_fin, hora, ubicacion, recurrente, grupo_id").eq("id", eventoId).single(),
      supabase.from("grupos").select("id, nombre").order("nombre"),
    ]).then(([eventoRes, gruposRes]) => {
      if (eventoRes.error || !eventoRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const e = eventoRes.data;
      setTitulo(e.titulo ?? "");
      setDescripcion(e.descripcion ?? "");
      setTipo((e.tipo as TipoEvento) ?? "reunion");
      setFecha(e.fecha ? new Date((e.fecha as string) + "T12:00:00") : null);
      setFechaFin(e.fecha_fin ? new Date((e.fecha_fin as string) + "T12:00:00") : null);
      setHora(horaToTimeInput(e.hora));
      setUbicacion(e.ubicacion ?? "");
      setRecurrente(e.recurrente ?? false);
      setGrupoId(e.grupo_id ?? "");
      setGruposDisponibles((gruposRes.data as GrupoRow[]) ?? []);
      setLoading(false);
    });
  }, [eventoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("eventos")
      .update({
        titulo,
        descripcion: descripcion || null,
        tipo,
        fecha: fecha ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}` : null,
        fecha_fin: !recurrente && fechaFin ? `${fechaFin.getFullYear()}-${String(fechaFin.getMonth() + 1).padStart(2, "0")}-${String(fechaFin.getDate()).padStart(2, "0")}` : null,
        hora: hora || null,
        ubicacion: ubicacion || null,
        recurrente,
        grupo_id: tipo === "grupo" && grupoId ? grupoId : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventoId);
    setIsSubmitting(false);
    if (error) {
      return;
    }
    router.push(`/eventos/${eventoId}`);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Cargando…</p>
      </div>
    );
  }
  if (notFound) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-600 dark:text-gray-400">Evento no encontrado.</p>
        <Link href="/eventos" className="text-[#0ca6b2] font-medium hover:underline">Volver a eventos</Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0ca6b2] to-[#14b8a6] dark:from-[#1a1a1a] dark:to-[#252525] py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 dark:bg-[#333] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Editar evento
                </h1>
                <p className="text-white/80 mt-1">
                  {titulo}
                </p>
              </div>
            </div>
            <Link href={`/eventos/${eventoId}`} className="p-2 text-white/70 hover:text-white transition">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>
      </div>

      {/* Content */}
      <div className="py-6">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h2 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Información del evento</h2>
                <div className="space-y-4">
                  <FormField
                    icon={
                      <svg className="w-5 h-5 text-[#e64b27]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    }
                    label="Nombre del evento"
                  >
                    <input
                      type="text"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ej: Servicio dominical, Reunión de jóvenes..."
                      className="w-full bg-transparent text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none"
                      required
                    />
                  </FormField>

                  <FormField
                    icon={
                      <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                      </svg>
                    }
                    label="Descripción"
                  >
                    <textarea
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Describe los detalles del evento..."
                      rows={3}
                      className="w-full bg-transparent text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none resize-none"
                    />
                  </FormField>
                </div>
              </div>

              {/* Date & Time */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h2 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Fecha y hora</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    icon={
                      <svg className="w-5 h-5 text-[#f9c70c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                    }
                    label="Fecha de inicio"
                  >
                    <DatePicker
                      id="fecha"
                      name="fecha"
                      value={fecha}
                      onChange={(d) => {
                        setFecha(d);
                        if (fechaFin && d && d > fechaFin) setFechaFin(null);
                      }}
                      placeholder="dd/mm/aaaa"
                      minYear={new Date().getFullYear() - 1}
                      maxYear={new Date().getFullYear() + 5}
                    />
                  </FormField>

                  {!recurrente && (
                    <FormField
                      icon={
                        <svg className="w-5 h-5 text-[#f9c70c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                      }
                      label="Fecha de fin (opcional)"
                    >
                      <DatePicker
                        id="fecha_fin"
                        name="fecha_fin"
                        value={fechaFin}
                        onChange={setFechaFin}
                        placeholder="Mismo día si no aplica"
                        minYear={new Date().getFullYear() - 1}
                        maxYear={new Date().getFullYear() + 5}
                      />
                    </FormField>
                  )}

                  <FormField
                    icon={
                      <svg className="w-5 h-5 text-[#0ca6b2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    label="Hora"
                  >
                    <input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      className="w-full bg-transparent text-[#18301d] dark:text-white focus:outline-none cursor-pointer"
                    />
                  </FormField>
                </div>

                {/* Recurrence */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#2a2a2a]">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={recurrente}
                      onChange={(e) => setRecurrente(e.target.checked)}
                      className="w-4 h-4 text-[#0ca6b2] rounded focus:ring-[#0ca6b2]" 
                    />
                    <span className="text-sm text-[#18301d] dark:text-white">Evento recurrente</span>
                  </label>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h2 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Ubicación</h2>
                <div className="space-y-4">
                  <FormField
                    icon={
                      <svg className="w-5 h-5 text-[#e64b27]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    }
                    label="Lugar"
                  >
                    <input
                      type="text"
                      value={ubicacion}
                      onChange={(e) => setUbicacion(e.target.value)}
                      placeholder="Ej: Auditorio principal, Salón de reuniones..."
                      className="w-full bg-transparent text-[#18301d] dark:text-white placeholder:text-gray-400 focus:outline-none"
                      required
                    />
                  </FormField>

                </div>
              </div>

              {/* Image Upload */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h2 className="text-lg font-semibold text-[#18301d] dark:text-white mb-4">Imagen del evento</h2>
                <div className="border-2 border-dashed border-gray-200 dark:border-[#333] rounded-xl p-8 text-center hover:border-[#0ca6b2] transition cursor-pointer">
                  <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cambiar imagen del evento</p>
                  <p className="text-xs text-gray-400">PNG, JPG hasta 5MB</p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event Type */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Tipo de evento</h3>
                <div className="space-y-2">
                  {tiposEvento.map((t) => (
                    <label
                      key={t.value}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                        tipo === t.value 
                          ? "bg-gray-100 dark:bg-[#252525]" 
                          : "hover:bg-gray-50 dark:hover:bg-[#252525]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipo"
                        value={t.value}
                        checked={tipo === t.value}
                        onChange={(e) => setTipo(e.target.value as TipoEvento)}
                        className="w-4 h-4 text-[#0ca6b2] focus:ring-[#0ca6b2]"
                      />
                      <svg className={`w-5 h-5 ${t.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        {t.value === "servicio" && (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                        )}
                        {t.value === "reunion" && (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        )}
                        {t.value === "grupo" && (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        )}
                        {t.value === "clase" && (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        )}
                        {t.value === "especial" && (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                        )}
                      </svg>
                      <span className="text-sm font-medium text-[#18301d] dark:text-white">{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Assign to Group */}
              {tipo === "grupo" && (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#2a2a2a] p-6">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Asignar a grupo</h3>
                  <div className="space-y-2">
                    {gruposDisponibles.map((grupo) => (
                      <label
                        key={grupo.id}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                          grupoId === grupo.id 
                            ? "bg-gray-100 dark:bg-[#252525]" 
                            : "hover:bg-gray-50 dark:hover:bg-[#252525]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="grupo"
                          value={grupo.id}
                          checked={grupoId === grupo.id}
                          onChange={(e) => setGrupoId(e.target.value)}
                          className="w-4 h-4 text-[#0ca6b2] focus:ring-[#0ca6b2]"
                        />
                        <svg className="w-5 h-5 text-[#0ca6b2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                        <span className="text-sm font-medium text-[#18301d] dark:text-white">{grupo.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !titulo}
                  className="w-full py-4 bg-[#0ca6b2] text-white font-semibold rounded-2xl hover:bg-[#0a8f99] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-[#0ca6b2]/25 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Guardando cambios...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Guardar cambios
                    </>
                  )}
                </button>

                <Link
                  href={`/eventos/${eventoId}`}
                  className="w-full py-3 bg-gray-100 dark:bg-[#252525] text-[#18301d] dark:text-white font-medium rounded-2xl hover:bg-gray-200 dark:hover:bg-[#333] transition flex items-center justify-center gap-2"
                >
                  Cancelar
                </Link>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-200 dark:border-red-500/20 p-4">
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Zona de peligro</h3>
                <p className="text-sm text-red-500/80 dark:text-red-400/70 mb-3">
                  Estas acciones no se pueden deshacer.
                </p>
                <button
                  type="button"
                  className="w-full py-2.5 bg-white dark:bg-[#1a1a1a] text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                >
                  Eliminar evento
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
