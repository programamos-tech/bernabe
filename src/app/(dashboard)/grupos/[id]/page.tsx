import GrupoDetailClient from "./GrupoDetailClient";

/** Sin fetch en servidor: la ficha completa se resuelve en el cliente con una sola cadena de lecturas. */
export default function Page({ params }: { params: { id: string } }) {
  return <GrupoDetailClient grupoId={params.id} />;
}
