"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/UserAvatar";
import { ETAPA_LABELS, type EtapaPersonaDb } from "@/lib/persona-etapa";
import {
  parseTriBoolForm,
  type SituacionAcercamiento,
} from "@/lib/personas-situacion-acercamiento";
import { type PersonaSexo } from "@/lib/persona-sexo";
import { fechaHoyYYYYMMDD } from "@/lib/fecha-hoy-local";
import { useDashboardOrgPlan } from "@/contexts/DashboardOrgPlanContext";
import {
  isLeaderIndividualPlan,
  LEADER_INDIVIDUAL_MAX_PERSONAS,
} from "@/lib/organization-plan";
import { createClient } from "@/lib/supabase/client";
import type { AuthInsertContext } from "../[id]/_lib/persona-detail-types";
import { GrupoCalendarioStyleCard, GrupoSelectableCard } from "../_components/GrupoSeleccionCalendarioCards";
import {
  InformacionPersonalRegistroModal,
  type InformacionPersonalRegistroSetters,
  type InformacionPersonalRegistroState,
} from "../_components/InformacionPersonalRegistroModal";
import { BTN_FICHA_PRIMARIO } from "../[id]/_lib/persona-detail-buttons";
import { BTN_COMPLETAR_DATOS_CARD, IconoEditarDatos } from "../_components/CompletarDatosButton";
import {
  labelAcercamientoResumen,
  labelTriBoolResumen,
  ProcesoEspiritualRegistroModal,
  type ProcesoEspiritualRegistroSetters,
  type ProcesoEspiritualRegistroState,
} from "../_components/ProcesoEspiritualRegistroModal";

interface GrupoOption {
  id: string;
  nombre: string;
  hora: string | null;
  ubicacion: string | null;
  dia: string | null;
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

export default function NuevaPersonaClient({
  embedded = false,
  onCancel,
  onRegistered,
  initialPersonalModalOpen = true,
}: {
  embedded?: boolean;
  onCancel?: () => void;
  onRegistered?: (personaId: string) => void;
  initialPersonalModalOpen?: boolean;
} = {}) {
  const orgPlan = useDashboardOrgPlan();
  const leaderFree = isLeaderIndividualPlan(orgPlan);
  const router = useRouter();
  const [grupos, setGrupos] = useState<GrupoOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personasEnOrg, setPersonasEnOrg] = useState<number | null>(null);
  const [personalModalOpen, setPersonalModalOpen] = useState(initialPersonalModalOpen);
  const [procesoModalOpen, setProcesoModalOpen] = useState(false);

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

  useEffect(() => {
    if (!leaderFree) return;
    const supabase = createClient();
    void supabase
      .from("personas")
      .select("id", { count: "exact", head: true })
      .then(({ count, error }) => {
        if (!error) setPersonasEnOrg(count ?? 0);
      });
  }, [leaderFree]);

  const etapaAlRegistrar: EtapaPersonaDb = grupoRadio ? "nuevo_creyente" : "visitante";
  const grupoNombre = grupoRadio ? grupos.find((g) => g.id === grupoRadio)?.nombre ?? "—" : "Sin grupo asignado";

  const personalInfoValues: InformacionPersonalRegistroState = {
    nombre,
    documentoId,
    telefono,
    email,
    fechaNacimiento,
    sexo,
    estadoCivil,
    ocupacion,
    direccion,
    tieneParejaTri,
    nombrePareja,
    trabajaTri,
    estudiaTri,
    condicionSalud,
    contactoEmergenciaNombre,
    contactoEmergenciaTelefono,
  };

  const personalInfoSetters: InformacionPersonalRegistroSetters = {
    setNombre,
    setDocumentoId,
    setTelefono,
    setEmail,
    setFechaNacimiento,
    setSexo,
    setEstadoCivil,
    setOcupacion,
    setDireccion,
    setTieneParejaTri,
    setNombrePareja,
    setTrabajaTri,
    setEstudiaTri,
    setCondicionSalud,
    setContactoEmergenciaNombre,
    setContactoEmergenciaTelefono,
  };

  const personalInfoCompleta = nombre.trim().length > 0 && telefono.trim().length > 0;

  const personalInfoTieneDatos =
    personalInfoCompleta ||
    email.trim().length > 0 ||
    documentoId.trim().length > 0 ||
    sexo !== "" ||
    estadoCivil !== "" ||
    ocupacion !== "" ||
    direccion.trim().length > 0 ||
    fechaNacimiento !== null ||
    tieneParejaTri !== "" ||
    nombrePareja.trim().length > 0 ||
    trabajaTri !== "" ||
    estudiaTri !== "" ||
    condicionSalud.trim().length > 0 ||
    contactoEmergenciaNombre.trim().length > 0 ||
    contactoEmergenciaTelefono.trim().length > 0;

