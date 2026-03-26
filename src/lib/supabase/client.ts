import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase en el navegador.
 * No pasamos `cookies` personalizados: `@supabase/ssr` usa `cookie` (parse/serialize)
 * y respeta cookies partidas (chunks) y atributos; un setAll manual rompía sesión/JWT.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
