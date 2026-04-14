import type { EtapaPersonaDb } from "@/lib/persona-etapa";
import type { PersonaSexo } from "@/lib/persona-sexo";
import type { PersonaGrupoResumen } from "./grupo-resumen-persona";
import type { ParticipacionEnGrupo, Rol } from "./persona-detail-participacion";

export interface NotaHistorialItem {
  id: string;
  contenido: string;
  creadoEn: string;
  autor: string;
}

/** Entrada de persona_historial que no es solo asistencia a reunión */
export interface RegistroSeguimientoItem {
  id: string;
  fecha: string;
  fechaDisplay: string;
  titulo: string;
  subtitulo: string | null;
  notas: string | null;
}

export interface Persona {
  id: string;
  cedula: string;
  nombre: string;
  telefono: string;
  email: string;
  fechaNacimientoIso: string | null;
  fechaNacimiento: string;
  edad: number | null;
  estadoCivil: string;
  ocupacion: string;
  direccion: string;
  grupo: string;
  grupoId: string | null;
  grupoImagen: string | null;
  grupoResumen: PersonaGrupoResumen | null;
  participacionEnGrupo: ParticipacionEnGrupo | null;
  rol: Rol;
  etapa: EtapaPersonaDb;
  fechaRegistro: string;
  ultimoContacto: string;
  fechaRegistroIso: string | null;
  ultimoContactoIso: string | null;
  fechaIngresoGrupoIso: string | null;
  fechaCaminoBautismoIso: string | null;
  fechaBautismoIso: string | null;
  lugarBautismo: string | null;
  coLiderDesdeIso: string | null;
  notasHistorial: NotaHistorialItem[];
  peticionesOracion: NotaHistorialItem[];
  registrosSeguimiento: RegistroSeguimientoItem[];
  bautizado: boolean | null;
  vieneDeOtraIglesia: boolean | null;
  nombreIglesiaAnterior: string | null;
  situacionAcercamiento: string | null;
  tienePareja: boolean | null;
  nombrePareja: string | null;
  trabajaActualmente: boolean | null;
  estudiaActualmente: boolean | null;
  condicionSalud: string | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
  sexo: PersonaSexo | null;
}

export type AuthInsertContext = {
  userId: string;
  organizationId: string;
  fullName: string;
};

export type PersistPersonalResult =
  | { ok: true }
  | { ok: false; message: string; code?: string };
