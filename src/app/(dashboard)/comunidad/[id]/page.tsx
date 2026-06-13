import { redirect } from "next/navigation";

/** Rutas antiguas de artículos mock → feed de victorias. */
export default function ComunidadLegacyRedirect() {
  redirect("/comunidad");
}
