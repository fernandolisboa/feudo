import { describe, expect, it } from "vitest";

import type { Database } from "@/db/client";
import type { HouseholdSession } from "./require-household-session";
import { transferOwnership } from "./membership";

type MemberRow = { id: string; userId: string; role: string };

// Mirrors exactly the chain transferOwnership calls inside its transaction
// (select … from member … where … for("update"), then update … set … where
// … returning(...) twice): a fake tx good enough to drive the row-count
// assertions without a real database.
function buildTx(members: MemberRow[], updateResults: { id: string }[][]) {
  let updateCallIndex = 0;

  const selectChain = {
    from: () => selectChain,
    where: () => selectChain,
    for: () => Promise.resolve(members),
  };

  const updateChain = {
    set: () => updateChain,
    where: () => updateChain,
    returning: () => {
      const result = updateResults[updateCallIndex] ?? [];
      updateCallIndex += 1;
      return Promise.resolve(result);
    },
  };

  return {
    select: () => selectChain,
    update: () => updateChain,
  };
}

function buildDb(members: MemberRow[], updateResults: { id: string }[][]): Database {
  return {
    transaction: (fn: (tx: unknown) => Promise<void>) => fn(buildTx(members, updateResults)),
  } as unknown as Database;
}

const session: HouseholdSession = {
  userId: "owner-user",
  name: "Owner",
  email: "owner@example.com",
  householdId: "household-1",
  theme: "caderno",
};

const members: MemberRow[] = [
  { id: "member-owner", userId: "owner-user", role: "owner" },
  { id: "member-target", userId: "target-user", role: "admin" },
];

describe("transferOwnership row-count assertions", () => {
  it("fails instead of promoting anyone when the demote update matches zero rows", async () => {
    const db = buildDb(members, [[]]);

    const outcome = await transferOwnership("member-target", session, db);

    expect(outcome.status).toBe("failed");
  });

  it("fails after a successful demote when the promote update matches zero rows", async () => {
    const db = buildDb(members, [[{ id: "member-owner" }], []]);

    const outcome = await transferOwnership("member-target", session, db);

    expect(outcome.status).toBe("failed");
  });

  it("succeeds when both updates match exactly one row", async () => {
    const db = buildDb(members, [[{ id: "member-owner" }], [{ id: "member-target" }]]);

    const outcome = await transferOwnership("member-target", session, db);

    expect(outcome.status).toBe("ok");
  });
});
