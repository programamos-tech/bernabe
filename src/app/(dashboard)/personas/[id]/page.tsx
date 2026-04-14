import PersonaDetailClient from "./PersonaDetailClient";

/** Sin fetch en servidor: evita una ida a Supabase en serie antes de hidratar (el cliente ya carga la ficha). */
export default function Page({ params }: { params: { id: string } }) {
  return <PersonaDetailClient personaId={params.id} />;
}
