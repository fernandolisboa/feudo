import { RATE_TYPES } from "@feudo/core";
import { describe, expect, it } from "vitest";

import { rateTypeEnum } from "./schema";

describe("rate_type", () => {
  it("stores exactly the rate types the provider contract accepts", () => {
    expect(rateTypeEnum.enumValues).toEqual([...RATE_TYPES]);
  });
});
