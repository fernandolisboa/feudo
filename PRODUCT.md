# Feudo — Product

A PWA for households that pool their income. The first household is the owner's, but the product
is multi-tenant from day one: anyone can register, connect their own banks and invite their
partner.

## Who it is for

Couples and small households that share income and want one calm place to see where the money
goes, how much of it to keep as an emergency reserve and where, and whether their banks are
serving them or trapping them.

## The three jobs

### 1. Ledger and visibility

Accounts, cards and transactions synced from each person's own bank connection (Meu Pluggy today),
never through a shared credential. Categorized spending,
monthly evolution, savings rate. Per household, with shared and individual accounts. Transfers
between the household's own accounts are recognized and never counted as spending.

### 2. Emergency reserve

Compute the target reserve as multiples of the household's average fixed cost. Rank where to
keep it across the household's connected accounts using: % of CDI, real yield versus IPCA, daily
liquidity, FGC coverage.

### 3. Banking intelligence

Evaluate which banks fit the household's profile: card benefits, access to investment products,
app and tech quality, security features, fees, and especially how much a bank locks you in
(arbitrary limits, forced products, friction to move money out). Output is a scored comparison
with reasoning, refreshed periodically.

## Core screens

1. Onboarding and household setup: registration, verification, create or join a household,
   consent, connect banks.
2. Ledger dashboard: balances, spending by category, monthly evolution, savings rate.
3. Reserve view: target, current coverage, ranked placement options with trade-offs.

Later: bank comparison view, monthly AI analysis, settings (members, data export, deletion). The
app shell reserves their destinations (Bancos, Casa) from the start; they stay disabled until their
tickets land.

## Principles that shape the product

- AI interprets; it never calculates or invents numbers. Every number on screen comes from
  deterministic code over synced data.
- Tenant isolation is absolute. A household never sees another household's data.
- Privacy by design (LGPD): consent before connecting banks, minimal storage, export and deletion.
- Money is exact: integer centavos, Brazilian formatting.
- Calm and trustworthy. No gamification, no upsell, no fintech-landing-page energy.

## Platform reality

~90% Windows PC (Edge/Chrome), ~6% Android, rest Apple. Installable PWA on all of them.
Offline: read-only shell and last-known data.

## Out of scope for now

Native builds, risk investing, options, backtests, billing and plans.
