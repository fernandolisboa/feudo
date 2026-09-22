# CI minutes runbook

GitHub Actions minutes on a **private** repository are metered. The allowance resets on the first
of the month and does not roll over: GitHub Free includes 2,000 minutes, GitHub Pro 3,000, and
extra Linux 2-core minutes cost US$ 0.006 each. Every job is rounded **up to the whole minute**,
so twenty jobs of ten seconds cost twenty minutes, not four. Public repositories are not metered
at all on standard runners, so nothing they run touches the allowance.

**The allowance belongs to the account, not to this repository**, and every private repository the
owner has draws on the same pool. In September 2026 Feudo billed about 1,248 minutes of roughly
3,065 across the account, against a 3,000-minute Pro allowance — Feudo was the second-largest
consumer, not the cause on its own. Reading this repository's usage in isolation will mislead you;
read the account's usage grouped by repository, as step 1 below describes.

Feudo runs one CI suite per pull request and a migration on every push to `main`. This runbook is
what to do when the allowance runs out, and what keeps the burn down between months.

## Add credit or raise the limit

Everything below is under **your personal account**, not the repository's settings. The repository
has no billing page of its own; the bill belongs to `fernandolisboa`.

### 1. See where you actually stand

1. Open <https://github.com/settings/billing>.
2. Read **Usage this month**: the Actions line shows minutes consumed against the included
   allowance, and how much paid usage sits on top.
3. To see which repository burned them, open the usage report and group by repository, or export
   the CSV from the same page.

### 2. Make paid minutes possible

Included minutes stop at the allowance. Anything beyond it needs a payment method **and** a budget
that permits the spend, otherwise Actions simply refuses to start new runs.

1. Open <https://github.com/settings/billing> → **Payment information**.
2. Confirm a valid card is on file. Add one if not.

### 3. Set or raise the budget

The old "spending limit" is now a **budget**. A budget of zero is what blocks runs once the
included minutes are gone.

1. Open <https://github.com/settings/billing> → **Budgets and alerts**.
2. If an Actions budget already exists, click **Edit** on it. Otherwise click **New budget**.
3. Budget type: **Product-level budget**, product **Actions**.
4. Budget scope: the whole account, or just `fernandolisboa/feudo` if you want the cap to apply to
   this project alone.
5. Enter the monthly amount in US dollars. At US$ 0.006 per minute, US$ 10 buys roughly 1,600
   extra Linux minutes. For scale: across all of 2026 the account was billed US$ 0.47 beyond the
   included allowance, so a budget of US$ 5–10 is a stop that will almost never be reached, not a
   recurring cost. A budget of zero is what turns a 65-minute overrun into blocked CI.
6. Leave **Stop usage when budget limit is reached** checked. Unchecked, GitHub keeps running and
   keeps charging; checked, it stops at the cap and CI fails closed. Fail closed.
7. Check **Receive budget threshold alerts** so the 75% / 90% / 100% emails arrive while there is
   still time to react.
8. **Create budget** (or **Save**).

Runs blocked for lack of budget do not resume by themselves. Re-run the failed workflow from the
pull request's Checks tab once the budget is in place.

### 4. What running out actually looks like

There is no "paused and green" state. When the allowance is gone GitHub refuses to start the run,
and the refusal surfaces as a red check on the pull request. Since `ci` and `integration` are
required checks, the pull request cannot be merged — stopping CI and blocking the merge are the
same event. Nothing in this repository can turn that red into a pass.

`migrate-production` stops with everything else, so committed migrations do not reach production
until Actions runs again; the manual emergency path is in `docs/runbooks/database.md`. The app's
own scheduled work is unaffected — `/api/cron/sync` and `/api/cron/daily` are Vercel Cron, not
Actions.

If something has to merge while the allowance is out, the only lever is to drop `ci` and
`integration` from the branch's required checks in **Settings → Branches**, merge, and put them
back. That merges code nothing validated, so it is a decision for the owner, not a routine step.

### 5. If the month simply ran out

Three ways out, in order of how much they cost:

- **Wait for the reset.** The allowance returns on the first of the month.
- **Raise the budget** as above, and pay for the overage.
- **Upgrade the plan.** GitHub Pro raises the included allowance from 2,000 to 3,000 minutes for
  about US$ 4 per month, which is cheaper than buying 1,000 minutes at the overage rate. Do not
  upgrade without asking the owner first.

## What the suite costs

Measured over 2026-09-02 to 2026-09-22 (177 runs, 431 jobs): **1,213 billed minutes**, against
990 minutes of real runtime. The 223-minute gap is per-job rounding, which is why the number of
jobs matters as much as their length.

| job                  | mean runtime | share of the bill |
| -------------------- | ------------ | ----------------- |
| `integration`        | 3.2 min      | 46%               |
| `ci`                 | 2.0 min      | 36%               |
| `e2e`                | 1.6 min      | 17%               |
| `migrate-production` | 0.4 min      | 1%                |

A full pull-request run costs roughly **7 billed minutes**. The average pull request spent 3.9
runs and 27 minutes.

## Keeping the burn down

The workflow files already do what configuration can do:

- `ci.yml` runs on `pull_request` only. `main` moves only through a squash-merge of a green,
  up-to-date pull request, so re-running the suite on push tested a tree that was already tested.
- `migrate-production.yml` runs on push to `main` and does only the migration.
- A superseded run is cancelled by the `ci-${{ github.ref }}` concurrency group as soon as a new
  commit is pushed.
- A pull request that touches only `*.md`, `docs/**` or `.claude/**` skips the heavy steps of `ci`
  and skips `integration` and `e2e` entirely. Skipped jobs satisfy branch protection.

What configuration cannot fix is the number of pushes. Each push to an open pull request costs a
full suite, so:

- Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` locally before pushing. CI is the
  proof, not the first check.
- Batch review fixes into a single push instead of one push per finding. Three review rounds on
  one pull request cost 21 minutes on their own.
- Push documentation-only work as its own pull request; it then costs about 1 minute instead of 7.

## Related

- `.github/workflows/ci.yml`, `.github/workflows/migrate-production.yml`
- `docs/runbooks/database.md` for what `integration` does to the `feudo-preview` project
