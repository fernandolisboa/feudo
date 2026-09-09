export type RegistrationMode = "open" | "invite" | "closed";

export type RegistrationRefusalReason = "registration_closed" | "invite_required";

export type RegistrationDecision =
  { allowed: true } | { allowed: false; reason: RegistrationRefusalReason };

export function evaluateRegistrationMode(
  mode: RegistrationMode,
  hasPendingInvite: boolean,
): RegistrationDecision {
  switch (mode) {
    case "open":
      return { allowed: true };
    case "closed":
      return { allowed: false, reason: "registration_closed" };
    case "invite":
      return hasPendingInvite ? { allowed: true } : { allowed: false, reason: "invite_required" };
  }
}
