"use client";

import { useState, type Dispatch, type SetStateAction, type ReactNode, type JSX } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { soloDigitosDocumentoId } from "@/lib/documento-id";
import { ETAPA_LABELS } from "@/lib/persona-etapa";
import { formatEstadoCivilYPareja, labelSituacionLaboralEstudio } from "@/lib/persona-info-lider";
import { labelPersonaSexo, type PersonaSexo } from "@/lib/persona-sexo";
import {
  labelSituacionAcercamiento,
  labelTriBool,
  parseTriBoolForm,
  SITUACION_ACERCAMIENTO_OPTIONS,
  type SituacionAcercamiento,
} from "@/lib/personas-situacion-acercamiento";
import { labelParticipacionEnGrupo } from "../_lib/persona-detail-participacion";
import type { Persona, PersistPersonalResult } from "../_lib/persona-detail-types";
import {
  formatFechaNacimiento,
  formatUltimoContacto,
  calcularEdad,
  fechaLocalToIso,
  parseIsoToDatePersona,
} from "../_lib/persona-detail-dates";

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

function triToBoolDraft(t: "" | "true" | "false"): boolean | null {
  if (t === "true") return true;
  if (t === "false") return false;
  return null;
}

const INLINE_FIELD_CLASS =
  "w-full min-w-0 border-0 bg-transparent py-2.5 px-0 text-sm font-medium leading-snug text-gray-900 shadow-none ring-0 placeholder:text-gray-500/45 focus:outline-none focus:ring-0 dark:text-white dark:placeholder:text-gray-500/50";

const INLINE_SELECT_CLASS = `${INLINE_FIELD_CLASS} cursor-pointer pr-1 dark:[color-scheme:dark]`;

const INLINE_TEXTAREA_CLASS = `${INLINE_FIELD_CLASS} min-h-[3.5rem] resize-y`;

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

function triFromBoolPersona(v: boolean | null | undefined): "" | "true" | "false" {
  if (v === true) return "true";
  if (v === false) return "false";
  return "";
}

