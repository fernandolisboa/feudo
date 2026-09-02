---
status: accepted
date: 2026-09-02
---

# Bank profiles are versioned reference data in the repository, curated by the product

Banking intelligence scores institutions on evidence that changes slowly and must be reviewable, so bank profiles are product-curated reference data, not household data: a versioned data file in the repository, changed only through pull requests, which a periodic research job proposes with cited sources. They move to a database table only when someone has to edit them without a pull request.

## Decision

- Scope: Nubank, Inter, Itaú, Bradesco, Banco do Brasil, Caixa, Santander, C6, BTG, XP, Sicoob, PicPay, Mercado Pago initially.
- Criteria, each scored 0 to 5 with cited evidence and a `reviewedAt` date: card benefits, investment access, app and tech quality, security, fees, lock-in, public customer reviews (Reclame Aqui, consumidor.gov.br). The data file is validated by a Zod schema in CI; a profile with a missing citation or a stale `reviewedAt` (older than a threshold set in the schema) fails the build.
- Weights are household data: the product ships defaults, each household adjusts its own. Scoring is a pure function in `packages/core` over profiles and weights; criteria and default weights are data, not code branches.
- Output of a bank comparison: two or three candidate institutions with pros and cons against the institutions the household already uses. The AI layer (ADR-0004) may phrase the reasoning; the ranking and scores come from the deterministic function.
- Two reference datasets, kept separate: `institutions` (identity, Open Finance identifier, financial conglomerate, FGC participation), used by ledger and reserve to compute FGC headroom per CPF per conglomerate; and `bank-profiles` (the scored criteria above), used by banking intelligence only. This keeps `reserve` from depending on `banking-intel`.

## Consequences

- Every profile change is a reviewed diff with sources, which is the audit trail; the research job opens the PR, it never merges.
- The household-facing "last reviewed" date comes straight from the data, so stale evidence is visible, not hidden.