  const procesoEspiritualTieneDatos =
    bautizadoTri !== "" ||
    situacion !== "" ||
    vieneDeOtraIglesia !== "" ||
    nombreIglesiaAnterior.trim().length > 0 ||
    grupoRadio !== "";

  const procesoEspiritualValues: ProcesoEspiritualRegistroState = {
    etapaAlRegistrar,
    grupoNombre,
    grupoRadio,
    bautizadoTri,
    situacion,
    vieneDeOtraIglesia,
    nombreIglesiaAnterior,
  };

  const procesoEspiritualSetters: ProcesoEspiritualRegistroSetters = {
    setBautizadoTri,
    setSituacion,
    setVieneDeOtraIglesia,
    setNombreIglesiaAnterior,
  };

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
      setPersonalModalOpen(true);
      setError("Completa el nombre en información personal.");
      setIsSubmitting(false);
      return;
    }

    if (!telefonoVal) {
      setPersonalModalOpen(true);
      setError("Completa el teléfono en información personal.");
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

      if (leaderFree) {
        const { count, error: cErr } = await supabase
          .from("personas")
          .select("id", { count: "exact", head: true });
        if (cErr) throw cErr;
        const n = count ?? 0;
        setPersonasEnOrg(n);
        if (n >= LEADER_INDIVIDUAL_MAX_PERSONAS) {
          setError(
            `En el plan gratuito de líder alcanzaste el máximo de ${LEADER_INDIVIDUAL_MAX_PERSONAS} personas. Escríbenos por WhatsApp para ampliar tu espacio con precio justo.`
          );
          setIsSubmitting(false);
          return;
        }
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
            "Ya existe una persona con ese documento en tu rebaño. Revisa el número o busca en el listado."
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
        if (onRegistered) {
          onRegistered(personaId);
        } else {
          router.push(`/personas/${personaId}`);
        }
      } else if (onCancel) {
        onCancel();
      } else {
        router.push("/personas");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar. Intenta de nuevo.");
      setIsSubmitting(false);
    }
  };

  const atPersonaCap =
    leaderFree && personasEnOrg !== null && personasEnOrg >= LEADER_INDIVIDUAL_MAX_PERSONAS;

  return (
    <div className={embedded ? "w-full" : "w-full min-h-[calc(100vh-4rem)]"}>
      {leaderFree && !embedded ? (
        <div className="mb-4 rounded-2xl border border-sky-200/80 bg-sky-50/90 px-4 py-3 text-sm text-sky-950 dark:border-sky-800/40 dark:bg-sky-950/30 dark:text-sky-100">
          <p className="font-semibold">Líder individual — gratis</p>
          <p className="mt-1 leading-snug text-sky-900/90 dark:text-sky-200/90">
            Hasta {LEADER_INDIVIDUAL_MAX_PERSONAS} personas y hasta 3 grupos. Los módulos Líderes y Eventos no aplican en
            este plan. Si necesitas el producto completo para tu rebaño, contáctanos por WhatsApp en la barra
            superior.
          </p>
          {personasEnOrg !== null ? (
            <p className="mt-2 text-xs font-semibold tabular-nums">
              Personas en tu rebaño: {personasEnOrg} / {LEADER_INDIVIDUAL_MAX_PERSONAS}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={`${embedded ? "mb-4" : "mb-5"} rounded-3xl bg-gray-100/50 p-5 dark:bg-white/[0.04] md:p-6`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="shrink-0 rounded-full bg-white/80 p-1 shadow-sm shadow-black/[0.06] ring-1 ring-black/[0.04] dark:bg-white/[0.08] dark:shadow-none dark:ring-white/[0.08]">
            <UserAvatar seed={nombre || "Nueva Persona"} sexo={sexo === "" ? null : sexo} size={embedded ? 80 : 104} />
          </div>
          <div className="min-w-0 flex-1">
            <h1
              id={embedded ? "registrar-persona-modal-title" : undefined}
              className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-2xl"
            >
              {embedded ? "Nueva visita" : "Registrar nueva persona"}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {embedded
                ? "Captura los datos de quien acaba de llegar. Empieza por nombre y teléfono; el resto puede quedar para después."
                : "Completa la información personal en el modal, asigna grupo si aplica y registra. Al guardar se abre la ficha."}
            </p>
          </div>
          {embedded && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="shrink-0 rounded-full p-2.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
              title="Cerrar"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <Link
              href="/personas"
              className="shrink-0 rounded-full p-2.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
              title="Volver a personas"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          )}
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
            <div className="rounded-2xl border border-gray-200/50 bg-gray-50/40 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
              {personalInfoTieneDatos ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Información personal</h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {personalInfoCompleta
                          ? "Datos listos. Puedes editarlos antes de registrar."
                          : "Faltan nombre o teléfono. Complétalos antes de registrar."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPersonalModalOpen(true)}
                      className={BTN_COMPLETAR_DATOS_CARD}
                    >
                      <IconoEditarDatos />
                      Completar datos
                    </button>
                  </div>

                  <dl className="mt-5 divide-y divide-gray-200/40 dark:divide-white/[0.06]">
                    {[
                      ["Nombre", nombre.trim() || "—"],
                      ["Teléfono", telefono.trim() || "—"],
                      ["Correo", email.trim() || "—"],
                      ["Documento", documentoId.trim() || "—"],
                      ["Sexo", sexo === "masculino" ? "Masculino" : sexo === "femenino" ? "Femenino" : "—"],
                      ["Ocupación", ocupacion || "—"],
                      ["Dirección", direccion.trim() || "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4">
                        <dt className="w-24 shrink-0 text-xs text-gray-500 dark:text-gray-400">{label}</dt>
                        <dd className="min-w-0 flex-1 text-sm font-medium text-gray-900 dark:text-white">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Información personal</h2>
                  <button
                    type="button"
                    onClick={() => setPersonalModalOpen(true)}
                    className={`${BTN_COMPLETAR_DATOS_CARD} mt-4 w-full justify-center py-3`}
                  >
                    <IconoEditarDatos />
                    Completar datos
                  </button>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200/50 bg-gray-50/40 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
              {procesoEspiritualTieneDatos ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Etapa del proceso y camino espiritual
                      </h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Bautismo y cómo llegó a tu ministerio. Sin grupo queda como visitante; con grupo, como nuevo creyente en
                        célula.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProcesoModalOpen(true)}
                      className={BTN_COMPLETAR_DATOS_CARD}
                    >
                      <IconoEditarDatos />
                      Completar datos
                    </button>
                  </div>

                  <dl className="mt-5 divide-y divide-gray-200/40 dark:divide-white/[0.06]">
                    {[
                      ["Etapa", ETAPA_LABELS[etapaAlRegistrar]],
                      ["Rol", "Miembro"],
                      ["Grupo", grupoNombre],
                      ["Bautismo", labelTriBoolResumen(bautizadoTri)],
                      ["Acercamiento", labelAcercamientoResumen(situacion)],
                      ["Otra iglesia", labelTriBoolResumen(vieneDeOtraIglesia)],
                      ...(vieneDeOtraIglesia === "true" && nombreIglesiaAnterior.trim()
                        ? [["Congregación previa", nombreIglesiaAnterior.trim()] as const]
                        : []),
                    ].map(([label, value]) => (
                      <div key={label} className="flex gap-3 py-3 first:pt-0 last:pb-0 sm:gap-4">
                        <dt className="w-28 shrink-0 text-xs text-gray-500 dark:text-gray-400 sm:w-32">{label}</dt>
                        <dd className="min-w-0 flex-1 text-sm font-medium text-gray-900 dark:text-white">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Etapa del proceso y camino espiritual
                  </h2>
                  <button
                    type="button"
                    onClick={() => setProcesoModalOpen(true)}
                    className={`${BTN_COMPLETAR_DATOS_CARD} mt-4 w-full justify-center py-3`}
                  >
                    <IconoEditarDatos />
                    Completar datos
                  </button>
                </>
              )}
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
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Registro en tu rebaño</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Sin grupo queda como visitante; con grupo, como nuevo creyente en célula. Luego podrás ajustar etapa y
                    participación desde la ficha.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/50 bg-gray-50/40 p-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting || atPersonaCap}
                  className={`flex w-full items-center justify-center gap-2 !rounded-full px-6 py-3 ${BTN_FICHA_PRIMARIO}`}
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
                {embedded && onCancel ? (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300/70 px-6 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-200/50 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/[0.08]"
                  >
                    Cancelar
                  </button>
                ) : (
                  <Link
                    href="/personas"
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300/70 px-6 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-200/50 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/[0.08]"
                  >
                    Cancelar
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      <InformacionPersonalRegistroModal
        isOpen={personalModalOpen}
        onClose={() => setPersonalModalOpen(false)}
        values={personalInfoValues}
        setters={personalInfoSetters}
      />

      <ProcesoEspiritualRegistroModal
        isOpen={procesoModalOpen}
        onClose={() => setProcesoModalOpen(false)}
        values={procesoEspiritualValues}
        setters={procesoEspiritualSetters}
      />
    </div>
  );
}
