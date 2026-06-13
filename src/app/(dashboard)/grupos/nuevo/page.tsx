"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GrupoAvatarCluster } from "@/components/GrupoAvatarCluster";
import { UserAvatar } from "@/components/UserAvatar";
import { TimePicker } from "@/components/ui/TimePicker";
import { useDashboardOrgPlan } from "@/contexts/DashboardOrgPlanContext";
import { createClient } from "@/lib/supabase/client";
import { fechaHoyYYYYMMDD } from "@/lib/fecha-hoy-local";
import { tipoLabelGrupo } from "@/lib/grupo-tipo";
import { ETAPA_LABELS, parseEtapaDb } from "@/lib/persona-etapa";
import { parsePersonaSexo } from "@/lib/persona-sexo";
import { isLeaderIndividualPlan, LEADER_INDIVIDUAL_MAX_GRUPOS } from "@/lib/organization-plan";
import { BTN_FICHA_PRIMARIO } from "@/app/(dashboard)/personas/[id]/_lib/persona-detail-buttons";

type TipoGrupo = "parejas" | "jovenes" | "teens" | "hombres" | "mujeres" | "general";

const tiposGrupo: { value: TipoGrupo; label: string }[] = [
  { value: "parejas", label: "Parejas" },
  { value: "jovenes", label: "Jóvenes" },
  { value: "teens", label: "Teens / Adolescentes" },
  { value: "hombres", label: "Hombres" },
  { value: "mujeres", label: "Mujeres" },
  { value: "general", label: "General / Mixto" },
];

const diasSemana = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábados",
  "Domingos",
];

const GRUPO_FORM_CONTROL_CLASS =
  "w-full min-w-0 rounded-xl border border-gray-200/80 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300/40 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-white/30 dark:focus:ring-white/15 dark:[color-scheme:dark]";

interface PersonaSinGrupo {
  id: string;
  nombre: string;
  sexo: string | null;
  etapa: string | null;
}

async function resolveLiderIdPropio(supabase: ReturnType<typeof createClient>, userId: string): Promise<string | null> {
  const { data: propio } = await supabase
    .from("lideres")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (propio?.id) return propio.id as string;

  const { data: prof } = await supabase
    .from("profiles")
    .select("organization_id, full_name")
    .eq("id", userId)
    .maybeSingle();
  if (!prof?.organization_id) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("onboarding_user_id, pastor_name")
    .eq("id", prof.organization_id)
    .maybeSingle();
  if (org?.onboarding_user_id !== userId) return null;

  const { data: lideresOrg } = await supabase
    .from("lideres")
    .select("id, nombre")
    .eq("organization_id", prof.organization_id);

  const rows = (lideresOrg ?? []) as { id: string; nombre: string }[];
  const porNombre =
    rows.find(
      (l) =>
        prof.full_name?.trim() &&
        l.nombre.trim().toLowerCase() === prof.full_name.trim().toLowerCase(),
    ) ??
    rows.find(
      (l) =>
        org.pastor_name?.trim() &&
        l.nombre.trim().toLowerCase() === org.pastor_name.trim().toLowerCase(),
    );
  return porNombre?.id ?? null;
}

