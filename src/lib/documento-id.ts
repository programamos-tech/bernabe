/** Conserva solo dígitos para el documento de identidad. */
export function soloDigitosDocumentoId(value: string): string {
  return value.replace(/\D/g, "");
}
