/**
 * GoTrue/Supabase devuelve muchos mensajes en inglés. Mapeamos los más frecuentes al español.
 */
const SUPABASE_AUTH_ES: Record<string, string> = {
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "New password should be different from the old password.":
    "La nueva contraseña debe ser distinta a la anterior.",
  "Auth session missing!":
    "No hay sesión activa. Si acabas de registrarte, confirma el enlace del correo e inicia sesión.",
  "Email signups are disabled":
    "Los registros por correo están desactivados en tu proyecto Supabase. Ve a Authentication → User Signups y activa «Allow new users to sign up», guarda, y vuelve a intentar.",
  "Anonymous sign-ins are disabled":
    "Los accesos anónimos están desactivados. En Supabase: Authentication → User Signups → activa «Allow anonymous sign-ins» y guarda.",
  "Signups not allowed for this instance":
    "Los registros de nuevas cuentas están desactivados. En Supabase: Authentication → Sign In / Providers → User Signups → activa «Allow new users to sign up» y pulsa «Save changes».",
};

export function translateSupabaseAuthMessage(message: string): string {
  const t = message.trim();
  if (SUPABASE_AUTH_ES[t]) return SUPABASE_AUTH_ES[t];
  const key = Object.keys(SUPABASE_AUTH_ES).find((k) => k.toLowerCase() === t.toLowerCase());
  if (key) return SUPABASE_AUTH_ES[key];
  return message;
}
