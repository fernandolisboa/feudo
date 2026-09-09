---
status: accepted
date: 2026-09-08
---

# Reserve placement: hard filter, then net real yield, with honest tax and liquidity assumptions

Ranking "where to keep the emergency reserve" has to be explainable to a household that will not audit a formula, and the inputs available from the provider are incomplete (rates and due dates, but no explicit "redeemable any day" flag). We therefore rank in two stages, a hard filter and an ordering, and we make the two uncertain assumptions, tax bracket and liquidity, deterministic and visible rather than blended into a score.

## Decision

- **Hard filter first**: a position or option qualifies as reserve placement only if it is redeemable in at most one business day (D+1) and either covered by the FGC or a Tesouro Selic position. Whatever fails the filter is listed apart with the reason ("not liquid", "not covered"), never silently ranked low.
- **Then order by net real yield**: the position's rate, whatever its rate type (percentage of CDI, fixed annual, inflation-linked, or other, where poupança and Tesouro Selic are resolved from the product type), converted to an annual nominal rate with the 252-business-day convention, minus income tax, compared against the 12-month accumulated IPCA. "As % of CDI" is one input form, not the comparison basis. Ties break by remaining FGC headroom for the holder's CPF in that financial conglomerate (R$ 250,000 per CPF per conglomerate; one holder hash per account, joint accounts are a later refinement if ever needed).
- **Tax bracket**: an existing position is taxed at the regressive-table bracket for its real holding age today, the number the household would pay if it redeemed now; a hypothetical new placement is taxed at the worst bracket (22.5%); when the acquisition date is unknown, the position is taxed at the worst bracket (22.5%) and labelled "acquisition date unknown". LCI/LCA and poupança are exempt. The interpretation layer may explain that the bracket falls with time; the ranking does not anticipate it.
- **Liquidity**: decided by product type where the type settles it (poupança, Tesouro Selic and provider "savings box" products are liquid; a CDB with a due date is liquid only if the household marks it so). When the product cannot tell, the position is shown as "liquidity unknown, confirm" and excluded from the ranking until marked.
- Criteria, thresholds and the FGC constants are data in `packages/core`, covered by unit and property-based tests; no weight is tuned in code branches.

## Considered options

- **Single weighted score mixing yield, liquidity and coverage**: compact but opaque; a household cannot tell why an illiquid CDB with a great rate ranks where it does. Rejected.
- **Always assume the worst tax bracket**: comparable across positions but wrong for the household's actual money; it would understate every position older than six months. Rejected in favour of the "if redeemed today" number.
- **Reference data for liquidity per bank and product**: the most accurate, but a maintenance burden with no source of truth today. Deferred; the household's mark is the fallback until then.

## Consequences

- The `reserve` module depends on the `institutions` reference dataset (ADR-0006) for conglomerate and FGC participation, and on the SGS market data for CDI and IPCA; it never depends on `banking-intel`.
- Every rejection by the hard filter is a first-class output, so the screen and the AI interpretation can state it.
