const MAX_CAUSE_CHAIN_DEPTH = 5;

function hasStringCode(value: unknown): value is { code: string } {
  return (
    typeof value === "object" && value !== null && "code" in value && typeof value.code === "string"
  );
}

function hasCause(value: unknown): value is { cause: unknown } {
  return typeof value === "object" && value !== null && "cause" in value;
}

// Postgres error codes surface wrapped in DrizzleQueryError.cause (and
// possibly nested further), never as .code on the error a catch receives
// directly, so every caller needs to walk .cause the same way.
export function findSqlState(error: unknown): string | undefined {
  let current = error;
  for (let depth = 0; depth < MAX_CAUSE_CHAIN_DEPTH; depth += 1) {
    if (hasStringCode(current)) {
      return current.code;
    }
    if (!hasCause(current)) {
      return undefined;
    }
    current = current.cause;
  }
  return undefined;
}

export function hasSqlState(error: unknown, code: string): boolean {
  return findSqlState(error) === code;
}
