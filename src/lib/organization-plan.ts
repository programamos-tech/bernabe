export type OrganizationPlan = "leader_individual" | "church";

export const LEADER_INDIVIDUAL_MAX_PERSONAS = 50;
export const LEADER_INDIVIDUAL_MAX_GRUPOS = 3;

export function isLeaderIndividualPlan(plan: string | null | undefined): plan is "leader_individual" {
  return plan === "leader_individual";
}

export function parseOrganizationPlan(value: string | null | undefined): OrganizationPlan {
  return value === "leader_individual" ? "leader_individual" : "church";
}

const WA_IGLESIA_TEXT = "Hola, me interesa Bernabé para mi iglesia.";

/** URL de WhatsApp para contacto “iglesia”; configurable por entorno. */
export function whatsappIglesiaHref(): string {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_IGLESIA_URL?.trim();
  if (raw) return raw;
  const num = process.env.NEXT_PUBLIC_WHATSAPP_IGLESIA_NUMERO?.replace(/\D/g, "");
  const q = `text=${encodeURIComponent(WA_IGLESIA_TEXT)}`;
  if (num) return `https://wa.me/${num}?${q}`;
  return `https://wa.me/?${q}`;
}
