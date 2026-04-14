/**
 * Barrel para la ficha persona: selects, resumen de grupo, etiquetas de seguimiento y participación.
 */
export { PERSONA_DETALLE_GRUPOS_JOIN } from "./persona-detail-selects";
export {
  buildGrupoResumenFromJoin,
  type GrupoJoinNested,
  type PersonaGrupoResumen,
} from "../_lib/grupo-resumen-persona";
export {
  labelParticipacionEnGrupo,
  type ParticipacionEnGrupo,
  type Rol,
} from "../_lib/persona-detail-participacion";
export {
  resultadoSeguimientoLabelsCorto,
  tipoSeguimientoLabelsCorto,
  type SeguimientoSavePayload,
} from "../_lib/persona-seguimiento-labels";
