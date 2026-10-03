export type SuccessionCandidate = {
  id: string;
  role: "admin" | "member";
  joinedAt: Date;
  leaving: boolean;
};

const ROLE_PRIORITY: Record<SuccessionCandidate["role"], number> = { admin: 0, member: 1 };

function compareCandidates(a: SuccessionCandidate, b: SuccessionCandidate): number {
  return (
    Number(a.leaving) - Number(b.leaving) ||
    ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role] ||
    a.joinedAt.getTime() - b.joinedAt.getTime() ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

// ADR-0001: the oldest admin, else the oldest member. Someone whose own
// account deletion is also pending only inherits when nobody else is left.
export function pickSuccessor<T extends SuccessionCandidate>(candidates: readonly T[]): T | null {
  return [...candidates].sort(compareCandidates)[0] ?? null;
}
