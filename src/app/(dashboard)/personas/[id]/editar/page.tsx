"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { UserAvatar } from "@/components/UserAvatar";
import { DatePicker } from "@/components/ui/DatePicker";
import { soloDigitosDocumentoId } from "@/lib/documento-id";
import {
  parseTriBoolForm,
  SITUACION_ACERCAMIENTO_OPTIONS,
  type SituacionAcercamiento,
} from "@/lib/personas-situacion-acercamiento";
import { parseEtapaDb } from "@/lib/persona-etapa";
import { parsePersonaSexo, type PersonaSexo } from "@/lib/persona-sexo";
import { fechaHoyYYYYMMDD } from "@/lib/fecha-hoy-local";
import { createClient } from "@/lib/supabase/client";
import { PERSONA_NATIVE_SELECT_CLASS } from "@/lib/persona-form-ui";

interface GrupoOption {
  id: string;
  nombre: string;
}

const estadosCiviles = [
  "Soltero/a",
  "Casado/a",
  "Unión libre",
  "Divorciado/a",
  "Viudo/a",
];

const ocupaciones = [
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
];

function parseFechaRow(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(`${s.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function boolToTri(v: boolean | null | undefined): "" | "true" | "false" {
  if (v === true) return "true";
  if (v === false) return "false";
  return "";
}

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const initialGrupoRef = useRef<string | null>(null);
  const initialEtapaRef = useRef<string>("visitante");
  const spiritualColumnsAvailableRef = useRef(true);
  const infoLiderColumnsAvailableRef = useRef(true);
  /** Si la carga usó columnas mínimas, no persistimos camino espiritual al guardar. */
  const [spiritualPersistenceOk, setSpiritualPersistenceOk] = useState(true);
  /** Columnas de información para el líder (pareja, trabajo/estudio, salud, emergencia). */
  const [infoLiderPersistenceOk, setInfoLiderPersistenceOk] = useState(true);

  const [grupos, setGrupos] = useState<GrupoOption[]>([]);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
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

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("grupos")
      .select("id, nombre")
      .order("nombre")
      .then(({ data }) => setGrupos((data as GrupoOption[]) ?? []));
  }, []);

  useEffect(() => {
    if (!id) {
      setLoadStatus("notfound");
      return;
    }
    setLoadStatus("loading");
    setLoadMessage(null);
    setSpiritualPersistenceOk(true);
    setInfoLiderPersistenceOk(true);
    spiritualColumnsAvailableRef.current = true;
    infoLiderColumnsAvailableRef.current = true;
    const supabase = createClient();
    (async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        setLoadMessage("Debes iniciar sesión.");
        setLoadStatus("error");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
      const organizationId = profile?.organization_id;
      if (!organizationId) {
        setLoadMessage("No tienes una iglesia asignada.");
        setLoadStatus("error");
        return;
      }

      let row: Record<string, unknown> | null = null;
      const spiritualSelect =
        "id, organization_id, cedula, nombre, sexo, telefono, email, fecha_nacimiento, estado_civil, ocupacion, direccion, grupo_id, etapa, bautizado, viene_de_otra_iglesia, nombre_iglesia_anterior, situacion_acercamiento";
      const liderSuffix =
        ", tiene_pareja, nombre_pareja, trabaja_actualmente, estudia_actualmente, condicion_salud, contacto_emergencia_nombre, contacto_emergencia_telefono";
      const selectWithLider = spiritualSelect + liderSuffix;
      const minimalSelect =
        "id, organization_id, cedula, nombre, sexo, telefono, email, fecha_nacimiento, estado_civil, ocupacion, direccion, grupo_id, etapa";

      const missingCol = (msg: string) =>
        /column|does not exist|42703|PGRST204|schema cache|unknown column|could not find/i.test(msg);

      const resMax = await supabase
        .from("personas")
        .select(selectWithLider)
        .eq("id", id)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (!resMax.error) {
        spiritualColumnsAvailableRef.current = true;
        infoLiderColumnsAvailableRef.current = true;
        setSpiritualPersistenceOk(true);
        setInfoLiderPersistenceOk(true);
        row = resMax.data as Record<string, unknown> | null;
      } else {
        const msgMax = resMax.error.message ?? "";
        const looksLikeMissingLider =
          /tiene_pareja|nombre_pareja|trabaja_actualmente|estudia_actualmente|condicion_salud|contacto_emergencia/i.test(
            msgMax
          );
        if (!missingCol(msgMax)) {
          setLoadMessage(msgMax || "No se pudo cargar la persona.");
          setLoadStatus("error");
          return;
        }
        if (looksLikeMissingLider) {
          infoLiderColumnsAvailableRef.current = false;
          setInfoLiderPersistenceOk(false);
          const resMid = await supabase
            .from("personas")
            .select(spiritualSelect)
            .eq("id", id)
            .eq("organization_id", organizationId)
            .maybeSingle();
          if (!resMid.error) {
            spiritualColumnsAvailableRef.current = true;
            setSpiritualPersistenceOk(true);
            row = resMid.data as Record<string, unknown> | null;
          } else {
            const msgMid = resMid.error.message ?? "";
            const looksLikeMissingSpiritual =
              /bautizado|viene_de_otra|situacion_acercamiento|nombre_iglesia/i.test(msgMid);
            if (!missingCol(msgMid) || !looksLikeMissingSpiritual) {
              setLoadMessage(msgMid || "No se pudo cargar la persona.");
              setLoadStatus("error");
              return;
            }
            spiritualColumnsAvailableRef.current = false;
            setSpiritualPersistenceOk(false);
            const resMin = await supabase
              .from("personas")
              .select(minimalSelect)
              .eq("id", id)
              .eq("organization_id", organizationId)
              .maybeSingle();
            if (resMin.error) {
              setLoadMessage(resMin.error.message || "No se pudo cargar la persona.");
              setLoadStatus("error");
              return;
            }
            row = resMin.data as Record<string, unknown> | null;
          }
        } else {
          const looksLikeMissingSpiritual =
            /bautizado|viene_de_otra|situacion_acercamiento|nombre_iglesia/i.test(msgMax);
          if (!looksLikeMissingSpiritual) {
            setLoadMessage(msgMax || "No se pudo cargar la persona.");
            setLoadStatus("error");
            return;
          }
          infoLiderColumnsAvailableRef.current = false;
          setInfoLiderPersistenceOk(false);
          spiritualColumnsAvailableRef.current = false;
          setSpiritualPersistenceOk(false);
          const resMin = await supabase
            .from("personas")
            .select(minimalSelect)
            .eq("id", id)
            .eq("organization_id", organizationId)
            .maybeSingle();
          if (resMin.error) {
            setLoadMessage(resMin.error.message || "No se pudo cargar la persona.");
            setLoadStatus("error");
            return;
          }
          row = resMin.data as Record<string, unknown> | null;
        }
      }

      if (!row) {
        setLoadStatus("notfound");
        return;
      }

      const r = row;
      initialGrupoRef.current = (r.grupo_id as string | null) ?? null;
      initialEtapaRef.current = parseEtapaDb(r.etapa as string);

      setNombre((r.nombre as string) ?? "");
      setDocumentoId(soloDigitosDocumentoId(String(r.cedula ?? "")));
      setTelefono((r.telefono as string) ?? "");
      setEmail((r.email as string) ?? "");
      setSexo(parsePersonaSexo(r.sexo) ?? "");
      setFechaNacimiento(parseFechaRow((r.fecha_nacimiento as string) ?? null));
      setEstadoCivil((r.estado_civil as string) ?? "");
      setOcupacion((r.ocupacion as string) ?? "");
      setDireccion((r.direccion as string) ?? "");
      setGrupoRadio((r.grupo_id as string) ?? "");
      setBautizadoTri(boolToTri(r.bautizado as boolean | null));
      setSituacion((r.situacion_acercamiento as string) ?? "");
      setVieneDeOtraIglesia(boolToTri(r.viene_de_otra_iglesia as boolean | null));
      setNombreIglesiaAnterior((r.nombre_iglesia_anterior as string) ?? "");
      setTieneParejaTri(boolToTri(r.tiene_pareja as boolean | null));
      setNombrePareja((r.nombre_pareja as string) ?? "");
      setTrabajaTri(boolToTri(r.trabaja_actualmente as boolean | null));
      setEstudiaTri(boolToTri(r.estudia_actualmente as boolean | null));
      setCondicionSalud((r.condicion_salud as string) ?? "");
      setContactoEmergenciaNombre((r.contacto_emergencia_nombre as string) ?? "");
      setContactoEmergenciaTelefono((r.contacto_emergencia_telefono as string) ?? "");

      setLoadStatus("ready");
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const nombreVal = (formData.get("nombre") as string)?.trim();
    const cedulaVal = documentoId.trim() || null;
    const telefonoVal = (formData.get("telefono") as string)?.trim() || null;
    const emailVal = (formData.get("email") as string)?.trim() || null;
    const estadoCivilVal = estadoCivil || null;
    const ocupacionVal = ocupacion || null;
    const direccionVal = (formData.get("direccion") as string)?.trim() || null;
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

    if (!nombreVal) {
      setError("El nombre es obligatorio.");
      setIsSubmitting(false);
      return;
    }

    const oldG = initialGrupoRef.current;
    const initialEtapa = initialEtapaRef.current;

    const updatePayload: Record<string, unknown> = {
      nombre: nombreVal,
      cedula: cedulaVal,
      telefono: telefonoVal,
      email: emailVal,
      fecha_nacimiento: fechaNacimiento ? fechaNacimiento.toISOString().slice(0, 10) : null,
      estado_civil: estadoCivilVal,
      ocupacion: ocupacionVal,
      direccion: direccionVal,
      grupo_id: newG,
      sexo: sexo === "" ? null : sexo,
    };
    if (spiritualColumnsAvailableRef.current) {
      updatePayload.bautizado = bautizadoVal;
      updatePayload.viene_de_otra_iglesia = vieneOtraVal;
      updatePayload.nombre_iglesia_anterior = vieneOtraVal === true ? iglesiaAntVal : null;
      updatePayload.situacion_acercamiento = situacionVal;
    }

    if (infoLiderColumnsAvailableRef.current) {
      const tieneParejaVal = parseTriBoolForm(tieneParejaTri);
      const trabajaVal = parseTriBoolForm(trabajaTri);
      const estudiaVal = parseTriBoolForm(estudiaTri);
      updatePayload.tiene_pareja = tieneParejaVal;
      updatePayload.nombre_pareja = tieneParejaVal === true ? nombrePareja.trim() || null : null;
      updatePayload.trabaja_actualmente = trabajaVal;
      updatePayload.estudia_actualmente = estudiaVal;
      updatePayload.condicion_salud = condicionSalud.trim() || null;
      updatePayload.contacto_emergencia_nombre = contactoEmergenciaNombre.trim() || null;
      updatePayload.contacto_emergencia_telefono = contactoEmergenciaTelefono.trim() || null;
    }

    if (oldG !== newG) {
      if (!newG) {
        updatePayload.participacion_en_grupo = null;
        updatePayload.etapa = "en_proceso";
        updatePayload.fecha_ingreso_grupo = null;
        updatePayload.co_lider_desde = null;
      } else if (!oldG) {
        updatePayload.participacion_en_grupo = "miembro";
        updatePayload.fecha_ingreso_grupo = fechaHoyYYYYMMDD();
        updatePayload.co_lider_desde = null;
        if (
          initialEtapa === "visitante" ||
          initialEtapa === "nuevo_creyente" ||
          initialEtapa === "en_proceso"
        ) {
          updatePayload.etapa = "consolidado";
        }
      } else {
        updatePayload.participacion_en_grupo = "miembro";
        updatePayload.fecha_ingreso_grupo = fechaHoyYYYYMMDD();
        updatePayload.co_lider_desde = null;
      }
    }

    try {
      const supabase = createClient();
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) {
        setError("Debes iniciar sesión.");
        setIsSubmitting(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
      const organizationId = profile?.organization_id;
      if (!organizationId) {
        setError("No tienes una iglesia asignada.");
        setIsSubmitting(false);
        return;
      }

      const { error: updErr } = await supabase
        .from("personas")
        .update(updatePayload)
        .eq("id", id)
        .eq("organization_id", organizationId);

      if (updErr) {
        if (updErr.code === "23505") {
          setError(
            "Ya existe otra persona con ese documento de identidad en tu iglesia. Revisa el número."
          );
          setIsSubmitting(false);
          return;
        }
        throw updErr;
      }

      router.push(`/personas/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar. Intenta de nuevo.");
      setIsSubmitting(false);
    }
  };

  if (loadStatus === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  if (loadStatus === "notfound") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-600 dark:text-gray-400">Persona no encontrada o sin permiso.</p>
        <Link
          href="/personas"
          className="font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white"
        >
          Volver a personas
        </Link>
      </div>
    );
  }

  if (loadStatus === "error" && loadMessage) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="max-w-md text-gray-600 dark:text-gray-400">{loadMessage}</p>
        <Link
          href="/personas"
          className="font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white"
        >
          Volver a personas
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] py-8">
      <div className="mb-8 rounded-3xl bg-gray-100/50 p-5 dark:bg-white/[0.04] md:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="shrink-0 rounded-full bg-white/80 p-1 shadow-sm shadow-black/[0.06] ring-1 ring-black/[0.04] dark:bg-white/[0.08] dark:shadow-none dark:ring-white/[0.08]">
            <UserAvatar seed={nombre || "Persona"} sexo={sexo === "" ? null : sexo} size={104} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-2xl">
              Editar persona
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Actualiza los datos de {nombre || "esta persona"}
            </p>
          </div>
          <Link
            href={`/personas/${id}`}
            className="shrink-0 rounded-full p-2.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
            title="Volver al detalle"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div>
          {error && (
            <div className="mb-6 rounded-2xl bg-red-50/90 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-3xl bg-gray-100/40 p-6 dark:bg-white/[0.04]">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Información básica</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField icon="user" label="Nombre completo" required>
                    <input
                      type="text"
                      name="nombre"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: María García"
                      className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
                    />
                  </FormField>

                  <FormField icon="id" label="Documento ID">
                    <input
                      type="text"
                      name="cedula"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      value={documentoId}
                      onChange={(e) => setDocumentoId(soloDigitosDocumentoId(e.target.value))}
                      placeholder="Ej: 1023456789"
                      className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
                    />
                  </FormField>

                  <FormField icon="phone" label="Teléfono" required>
                    <input
                      type="tel"
                      name="telefono"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+57 300 123 4567"
                      className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
                    />
                  </FormField>

                  <FormField icon="email" label="Correo electrónico">
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
                    />
                  </FormField>

                  <FormField icon="user" label="Sexo (avatar ilustrado)">
                    <select
                      name="sexo"
                      value={sexo}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSexo(v === "masculino" || v === "femenino" ? v : "");
                      }}
                      className={PERSONA_NATIVE_SELECT_CLASS}
                    >
                      <option value="">Sin registrar</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                    </select>
                  </FormField>
                </div>
              </div>

              <div className="rounded-3xl bg-gray-100/40 p-6 dark:bg-white/[0.04]">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Información personal</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs text-gray-500 dark:text-gray-400">Fecha de nacimiento</label>
                    <DatePicker
                      id="fechaNacimiento"
                      name="fechaNacimiento"
                      value={fechaNacimiento}
                      onChange={setFechaNacimiento}
                      placeholder="Seleccionar fecha"
                      variant="soft"
                    />
                  </div>

                  <div className="sm:col-span-2 rounded-2xl border border-gray-200/70 bg-gray-100/35 p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                      Estado civil y pareja
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField icon="heart" label="Estado civil">
                        <select
                          name="estadoCivil"
                          value={estadoCivil}
                          onChange={(e) => setEstadoCivil(e.target.value)}
                          className={PERSONA_NATIVE_SELECT_CLASS}
                        >
                          <option value="">Seleccionar...</option>
                          {estadosCiviles.map((estado) => (
                            <option key={estado} value={estado}>
                              {estado}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField icon="heart" label="¿Tiene pareja o relación estable?">
                        <select
                          name="tienePareja"
                          value={tieneParejaTri}
                          onChange={(e) => setTieneParejaTri(e.target.value as "" | "true" | "false")}
                          className={PERSONA_NATIVE_SELECT_CLASS}
                          disabled={!infoLiderPersistenceOk}
                        >
                          <option value="">Sin registrar</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </FormField>

                      {tieneParejaTri === "true" && (
                        <div className="sm:col-span-2">
                          <FormField icon="heart" label="Nombre de la pareja">
                            <input
                              type="text"
                              name="nombrePareja"
                              value={nombrePareja}
                              onChange={(e) => setNombrePareja(e.target.value)}
                              placeholder="Opcional"
                              className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
                              disabled={!infoLiderPersistenceOk}
                            />
                          </FormField>
                        </div>
                      )}
                    </div>
                  </div>

                  {!infoLiderPersistenceOk && (
                    <p className="sm:col-span-2 rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:bg-amber-500/15 dark:text-amber-100">
                      Tu base aún no tiene las columnas de información para líderes (pareja, trabajo, estudios, salud,
                      emergencia). El estado civil de arriba sí se guarda; el resto de este bloque no se persistirá hasta aplicar
                      la migración en Supabase.
                    </p>
                  )}

                  <FormField icon="work" label="Ocupación">
                    <select
                      name="ocupacion"
                      value={ocupacion}
                      onChange={(e) => setOcupacion(e.target.value)}
                      className={PERSONA_NATIVE_SELECT_CLASS}
                    >
                      <option value="">Seleccionar...</option>
                      {ocupaciones.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField icon="location" label="Dirección">
                    <input
                      type="text"
                      name="direccion"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Ej: Calle 45 #12-34, Bogotá"
                      className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
                    />
                  </FormField>

                  <FormField icon="work" label="¿Trabaja actualmente?">
                    <select
                      name="trabajaActualmente"
                      value={trabajaTri}
                      onChange={(e) => setTrabajaTri(e.target.value as "" | "true" | "false")}
                      className={PERSONA_NATIVE_SELECT_CLASS}
                      disabled={!infoLiderPersistenceOk}
                    >
                      <option value="">Sin registrar</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </FormField>

                  <FormField icon="work" label="¿Estudia actualmente?">
                    <select
                      name="estudiaActualmente"
                      value={estudiaTri}
                      onChange={(e) => setEstudiaTri(e.target.value as "" | "true" | "false")}
                      className={PERSONA_NATIVE_SELECT_CLASS}
                      disabled={!infoLiderPersistenceOk}
                    >
                      <option value="">Sin registrar</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </FormField>

                  <div className="sm:col-span-2">
                    <FormField icon="work" label="Condición de salud o cuidados (alergias, medicación, etc.)">
                      <textarea
                        name="condicionSalud"
                        value={condicionSalud}
                        onChange={(e) => setCondicionSalud(e.target.value)}
                        rows={3}
                        placeholder="Opcional. Visible para líderes con fines pastorales de cuidado."
                        className="w-full resize-none bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
                        disabled={!infoLiderPersistenceOk}
                      />
                    </FormField>
                  </div>

                  <FormField icon="phone" label="Contacto de emergencia — nombre">
                    <input
                      type="text"
                      name="contactoEmergenciaNombre"
                      value={contactoEmergenciaNombre}
                      onChange={(e) => setContactoEmergenciaNombre(e.target.value)}
                      placeholder="Ej: Familiar, cónyuge…"
                      className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
                      disabled={!infoLiderPersistenceOk}
                    />
                  </FormField>

                  <FormField icon="phone" label="Contacto de emergencia — teléfono">
                    <input
                      type="tel"
                      name="contactoEmergenciaTelefono"
                      value={contactoEmergenciaTelefono}
                      onChange={(e) => setContactoEmergenciaTelefono(e.target.value)}
                      placeholder="+57…"
                      className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
                      disabled={!infoLiderPersistenceOk}
                    />
                  </FormField>
                </div>
              </div>

              <div className="rounded-3xl bg-gray-100/40 p-6 dark:bg-white/[0.04]">
                <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Camino espiritual y llegada</h2>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  Bautismo, si viene de otra iglesia y cómo se acercó a la fe (opcional).
                </p>
                {!spiritualPersistenceOk && (
                  <p className="mb-4 rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:bg-amber-500/15 dark:text-amber-100">
                    Tu base aún no tiene las columnas de este bloque (migración camino espiritual). Puedes ver el
                    formulario, pero esos valores no se guardarán hasta aplicar la migración en Supabase.
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField icon="sparkles" label="¿Está bautizado/a?">
                    <select
                      name="bautizado"
                      value={bautizadoTri}
                      onChange={(e) => setBautizadoTri(e.target.value as "" | "true" | "false")}
                      className={PERSONA_NATIVE_SELECT_CLASS}
                      disabled={!spiritualPersistenceOk}
                    >
                      <option value="">Sin registrar</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </FormField>

                  <FormField icon="sparkles" label="Situación de acercamiento">
                    <select
                      name="situacionAcercamiento"
                      value={situacion}
                      onChange={(e) => setSituacion(e.target.value)}
                      className={PERSONA_NATIVE_SELECT_CLASS}
                      disabled={!spiritualPersistenceOk}
                    >
                      <option value="">Seleccionar…</option>
                      {SITUACION_ACERCAMIENTO_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField icon="sparkles" label="¿Viene de otra iglesia?">
                    <select
                      name="vieneDeOtraIglesia"
                      value={vieneDeOtraIglesia}
                      onChange={(e) => setVieneDeOtraIglesia(e.target.value as "" | "true" | "false")}
                      className={PERSONA_NATIVE_SELECT_CLASS}
                      disabled={!spiritualPersistenceOk}
                    >
                      <option value="">Sin registrar</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </FormField>

                  {vieneDeOtraIglesia === "true" && (
                    <div className="sm:col-span-2">
                      <FormField icon="sparkles" label="Nombre de la iglesia anterior">
                        <input
                          type="text"
                          name="nombreIglesiaAnterior"
                          value={nombreIglesiaAnterior}
                          onChange={(e) => setNombreIglesiaAnterior(e.target.value)}
                          disabled={!spiritualPersistenceOk}
                          placeholder="Ej: Iglesia X, ciudad…"
                          className="mt-0.5 w-full rounded-lg border border-gray-200/90 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400/40 disabled:opacity-50 dark:border-white/15 dark:bg-zinc-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-white/25"
                        />
                      </FormField>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Las notas con fecha se administran en la ficha de la persona.
              </p>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl bg-gray-100/40 p-6 dark:bg-white/[0.04]">
                <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Grupo
                </h3>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-gray-100/60 p-3 transition hover:bg-gray-200/50 dark:bg-white/[0.05] dark:hover:bg-white/[0.08]">
                    <input
                      type="radio"
                      name="grupoVisual"
                      checked={grupoRadio === ""}
                      onChange={() => setGrupoRadio("")}
                      className="h-4 w-4 border-gray-400 text-gray-900 focus:ring-gray-400/50 dark:border-gray-500 dark:text-white"
                    />
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin asignar</span>
                  </label>
                  {grupos.map((grupo) => (
                    <label
                      key={grupo.id}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl bg-gray-100/60 p-3 transition hover:bg-gray-200/50 dark:bg-white/[0.05] dark:hover:bg-white/[0.08]"
                    >
                      <input
                        type="radio"
                        name="grupoVisual"
                        checked={grupoRadio === grupo.id}
                        onChange={() => setGrupoRadio(grupo.id)}
                        className="h-4 w-4 border-gray-400 text-gray-900 focus:ring-gray-400/50 dark:border-gray-500 dark:text-white"
                      />
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{grupo.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-gray-100/50 p-5 dark:bg-white/[0.05]">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200/80 dark:bg-white/[0.1]">
                    <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Cambios de grupo</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Quitar del grupo pasa la persona a &quot;En seguimiento&quot;. Asignar grupo por primera vez puede
                      ponerla en &quot;Activo&quot; si era visitante o en seguimiento.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-gray-100/40 p-6 dark:bg-white/[0.04]">
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm shadow-black/10 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:shadow-none dark:hover:bg-gray-100"
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
                        Guardando...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Guardar cambios
                      </>
                    )}
                  </button>
                  <Link
                    href={`/personas/${id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300/70 px-6 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-200/50 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/[0.08]"
                  >
                    Cancelar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function FormField({
  icon,
  label,
  required = false,
  children,
}: {
  icon: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const icons: Record<string, JSX.Element> = {
    user: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    ),
    id: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
      />
    ),
    phone: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      />
    ),
    email: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    ),
    heart: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    ),
    work: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"
        />
      </>
    ),
    location: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </>
    ),
    sparkles: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    ),
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-100/60 p-4 transition focus-within:ring-2 focus-within:ring-gray-300/40 dark:bg-white/[0.05] dark:focus-within:ring-white/15">
      <svg className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {icons[icon]}
      </svg>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-xs text-gray-500 dark:text-gray-400">
          {label} {required && <span className="text-[#e64b27]">*</span>}
        </p>
        {children}
      </div>
    </div>
  );
}
