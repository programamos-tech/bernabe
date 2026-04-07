import { createClient } from "@/lib/supabase/client";

/**
 * Cliente: si no hay sesión, navega a /register y devuelve false.
 * Si hay usuario, devuelve true para continuar con la acción.
 */
export async function ensureAuthenticatedOrRedirectToRegister(push: (href: string) => void): Promise<boolean> {
  const { data: { user } } = await createClient().auth.getUser();
  if (user) return true;
  push("/register");
  return false;
}
