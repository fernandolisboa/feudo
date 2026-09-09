export type SessionForRouting = { householdId: string | null } | null;

export type RedirectTarget = string | null;

const SIGN_IN_ROUTE = "/entrar";
const ONBOARDING_ROUTE = "/comecar";
const OVERVIEW_ROUTE = "/";

export function resolveAppRoute(session: SessionForRouting): RedirectTarget {
  if (!session) {
    return SIGN_IN_ROUTE;
  }
  if (!session.householdId) {
    return ONBOARDING_ROUTE;
  }
  return null;
}

export function resolveOnboardingRoute(session: SessionForRouting): RedirectTarget {
  if (!session) {
    return SIGN_IN_ROUTE;
  }
  if (session.householdId) {
    return OVERVIEW_ROUTE;
  }
  return null;
}
