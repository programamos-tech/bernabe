import PersonaDetailClient from "./PersonaDetailClient";

/** Sin fetch en servidor: evita una ida a Supabase en serie antes de hidratar (el cliente ya carga la ficha). */
export default function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { lider?: string; promover?: string };
}) {
  return (
    <PersonaDetailClient
      personaId={params.id}
      liderIdHint={searchParams?.lider}
      promoverLider={searchParams?.promover === "1" || searchParams?.promover === "lider"}
    />
  );
}
