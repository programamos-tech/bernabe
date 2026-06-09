import type { SupabaseClient } from "@supabase/supabase-js";
import { soloDigitosDocumentoId } from "@/lib/documento-id";

export async function findPersonaIdForLider(
  supabase: SupabaseClient,
  organizationId: string,
  lider: { email?: string | null; cedula?: string | null },
): Promise<string | null> {
  const cedula = soloDigitosDocumentoId(lider.cedula ?? "").trim();
  const email = (lider.email ?? "").trim().toLowerCase();

  if (cedula.length >= 4) {
    const { data } = await supabase
      .from("personas")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("cedula", cedula)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  if (email.length > 3) {
    const { data: rows } = await supabase
      .from("personas")
      .select("id, email")
      .eq("organization_id", organizationId)
      .not("email", "is", null);
    const match = (rows ?? []).find((r) => (r.email as string).trim().toLowerCase() === email);
    if (match?.id) return match.id as string;
  }

  return null;
}

export async function linkLiderToPersona(
  supabase: SupabaseClient,
  liderId: string,
  personaId: string,
): Promise<{ error?: string }> {
  const { data: existing } = await supabase
    .from("lideres")
    .select("id")
    .eq("persona_id", personaId)
    .neq("id", liderId)
    .maybeSingle();
  if (existing?.id) {
    return { error: "Este miembro ya está vinculado a otro líder." };
  }

  const { error } = await supabase.from("lideres").update({ persona_id: personaId }).eq("id", liderId);
  if (error) return { error: error.message };

  await supabase.from("personas").update({ rol: "Líder" }).eq("id", personaId);
  return {};
}

export function personaDetailHref(personaId: string, liderId: string): string {
  return `/personas/${personaId}?lider=${liderId}`;
}