export default function Page() {
  const orgPlan = useDashboardOrgPlan();
  const leaderFree = isLeaderIndividualPlan(orgPlan);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gruposCount, setGruposCount] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoGrupo>("general");
  const [hora, setHora] = useState<string | null>(null);
  const [liderIdPropio, setLiderIdPropio] = useState<string | null>(null);
  const [personasSinGrupo, setPersonasSinGrupo] = useState<PersonaSinGrupo[]>([]);
  const [personasLoading, setPersonasLoading] = useState(true);
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState<string[]>([]);
  const [busquedaPersonas, setBusquedaPersonas] = useState("");

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const liderId = await resolveLiderIdPropio(supabase, user.id);
        setLiderIdPropio(liderId);
      }

      setPersonasLoading(true);
      const { data: personasData, error: personasErr } = await supabase
        .from("personas")
        .select("id, nombre, sexo, etapa")
        .is("grupo_id", null)
        .order("nombre");

      if (!personasErr) {
        setPersonasSinGrupo((personasData as PersonaSinGrupo[]) ?? []);
      }
      setPersonasLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!leaderFree) return;
    const supabase = createClient();
    void supabase
      .from("grupos")
      .select("id", { count: "exact", head: true })
      .then(({ count, error: countErr }) => {
        if (!countErr) setGruposCount(count ?? 0);
      });
  }, [leaderFree]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const nombreVal = (formData.get("nombre") as string)?.trim();
    const descripcionVal = (formData.get("descripcion") as string)?.trim() || null;
    const diaVal = (formData.get("dia") as string)?.trim() || null;
    const ubicacionVal = (formData.get("ubicacion") as string)?.trim() || null;

    if (!nombreVal) {
      setError("El nombre del grupo es obligatorio.");
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        setError("Debes iniciar sesión para crear un grupo.");
        setIsSubmitting(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
      const organizationId = profile?.organization_id;
      if (!organizationId) {
        setError("Completa el onboarding para configurar tu espacio de líder.");
        setIsSubmitting(false);
        return;
      }

      if (leaderFree) {
        const { count, error: cErr } = await supabase.from("grupos").select("id", { count: "exact", head: true });
        if (cErr) throw cErr;
        const n = count ?? 0;
        setGruposCount(n);
        if (n >= LEADER_INDIVIDUAL_MAX_GRUPOS) {
          setError(
            `En el plan gratuito de líder puedes crear hasta ${LEADER_INDIVIDUAL_MAX_GRUPOS} grupos. Para más capacidad, escríbenos por WhatsApp.`,
          );
          setIsSubmitting(false);
          return;
        }
      }

      const { data: nuevoGrupo, error: insertErr } = await supabase
        .from("grupos")
        .insert({
          organization_id: organizationId,
          nombre: nombreVal,
          tipo,
          descripcion: descripcionVal,
          dia: diaVal,
          hora: hora || null,
          ubicacion: ubicacionVal,
          imagen: null,
          lider_id: liderIdPropio,
          activo: true,
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      if (nuevoGrupo?.id && personasSeleccionadas.length > 0) {
        const hoy = fechaHoyYYYYMMDD();
        const { error: assignErr } = await supabase
          .from("personas")
          .update({
            grupo_id: nuevoGrupo.id,
            etapa: "nuevo_creyente",
            participacion_en_grupo: "miembro",
            fecha_ingreso_grupo: hoy,
            co_lider_desde: null,
          })
          .in("id", personasSeleccionadas)
          .is("grupo_id", null);

        if (assignErr) throw assignErr;
      }

      router.push(nuevoGrupo?.id ? `/grupos/${nuevoGrupo.id}` : "/grupos");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el grupo. Intenta de nuevo.");
      setIsSubmitting(false);
    }
  };

  const atGrupoCap = leaderFree && gruposCount !== null && gruposCount >= LEADER_INDIVIDUAL_MAX_GRUPOS;
  const nombreDisplay = nombre.trim() || "Nombre del grupo";

  const personasFiltradas = useMemo(() => {
    const q = busquedaPersonas.trim().toLowerCase();
    if (!q) return personasSinGrupo;
    return personasSinGrupo.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [busquedaPersonas, personasSinGrupo]);

  const togglePersona = (personaId: string) => {
    setPersonasSeleccionadas((prev) =>
      prev.includes(personaId) ? prev.filter((id) => id !== personaId) : [...prev, personaId],
    );
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)]">
      <div className="relative mb-5 rounded-3xl bg-gray-100/50 p-5 dark:bg-white/[0.04] md:p-6">
        <Link
          href="/grupos"
          className="absolute right-4 top-4 rounded-full p-2.5 text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
          title="Volver a grupos"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>

        <div className="flex flex-col gap-5 pr-12 sm:flex-row sm:items-center">
          <div className="shrink-0">
            <GrupoAvatarCluster nombreGrupo={nombreDisplay} sizeCenter={80} sizeSide={48} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-gray-700 shadow-sm shadow-black/[0.04] dark:bg-white/10 dark:text-gray-300 dark:shadow-none">
                {tipoLabelGrupo(tipo)}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80 dark:bg-emerald-400/55" />
                Nuevo grupo
              </span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-2xl">
              {nombreDisplay}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Define la información básica, el horario de reunión y agrega personas si ya las tienes registradas.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error ? (
          <div className="mb-6 rounded-2xl bg-red-50/90 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-gray-200/50 bg-gray-50/40 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Información del grupo</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Nombre, tipo y una breve descripción para identificarlo en la lista.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-1.5">
                  <label htmlFor="grupo-nombre" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Nombre del grupo <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="grupo-nombre"
                    type="text"
                    name="nombre"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Jóvenes Adultos"
                    className={GRUPO_FORM_CONTROL_CLASS}
                    autoComplete="off"
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label htmlFor="grupo-tipo" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Tipo de grupo <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="grupo-tipo"
                    name="tipo"
                    required
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoGrupo)}
                    className={GRUPO_FORM_CONTROL_CLASS}
                  >
                    {tiposGrupo.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="grupo-desc" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Descripción
                  </label>
                  <textarea
                    id="grupo-desc"
                    name="descripcion"
                    rows={3}
                    placeholder="Ej: Jóvenes adultos de 18 a 30 años creciendo en fe"
                    className={`${GRUPO_FORM_CONTROL_CLASS} min-h-[5rem] resize-y leading-relaxed`}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/50 bg-gray-50/40 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Horario y ubicación</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Día, hora y lugar donde se reúne el grupo habitualmente.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="grupo-dia" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Día de reunión <span className="text-red-500">*</span>
                  </label>
                  <select id="grupo-dia" name="dia" required className={GRUPO_FORM_CONTROL_CLASS}>
                    <option value="">Seleccionar día…</option>
                    {diasSemana.map((dia) => (
                      <option key={dia} value={dia}>
                        {dia}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Hora <span className="text-red-500">*</span>
                  </span>
                  <TimePicker id="grupo-hora" name="hora" value={hora} onChange={setHora} placeholder="Seleccionar hora" />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="grupo-ubic" className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Ubicación <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="grupo-ubic"
                    type="text"
                    name="ubicacion"
                    required
                    placeholder="Ej: Salón principal, Auditorio juvenil, Casa del líder"
                    className={GRUPO_FORM_CONTROL_CLASS}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200/50 bg-gray-50/40 p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Personas en el grupo
                  </h3>
                  <p className="mt-1 text-xs leading-snug text-gray-500 dark:text-gray-500">
                    Opcional. Solo aparecen quienes aún no tienen grupo. Tú quedarás como líder al crearlo.
                  </p>
                </div>
                {personasSeleccionadas.length > 0 ? (
                  <span className="rounded-full bg-gray-900/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-gray-800 dark:bg-white/10 dark:text-gray-200">
                    {personasSeleccionadas.length} seleccionada{personasSeleccionadas.length === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>

              <div className="mt-4">
                <label htmlFor="buscar-personas-grupo" className="sr-only">
                  Buscar personas
                </label>
                <input
                  id="buscar-personas-grupo"
                  type="search"
                  value={busquedaPersonas}
                  onChange={(e) => setBusquedaPersonas(e.target.value)}
                  placeholder="Buscar por nombre…"
                  className={GRUPO_FORM_CONTROL_CLASS}
                  autoComplete="off"
                />
              </div>

              <div className="mt-3 max-h-[min(28rem,55vh)] space-y-2 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
                {personasLoading ? (
                  <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">Cargando personas…</p>
                ) : personasFiltradas.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300/70 bg-white/50 px-4 py-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {personasSinGrupo.length === 0
                        ? "No hay personas sin grupo todavía."
                        : "Ninguna persona coincide con la búsqueda."}
                    </p>
                    {personasSinGrupo.length === 0 ? (
                      <Link
                        href="/personas/nuevo"
                        className="mt-3 inline-block text-sm font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white"
                      >
                        Registrar persona
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  personasFiltradas.map((persona) => {
                    const selected = personasSeleccionadas.includes(persona.id);
                    const etapaLabel = ETAPA_LABELS[parseEtapaDb(persona.etapa)];
                    return (
                      <button
                        key={persona.id}
                        type="button"
                        role="checkbox"
                        aria-checked={selected}
                        onClick={() => togglePersona(persona.id)}
                        className={`relative flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 pr-12 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-neutral-400 dark:focus-visible:ring-offset-[#0c0c0c] ${
                          selected
                            ? "border-neutral-400 bg-white/80 shadow-[0_0_0_1px_rgba(115,115,115,0.35)] dark:border-neutral-500 dark:bg-white/[0.06]"
                            : "border-gray-200/60 bg-white/60 hover:border-gray-300/80 hover:bg-white/80 dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                        }`}
                      >
                        <UserAvatar seed={persona.nombre} sexo={parsePersonaSexo(persona.sexo)} size={32} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{persona.nombre}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{etapaLabel}</p>
                        </div>
                        <span
                          aria-hidden
                          className={`absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition ${
                            selected
                              ? "bg-neutral-600 text-white shadow-md dark:bg-neutral-500"
                              : "border border-gray-300/80 bg-white/60 dark:border-white/20 dark:bg-white/[0.04]"
                          }`}
                        >
                          {selected ? (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/50 bg-gray-50/50 p-5 dark:bg-white/[0.05]">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200/80 dark:bg-white/[0.1]">
                  <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">El grupo se creará activo</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Tú serás el líder. Las personas que elijas entrarán al núcleo; luego podrás agregar más desde la ficha.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/50 bg-gray-50/40 p-6 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting || atGrupoCap}
                  className={`flex w-full items-center justify-center gap-2 !rounded-full px-6 py-3 ${BTN_FICHA_PRIMARIO}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creando grupo…
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Crear grupo
                    </>
                  )}
                </button>
                <Link
                  href="/grupos"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300/70 px-6 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-200/50 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/[0.08]"
                >
                  Cancelar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
