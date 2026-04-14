/** Tipos de seguimiento (modal + historial / inserts). */
export type TipoSeguimientoVisitante = "mensaje" | "llamada" | "visita";
export type ResultadoSeguimientoVisitante =
  | "contesto"
  | "no_contesto"
  | "volvera"
  | "no_volvera"
  | "interesado"
  | "otro";

export type TipoSeguimientoActivo = "mensaje" | "llamada" | "encuentro";
export type ResultadoSeguimientoActivo =
  | "bien_grupo"
  | "dificultades"
  | "apoyo_pastoral"
  | "camino_proceso"
  | "pendiente_contacto"
  | "otro";

export type SeguimientoSavePayload =
  | {
      perfil: "visitante";
      tipo: TipoSeguimientoVisitante;
      resultado: ResultadoSeguimientoVisitante;
      notas: string;
    }
  | {
      perfil: "activo";
      tipo: TipoSeguimientoActivo;
      resultado: ResultadoSeguimientoActivo;
      notas: string;
    };

/** Etiquetas cortas para timeline / resumen en persona_historial */
export const tipoSeguimientoLabelsCorto: Record<string, string> = {
  mensaje: "Le escribí",
  llamada: "Lo llamé",
  visita: "Lo visité",
  encuentro: "Café o encuentro",
};

export const resultadoSeguimientoLabelsCorto: Record<string, string> = {
  contesto: "Contestó / Respondió",
  no_contesto: "No contestó / No respondió",
  volvera: "Dijo que volverá",
  no_volvera: "No va a volver",
  interesado: "Interesado en un grupo",
  otro: "Otro",
  bien_grupo: "Va bien / integrado al grupo",
  dificultades: "Compartió dificultades o problemas",
  apoyo_pastoral: "Necesita apoyo, consejería u oración",
  camino_proceso: "Hablamos de su proceso en la iglesia",
  pendiente_contacto: "Quedó pendiente otro contacto",
};
