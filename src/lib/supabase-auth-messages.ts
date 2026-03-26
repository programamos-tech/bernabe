/**
 * GoTrue/Supabase devuelve muchos mensajes en inglés. Mapeamos los más frecuentes al español.
 */
const SUPABASE_AUTH_ES: Record<string, string> = {
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "New password should be different from the old password.":
    "La nueva contraseña debe ser distinta a la anterior.",
};

export function translateSupabaseAuthMessage(message: string): string {
  const t = message.trim();
  if (SUPABASE_AUTH_ES[t]) return SUPABASE_AUTH_ES[t];
  const key = Object.keys(SUPABASE_AUTH_ES).find((k) => k.toLowerCase() === t.toLowerCase());
  if (key) return SUPABASE_AUTH_ES[key];
  return message;
}
