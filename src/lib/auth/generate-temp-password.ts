/**
 * Solo importar desde API routes (Node). No uses en middleware ni en el cliente.
 */
import { randomBytes } from "crypto";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Contraseña temporal legible para copiar por WhatsApp (sin caracteres ambiguos 0/O, l/I). */
export function generateTemporaryPassword(length = 18): string {
  const buf = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHARSET[buf[i]! % CHARSET.length];
  }
  return out;
}
