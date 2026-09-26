---
status: accepted
date: 2026-09-02
---

# Calculations read subcategory kinds, never category names

Fixed cost, savings rate and the reserve target all depend on telling income, fixed spending, variable spending and internal transfers apart, and households will rename, add and reassign subcategories over time. We therefore give every subcategory exactly one kind, `income | fixed | variable | transfer`, and every calculation in `packages/core` reads only the kind. Category and subcategory names exist for people; no rule, sum or ranking ever branches on a name.

## Decision

- Categories are fixed by the product; households cannot create them. Subcategories are shipped by the product with a default kind, and a household may add its own subcategories and override the kind of any subcategory for itself.
- Credit-card purchases are spending on the purchase date, each installment on its own date; the card bill payment is an internal transfer, never spending.
- Internal transfers are detected by pair matching: same amount, opposite direction, at most two business days apart, both accounts assigned to the household, confirmed when the counterpart document hash stored on the transaction matches the keyed hash of one of the household's synced account holders (see ADR-0008; the document itself is never stored). Pairing belongs to the `ledger` module and is re-run whenever an account joins the household. A user can always mark a transaction as an internal transfer by hand.
- Precedence: manual categorization beats household rules, household rules beat product defaults, product defaults beat the provider's own category. Recurring-spend detection only suggests a `fixed` kind; nothing changes kind silently.
- Fixed cost is the sum of spending in subcategories of kind `fixed`. Average fixed cost is the mean over the last six complete months, computed with at least three; with fewer, the value is labelled an estimate that names the months used. Reserve target = reserve multiple (default 6, range 3 to 12) × average fixed cost, recomputed at month close; the household is notified only when it moves by more than 10%.

## Consequences

- Unit tests for every calculation use fixtures keyed by kind, so renaming a subcategory can never break a test or a number.
- Any new kind is a domain change that touches every calculation; it needs a new ADR, not a migration.
- A transaction with no subcategory has no kind and is reported as uncategorized; it counts in no total until categorized. This makes gaps visible instead of silently miscounting them.

## Amendment 2026-09-26 (#15): only manual choices are stored

The taxonomy ships as data in `packages/core/src/ledger/categories/` (thirteen fixed categories, each subcategory with its default kind), together with the mapping from Pluggy's category names and a short list of product default rules for unambiguous statement descriptions (card bill payment, condominium, IPTU, IOF, and similar). A provider category that is too generic to guess (a plain PIX or TED transfer, "Other", a bare top-level bucket) maps to nothing, so the transaction is reported as uncategorized instead of landing in a catch-all.

Categorization is resolved by one pure function each time transactions are read, in the precedence above; only a member's manual choice is persisted (`transaction_categorization`, keyed by household and transaction). Household rules, subcategories and kind overrides are household-scoped tables. Consequences: a rule applies at once to every past and future transaction, so "apply on sync" and "apply on demand" are the same thing; an account moved to another household arrives with that household's rules and none of the previous household's manual choices; and nothing needs re-running after a sync, a rule change or a move. A rule matches when its normalized pattern appears as a whole-word sequence in the normalized description (upper case, accents and punctuation stripped); when several rules match, the most specific (more words, then longer) wins, then the newest. Recurring-spend detection runs over the last three complete months and only lists subcategories a member may mark as fixed.
