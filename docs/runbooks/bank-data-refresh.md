# Bank data refresh

The scheduled routine that keeps the bank profiles current (ADR-0006, amendment 2026-10-14). It
runs as a Claude session on a schedule, not inside the app: no API spend, no scraping from Vercel.
The output is one pull request that changes only
`apps/web/src/modules/banking-intel/bank-profiles-data.ts`.

## Scope of one run

- Every institution in the data file, every criterion and every account type. Start with whichever
  `reviewedAt` is oldest, criterion or account type; if the run cannot finish all 13 banks, stop
  after the ones it verified and say which were left for the next run.
- Re-read each citation. Prefer primary sources (the bank's own pages, the Banco Central tariff
  registry `bcb.gov.br/fis/tarifas/htms/<ISPB>.asp`, Reclame Aqui's company page for public
  reviews). Look for what changed since `checkedAt`: fees, packages, card annuity and benefits,
  investment access, app ratings and outages, security incidents, joint and shared account rules,
  MEI account rules, Pix limits.
- Use the scoring rubric already in force for each criterion (ADR-0006 and its amendments; the
  current scores and evidence show how it was applied). Never guess a score: a criterion with no
  citable source becomes `insufficient-evidence` with a `reason`.
- Account types (`joint`, `shared`, `jointInvestment`, `mei`, ADR-0006 amendment 2026-10-16) are a
  yes/no fact, not a score: `offered`, `not-offered` (the bank itself says it does not) or
  `not-found` (no source either way). Never guess a status. A `not-found` type may become `offered`
  or `not-offered` once a source turns up; the reverse never happens without a source saying the
  bank changed the product.

## Writing a change

- A criterion whose facts are unchanged: update `checkedAt` on the citations you re-read and
  `reviewedAt` to the run's date. Do not touch `evidence`, `summaryPtBr` or the score.
- A criterion whose facts changed: update `evidence` (English, the review record), `summaryPtBr`
  (the same facts in natural Brazilian Portuguese, R$ 1.234,56, 4,6%, no em-dashes), `score` if the
  rubric gives a different one, the citations (`url`, `kind`, `checkedAt`, `finding`) and
  `reviewedAt`.
- An account type follows the same rule: unchanged facts only bump `checkedAt` and `reviewedAt`;
  changed facts update `evidence`, `summaryPtBr`, `conditionPtBr` (a short chip, optional), the
  citations and `reviewedAt`. Changing `status` needs a citation, except when a `not-found` without
  one turns into another `not-found` with newly checked sources that still found nothing.
- `reviewedAt` must not be earlier than any citation's `checkedAt` (the schema refuses it), for a
  criterion or an account type alike.
- A source that cannot be read (blocked, gone): keep the old citation, add one saying what was tried,
  and only lower confidence through `kind: "secondary"` or `insufficient-evidence` (or, for an
  account type, `not-found`) when nothing else backs the fact.
- Bumping `reviewedAt` is what tells households with a correction on that criterion or account type
  that a newer review exists. Bump it only for what you actually re-verified.

## Pull request

- Branch `claude/bank-data-refresh-<YYYY-MM-DD>`, conventional commit
  `chore(banking-intel): refresh bank data <YYYY-MM-DD>`.
- The description lists, per bank, the criteria whose score or facts changed (old → new score, one
  line on what changed, the source) and the account types whose status or facts changed (old → new
  status, one line on what changed, the source), then what was only re-confirmed, then anything
  left for the next run.
- Run `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm format:check` before pushing; one push.
- Then follow the repository's PR rules: review, merge when green, confirm production.
- Run as the Managed Agents session in `agents/bank-data-refresh/` (owner's API credits), the run
  stops at the open PR; review and merge happen in the repository's normal PR flow.
