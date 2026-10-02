---
status: accepted
date: 2026-09-08
---

# Reserve placement: hard filter, then net real yield, with honest tax and liquidity assumptions

Ranking "where to keep the emergency reserve" has to be explainable to a household that will not audit a formula, and the inputs available from the provider are incomplete (rates and due dates, but no explicit "redeemable any day" flag). We therefore rank in two stages, a hard filter and an ordering, and we make the two uncertain assumptions, tax bracket and liquidity, deterministic and visible rather than blended into a score.

## Decision

- **Hard filter first**: a position or option qualifies as reserve placement only if it is redeemable in at most one business day (D+1) and either covered by the FGC or FGCoop or a Tesouro Selic position (FGCoop added 2026-10-02, #21: Sicoob is covered by FGCoop, whose limit is per associated cooperative, CMN Resolution 4,933). Whatever fails the filter is listed apart with the reason ("not liquid", "not covered"), never silently ranked low.
- **Then order by net real yield**: the position's rate, whatever its rate type (percentage of CDI, fixed annual, inflation-linked, or other, where poupança and Tesouro Selic are resolved from the product type), converted to an annual nominal rate with the 252-business-day convention, minus income tax, compared against the 12-month accumulated IPCA. "As % of CDI" is one input form, not the comparison basis. Ties break by remaining FGC headroom for the holder's CPF in that financial conglomerate (R$ 250,000 per CPF per conglomerate, or per cooperative under FGCoop; one holder hash per account, joint accounts are a later refinement if ever needed).
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
- `getLatestIndicators()` surfaces the Selic **target** rate (series 432), already an annual figure, and (since #22) the effective Selic, the daily series (11) annualised over 252 business days.

## Amendment 2026-10-02 (#22): what the first implementation settled

- **Tesouro Selic earns the effective Selic** (series 11, annualised), not the target: the bond accrues the daily Selic, and the target sits a few basis points above it, which would hand Tesouro Selic an edge over CDI-linked positions it does not have. Poupança keeps the target (432), because its legal rule is written on the target; TR is not fetched, so poupança is understated by the period's TR, and the screen says "Poupança sem TR".
- **Which institution guarantees a position.** A deposit (checking or poupança) is covered by the institution that holds the account, and is not covered at all when that is a payment institution; a bank-issued instrument (CDB, RDB, LC, LCI, LCA, LIG) is covered by its issuer's conglomerate. The issuer defaults to the institution the connection's own label names (`matchInstitutionByLabel` in `packages/core`, shared with the bank comparison), and the household's reserve mark can name another or say it is outside the reference list. An unidentified institution excludes the position ("institution not identified"); it is never assumed covered.
- **Product types** are data in `packages/core/src/reserve/products.ts`: each says how liquidity, guarantee, yield and tax are settled. A provider product type that is neither a known covered instrument nor a known uncovered one (funds, equities, corporate debt, COE) is "product not recognised", never assumed uncovered. Tesouro Selic is told apart from other Tesouro bonds by its name, since the provider types them all as `TREASURY`.
- **FGCoop** limits are per cooperative, which the provider does not name, so all of a holder's Sicoob positions share one limit (understating headroom, never overstating it).
- **Holder with no headroom left** in a conglomerate fails the filter ("FGC limit reached"); the next reais there would not be covered.
- **The screen** shows the top three as the ranking and the rest under "também avaliados", ranked ones with their place, excluded ones with every reason that applies.
- **Known gap:** a fully redeemed investment keeps its last balance until #102 is fixed (sync never removes a position the provider stops listing), so it can still appear in the ranking and, if marked, in the coverage.
