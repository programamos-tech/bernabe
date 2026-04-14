/** Fragmento de `select` reutilizado al cargar la ficha de persona (join a grupo). */
export const PERSONA_DETALLE_GRUPOS_JOIN =
  "grupos(id, nombre, descripcion, tipo, miembros_count, lider_id, dia, hora, ubicacion, imagen, activo, lideres(nombre))";
