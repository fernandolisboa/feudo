import { describe, expect, it } from "vitest";

import type { AccountDeletionHousehold } from "./service";
import { summarizeHouseholdForDeletion } from "./summarize-household";

const casa: AccountDeletionHousehold = {
  householdId: "casa",
  householdName: "Casa Lisboa",
  timeZone: "America/Sao_Paulo",
  role: "owner",
  deletesHousehold: false,
  alreadyPendingDeletion: false,
  successorName: "Bia",
  otherMembers: [{ name: "Bia", email: "bia@example.com" }],
  accounts: 2,
  months: ["2025-11", "2025-12", "2026-01", "2026-03"],
};

describe("summarizeHouseholdForDeletion", () => {
  it("names the months the household loses and who becomes the owner", () => {
    expect(summarizeHouseholdForDeletion(casa)).toEqual({
      name: "Casa Lisboa",
      lines: [
        "Casa Lisboa perde as transações de novembro de 2025 a janeiro de 2026 e março de 2026.",
        "Bia passa a ser o responsável.",
      ],
    });
  });

  it("says when the household goes too because nobody else is in it", () => {
    const solo = {
      ...casa,
      successorName: null,
      deletesHousehold: true,
      otherMembers: [],
      accounts: 0,
      months: [],
    };

    expect(summarizeHouseholdForDeletion(solo).lines).toEqual([
      "Casa Lisboa não tem contas suas, então não perde dados.",
      "Você é o único membro, então a casa também é apagada.",
    ]);
  });

  it("says when the user's accounts have no transactions to lose", () => {
    expect(
      summarizeHouseholdForDeletion({ ...casa, role: "member", successorName: null, months: [] })
        .lines,
    ).toEqual(["Casa Lisboa perde as contas que você conectou, que não têm transações."]);
  });

  it("says a household already pending deletion goes with the user", () => {
    expect(
      summarizeHouseholdForDeletion({
        ...casa,
        alreadyPendingDeletion: true,
        deletesHousehold: true,
        successorName: null,
        otherMembers: [],
      }).lines,
    ).toEqual([
      "Casa Lisboa já está com exclusão agendada e é apagada junto com seu cadastro, já que ninguém mais pode restaurá-la.",
    ]);
  });
});
