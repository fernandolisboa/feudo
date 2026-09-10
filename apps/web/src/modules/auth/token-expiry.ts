// Single source of truth for every single-use link's lifetime: Better Auth
// options (options.ts) and the email copy that quotes these numbers to the
// recipient (email/*.ts) both read from here, so the two can never drift.
export const VERIFICATION_EXPIRES_IN_SECONDS = 60 * 60;
export const MAGIC_LINK_EXPIRES_IN_SECONDS = 60 * 5;
export const RESET_PASSWORD_EXPIRES_IN_SECONDS = 60 * 60;
export const INVITATION_EXPIRES_IN_SECONDS = 60 * 60 * 24;

// `t` (strings.ts) always resolves to the ptBR copy today (no locale switch
// yet), so only the phrase that copy needs exists here; add an `en` variant
// only once something actually renders the `en` block.
export function describeExpiryPtBR(seconds: number): string {
  if (seconds % 3600 === 0) {
    const hours = seconds / 3600;
    return hours === 1 ? "1 hora" : `${hours.toString()} horas`;
  }
  const minutes = Math.round(seconds / 60);
  return minutes === 1 ? "1 minuto" : `${minutes.toString()} minutos`;
}
