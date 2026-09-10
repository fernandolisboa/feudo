export type ResetPasswordFlowState = "form" | "link-removed" | "invalid";

export function resolveResetPasswordFlowState(
  token: string | undefined,
  wasInProgress: boolean,
): ResetPasswordFlowState {
  if (token) {
    return "form";
  }
  return wasInProgress ? "link-removed" : "invalid";
}
