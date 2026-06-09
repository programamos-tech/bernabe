"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { DatePicker } from "@/components/ui/DatePicker";
import { soloDigitosDocumentoId } from "@/lib/documento-id";
import { labelSituacionLaboralEstudio } from "@/lib/persona-info-lider";
import { type PersonaSexo } from "@/lib/persona-sexo";
import {
  BTN_FICHA_PRIMARIO_FLEX,
  BTN_FICHA_SECUNDARIO_FLEX,
} from "../[id]/_lib/persona-detail-buttons";
import { calcularEdad, fechaLocalToIso } from "../[id]/_lib/persona-detail-dates";

export const ESTADOS_CIVILES_REGISTRO = [
  "Soltero/a",
  "Casado/a",
  "Unión libre",
  "Divorciado/a",
  "Viudo/a",
] as const;

export const OCUPACIONES_REGISTRO = [
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

const MODAL_FIELD_CLASS =
  "w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-300/50 dark:border-white/10 dark:bg-[#252525] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-white/20";

const MODAL_SELECT_CLASS = `${MODAL_FIELD_CLASS} cursor-pointer appearance-none pr-8 dark:[color-scheme:dark]`;

const MODAL_TEXTAREA_CLASS = `${MODAL_FIELD_CLASS} min-h-[4.5rem] resize-y`;

function triToBoolDraft(t: "" | "true" | "false"): boolean | null {
  if (t === "true") return true;
  if (t === "false") return false;
  return null;
}

function ModalField({ label, children, multiline }: { label: string; children: ReactNode; multiline?: boolean }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
      <div className={multiline ? "min-w-0 [&_textarea]:whitespace-pre-wrap" : "min-w-0"}>{children}</div>
    </div>
  );
}

export type InformacionPersonalRegistroState = {
  nombre: string;
  documentoId: string;
  telefono: string;
  email: string;
  fechaNacimiento: Date | null;
  sexo: PersonaSexo | "";
  estadoCivil: string;
  ocupacion: string;
  direccion: string;
  tieneParejaTri: "" | "true" | "false";
  nombrePareja: string;
  trabajaTri: "" | "true" | "false";
  estudiaTri: "" | "true" | "false";
  condicionSalud: string;
  contactoEmergenciaNombre: string;
  contactoEmergenciaTelefono: string;
};

export type InformacionPersonalRegistroSetters = {
  setNombre: (v: string) => void;
  setDocumentoId: (v: string) => void;
  setTelefono: (v: string) => void;
  setEmail: (v: string) => void;
  setFechaNacimiento: (v: Date | null) => void;
  setSexo: (v: PersonaSexo | "") => void;
  setEstadoCivil: (v: string) => void;
  setOcupacion: (v: string) => void;
  setDireccion: (v: string) => void;
  setTieneParejaTri: (v: "" | "true" | "false") => void;
  setNombrePareja: (v: string) => void;
  setTrabajaTri: (v: "" | "true" | "false") => void;
  setEstudiaTri: (v: "" | "true" | "false") => void;
  setCondicionSalud: (v: string) => void;
  setContactoEmergenciaNombre: (v: string) => void;
  setContactoEmergenciaTelefono: (v: string) => void;
};

