---
status: accepted
date: 2026-09-02
---

# Bank profiles are versioned reference data in the repository, curated by the product

Banking intelligence scores institutions on evidence that changes slowly and must be reviewable, so bank profiles are product-curated reference data, not household data: a versioned data file in the repository, changed only through pull requests with cited sources. They move to a database table only when someone has to edit them without a pull request.

## Decision

- Scope: Nubank, Inter, Itaú, Bradesco, Banco do Brasil, Caixa, Santander, C6, BTG, XP, Sicoob, PicPay, Mercado Pago initially.
- Criteria, each scored as an integer from 0 to 100 (amended 2026-10-02, #21; it was 0 to 5, which left too little range to compare thirteen banks) with cited evidence and a `reviewedAt` date: card benefits, investment access, app and tech quality, security, fees, lock-in, public customer reviews (Reclame Aqui, consumidor.gov.br). Every criterion reads "higher is better for the household": lock-in 100 means the easiest bank to leave. A criterion without a citable source is recorded as insufficient evidence, never given a guessed score. The data file is validated by a Zod schema in CI; a profile with a missing citation fails the build; CI reports stale profiles (`reviewedAt` older than a threshold set in the schema) and the UI shows the review date.
- Weights are household data: the product ships defaults, each household adjusts its own. Scoring is a pure function in `packages/core` over profiles and weights; criteria and default weights are data, not code branches.
- Output of a bank comparison: up to three candidate institutions (amended 2026-10-02, #23; see below) with pros and cons against the institutions the household already uses. The AI layer (ADR-0004) may phrase the reasoning; the ranking and scores come from the deterministic function.
- Two reference datasets, kept separate: `institutions` (identity, Open Finance identifier, financial conglomerate, FGC participation), living in `packages/core` reference data next to the FGC constants and used by ledger and reserve to compute FGC headroom per CPF per conglomerate. The conglomerate is the Central Bank's _financial conglomerate_ as published in IF.data, because the FGC regulation sums credits per "conglomerado financeiro"; an institution's guarantee is either FGC per conglomerate or FGCoop per associated cooperative (Sicoob), and a payment institution holding the account is recorded as such because it is not an FGC member; and `bank-profiles` (the scored criteria above), used by banking intelligence only. This keeps `reserve` from depending on `banking-intel`.

## Consequences

- Every profile change is a reviewed diff with sources, which is the audit trail. The agent that changes the data verifies each fact against a primary source where one exists and records the URL, the date checked and what was read; a fact that rests only on a secondary source is labelled as such. The owner's approval before merge is no longer required (waived by the owner on 2026-10-02, #21): an error found later is fixed by another pull request. A research job that proposes profile updates is a later ticket.
- The household-facing "last reviewed" date comes straight from the data, so stale evidence is visible, not hidden.

## Amendment 2026-10-02 (#23): how the comparison is computed

- An institution's score is the mean of its evidenced criterion scores weighted by the household's weights, rounded half up to an integer from 0 to 100; the ranking compares the exact means, and ties keep the dataset's order. A weighted criterion with insufficient evidence is left out of the mean and named on screen, never replaced by a guess.
- Weights are integers from 0 ("não conta") to 5, defaults in `packages/core` (fees 5; security, lock-in and public reviews 4; investment access and app quality 3; card benefits 2). A household stores its set in `bank_criteria_weights`; only the owner or an admin changes or resets it, and at least one weight must be above zero.
- Candidates are the top three scored institutions the household does not use. A pro or a con is a weighted criterion where the candidate is at least 10 points above or below the best score the household's own institutions reach on it.
- The institutions a household uses are inferred at read time from the institution names of the connections behind its accounts (`matchInstitutionByLabel`, shared with the reserve ranking); nothing is stored. Unrecognised names are shown so their owner can rename the connection. A household with no recognised institution is compared with the lower median of each criterion across all profiles.
