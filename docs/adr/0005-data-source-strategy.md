---
status: accepted
date: 2026-09-02
---

# Bank data comes from each user's own Meu Pluggy credentials, behind a swappable provider interface

Open Finance data in Brazil is only reachable through a Bacen-authorized aggregator; Pluggy's commercial plan costs R$ 2,500/month minimum, Belvo's starts at US$ 1,000/month, and no hobby-friendly tier exists anywhere in the market (see `docs/research/2026-09-02-aggregator-alternatives.md`). Pluggy's free personal product, Meu Pluggy, gives an individual their own API credentials for their own accounts, free indefinitely, scoped per CPF. We therefore start with each user bringing their own Meu Pluggy credentials, keep the provider behind a small interface so it can be swapped, and gate each growth step on a legal and financial condition.

## Decision: three steps

1. **Now (owner's household)**. Each user creates their own Meu Pluggy account, connects their banks on Pluggy's own site, and pastes their personal client id and secret into Feudo through a guided wizard. Feudo stores those credentials encrypted (ADR-0008) and syncs each user's data with that user's credentials only. Feudo never pools several people's accounts under one credential, never uses the Pluggy Connect widget, and never sees a bank password. Bank connections therefore belong to the user, not the household (ADR-0001).
2. **Closed beta (a handful of households)**. Stays on the same model only after **written confirmation from Pluggy support** that several people, each with their own Meu Pluggy account, each plugging their own credentials into a shared, unsold app, is personal use under their terms. Pluggy's FAQ draws the commercial line at "serving customers, connecting several CPFs' accounts, or turning it into a commercial product"; its terms PDF is silent on the scenario, so FAQ copy is not enough. Without that confirmation the beta is limited to the owner's household.
3. **Public launch**. Requires a paid, regulated aggregator (Pluggy Dados, Belvo or equivalent) and paying customers to fund it. `REGISTRATION_MODE=open` is blocked by this gate and by the LGPD set in ADR-0008. Pluggy bills per API request above its plan minimum, so sync frequency is a cost lever, not just a freshness one.

OFX/CSV import is a backlog secondary source for institutions where a partner's account type makes Meu Pluggy impractical (for example C6 personal accounts export PDF only).

## Provider interface

The `sync` module talks to a `DataProvider` with four operations: list accounts, list transactions since a date, list investment positions, refresh a connection. Every payload crossing that boundary is validated with Zod and normalized into Feudo's own account, transaction and position shapes before anything else touches it; provider ids are kept only to deduplicate on the next sync. Pluggy's own category, counterpart document and investment rate fields feed the normalizer; nothing downstream knows the provider's field names.

Sync runs automatically once a day and can be triggered manually up to three times per day per household, through Vercel Cron hitting bearer-protected route handlers, with no queue. The unit of work is the bank connection (user-owned); the daily job iterates connections, and a manual trigger from a household refreshes the connections whose accounts are assigned to it, counting against that household's quota.

## Considered options

- **Pluggy Dados or Belvo now**: the "correct" architecture, but R$ 2,500/month for one household. Rejected until step 3.
- **One Pluggy account for the whole app, users connect through the Connect widget**: the design CLAUDE.md originally assumed; it is exactly the multi-CPF pooling that Pluggy's terms define as commercial. Rejected.
- **Bank developer APIs**: Inter, BB, Bradesco and Itaú expose them only to business accounts; Nubank has none. Rejected.
- **OFX/CSV only**: free and aggregator-independent, but manual, inconsistent per bank and unavailable for several institutions. Kept as a secondary source, not the primary.

## Consequences

- The wizard must be honest with the user: they are handing Feudo a secret that can read all their accounts, and they can revoke it at Pluggy or delete it in Feudo at any time.
- End-to-end tests run against an in-repo fake `DataProvider` with Pluggy-shaped fixtures; Meu Pluggy has no sandbox, so the real provider is exercised by a manual smoke test on the owner's own credentials.
- CLAUDE.md's stack section (Connect widget, "MeuPluggy only for local development", billing per item) is superseded by this ADR and should be updated by the orchestrator.
