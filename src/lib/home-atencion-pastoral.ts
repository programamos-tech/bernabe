import { buildCumpleanosEstaSemana, type PersonaCumpleRow } from "@/lib/cumpleanos-comunidad";
import { diasDesde, necesitaSeguimiento } from "@/lib/dashboard-notifications";
import { createClient } from "@/lib/supabase/client";

export type HomeCumpleItem = {
  id: string;
  nombre: string;
  etiqueta: string;
};

export type HomeSeguimientoItem = {
  id: string;
  nombre: string;
  descripcion: string;
};

export type HomeAtencionPastoralData = {
  cumpleanos: HomeCumpleItem[];
  seguimientos: HomeSeguimientoItem[];
};

export async function fetchHomeAtencionPastoral(limit = 6): Promise<HomeAtencionPastoralData> {
  const supabase = createClient();
  const hoy = new Date();

  const [cumplesRes, seguimientoRes] = await Promise.all([
    supabase.from("personas").select("id, nombre, fecha_nacimiento").not("fecha_nacimiento", "is", null),
    supabase
      .from("personas")
      .select("id, nombre, ultimo_contacto")
      .order("ultimo_contacto", { ascending: true, nullsFirst: true })
      .limit(60),
  ]);

  const cumpleanos = buildCumpleanosEstaSemana((cumplesRes.data ?? []) as PersonaCumpleRow[], hoy)
    .slice(0, limit)
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      etiqueta: c.etiqueta,
    }));

  const seguimientos = (seguimientoRes.data ?? [])
    .filter((p) => necesitaSeguimiento(p.ultimo_contacto))
    .slice(0, limit)
    .map((p) => {
      const dias = diasDesde(p.ultimo_contacto);
      const descripcion =
        dias === null ? "Sin contacto registrado" : `Sin contacto hace ${dias} días`;
      return {
        id: p.id as string,
        nombre: (p.nombre as string) ?? "Persona",
        descripcion,
      };
    });

  return { cumpleanos, seguimientos };
}