export function InformacionPersonalRegistroFields({
  values,
  setters,
}: {
  values: InformacionPersonalRegistroState;
  setters: InformacionPersonalRegistroSetters;
}) {
  const edadLabel = (() => {
    const iso = fechaLocalToIso(values.fechaNacimiento);
    if (!iso) return "Sin registrar";
    const e = calcularEdad(iso);
    return e != null ? `${e} años` : "—";
  })();

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Contacto e identidad</h3>
        <ModalField label="Nombre *">
          <input
            type="text"
            name="nombre"
            required
            value={values.nombre}
            onChange={(e) => setters.setNombre(e.target.value)}
            className={MODAL_FIELD_CLASS}
            placeholder="Nombre y apellido"
            autoComplete="name"
          />
        </ModalField>
        <ModalField label="Documento ID">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={values.documentoId}
            onChange={(e) => setters.setDocumentoId(soloDigitosDocumentoId(e.target.value))}
            className={MODAL_FIELD_CLASS}
            placeholder="Opcional"
          />
        </ModalField>
        <ModalField label="Teléfono *">
          <input
            type="tel"
            name="telefono"
            required
            value={values.telefono}
            onChange={(e) => setters.setTelefono(e.target.value)}
            className={MODAL_FIELD_CLASS}
            placeholder="Celular o fijo"
            autoComplete="tel"
          />
        </ModalField>
        <ModalField label="Correo">
          <input
            type="email"
            name="email"
            value={values.email}
            onChange={(e) => setters.setEmail(e.target.value)}
            className={MODAL_FIELD_CLASS}
            placeholder="Opcional"
            autoComplete="email"
          />
        </ModalField>
        <ModalField label="Fecha de nacimiento">
          <DatePicker
            id="registroPersonaFechaNacimiento"
            name="fechaNacimiento"
            value={values.fechaNacimiento}
            onChange={setters.setFechaNacimiento}
            placeholder="Seleccionar fecha"
            variant="soft"
          />
        </ModalField>
        <ModalField label="Edad">
          <p className="rounded-xl border border-gray-200/60 bg-gray-50/80 px-3 py-2.5 text-sm text-gray-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-300">
            {edadLabel}
          </p>
        </ModalField>
        <ModalField label="Sexo">
          <select
            name="sexo"
            value={values.sexo}
            onChange={(e) => {
              const v = e.target.value;
              setters.setSexo(v === "masculino" || v === "femenino" ? v : "");
            }}
            className={MODAL_SELECT_CLASS}
            aria-label="Sexo"
          >
            <option value="">Sin registrar</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
          </select>
        </ModalField>
        <ModalField label="Estado civil">
          <select
            name="estadoCivil"
            value={values.estadoCivil}
            onChange={(e) => setters.setEstadoCivil(e.target.value)}
            className={MODAL_SELECT_CLASS}
          >
            <option value="">Sin registrar</option>
            {ESTADOS_CIVILES_REGISTRO.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField label="¿Tiene pareja?">
          <select
            name="tienePareja"
            value={values.tieneParejaTri}
            onChange={(e) => setters.setTieneParejaTri(e.target.value as "" | "true" | "false")}
            className={MODAL_SELECT_CLASS}
          >
            <option value="">Sin registrar</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </ModalField>
        {values.tieneParejaTri === "true" ? (
          <ModalField label="Nombre de la pareja">
            <input
              type="text"
              name="nombrePareja"
              value={values.nombrePareja}
              onChange={(e) => setters.setNombrePareja(e.target.value)}
              className={MODAL_FIELD_CLASS}
              placeholder="Opcional"
            />
          </ModalField>
        ) : null}
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Actividad, salud y ubicación</h3>
        <ModalField label="Situación laboral y de estudio">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={values.trabajaTri}
              onChange={(e) => setters.setTrabajaTri(e.target.value as "" | "true" | "false")}
              className={MODAL_SELECT_CLASS}
              aria-label="¿Trabaja actualmente?"
            >
              <option value="">Trabaja…</option>
              <option value="true">Trabaja: sí</option>
              <option value="false">Trabaja: no</option>
            </select>
            <select
              value={values.estudiaTri}
              onChange={(e) => setters.setEstudiaTri(e.target.value as "" | "true" | "false")}
              className={MODAL_SELECT_CLASS}
              aria-label="¿Estudia actualmente?"
            >
              <option value="">Estudia…</option>
              <option value="true">Estudia: sí</option>
              <option value="false">Estudia: no</option>
            </select>
          </div>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {labelSituacionLaboralEstudio(triToBoolDraft(values.trabajaTri), triToBoolDraft(values.estudiaTri))}
          </p>
        </ModalField>
        <ModalField label="Ocupación">
          <select
            name="ocupacion"
            value={values.ocupacion}
            onChange={(e) => setters.setOcupacion(e.target.value)}
            className={MODAL_SELECT_CLASS}
          >
            <option value="">Sin registrar</option>
            {values.ocupacion.trim() &&
            !(OCUPACIONES_REGISTRO as readonly string[]).includes(values.ocupacion.trim()) ? (
              <option value={values.ocupacion.trim()}>{values.ocupacion.trim()} (actual)</option>
            ) : null}
            {OCUPACIONES_REGISTRO.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField label="Salud" multiline>
          <textarea
            name="condicionSalud"
            value={values.condicionSalud}
            onChange={(e) => setters.setCondicionSalud(e.target.value)}
            rows={3}
            className={MODAL_TEXTAREA_CLASS}
            placeholder="Alergias, condiciones, etc. (opcional)"
          />
        </ModalField>
        <ModalField label="Contacto de emergencia" multiline>
          <div className="space-y-2">
            <input
              type="text"
              name="contactoEmergenciaNombre"
              value={values.contactoEmergenciaNombre}
              onChange={(e) => setters.setContactoEmergenciaNombre(e.target.value)}
              className={MODAL_FIELD_CLASS}
              placeholder="Nombre"
            />
            <input
              type="tel"
              name="contactoEmergenciaTelefono"
              value={values.contactoEmergenciaTelefono}
              onChange={(e) => setters.setContactoEmergenciaTelefono(e.target.value)}
              className={MODAL_FIELD_CLASS}
              placeholder="Teléfono"
            />
          </div>
        </ModalField>
        <ModalField label="Dirección" multiline>
          <textarea
            name="direccion"
            value={values.direccion}
            onChange={(e) => setters.setDireccion(e.target.value)}
            rows={2}
            className={MODAL_TEXTAREA_CLASS}
            placeholder="Opcional"
          />
        </ModalField>
      </section>
    </div>
  );
}

export function InformacionPersonalRegistroModal({
  isOpen,
  onClose,
  values,
  setters,
}: {
  isOpen: boolean;
  onClose: () => void;
  values: InformacionPersonalRegistroState;
  setters: InformacionPersonalRegistroSetters;
}) {
  const [mounted, setMounted] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setErrorLocal(null);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleGuardar = () => {
    if (!values.nombre.trim()) {
      setErrorLocal("El nombre es obligatorio.");
      return;
    }
    if (!values.telefono.trim()) {
      setErrorLocal("El teléfono es obligatorio.");
      return;
    }
    setErrorLocal(null);
    onClose();
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 min-h-[100dvh] w-full bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="relative z-[1] flex max-h-[min(92dvh,780px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-[#2a2a2a] dark:bg-[#1a1a1a]"
        role="dialog"
        aria-labelledby="informacion-personal-registro-title"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-[#2a2a2a]">
          <div className="min-w-0">
            <h2 id="informacion-personal-registro-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Información personal
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Datos de quien acaba de llegar. Solo nombre y teléfono son obligatorios; el resto puede quedar para después.
            </p>
            {errorLocal ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorLocal}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#252525] dark:hover:text-white"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <InformacionPersonalRegistroFields values={values} setters={setters} />
        </div>

        <div className="flex shrink-0 gap-2 border-t border-gray-100 px-5 py-4 dark:border-[#2a2a2a]">
          <button type="button" onClick={onClose} className={BTN_FICHA_SECUNDARIO_FLEX}>
            Cerrar
          </button>
          <button type="button" onClick={handleGuardar} className={BTN_FICHA_PRIMARIO_FLEX}>
            Listo, continuar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
