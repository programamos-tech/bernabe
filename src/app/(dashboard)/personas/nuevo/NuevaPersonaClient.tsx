"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/UserAvatar";
import { DatePicker } from "@/components/ui/DatePicker";
import { soloDigitosDocumentoId } from "@/lib/documento-id";
import { ETAPA_LABELS, type EtapaPersonaDb } from "@/lib/persona-etapa";
import { labelSituacionLaboralEstudio } from "@/lib/persona-info-lider";
import {
  parseTriBoolForm,
  SITUACION_ACERCAMIENTO_OPTIONS,
  type SituacionAcercamiento,
} from "@/lib/personas-situacion-acercamiento";
import { type PersonaSexo } from "@/lib/persona-sexo";
import { fechaHoyYYYYMMDD } from "@/lib/fecha-hoy-local";
import { createClient } from "@/lib/supabase/client";
import { labelParticipacionEnGrupo } from "../[id]/_lib/persona-detail-participacion";
import { calcularEdad, fechaLocalToIso } from "../[id]/_lib/persona-detail-dates";
import type { AuthInsertContext } from "../[id]/_lib/persona-detail-types";
import type { ReactNode } from "react";
import { GrupoCalendarioStyleCard, GrupoSelectableCard } from "../_components/GrupoSeleccionCalendarioCards";

interface GrupoOption {
  id: string;
  nombre: string;
  hora: string | null;
  ubicacion: string | null;
  dia: string | null;
}

const ESTADOS_CIVILES_CARD = [
  "Soltero/a",
  "Casado/a",
  "Unión libre",
  "Divorciado/a",
  "Viudo/a",
] as const;

const OCUPACIONES_CARD = [
  "Salud (Médico, Enfermero, etc.)",
  "Ingeniería y Tecnología",
  "Educación (Docente, Profesor)",
  "Administración y Negocios",
  "Finanzas y Contabilidad",
  "Derecho y Legal",
  "Comercio y Ventas",
  "Construcción y Arquitectura",
  "Transporte y Logística",
  "Hotelería y Turismo",
  "Comunicación y Marketing",
  "Arte y Diseño",
  "Agricultura y Ganadería",
  "Servicios (Belleza, Limpieza, etc.)",
  "Seguridad",
  "Estudiante",
  "Ama de casa",
  "Jubilado/Pensionado",
  "Independiente/Emprendedor",
  "Desempleado",
  "Otro",
] as const;

const INLINE_FIELD_CLASS =
  "w-full min-w-0 border-0 bg-transparent py-2.5 px-0 text-sm font-medium leading-snug text-gray-900 shadow-none ring-0 placeholder:text-gray-500/45 focus:outline-none focus:ring-0 dark:text-white dark:placeholder:text-gray-500/50";

const INLINE_SELECT_CLASS = `${INLINE_FIELD_CLASS} cursor-pointer pr-1 dark:[color-scheme:dark]`;

const INLINE_TEXTAREA_CLASS = `${INLINE_FIELD_CLASS} min-h-[3.5rem] resize-y`;

function triToBoolDraft(t: "" | "true" | "false"): boolean | null {
  if (t === "true") return true;
  if (t === "false") return false;
  return null;
}

function PersonaFichaRowEdit({
  k,
  children,
  multiline,
}: {
  k: string;
  children: ReactNode;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-200/40 py-4 last:border-b-0 dark:border-white/[0.06] sm:gap-4">
      <dt className="w-[5.5rem] shrink-0 pt-2.5 text-xs text-gray-500 dark:text-gray-400 sm:w-24">{k}</dt>
      <dd
        className={`min-w-0 flex-1 text-sm leading-snug text-gray-900 dark:text-white ${
          multiline ? "[&_textarea]:whitespace-pre-wrap" : ""
        }`}
      >
        {children}
      </dd>
    </div>
  );
}

function PersonaFichaColumn({
  title,
  children,
  titleSpacing = "default",
}: {
  title: string;
  children: ReactNode;
  titleSpacing?: "default" | "roomy";
}) {
  const titleMb = titleSpacing === "roomy" ? "mb-4" : "mb-2";
  return (
    <section className="min-w-0">
      <h3 className={`${titleMb} text-sm font-semibold text-gray-900 dark:text-white`}>{title}</h3>
      <dl>{children}</dl>
    </section>
  );
}

