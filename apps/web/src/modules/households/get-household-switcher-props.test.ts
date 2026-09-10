import { beforeEach, describe, expect, it, vi } from "vitest";

const listHouseholdsMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({ headers: () => Promise.resolve(new Headers()) }));
vi.mock("./service", () => ({ listHouseholds: listHouseholdsMock }));

import { getHouseholdSwitcherProps } from "./get-household-switcher-props";

beforeEach(() => {
  listHouseholdsMock.mockReset();
});

describe("getHouseholdSwitcherProps", () => {
  it("fetches the household list exactly once and returns it with the active household id", async () => {
    listHouseholdsMock.mockResolvedValue([
      { id: "household-a", name: "Casa A" },
      { id: "household-b", name: "Casa B" },
    ]);

    const result = await getHouseholdSwitcherProps("household-a");

    expect(listHouseholdsMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      households: [
        { id: "household-a", name: "Casa A" },
        { id: "household-b", name: "Casa B" },
      ],
      activeHouseholdId: "household-a",
    });
  });

  it("returns null when the user has no households", async () => {
    listHouseholdsMock.mockResolvedValue([]);

    const result = await getHouseholdSwitcherProps("household-a");

    expect(result).toBeNull();
  });
});
