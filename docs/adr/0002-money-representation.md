---
status: accepted
date: 2026-09-02
---

# Money is integer centavos with a currency code; BRL is the ledger currency

Floating-point money produces rounding errors that a household will notice on a balance and that a test cannot pin down, so every amount in Feudo is stored and computed as an integer number of centavos paired with an ISO 4217 currency code, and formatted for display only at the UI edge (pt-BR: `R$ 1.234,56`). BRL is the only currency the ledger aggregates: accounts in any other currency are shown separately, in their own currency, and are excluded from every total, rate and target, because converting them would require an exchange-rate source and a conversion date policy that no current job needs.

Dates and times are stored in UTC and rendered in the household's time zone (default `America/Sao_Paulo`); a transaction's "day" for categorization and monthly grouping is the day in the household's time zone.

## Consequences

- Money values are validated at every boundary (Pluggy payloads, forms, AI output) with a Zod schema that rejects non-integers; provider amounts that arrive as decimals are converted once, at the boundary, with explicit rounding to the centavo.
- Percentages used in calculations (% CDI, IPCA, IR brackets) are rational numbers handled in `packages/core` as `RatePpm` (an integer number of millionths, `1_000_000` = 100%) or explicit numerator/denominator, never floats over money; every CDI, Selic and IPCA value entering a calculation is a `RatePpm`, never a raw float. Bacen's SGS API publishes the daily CDI with six decimals of percent (`"0.053680"`), one more significant digit than `RatePpm` holds; rounding that daily value to `RatePpm` before compounding it over the 252-business-day convention shifts the annualised result by whole millionths. The precision rule: a rate is quantised to `RatePpm` only once, at the last step of a calculation (for example the annualised CDI, or the accumulated 12-month IPCA); an SGS decimal string that feeds a further calculation is read at its full precision first.
- Money math and formatting live in `packages/core` and are covered by property-based tests (`fast-check`).
- Adding currency conversion later is a new ADR, not a flag.

## Amendment 2026-09-28 (#17): a transaction's day is resolved at read time, in the household's own time zone

A transaction's stored `date` is the UTC calendar-day prefix of whatever the provider sent, which is the wrong day for an instant close to midnight in a time zone behind UTC. When Pluggy also sends a real instant (`occurred_at`), the ledger resolves the transaction's day at read time by localizing that instant into the reading household's own time zone, not the zone in effect when the row was synced (an account's household, and so its time zone, can change after sync). A provider timestamp at exact UTC midnight carries no time-zone information of its own — Pluggy uses it as a stand-in for "just a date" — so it is read as a plain date and never localized; `occurred_at` stays `NULL` for it, and the stored `date` is used as-is.

Rows synced before migration 0015 (`occurred_at`) also have `occurred_at` `NULL`, for the unrelated reason that no instant was ever recorded for them; they keep reading on their stored UTC-prefix day until a later sync re-reads and re-normalizes them. Because the incremental sync window only re-reads the last week, an old row can stay on its pre-migration day for a long time. This is accepted because the only rows this can mis-day are instants between 21:00 and midnight São Paulo time (`America/Sao_Paulo`, UTC-3) — the rest of the day already lands on the same date in both UTC and the household's own zone.

The dashboard (`buildLedgerDashboard`) aggregates only rows in the household's own currency (BRL, ADR-0002's ledger-currency rule above); a row in any other currency is excluded from every total, category bar and series point it computes, whatever currency-filtering the caller already did.
