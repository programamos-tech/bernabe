/** Valores almacenados en personas.situacion_acercamiento */
export type SituacionAcercamiento =
  | "primera_vez_fe"
  | "otra_iglesia"
  | "retorno"
  | "no_indica";

export const SITUACION_ACERCAMIENTO_OPTIONS: { value: SituacionAcercamiento; label: string }[] = [
  { value: "primera_vez_fe", label: "Primera vez / nuevo en la fe" },
  { value: "otra_iglesia", label: "Viene de otra iglesia" },
  { value: "retorno", label: "Retorno (estuvo alejado un tiempo)" },
  { value: "no_indica", label: "Prefiero no indicar / no aplica" },
];

export function labelSituacionAcercamiento(value: string | null | undefined): string {
  if (!value) return "";
  const found = SITUACION_ACERCAMIENTO_OPTIONS.find((o) => o.value === value);
  return found?.label ?? value;
}

export function parseTriBoolForm(value: FormDataEntryValue | null): boolean | null {
  if (value === "" || value == null) return null;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function labelTriBool(value: boolean | null | undefined): string {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return "Sin registrar";
}
