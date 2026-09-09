export type TermsDecision = { accepted: true } | { accepted: false; reason: "terms_not_accepted" };

export function evaluateTermsAcceptance(checkboxAccepted: boolean): TermsDecision {
  return checkboxAccepted ? { accepted: true } : { accepted: false, reason: "terms_not_accepted" };
}