export function PersonalInfoCard({
  persona,
  setPersona,
  personaId,
  includesInfoLider,
  persistUpdate,
  showAppToast,
}: {
  persona: Persona;
  setPersona: Dispatch<SetStateAction<Persona | null>>;
  personaId: string;
  includesInfoLider: boolean;
  persistUpdate: (payload: Record<string, unknown>) => Promise<PersistPersonalResult>;
  showAppToast: (message: string, variant?: "success" | "error") => void;
}) {
  const [editing, setEditing] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [documentoId, setDocumentoId] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState<Date | null>(null);
  const [estadoCivil, setEstadoCivil] = useState("");
  const [ocupacion, setOcupacion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [tieneParejaTri, setTieneParejaTri] = useState<"" | "true" | "false">("");
  const [nombrePareja, setNombrePareja] = useState("");
  const [trabajaTri, setTrabajaTri] = useState<"" | "true" | "false">("");
  const [estudiaTri, setEstudiaTri] = useState<"" | "true" | "false">("");
  const [condicionSalud, setCondicionSalud] = useState("");
  const [contactoEmergenciaNombre, setContactoEmergenciaNombre] = useState("");
  const [contactoEmergenciaTelefono, setContactoEmergenciaTelefono] = useState("");
  const [sexoField, setSexoField] = useState<"" | PersonaSexo>("");

  const fillDraftFromPersona = () => {
    setNombre(persona.nombre);
    setDocumentoId(soloDigitosDocumentoId(persona.cedula));
    setTelefono(persona.telefono);
    setEmail(persona.email);
    setFechaNacimiento(parseIsoToDatePersona(persona.fechaNacimientoIso));
    setEstadoCivil(persona.estadoCivil);
    setOcupacion(persona.ocupacion);
    setDireccion(persona.direccion);
    setTieneParejaTri(triFromBoolPersona(persona.tienePareja));
    setNombrePareja(persona.nombrePareja ?? "");
    setTrabajaTri(triFromBoolPersona(persona.trabajaActualmente));
    setEstudiaTri(triFromBoolPersona(persona.estudiaActualmente));
    setCondicionSalud(persona.condicionSalud ?? "");
    setContactoEmergenciaNombre(persona.contactoEmergenciaNombre ?? "");
    setContactoEmergenciaTelefono(persona.contactoEmergenciaTelefono ?? "");
    setSexoField(persona.sexo ?? "");
  };

  const abrirEdicion = () => {
    fillDraftFromPersona();
    setErrorLocal(null);
    setEditing(true);
  };

  const cancelar = () => {
    setEditing(false);
    setErrorLocal(null);
  };

  const guardar = async () => {
    const nombreVal = nombre.trim();
    if (!nombreVal) {
      setErrorLocal("El nombre es obligatorio.");
      return;
    }
    setGuardando(true);
    setErrorLocal(null);

    const cedulaVal = documentoId.trim() || null;
    const telefonoVal = telefono.trim() || null;
    const emailVal = email.trim() || null;
    const estadoCivilVal = estadoCivil.trim() || null;
    const ocupacionVal = ocupacion.trim() || null;
    const direccionVal = direccion.trim() || null;
    const fechaIso = fechaLocalToIso(fechaNacimiento);

    const sexoVal: PersonaSexo | null = sexoField === "" ? null : sexoField;

    const updatePayload: Record<string, unknown> = {
      nombre: nombreVal,
      cedula: cedulaVal,
      telefono: telefonoVal,
      email: emailVal,
      fecha_nacimiento: fechaIso,
      estado_civil: estadoCivilVal,
      ocupacion: ocupacionVal,
      direccion: direccionVal,
      sexo: sexoVal,
    };

    if (includesInfoLider) {
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

    const res = await persistUpdate(updatePayload);
    setGuardando(false);
    if (!res.ok) {
      if (res.code === "23505") {
        setErrorLocal("Ya existe otra persona con ese documento de identidad en tu iglesia.");
      } else {
        setErrorLocal(res.message);
      }
      return;
    }

    const tieneP = includesInfoLider ? parseTriBoolForm(tieneParejaTri) : persona.tienePareja;
    const trabaja = includesInfoLider ? parseTriBoolForm(trabajaTri) : persona.trabajaActualmente;
    const estudia = includesInfoLider ? parseTriBoolForm(estudiaTri) : persona.estudiaActualmente;
    const nombreParejaNuevo =
      includesInfoLider && tieneP === true ? nombrePareja.trim() || null : includesInfoLider ? null : persona.nombrePareja;
    const condicionN = includesInfoLider ? condicionSalud.trim() || null : persona.condicionSalud;
    const emNom = includesInfoLider ? contactoEmergenciaNombre.trim() || null : persona.contactoEmergenciaNombre;
    const emTel = includesInfoLider ? contactoEmergenciaTelefono.trim() || null : persona.contactoEmergenciaTelefono;

    setPersona((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        nombre: nombreVal,
        cedula: documentoId,
        telefono: telefonoVal ?? "",
        email: emailVal ?? "",
        fechaNacimientoIso: fechaIso,
        fechaNacimiento: formatFechaNacimiento(fechaIso),
        edad: calcularEdad(fechaIso),
        estadoCivil: estadoCivilVal ?? "",
        ocupacion: ocupacionVal ?? "",
        direccion: direccionVal ?? "",
        tienePareja: tieneP,
        nombrePareja: nombreParejaNuevo,
        trabajaActualmente: trabaja,
        estudiaActualmente: estudia,
        condicionSalud: condicionN,
        contactoEmergenciaNombre: emNom,
        contactoEmergenciaTelefono: emTel,
        sexo: sexoVal,
      };
    });

    setEditing(false);
    showAppToast("Información personal actualizada", "success");
  };

  return (
    <div className="rounded-2xl border border-gray-200/50 bg-gray-50/40 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Información personal</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Contacto, identidad, ocupación y datos de cuidado. Los vacíos se muestran suaves en la vista de lectura.
          </p>
          {errorLocal ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorLocal}</p> : null}
          {editing && !includesInfoLider ? (
            <p className="mt-2 text-xs leading-snug text-amber-800/90 dark:text-amber-200/90">
              Pareja, trabajo, estudios, salud y emergencia no se guardan hasta migrar esas columnas en Supabase.
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={cancelar}
                disabled={guardando}
                className="rounded-xl border border-gray-200/80 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-white dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/[0.06]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void guardar()}
                disabled={guardando}
                className="rounded-xl bg-[#0ca6b2] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0a8f99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? "Guardando…" : "Guardar"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={abrirEdicion}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/80 px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-[#252525] dark:text-gray-100 dark:hover:bg-[#2e2e2e]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
              Editar
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-6 grid gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-x-14 sm:gap-y-10">
          <PersonaFichaColumn title="Contacto e identidad" titleSpacing="roomy">
            <PersonaFichaRowEdit k="Nombre">
              <input
                type="text"
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INLINE_FIELD_CLASS}
                placeholder="—"
                autoComplete="email"
              />
            </PersonaFichaRowEdit>
            <PersonaFichaRowEdit k="Nac.">
              <DatePicker
                id="personaInlineFechaNacimiento"
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
                value={sexoField}
                onChange={(e) => setSexoField(e.target.value as "" | PersonaSexo)}
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
                value={tieneParejaTri}
                onChange={(e) => setTieneParejaTri(e.target.value as "" | "true" | "false")}
                className={INLINE_SELECT_CLASS}
                disabled={!includesInfoLider}
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
                  value={nombrePareja}
                  onChange={(e) => setNombrePareja(e.target.value)}
                  className={INLINE_FIELD_CLASS}
                  disabled={!includesInfoLider}
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
                  disabled={!includesInfoLider}
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
                  disabled={!includesInfoLider}
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
              <select value={ocupacion} onChange={(e) => setOcupacion(e.target.value)} className={INLINE_SELECT_CLASS}>
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
                value={condicionSalud}
                onChange={(e) => setCondicionSalud(e.target.value)}
                rows={3}
                disabled={!includesInfoLider}
                className={`${INLINE_TEXTAREA_CLASS} disabled:opacity-45`}
                placeholder="—"
              />
            </PersonaFichaRowEdit>
            <PersonaFichaRowEdit k="Emergencia" multiline>
              <div className="space-y-2">
                <input
                  type="text"
                  value={contactoEmergenciaNombre}
                  onChange={(e) => setContactoEmergenciaNombre(e.target.value)}
                  className={INLINE_FIELD_CLASS}
                  disabled={!includesInfoLider}
                  placeholder="Nombre"
                />
                <input
                  type="tel"
                  value={contactoEmergenciaTelefono}
                  onChange={(e) => setContactoEmergenciaTelefono(e.target.value)}
                  className={INLINE_FIELD_CLASS}
                  disabled={!includesInfoLider}
                  placeholder="Teléfono"
                />
              </div>
            </PersonaFichaRowEdit>
            <PersonaFichaRowEdit k="Dirección" multiline>
              <textarea
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                rows={2}
                className={INLINE_TEXTAREA_CLASS}
                placeholder="—"
              />
            </PersonaFichaRowEdit>
          </PersonaFichaColumn>
        </div>
      ) : (
        <div className="mt-5">
          <PersonalInfoPanel persona={persona} />
        </div>
      )}
    </div>
  );
}

