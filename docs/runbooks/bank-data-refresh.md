# Bank data refresh

The scheduled routine that keeps the bank profiles current (ADR-0006, amendment 2026-10-14). It
runs as a Claude session on a schedule, not inside the app: no API spend, no scraping from Vercel.
The output is one pull request that changes only
`apps/web/src/modules/banking-intel/bank-profiles-data.ts`.

## Scope of one run

- Every institution in the data file, every criterion. Start with the criteria whose `reviewedAt`
  is oldest; if the run cannot finish all 13 banks, stop after the ones it verified and say which
  were left for the next run.
- Re-read each citation. Prefer primary sources (the bank's own pages, the Banco Central tariff
  registry `bcb.gov.br/fis/tarifas/htms/<ISPB>.asp`, Reclame Aqui's company page for public
  reviews). Look for what changed since `checkedAt`: fees, packages, card annuity and benefits,
  investment access, app ratings and outages, security incidents, joint-account rules, Pix limits.
- Use the scoring rubric already in force for each criterion (ADR-0006 and its amendments; the
  current scores and evidence show how it was applied). Never guess a score: a criterion with no
  citable source becomes `insufficient-evidence` with a `reason`.

## Writing a change

- A criterion whose facts are unchanged: update `checkedAt` on the citations you re-read and
  `reviewedAt` to the run's date. Do not touch `evidence`, `summaryPtBr` or the score.
- A criterion whose facts changed: update `evidence` (English, the review record), `summaryPtBr`
  (the same facts in natural Brazilian Portuguese, R$ 1.234,56, 4,6%, no em-dashes), `score` if the
  rubric gives a different one, the citations (`url`, `kind`, `checkedAt`, `finding`) and
  `reviewedAt`.
- `reviewedAt` must not be earlier than any citation's `checkedAt` (the schema refuses it).
- A source that cannot be read (blocked, gone): keep the old citation, add one saying what was tried,
  and only lower confidence through `kind: "secondary"` or `insufficient-evidence` when nothing else
  backs the fact.
- Bumping `reviewedAt` is what tells households with a correction on that criterion that a newer
  review exists. Bump it only for criteria you actually re-verified.

## Pull request

- Branch `claude/bank-data-refresh-<YYYY-MM-DD>`, conventional commit
  `chore(banking-intel): refresh bank data <YYYY-MM-DD>`.
- The description lists, per bank, the criteria whose score or facts changed (old → new score, one
  line on what changed, the source), then the criteria only re-confirmed, then anything left for
  the next run.
- Run `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm format:check` before pushing; one push.
- Then follow the repository's PR rules: review, merge when green, confirm production.
