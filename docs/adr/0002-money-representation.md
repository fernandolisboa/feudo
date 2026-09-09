---
status: accepted
date: 2026-09-02
---

# Money is integer centavos with a currency code; BRL is the ledger currency

Floating-point money produces rounding errors that a household will notice on a balance and that a test cannot pin down, so every amount in Feudo is stored and computed as an integer number of centavos paired with an ISO 4217 currency code, and formatted for display only at the UI edge (pt-BR: `R$ 1.234,56`). BRL is the only currency the ledger aggregates: accounts in any other currency are shown separately, in their own currency, and are excluded from every total, rate and target, because converting them would require an exchange-rate source and a conversion date policy that no current job needs.

Dates and times are stored in UTC and rendered in the household's time zone (default `America/Sao_Paulo`); a transaction's "day" for categorization and monthly grouping is the day in the household's time zone.

## Consequences

- Money values are validated at every boundary (Pluggy payloads, forms, AI output) with a Zod schema that rejects non-integers; provider amounts that arrive as decimals are converted once, at the boundary, with explicit rounding to the centavo.
- Percentages used in calculations (% CDI, IPCA, IR brackets) are rational numbers handled in `packages/core` with basis points or explicit numerator/denominator, never floats over money.
- `RatePpm` (an integer number of millionths, `1_000_000` = 100%) is the single rate representation in `packages/core`: every CDI, Selic and IPCA value entering a calculation is a `RatePpm`, never a raw float. Bacen's SGS API publishes the daily CDI with six decimals of percent (`"0.053680"`), one more significant digit than `RatePpm` holds; rounding that daily value to `RatePpm` before compounding it over the 252-business-day convention shifts the annualised result by whole basis points. The precision rule: a rate is quantised to `RatePpm` only once, at the last step of a calculation (for example the annualised CDI, or the accumulated 12-month IPCA); an SGS decimal string that feeds a further calculation is read at its full precision first.
- Money math and formatting live in `packages/core` and are covered by property-based tests (`fast-check`).
- Adding currency conversion later is a new ADR, not a flag.