async function resolveAuthInsertContext(
  supabase: ReturnType<typeof createClient>
): Promise<AuthInsertContext | null> {
  const {
    data: { session },
    error: sErr,
  } = await supabase.auth.getSession();
  if (sErr || !session?.user) return null;
  const { data: prof, error: pErr } = await supabase
    .from("profiles")
    .select("organization_id, full_name")
    .eq("id", session.user.id)
    .maybeSingle();
  if (pErr || !prof?.organization_id) return null;
  return {
    userId: session.user.id,
    organizationId: prof.organization_id,
    fullName: ((prof.full_name as string | null) ?? "").trim(),
  };
}

export default function NuevaPersonaClient() {
  const router = useRouter();
  const [grupos, setGrupos] = useState<GrupoOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  const [nombre, setNombre] = useState("");
  const [documentoId, setDocumentoId] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [sexo, setSexo] = useState<PersonaSexo | "">("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [ocupacion, setOcupacion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [grupoRadio, setGrupoRadio] = useState("");
  const [bautizadoTri, setBautizadoTri] = useState<"" | "true" | "false">("");
  const [situacion, setSituacion] = useState("");
  const [vieneDeOtraIglesia, setVieneDeOtraIglesia] = useState<"" | "true" | "false">("");
  const [nombreIglesiaAnterior, setNombreIglesiaAnterior] = useState("");
  const [tieneParejaTri, setTieneParejaTri] = useState<"" | "true" | "false">("");
  const [nombrePareja, setNombrePareja] = useState("");
  const [trabajaTri, setTrabajaTri] = useState<"" | "true" | "false">("");
  const [estudiaTri, setEstudiaTri] = useState<"" | "true" | "false">("");
  const [condicionSalud, setCondicionSalud] = useState("");
  const [contactoEmergenciaNombre, setContactoEmergenciaNombre] = useState("");
  const [contactoEmergenciaTelefono, setContactoEmergenciaTelefono] = useState("");

  const [nuevaNotaInput, setNuevaNotaInput] = useState("");
  const [draftNotas, setDraftNotas] = useState<{ id: string; contenido: string }[]>([]);
  const [nuevaPeticionInput, setNuevaPeticionInput] = useState("");
  const [draftPeticiones, setDraftPeticiones] = useState<{ id: string; contenido: string }[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("grupos")
      .select("id, nombre, hora, ubicacion, dia")
      .eq("activo", true)
      .order("nombre")
      .then(({ data }) =>
        setGrupos(
          ((data ?? []) as GrupoOption[]).map((g) => ({
            id: g.id,
            nombre: g.nombre,
            hora: g.hora ?? null,
            ubicacion: g.ubicacion ?? null,
            dia: g.dia ?? null,
          }))
        )
      );
  }, []);

  const etapaAlRegistrar: EtapaPersonaDb = grupoRadio ? "nuevo_creyente" : "visitante";
  const grupoNombre = grupoRadio ? grupos.find((g) => g.id === grupoRadio)?.nombre ?? "—" : "Sin grupo asignado";

  const agregarNotaDraft = () => {
    const t = nuevaNotaInput.trim();
    if (!t) return;
    setDraftNotas((prev) => [{ id: `draft-${crypto.randomUUID()}`, contenido: t }, ...prev]);
    setNuevaNotaInput("");
  };

  const agregarPeticionDraft = () => {
    const t = nuevaPeticionInput.trim();
    if (!t) return;
    setDraftPeticiones((prev) => [{ id: `draft-${crypto.randomUUID()}`, contenido: t }, ...prev]);
    setNuevaPeticionInput("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const nombreVal = nombre.trim();
    const cedulaVal = documentoId.trim() || null;
    const telefonoVal = telefono.trim() || null;
    const emailVal = email.trim() || null;
    const estadoCivilVal = estadoCivil || null;
    const ocupacionVal = ocupacion || null;
    const direccionVal = direccion.trim() || null;
    const newG = grupoRadio.trim() || null;
    const bautizadoVal = parseTriBoolForm(bautizadoTri);
    const vieneOtraVal = parseTriBoolForm(vieneDeOtraIglesia);
    const iglesiaAntVal = nombreIglesiaAnterior.trim() || null;
    const situRaw = situacion.trim() || null;
    const situacionesValidas: SituacionAcercamiento[] = [
      "primera_vez_fe",
      "otra_iglesia",
      "retorno",
      "no_indica",
    ];
    const situacionVal =
      situRaw && situacionesValidas.includes(situRaw as SituacionAcercamiento)
        ? (situRaw as SituacionAcercamiento)
        : null;
    const tieneParejaVal = parseTriBoolForm(tieneParejaTri);
    const trabajaVal = parseTriBoolForm(trabajaTri);
    const estudiaVal = parseTriBoolForm(estudiaTri);

    if (!nombreVal) {
      setError("El nombre es obligatorio.");
      setIsSubmitting(false);
      return;
    }

    if (!telefonoVal) {
      setError("El teléfono es obligatorio.");
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();
      const ctx = await resolveAuthInsertContext(supabase);
      if (!ctx) {
        setError("Debes iniciar sesión para registrar una persona.");
        setIsSubmitting(false);
        return;
      }

      const insertPayload: Record<string, unknown> = {
        organization_id: ctx.organizationId,
        nombre: nombreVal,
        sexo: sexo === "" ? null : sexo,
        cedula: cedulaVal,
        telefono: telefonoVal,
        email: emailVal,
        fecha_nacimiento: fechaNacimiento ? fechaNacimiento.toISOString().slice(0, 10) : null,
        estado_civil: estadoCivilVal,
        ocupacion: ocupacionVal,
        direccion: direccionVal,
        grupo_id: newG,
        participacion_en_grupo: newG ? "miembro" : null,
        fecha_ingreso_grupo: newG ? fechaHoyYYYYMMDD() : null,
        co_lider_desde: null,
        notas: null,
        etapa: newG ? "nuevo_creyente" : "visitante",
        rol: "Miembro",
        bautizado: bautizadoVal,
        viene_de_otra_iglesia: vieneOtraVal,
        nombre_iglesia_anterior: vieneOtraVal === true ? iglesiaAntVal : null,
        situacion_acercamiento: situacionVal,
        tiene_pareja: tieneParejaVal,
        nombre_pareja: tieneParejaVal === true ? nombrePareja.trim() || null : null,
        trabaja_actualmente: trabajaVal,
        estudia_actualmente: estudiaVal,
        condicion_salud: condicionSalud.trim() || null,
        contacto_emergencia_nombre: contactoEmergenciaNombre.trim() || null,
        contacto_emergencia_telefono: contactoEmergenciaTelefono.trim() || null,
      };

      const { data: nuevaPersona, error: insertErr } = await supabase
        .from("personas")
        .insert(insertPayload)
        .select("id")
        .single();

      if (insertErr) {
        if (insertErr.code === "23505") {
          setError(
            "Ya existe una persona con ese documento de identidad en tu iglesia. Revisa el número o busca en el listado."
          );
          setIsSubmitting(false);
          return;
        }
        throw insertErr;
      }

      const personaId = nuevaPersona?.id;
      if (personaId && (draftNotas.length > 0 || draftPeticiones.length > 0)) {
        for (const n of draftNotas) {
          const { error: nErr } = await supabase.from("persona_notas").insert({
            organization_id: ctx.organizationId,
            persona_id: personaId,
            contenido: n.contenido,
            created_by: ctx.userId,
          });
          if (nErr) console.error("persona_notas:", nErr);
        }
        for (const p of draftPeticiones) {
          const { error: pErr } = await supabase.from("persona_peticiones_oracion").insert({
            organization_id: ctx.organizationId,
            persona_id: personaId,
            contenido: p.contenido,
            created_by: ctx.userId,
          });
          if (pErr) console.error("persona_peticiones_oracion:", pErr);
        }
      }

      if (personaId) {
        router.push(`/personas/${personaId}`);
      } else {
        router.push("/personas");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar. Intenta de nuevo.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] py-8">
      <div className="mb-8 rounded-3xl bg-gray-100/50 p-5 dark:bg-white/[0.04] md:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="shrink-0 rounded-full bg-white/80 p-1 shadow-sm shadow-black/[0.06] ring-1 ring-black/[0.04] dark:bg-white/[0.08] dark:shadow-none dark:ring-white/[0.08]">
            <UserAvatar seed={nombre || "Nueva Persona"} sexo={sexo === "" ? null : sexo} size={104} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-2xl">
              Registrar nueva persona
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Mismo formato que la ficha: datos personales, proceso y camino espiritual, notas pastorales y peticiones de
              oración. Al guardar se crea la persona y se abre su ficha.
            </p>
          </div>
          <Link
            href="/personas"
            className="shrink-0 rounded-full p-2.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
            title="Volver a personas"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 rounded-2xl bg-red-50/90 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Información personal — mismo card que en ficha (edición) */}
            <div className="rounded-2xl border border-gray-200/50 bg-gray-50/40 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Información personal</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Contacto, identidad, ocupación y datos de cuidado. Todo se guarda al pulsar «Registrar persona».
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-x-14 sm:gap-y-10">
                <PersonaFichaColumn title="Contacto e identidad" titleSpacing="roomy">
                  <PersonaFichaRowEdit k="Nombre">
                    <input
                      type="text"
                      name="nombre"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className={INLINE_FIELD_CLASS}
                      placeholder="Nombre y apellido"
                      autoComplete="name"
                    />
                  </PersonaFichaRowEdit>
                  <PersonaFichaRowEdit k="ID">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={documentoId}
                      onChange={(e) => setDocumentoId(soloDigitosDocumentoId(e.target.value))}
                      className={INLINE_FIELD_CLASS}
                      placeholder="—"
                    />
                  </PersonaFichaRowEdit>
                  <PersonaFichaRowEdit k="Tel.">
                    <input
                      type="tel"
                      name="telefono"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className={INLINE_FIELD_CLASS}
                      placeholder="—"
                      autoComplete="tel"
                    />
                  </PersonaFichaRowEdit>
                  <PersonaFichaRowEdit k="Correo">
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={INLINE_FIELD_CLASS}
                      placeholder="—"
                      autoComplete="email"
                    />
                  </PersonaFichaRowEdit>
                  <PersonaFichaRowEdit k="Nac.">
                    <DatePicker
                      id="nuevaPersonaFechaNacimiento"
                      name="fechaNacimiento"
                      value={fechaNacimiento}
                      onChange={setFechaNacimiento}
                      placeholder="Seleccionar fecha"
                      variant="soft"
                    />
                  </PersonaFichaRowEdit>
                  <PersonaFichaRowEdit k="Edad">
                    <span className="text-sm font-medium text-gray-900/85 dark:text-white/85">
                      {(() => {
                        const iso = fechaLocalToIso(fechaNacimiento);
                        if (!iso) return "Sin registrar";
                        const e = calcularEdad(iso);
                        return e != null ? `${e} años` : "—";
                      })()}
                    </span>
                  </PersonaFichaRowEdit>
                  <PersonaFichaRowEdit k="Sexo">
                    <select
                      name="sexo"
                      value={sexo}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSexo(v === "masculino" || v === "femenino" ? v : "");
                      }}
                      className={INLINE_SELECT_CLASS}
                      aria-label="Sexo (para el avatar ilustrado)"
                    >
                      <option value="">Sin registrar</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                    </select>
                  </PersonaFichaRowEdit>
                  <PersonaFichaRowEdit k="Estado civil">
                    <select
                      name="estadoCivil"
                      value={estadoCivil}
                      onChange={(e) => setEstadoCivil(e.target.value)}
                      className={INLINE_SELECT_CLASS}
                    >
                      <option value="">Sin registrar</option>
                      {ESTADOS_CIVILES_CARD.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </PersonaFichaRowEdit>
                  <PersonaFichaRowEdit k="Pareja">
                    <select
                      name="tienePareja"
                      value={tieneParejaTri}
                      onChange={(e) => setTieneParejaTri(e.target.value as "" | "true" | "false")}
                      className={INLINE_SELECT_CLASS}
                    >
                      <option value="">Sin registrar</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </PersonaFichaRowEdit>
                  {tieneParejaTri === "true" ? (
                    <PersonaFichaRowEdit k="Nom. pareja">
                      <input
                        type="text"
                        name="nombrePareja"
                        value={nombrePareja}
                        onChange={(e) => setNombrePareja(e.target.value)}
                        className={INLINE_FIELD_CLASS}
                        placeholder="—"
                      />
                    </PersonaFichaRowEdit>
                  ) : null}
                </PersonaFichaColumn>

                <PersonaFichaColumn title="Actividad, salud y ubicación" titleSpacing="roomy">
                  <PersonaFichaRowEdit k="Situación">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <select
                        value={trabajaTri}
                        onChange={(e) => setTrabajaTri(e.target.value as "" | "true" | "false")}
                        className={`${INLINE_SELECT_CLASS} max-w-[9.5rem]`}
                        aria-label="¿Trabaja actualmente?"
                      >
                        <option value="">Trabaja…</option>
                        <option value="true">Trabaja: sí</option>
                        <option value="false">Trabaja: no</option>
                      </select>
                      <select
                        value={estudiaTri}
                        onChange={(e) => setEstudiaTri(e.target.value as "" | "true" | "false")}
                        className={`${INLINE_SELECT_CLASS} max-w-[9.5rem]`}
                        aria-label="¿Estudia actualmente?"
                      >
                        <option value="">Estudia…</option>
                        <option value="true">Estudia: sí</option>
                        <option value="false">Estudia: no</option>
                      </select>
                    </div>
                    <p className="mt-1 text-xs font-normal text-gray-500/90 dark:text-gray-500/90">
                      {labelSituacionLaboralEstudio(triToBoolDraft(trabajaTri), triToBoolDraft(estudiaTri))}
                    </p>
                  </PersonaFichaRowEdit>
                  <PersonaFichaRowEdit k="Ocupación">
                    <select
                      name="ocupacion"
                      value={ocupacion}
                      onChange={(e) => setOcupacion(e.target.value)}
                      className={INLINE_SELECT_CLASS}
                    >
                      <option value="">Sin registrar</option>
                      {ocupacion.trim() && !(OCUPACIONES_CARD as readonly string[]).includes(ocupacion.trim()) ? (
                        <option value={ocupacion.trim()}>{ocupacion.trim()} (actual)</option>
                      ) : null}
                      {OCUPACIONES_CARD.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </PersonaFichaRowEdit>
                  <PersonaFichaRowEdit k="Salud" multiline>
                    <textarea
                      name="condicionSalud"
                      value={condicionSalud}
                      onChange={(e) => setCondicionSalud(e.target.value)}
                      rows={3}
                      className={INLINE_TEXTAREA_CLASS}
                      placeholder="—"
                    />
                  </PersonaFichaRowEdit>
                  <PersonaFichaRowEdit k="Emergencia" multiline>
                    <div className="space-y-2">
                      <input
                        type="text"
                        name="contactoEmergenciaNombre"
                        value={contactoEmergenciaNombre}
                        onChange={(e) => setContactoEmergenciaNombre(e.target.value)}
                        className={INLINE_FIELD_CLASS}
                        placeholder="Nombre"
                      />
                      <input
                        type="tel"
                        name="contactoEmergenciaTelefono"
                        value={contactoEmergenciaTelefono}
                        onChange={(e) => setContactoEmergenciaTelefono(e.target.value)}
                        className={INLINE_FIELD_CLASS}
                        placeholder="Teléfono"
                      />
                    </div>
                  </PersonaFichaRowEdit>
                  <PersonaFichaRowEdit k="Dirección" multiline>
                    <textarea
                      name="direccion"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      rows={2}
                      className={INLINE_TEXTAREA_CLASS}
                      placeholder="—"
                    />
                  </PersonaFichaRowEdit>
                </PersonaFichaColumn>
              </div>
            </div>

            {/* Etapa del proceso y camino espiritual */}
            <div className="rounded-2xl border border-gray-200/50 bg-gray-50/40 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Etapa del proceso y camino espiritual</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Aquí va el bautismo y cómo llegó a la iglesia. Sin grupo queda como visitante; con grupo, como nuevo creyente
                  en célula. El avance (camino al bautismo, consolidado, etc.) lo marca el liderazgo desde la ficha con{" "}
                  <span className="font-medium text-gray-600 dark:text-gray-300">Cambiar etapa</span>.
                </p>
              </div>

              <div className="mt-6 grid gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-x-14 sm:gap-y-10">
                <PersonaFichaColumn title="Proceso en la iglesia" titleSpacing="roomy">
                  <PersonaFichaRowEdit k="Etapa">
                    <span className="text-sm font-medium text-gray-900/90 dark:text-white/90">
                      {ETAPA_LABELS[etapaAlRegistrar]}
                    </span>
                  </PersonaFichaRowEdit>
                  <PersonaFichaRowEdit k="Rol">
                    <span className="text-sm font-medium text-gray-900/90 dark:text-white/90">Miembro</span>
                  </PersonaFichaRowEdit>
                  <PersonaFichaRowEdit k="Grupo">
                    <span className="text-sm font-medium text-gray-900/90 dark:text-white/90">{grupoNombre}</span>
                  </PersonaFichaRowEdit>
                  {grupoRadio ? (
                    <PersonaFichaRowEdit k="En el grupo">
                      <span className="text-sm font-medium text-gray-900/90 dark:text-white/90">
                        {labelParticipacionEnGrupo("miembro", grupoRadio)}
                      </span>
                    </PersonaFichaRowEdit>
                  ) : null}
                </PersonaFichaColumn>

                <PersonaFichaColumn title="Fe y llegada" titleSpacing="roomy">
                  <PersonaFichaRowEdit k="Bautismo">
                    <select
                      name="bautizado"
                      value={bautizadoTri}
                      onChange={(e) => setBautizadoTri(e.target.value as "" | "true" | "false")}
                      className={INLINE_SELECT_CLASS}
                      aria-label="¿Está bautizado?"
                    >
                      <option value="">Sin registrar</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </PersonaFichaRowEdit>
                  <PersonaFichaRowEdit k="Acercamiento">
                    <select
                      name="situacionAcercamiento"
                      value={situacion}
                      onChange={(e) => setSituacion(e.target.value)}
                      className={INLINE_SELECT_CLASS}
                      aria-label="Situación de acercamiento"
                    >
                      <option value="">Sin registrar</option>
                      {SITUACION_ACERCAMIENTO_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </PersonaFichaRowEdit>
                  <PersonaFichaRowEdit k="Otra iglesia">
                    <select
                      name="vieneDeOtraIglesia"
                      value={vieneDeOtraIglesia}
                      onChange={(e) => setVieneDeOtraIglesia(e.target.value as "" | "true" | "false")}
                      className={INLINE_SELECT_CLASS}
                      aria-label="¿Viene de otra iglesia?"
                    >
                      <option value="">Sin registrar</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </PersonaFichaRowEdit>
                  {vieneDeOtraIglesia === "true" ? (
                    <PersonaFichaRowEdit k="Congregación previa" multiline>
                      <textarea
                        name="nombreIglesiaAnterior"
                        value={nombreIglesiaAnterior}
                        onChange={(e) => setNombreIglesiaAnterior(e.target.value)}
                        rows={2}
                        className={INLINE_TEXTAREA_CLASS}
                        placeholder="Nombre de la congregación anterior"
                      />
                    </PersonaFichaRowEdit>
                  ) : null}
                </PersonaFichaColumn>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
              <div className="min-w-0 rounded-2xl border border-gray-200/50 bg-gray-50/40 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notas pastorales</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Ideas o contexto que quieras ver siempre, sin atarlo a una sola visita.
                </p>
                <div className="mt-4 space-y-3">
                  <textarea
                    value={nuevaNotaInput}
                    onChange={(e) => setNuevaNotaInput(e.target.value)}
                    placeholder="Escribe una nota pastoral…"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200/60 bg-white/70 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-300/40 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-white/15"
                  />
                  <button
                    type="button"
                    onClick={agregarNotaDraft}
                    disabled={!nuevaNotaInput.trim()}
                    className="rounded-xl border border-neutral-300/80 bg-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-500 dark:text-neutral-950 dark:hover:bg-neutral-400"
                  >
                    Añadir a la lista
                  </button>
                </div>
                {draftNotas.length > 0 ? (
                  <ul className="mt-6 divide-y divide-gray-200/50 dark:divide-white/[0.06]">
                    {draftNotas.map((n) => (
                      <li key={n.id} className="flex gap-2 py-4 first:pt-0">
                        <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-white">
                          {n.contenido}
                        </p>
                        <button
                          type="button"
                          onClick={() => setDraftNotas((prev) => prev.filter((x) => x.id !== n.id))}
                          className="shrink-0 text-xs text-gray-500 underline-offset-2 hover:underline dark:text-gray-400"
                        >
                          Quitar
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="min-w-0 rounded-2xl border border-gray-200/50 bg-gray-50/40 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Peticiones de oración</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Motivos para orar por esta persona, con fecha, para ti y para el equipo.
                </p>
                <div className="mt-4 space-y-3">
                  <textarea
                    value={nuevaPeticionInput}
                    onChange={(e) => setNuevaPeticionInput(e.target.value)}
                    placeholder="Escribe una petición…"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200/60 bg-white/80 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-300/40 dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-white/15"
                  />
                  <button
                    type="button"
                    onClick={agregarPeticionDraft}
                    disabled={!nuevaPeticionInput.trim()}
                    className="w-full rounded-xl border border-neutral-300/80 bg-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-500 dark:text-neutral-950 dark:hover:bg-neutral-400"
                  >
                    Añadir a la lista
                  </button>
                </div>
                {draftPeticiones.length > 0 ? (
                  <ul className="mt-5 max-h-[min(50vh,22rem)] divide-y divide-gray-200/50 overflow-y-auto dark:divide-white/[0.06]">
                    {draftPeticiones.map((n) => (
                      <li key={n.id} className="flex gap-2 py-3 first:pt-0">
                        <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-white">
                          {n.contenido}
                        </p>
                        <button
                          type="button"
                          onClick={() => setDraftPeticiones((prev) => prev.filter((x) => x.id !== n.id))}
                          className="shrink-0 text-xs text-gray-500 underline-offset-2 hover:underline dark:text-gray-400"
                        >
                          Quitar
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>

          {/* Sidebar: grupo + acciones */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200/50 bg-gray-50/40 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Grupo</h3>
              <p className="mb-4 text-xs font-normal leading-snug text-gray-500 dark:text-gray-500">
                Mismo diseño que en el calendario: elige una célula o deja sin asignar.
              </p>
              <div
                className="max-h-[min(32rem,60vh)] overflow-y-auto overflow-x-hidden pr-1 [-webkit-overflow-scrolling:touch]"
                role="radiogroup"
                aria-label="Grupo de célula"
              >
                <div className="grid grid-cols-2 gap-3">
                  <GrupoSelectableCard selected={grupoRadio === ""} onSelect={() => setGrupoRadio("")}>
                    <div className="relative flex h-28 items-center justify-center bg-gradient-to-b from-gray-100/90 to-gray-100/45 dark:from-white/[0.08] dark:to-white/[0.03]">
                      <div className="absolute left-2 top-2 z-10 flex items-center gap-1.5 rounded-full bg-gray-500/10 px-2 py-0.5 text-[10px] font-medium text-gray-700 shadow-sm shadow-black/[0.04] dark:text-gray-300 dark:shadow-none">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400 dark:bg-gray-500" />
                        Sin grupo
                      </div>
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-gray-400/50 bg-white/60 dark:border-white/[0.12] dark:bg-white/[0.05]">
                        <svg
                          className="h-8 w-8 text-gray-500 dark:text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          aria-hidden
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                          <circle cx="12" cy="12" r="8" />
                        </svg>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Sin asignar</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">—</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Queda como visitante hasta que elijas un grupo.
                      </p>
                    </div>
                  </GrupoSelectableCard>

                  {grupos.map((grupo) => {
                    const horaLinea =
                      grupo.hora?.trim() || grupo.dia?.trim() || "—";
                    const ubicacionLinea = grupo.ubicacion?.trim() || "—";
                    return (
                      <GrupoSelectableCard
                        key={grupo.id}
                        selected={grupoRadio === grupo.id}
                        onSelect={() => setGrupoRadio(grupo.id)}
                      >
                        <GrupoCalendarioStyleCard
                          nombre={grupo.nombre}
                          horaLinea={horaLinea}
                          ubicacionLinea={ubicacionLinea}
                          grupoId={grupo.id}
                        />
                      </GrupoSelectableCard>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/50 bg-gray-50/50 p-5 dark:bg-white/[0.05]">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200/80 dark:bg-white/[0.1]">
                  <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Registro en la iglesia</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Sin grupo queda como visitante; con grupo, como nuevo creyente en el núcleo. Luego podrás ajustar etapa y
                    participación desde la ficha.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/50 bg-gray-50/40 p-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300/90 bg-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-500 dark:text-neutral-950 dark:hover:bg-neutral-400"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Guardando…
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Registrar persona
                    </>
                  )}
                </button>
                <Link
                  href="/personas"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300/70 px-6 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-200/50 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/[0.08]"
                >
                  Cancelar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
