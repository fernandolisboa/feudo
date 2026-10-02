import { describe, expect, it } from "vitest";

import { formatMoney } from "../money/money";
import { extractNumberTokens } from "./numbers";

describe("extractNumberTokens", () => {
  it("canonicalizes a thousand-separated amount with decimals", () => {
    expect(extractNumberTokens("1.234,56")).toEqual(["1234.56"]);
  });

  it("canonicalizes a trailing decimal zero", () => {
    expect(extractNumberTokens("4,60")).toEqual(["4.6"]);
  });

  it("canonicalizes a large thousand-separated amount with a zero decimal", () => {
    expect(extractNumberTokens("250.000,00")).toEqual(["250000"]);
  });

  it("strips a leading zero from a plain integer", () => {
    expect(extractNumberTokens("02")).toEqual(["2"]);
  });

  it("keeps a single zero for a decimal under one", () => {
    expect(extractNumberTokens("0,5")).toEqual(["0.5"]);
  });

  it("strips every leading zero down to the first significant digit", () => {
    expect(extractNumberTokens("007")).toEqual(["7"]);
  });

  it("splits a dot not followed by exactly three digits into two tokens", () => {
    expect(extractNumberTokens("4.6")).toEqual(["4", "6"]);
  });

  it("splits a date into its three numeric components", () => {
    expect(extractNumberTokens("02/09/2026")).toEqual(["2", "9", "2026"]);
  });

  it("splits a number glued to letters at the letter boundary", () => {
    expect(extractNumberTokens("IPCA+6")).toEqual(["6"]);
  });

  it("formats a currency amount from formatMoney as a single canonical token", () => {
    expect(extractNumberTokens(formatMoney({ amountCentavos: 123456, currency: "BRL" }))).toEqual([
      "1234.56",
    ]);
  });

  it("formats a currency amount using the thin or non-breaking space Intl may insert", () => {
    const formatted = formatMoney({ amountCentavos: 360000000, currency: "BRL" });
    expect(extractNumberTokens(formatted)).toEqual(["3600000"]);
  });

  it("keeps the sign of a negative amount, with or without a space after R$", () => {
    expect(extractNumberTokens("-R$ 1.234,56")).toEqual(["-1234.56"]);
    expect(extractNumberTokens(formatMoney({ amountCentavos: -123456, currency: "BRL" }))).toEqual([
      "-1234.56",
    ]);
  });

  it("keeps the sign of a negative percentage, hyphen or minus sign alike", () => {
    expect(extractNumberTokens("-12,5%")).toEqual(["-12.5"]);
    expect(extractNumberTokens("\u221212,5%")).toEqual(["-12.5"]);
  });

  it("reads a hyphen inside a date or range as a separator, not a sign", () => {
    expect(extractNumberTokens("2026-09 e 1-3")).toEqual(["2026", "9", "1", "3"]);
  });

  it("reads a hyphen spaced from the number as punctuation", () => {
    expect(extractNumberTokens("renda - R$ 5,00")).toEqual(["5"]);
  });

  it("drops the sign of a negative zero", () => {
    expect(extractNumberTokens("-0,0%")).toEqual(["0"]);
  });

  it("canonicalizes a percentage", () => {
    expect(extractNumberTokens("4,6%")).toEqual(["4.6"]);
  });

  it("canonicalizes a whole-number percentage", () => {
    expect(extractNumberTokens("35%")).toEqual(["35"]);
  });

  it("canonicalizes a month label with a bare year", () => {
    expect(extractNumberTokens("setembro de 2026")).toEqual(["2026"]);
  });

  it("returns an empty array for text with no numbers", () => {
    expect(extractNumberTokens("A meta da reserva está coberta.")).toEqual([]);
  });

  it("treats multiple numbers across a sentence independently", () => {
    expect(extractNumberTokens("A reserva cobre 4,6 meses de 02/09/2026.")).toEqual([
      "4.6",
      "2",
      "9",
      "2026",
    ]);
  });
});