function personalDatoVacio(value: string): boolean {
  const t = value.trim();
  return t === "" || t === "Sin registrar" || t === "—";
}

/** Fila reutilizable (mismo estilo que Información personal). */
function PersonaFichaRow({
  k,
  value,
  multiline,
}: {
  k: string;
  value: string;
  multiline?: boolean;
}) {
  const vacio = personalDatoVacio(value);
  return (
    <div className="flex gap-3 border-b border-gray-200/40 py-2.5 last:border-b-0 dark:border-white/[0.06] sm:gap-4">
      <dt className="w-[5.5rem] shrink-0 text-xs text-gray-500 dark:text-gray-400 sm:w-24">{k}</dt>
      <dd
        className={`min-w-0 flex-1 text-sm leading-snug ${
          vacio ? "text-gray-500/70 dark:text-gray-500/65" : "text-gray-900 dark:text-white"
        } ${vacio ? "" : "font-medium"} ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {value}
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
  /** `roomy`: más aire bajo el título (formulario en edición). */
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

function PersonalInfoPanel({ persona }: { persona: Persona }) {
  const hasContacto =
    Boolean(persona.cedula?.trim()) ||
    Boolean(persona.telefono?.trim()) ||
    Boolean(persona.email?.trim());

  const emergenciaStr =
    [persona.contactoEmergenciaNombre, persona.contactoEmergenciaTelefono].filter(Boolean).join(" · ") ||
    "Sin registrar";

  return (
    <div className="grid gap-8 sm:grid-cols-2 sm:gap-10">
      <PersonaFichaColumn title="Contacto e identidad">
        {!hasContacto ? (
          <p className="text-sm text-gray-500/80 dark:text-gray-500/70">Sin datos de contacto.</p>
        ) : null}
        {persona.cedula?.trim() ? <PersonaFichaRow k="ID" value={persona.cedula} /> : null}
        {persona.telefono?.trim() ? <PersonaFichaRow k="Tel." value={persona.telefono} /> : null}
        {persona.email?.trim() ? <PersonaFichaRow k="Correo" value={persona.email} /> : null}
        {persona.fechaNacimiento ? <PersonaFichaRow k="Nac." value={persona.fechaNacimiento} /> : null}
        <PersonaFichaRow k="Edad" value={persona.edad != null ? `${persona.edad} años` : "Sin registrar"} />
        <PersonaFichaRow k="Sexo" value={labelPersonaSexo(persona.sexo)} />
        <PersonaFichaRow
          k="Estado y pareja"
          value={formatEstadoCivilYPareja(persona.estadoCivil, persona.tienePareja, persona.nombrePareja)}
          multiline
        />
      </PersonaFichaColumn>

      <PersonaFichaColumn title="Actividad, salud y ubicación">
        <PersonaFichaRow
          k="Situación"
          value={labelSituacionLaboralEstudio(persona.trabajaActualmente, persona.estudiaActualmente)}
        />
        <PersonaFichaRow k="Ocupación" value={persona.ocupacion?.trim() ? persona.ocupacion : "Sin registrar"} />
        <PersonaFichaRow
          k="Salud"
          value={persona.condicionSalud?.trim() ? persona.condicionSalud : "Sin registrar"}
          multiline
        />
        <PersonaFichaRow k="Emergencia" value={emergenciaStr} />
        <PersonaFichaRow k="Dirección" value={persona.direccion?.trim() ? persona.direccion : "Sin registrar"} multiline />
      </PersonaFichaColumn>
    </div>
  );
}

/** Embudo, grupo y fe / llegada — solo lectura (también dentro del card en vista lectura). */
function ProcesoYCaminoPanelRead({ persona }: { persona: Persona }) {
  const grupoTxt = persona.grupoId ? persona.grupo : "Sin grupo asignado";
  const iglesiaAnt = persona.nombreIglesiaAnterior?.trim() ?? "";

  return (
    <div className="grid gap-8 sm:grid-cols-2 sm:gap-10">
      <PersonaFichaColumn title="Proceso en la iglesia">
        <PersonaFichaRow k="Etapa" value={ETAPA_LABELS[persona.etapa]} />
        <PersonaFichaRow k="Rol" value={persona.rol} />
        <PersonaFichaRow k="Grupo" value={grupoTxt} />
        {persona.grupoId ? (
          <PersonaFichaRow
            k="En el grupo"
            value={labelParticipacionEnGrupo(persona.participacionEnGrupo, persona.grupoId)}
          />
        ) : null}
        <PersonaFichaRow k="Registro" value={persona.fechaRegistro} />
        <PersonaFichaRow k="Últ. contacto" value={persona.ultimoContacto} />
      </PersonaFichaColumn>

      <PersonaFichaColumn title="Fe y llegada">
        <PersonaFichaRow k="Bautismo" value={labelTriBool(persona.bautizado)} />
        <PersonaFichaRow
          k="Acercamiento"
          value={labelSituacionAcercamiento(persona.situacionAcercamiento) || "—"}
        />
        <PersonaFichaRow k="Otra iglesia" value={labelTriBool(persona.vieneDeOtraIglesia)} />
        {iglesiaAnt ? <PersonaFichaRow k="Congregación previa" value={iglesiaAnt} multiline /> : null}
      </PersonaFichaColumn>
    </div>
  );
}

export function ProcesoYCaminoCard({
  persona,
  setPersona,
  personaId,
  persistUpdate,
  showAppToast,
  detalleIncludesSpiritual,
}: {
  persona: Persona;
  setPersona: Dispatch<SetStateAction<Persona | null>>;
  personaId: string;
  persistUpdate: (payload: Record<string, unknown>) => Promise<PersistPersonalResult>;
  showAppToast: (message: string, variant?: "success" | "error") => void;
  detalleIncludesSpiritual: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const [fechaRegistroDate, setFechaRegistroDate] = useState<Date | null>(null);
  const [ultimoContactoDate, setUltimoContactoDate] = useState<Date | null>(null);
  const [bautizadoTri, setBautizadoTri] = useState<"" | "true" | "false">("");
  const [vieneDeOtraTri, setVieneDeOtraTri] = useState<"" | "true" | "false">("");
  const [situacion, setSituacion] = useState("");
  const [nombreIglesia, setNombreIglesia] = useState("");

  const fillDraftFromPersona = () => {
    setFechaRegistroDate(parseIsoToDatePersona(persona.fechaRegistroIso));
    setUltimoContactoDate(parseIsoToDatePersona(persona.ultimoContactoIso));
    setBautizadoTri(triFromBoolPersona(persona.bautizado));
    setVieneDeOtraTri(triFromBoolPersona(persona.vieneDeOtraIglesia));
    setSituacion(persona.situacionAcercamiento ?? "");
    setNombreIglesia(persona.nombreIglesiaAnterior ?? "");
  };

  const abrirEdicion = () => {
    fillDraftFromPersona();
    setErrorLocal(null);
    setEditing(true);
  };

  const cancelar = () => {
    setEditing(false);
    setErrorLocal(null);
  };

  const guardar = async () => {
    setGuardando(true);
    setErrorLocal(null);

    const fechaRegIso = fechaLocalToIso(fechaRegistroDate);
    const ultimoIso = fechaLocalToIso(ultimoContactoDate);

    const updatePayload: Record<string, unknown> = {
      fecha_registro: fechaRegIso,
      ultimo_contacto: ultimoIso,
    };

    if (detalleIncludesSpiritual) {
      const baut = parseTriBoolForm(bautizadoTri);
      const viene = parseTriBoolForm(vieneDeOtraTri);
      updatePayload.bautizado = baut;
      updatePayload.viene_de_otra_iglesia = viene;
      updatePayload.nombre_iglesia_anterior = viene === true ? nombreIglesia.trim() || null : null;
      const situRaw = situacion.trim();
      const situacionesValidas: SituacionAcercamiento[] = [
        "primera_vez_fe",
        "otra_iglesia",
        "retorno",
        "no_indica",
      ];
      updatePayload.situacion_acercamiento =
        situRaw && situacionesValidas.includes(situRaw as SituacionAcercamiento)
          ? situRaw
          : null;
    }

    const res = await persistUpdate(updatePayload);
    setGuardando(false);
    if (!res.ok) {
      setErrorLocal(res.message);
      return;
    }

    const bautizadoNuevo = detalleIncludesSpiritual ? parseTriBoolForm(bautizadoTri) : persona.bautizado;
    const vieneNuevo = detalleIncludesSpiritual ? parseTriBoolForm(vieneDeOtraTri) : persona.vieneDeOtraIglesia;
    let situNueva: string | null;
    if (!detalleIncludesSpiritual) {
      situNueva = persona.situacionAcercamiento;
    } else {
      const situTrim = situacion.trim();
      const situacionesValidasGuard: SituacionAcercamiento[] = [
        "primera_vez_fe",
        "otra_iglesia",
        "retorno",
        "no_indica",
      ];
      situNueva =
        situTrim && situacionesValidasGuard.includes(situTrim as SituacionAcercamiento) ? situTrim : null;
    }
    const nombreIglesiaNuevo =
      detalleIncludesSpiritual && vieneNuevo === true
        ? nombreIglesia.trim() || null
        : detalleIncludesSpiritual
          ? null
          : persona.nombreIglesiaAnterior;

    setPersona((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fechaRegistroIso: fechaRegIso,
        fechaRegistro: fechaRegIso ? formatFechaNacimiento(fechaRegIso) : "—",
        ultimoContactoIso: ultimoIso,
        ultimoContacto: ultimoIso ? formatUltimoContacto(ultimoIso) : "—",
        bautizado: bautizadoNuevo,
        vieneDeOtraIglesia: vieneNuevo,
        situacionAcercamiento: situNueva,
        nombreIglesiaAnterior: nombreIglesiaNuevo,
      };
    });

    setEditing(false);
    showAppToast("Proceso y camino espiritual actualizado", "success");
  };

  const grupoTxt = persona.grupoId ? persona.grupo : "Sin grupo asignado";

  return (
    <div className="rounded-2xl border border-gray-200/50 bg-gray-50/40 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Etapa del proceso y camino espiritual</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Embudo, grupo y seguimiento pastoral a la izquierda; bautismo y cómo llegó a la iglesia a la derecha. La etapa
            del embudo la cambias con{" "}
            <span className="font-medium text-gray-600 dark:text-gray-300">Cambiar etapa</span> en la cabecera.
          </p>
          {errorLocal ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorLocal}</p> : null}
          {editing && !detalleIncludesSpiritual ? (
            <p className="mt-2 text-xs leading-snug text-amber-800/90 dark:text-amber-200/90">
              Tu base aún no incluye en esta vista las columnas de camino espiritual. Solo se guardarán registro y último
              contacto hasta aplicar la migración completa en Supabase.
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={cancelar}
                disabled={guardando}
                className="rounded-xl border border-gray-200/80 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-white dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/[0.06]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void guardar()}
                disabled={guardando}
                className="rounded-xl bg-[#0ca6b2] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0a8f99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? "Guardando…" : "Guardar"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={abrirEdicion}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/80 px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-[#252525] dark:text-gray-100 dark:hover:bg-[#2e2e2e]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
              Editar
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-6 grid gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-x-14 sm:gap-y-10">
          <PersonaFichaColumn title="Proceso en la iglesia" titleSpacing="roomy">
            <PersonaFichaRowEdit k="Etapa">
              <span className="text-sm font-medium text-gray-900/90 dark:text-white/90">{ETAPA_LABELS[persona.etapa]}</span>
            </PersonaFichaRowEdit>
            <PersonaFichaRowEdit k="Rol">
              <span className="text-sm font-medium text-gray-900/90 dark:text-white/90">{persona.rol}</span>
            </PersonaFichaRowEdit>
            <PersonaFichaRowEdit k="Grupo">
              <span className="text-sm font-medium text-gray-900/90 dark:text-white/90">{grupoTxt}</span>
            </PersonaFichaRowEdit>
            {persona.grupoId ? (
              <PersonaFichaRowEdit k="En el grupo">
                <span className="text-sm font-medium text-gray-900/90 dark:text-white/90">
                  {labelParticipacionEnGrupo(persona.participacionEnGrupo, persona.grupoId)}
                </span>
              </PersonaFichaRowEdit>
            ) : null}
            <PersonaFichaRowEdit k="Registro">
              <DatePicker
                id="procesoFechaRegistro"
                name="fechaRegistro"
                value={fechaRegistroDate}
                onChange={setFechaRegistroDate}
                placeholder="Seleccionar fecha"
                variant="soft"
              />
            </PersonaFichaRowEdit>
            <PersonaFichaRowEdit k="Últ. contacto">
              <DatePicker
                id="procesoUltimoContacto"
                name="ultimoContacto"
                value={ultimoContactoDate}
                onChange={setUltimoContactoDate}
                placeholder="Seleccionar fecha"
                variant="soft"
              />
            </PersonaFichaRowEdit>
          </PersonaFichaColumn>

          {detalleIncludesSpiritual ? (
            <PersonaFichaColumn title="Fe y llegada" titleSpacing="roomy">
              <PersonaFichaRowEdit k="Bautismo">
                <select
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
                  value={vieneDeOtraTri}
                  onChange={(e) => setVieneDeOtraTri(e.target.value as "" | "true" | "false")}
                  className={INLINE_SELECT_CLASS}
                  aria-label="¿Viene de otra iglesia?"
                >
                  <option value="">Sin registrar</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </PersonaFichaRowEdit>
              {vieneDeOtraTri === "true" ? (
                <PersonaFichaRowEdit k="Congregación previa" multiline>
                  <textarea
                    value={nombreIglesia}
                    onChange={(e) => setNombreIglesia(e.target.value)}
                    rows={2}
                    className={INLINE_TEXTAREA_CLASS}
                    placeholder="Nombre de la congregación anterior"
                  />
                </PersonaFichaRowEdit>
              ) : null}
            </PersonaFichaColumn>
          ) : (
            <PersonaFichaColumn title="Fe y llegada" titleSpacing="roomy">
              <PersonaFichaRow k="Bautismo" value={labelTriBool(persona.bautizado)} />
              <PersonaFichaRow
                k="Acercamiento"
                value={labelSituacionAcercamiento(persona.situacionAcercamiento) || "—"}
              />
              <PersonaFichaRow k="Otra iglesia" value={labelTriBool(persona.vieneDeOtraIglesia)} />
              {persona.nombreIglesiaAnterior?.trim() ? (
                <PersonaFichaRow k="Congregación previa" value={persona.nombreIglesiaAnterior} multiline />
              ) : null}
            </PersonaFichaColumn>
          )}
        </div>
      ) : (
        <div className="mt-5">
          <ProcesoYCaminoPanelRead persona={persona} />
        </div>
      )}
    </div>
  );
}

export function ActionButton({ icon, color: _color, label }: { icon: string; color: string; label: string }) {
  const icons: Record<string, JSX.Element> = {
    clock: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />,
    tag: <><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></>,
  };

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-gray-200/40 dark:hover:bg-white/[0.06]"
    >
      <svg
        className="h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        {icons[icon]}
      </svg>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
    </button>
  );
}
