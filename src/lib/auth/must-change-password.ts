/** Sin dependencias de Node: usable en middleware / Edge. */
export function mustChangePasswordFromMetadata(meta: unknown): boolean {
  if (!meta || typeof meta !== "object") return false;
  const v = (meta as Record<string, unknown>).must_change_password;
  return v === true;
}

/** Normaliza valor que puede venir de PostgREST/JSON (boolean, string, número). */
export function normalizeProfileMustChange(v: unknown): boolean | null | undefined {
  if (v === true || v === "true" || v === 1) return true;
  if (v === false || v === "false" || v === 0) return false;
  if (v === null || v === undefined) return undefined;
  return undefined;
}

/** Tras UPDATE a false en BD (PostgREST a veces devuelve tipos raros). */
export function isProfileMustChangeCleared(v: unknown): boolean {
  return normalizeProfileMustChange(v) === false;
}

/**
 * `profiles.must_change_password`: false = ya puede usar la app (aunque el JWT vaya desfasado).
 * true = debe ir a primer acceso. null/undefined = legado: mirar solo app_metadata de Auth.
 */
export function needsPrimerAcceso(profileMustChange: unknown, appMetadata: unknown): boolean {
  const p = normalizeProfileMustChange(profileMustChange);
  if (p === false) return false;
  if (p === true) return true;
  return mustChangePasswordFromMetadata(appMetadata);
}
