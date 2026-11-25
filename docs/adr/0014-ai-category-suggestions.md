---
status: accepted
date: 2026-11-25
---

# AI category suggestions for pending transactions

Guided categorization (`/categorizar`) suggests a subcategory only from the household's own
history (`packages/core/src/ledger/categories/suggest.ts`): `history_amount`, then `history`, then
the `credit` fallback. A transaction with no history, or with history that disagrees, gets nothing,
and those are exactly the ones a member finds tedious. The owner approved, on a decision card, a
small AI call that sends the pending transactions' description, amount and direction to Anthropic
with the household's own key (ADR-0013), only when a member presses a button, with a new terms
version that everyone re-accepts. Cost must stay low (no new paid service; the household pays its
own Anthropic usage), and a suggestion is never applied without a member saving it.

This is a second AI use next to the analyst reading (ADR-0004), with a narrower and different
contract: the model classifies text into a closed list of ids and never produces a number, so the
three-layer rule holds (data → deterministic → interpretation): no figure on any screen comes from
it, and kinds, totals, the savings rate and the reserve target change only after a member saves a
choice, exactly as with a manual categorization today.

## Decision

- **Trigger.** A "Sugerir categorias com IA" button on `/categorizar`, rendered only when the
  household's analyst is enabled (`isAnalysisEnabled`: deploy switch on and, for `anthropic`, a
  usable household key) and at least one pending transaction is still unasked. Any member may press
  it (same as "Gerar nova leitura"). No page view, cron or sync ever calls the model for this.
- **What one press sends.** One model call covering the uncategorized transactions of the guided
  window (the overview's window, household currency only, deferred ones included) whose
  deterministic suggestion is none or the `credit` fallback, minus transactions already asked under
  the current prompt version. They are grouped by fingerprint (normalized description, absolute
  amount, currency, direction; pure function in `packages/core`), each group sent once, in queue
  order, at most 40 groups per call. A group is skipped when any uncategorized transaction with the
  same fingerprint was already asked.
- **What the model receives, and nothing else.** Feudo's product subcategories as stable ids with
  their pt-BR "Categoria · Subcategoria" labels and kinds (product data, not personal data), and per
  group: an index, the direction, the absolute amount formatted in BRL, and the description. The
  description is cut to 1,000 raw characters; normalized with Unicode NFKC; every
  default-ignorable, format and combining-mark character is deleted outright (zero-width spaces,
  bidi controls, variation selectors, an accent or a keycap mark that NFKC did not fold into a
  letter), except a run of them sitting directly between two letters, each a letter that is not
  itself default-ignorable, which becomes a space instead, so deleting it cannot glue the two
  letters into one word that swallows a mask run starting at the second one; every other control,
  private-use, unassigned or separator character, plus the blank-rendering U+2800 and the two
  replacement characters U+FFFC and U+FFFD, is folded to one space; a decimal digit of any script
  counts as a digit. When the 1,000-character cut removed something, a trailing run is then
  dropped too, right after normalization and just before the scan below, so a document cut in half
  is not kept: every trailing digit, mask symbol, separator and x/X together, not only a final x/X
  of a word; the strip does not check whether a trailing x/X was itself a mask character, since it
  only ever removes text the model would have received, never adds or changes
  any. It is then scanned for a document-like run: a sequence of 11 or more
  digits and mask characters (`*`, `•`, or `x`/`X` where it is not part of an ordinary word), with a
  gap of one or more characters drawn from `. - /` and space between any two of them and at least 6
  digits among them, is removed as a whole, alongside any other run of 9 or more digits and a
  `<`/`>`/`|` character; the result is cut at 140 characters. A gap character drawn from anything
  else (a comma, a colon, an underscore, a dash that is not a hyphen) is not bridged, and a masked
  document showing fewer than 6 digits is left as is. The aim is data minimisation against what a
  bank writes in a description, not a defence against someone who controls the description text,
  who decides what it says in any case; a character the rules above do not name (a letter,
  punctuation or a visible symbol between two digits) is not bridged. No dates, account names or
  types, institution, connection label, document hash, household subcategory names or examples from
  the household's categorized history. The description is the bank's own free text, so it can still
  carry a name, a date or part of a document number the sanitizer does not catch; the terms, privacy
  policy and connection consent say so. Descriptions are untrusted data: they sit inside a delimited
  block the system prompt declares as data, never instructions.
- **Output contract.** Structured outputs (JSON schema) restrict every answer to
  `{ index, subcategory }` where `subcategory` is one of the sent ids or `null`; the reply is then
  parsed with Zod, and an out-of-range index, an unknown id, or a second answer for the same index is
  dropped. One attempt per press; a failed call (refusal, truncation, timeout, malformed) stores no
  suggestion, and the press still counts against the quota.
- **Model.** A third per-household family setting, `category_suggestion_family` on
  `household_ai_settings`, default Haiku, set on Casa by an owner or admin and resolved like the
  other two (ADR-0013: newest qualifying version of the family, pinned id as safety net). A new tier
  `light` runs it at `low` effort with an 8,000-token output cap (Claude's adaptive thinking is on by
  default and its tokens count toward `max_tokens`; 8,000 keeps a 40-item answer from being truncated
  by thinking) and a 25 s call timeout inside a 60 s action budget. No `temperature`, `top_p`, `top_k`
  or assistant prefill is sent (the Claude API rejects all four alongside `effort`), and a refusal
  (`stop_reason: "refusal"`) maps the same way `complete` already maps one, with no server-side
  fallback for it. The server-side fallback beta follows the family rule already in
  `anthropic-client.ts` (never for Haiku, sent for Sonnet and Opus, both of which also accept `low`).
  `AiClient` gets a second method, `suggestCategories`, instead of generalising `complete`, so the
  analyst reading's request, schema and tests are untouched.
- **Limits.** Five presses per household per household-local day, one run at a time, both checked
  under a lock on the household row (the same `for no key update` pattern as `reserveOnDemand` in
  `analysis/repository.ts`); a run still `running` after 5 minutes counts as abandoned. A press that
  finds nothing to ask spends nothing and records nothing.
- **Storage.** Two household-scoped tables in `analysis` (ADR-0001): `category_suggestion_run`, one
  row per press (who, household day, status, prompt version, requested and answering model, groups
  and transactions sent, suggestions returned, token counts, failure reason), kept 30 days; and
  `category_ai_suggestion`, one row per (household, transaction) with the product subcategory id or
  `null` (asked, no answer), the prompt version and the answering model. A suggestion belongs to the
  household that asked, like `categorization_deferral`: it is read only while the transaction's
  account is assigned to that household, stays behind when the account moves, cascades with the
  transaction and the household, and is pruned after 240 days. No copy of any description is stored.
- **Input of record (squaring ADR-0004's "stored with its inputs").** For this use the stored input
  is a reference, not a copy: the suggestion row names the transaction (whose `bank_transaction` row
  holds the description, amount and direction that were sent) and the prompt version, whose frozen
  file also pins the rendered taxonomy block by hash. A suggestion is reproducible while its
  transaction exists; once the transaction is deleted, the suggestion is deleted with it, which is
  the point (LGPD minimisation). The run row records how many groups were sent, not what. The
  taxonomy this prompt renders will gain subcategories over time; because the hash pins the exact
  rendered block, adding or renaming one trips the pinned test on purpose — the fix is a new prompt
  version, not editing the expected hash in place, so a changed taxonomy is never served under the
  version a stored suggestion claims to have seen.
- **Read side.** `buildCategorizationQueue` gains an optional AI suggestion per candidate and a new
  reason `ai`, with precedence `history_amount` → `history` → `ai` → `credit`; an uncategorized
  transaction with no AI row of its own inherits from an uncategorized one with the same fingerprint.
  Only suggestions of the current prompt version are read; a new prompt version starts over. The
  guided screen pre-fills the subcategory with it, labelled "Sugestão da IA", and the member saves it
  as a normal manual categorization (the rule checkbox logic is unchanged). Nothing else in the
  product reads these rows.
- **Slice placement (ADR-0011).** `analysis` already imports `@/modules/ledger` (`service.ts` →
  `getLedgerAnalysisFacts`) and `ledger` imports nothing from `analysis`, so the direction stays
  `analysis → ledger`: `analysis` owns both tables, the prompt, the client method, the action, the
  quota and the button; `ledger` exports `getAiSuggestionCandidates` (the groups to send) and
  `productSubcategoriesForPrompt` (the taxonomy to offer, called directly by `analysis` when it
  renders the prompt, rather than carried through the candidates result) and accepts the stored
  suggestions as a plain input of `getGuidedCategorizationProps`. `app/(app)/categorizar/page.tsx`
  composes the two and passes the button into the guided view as a slot.
- **Audit (ADR-0008).** Each press that sends something writes a `financial_data_access` row of a
  new kind, `category_suggestions`, after the candidates are read and before Anthropic is called, so
  a failed audit write sends nothing. Shown to the member as "Sugestões de categoria (IA)" under
  "Seus acessos recentes".
- **Export and deletion.** Neither table is exported: suggestions are household-wide derived data
  with no author (like analyst readings), and runs are a short-lived usage control (like
  `manual_sync_trigger`); the privacy policy already says both stay out. Erasure is by cascade:
  household deletion removes both; connection or account-purge deletion removes the suggestions with
  their transactions; user deletion sets `requested_by_user_id` null on runs; the daily
  `analysis.runDailyPruneStep` deletes runs older than 30 days and suggestions older than 240 days.
- **Preview and tests.** The fake provider's client answers `income.salary` for every credit and
  `shopping.other` for every debit, and `null` for every third group (index `% 3 === 2`) so
  abstention is exercised; it is refused in production as before.
- **Legal text.** New `TERMS_VERSION`; the privacy policy, the terms' AI paragraph, the Como usar
  page and the bank-connection consent text (new `CONSENT_SCOPE_VERSION`) stop saying descriptions
  are never sent and say exactly what this sends, when, and through whose key.

## Consequences

- The cost of a press is bounded by design: ≤ 40 groups, ≤ 8,000 output tokens, five presses per
  household-day, Haiku by default, nothing re-sent for the same prompt version, and nothing sent for
  a transaction the household's own history already places. Changing the prompt (or a subcategory
  label, which fails the taxonomy hash pin) re-opens every pending transaction to one more call.
- Suggestions only cover product subcategories; a household that relies on its own subcategories
  gets fewer AI suggestions until the owner decides to send their names.
- ADR-0004's "no raw transactions, no free-text bank descriptions" stays the rule for the analyst
  reading and for any future AI use unless an ADR narrows it the way this one does.
- A household that never registers a key, or a deploy with `AI_PROVIDER=off`, sees `/categorizar`
  exactly as before.

## Alternatives considered

- **Automatic suggestions on page view or after sync.** Spends the household's money without a
  press and sends descriptions nobody asked to send; rejected by the owner's decision.
- **Caching by a hash of the fingerprint instead of per transaction.** Would let a future
  transaction reuse an old answer without a call, but needs either a second copy of the description
  or a keyed hash with its own secret; read-time inheritance between uncategorized transactions in
  the window gets the same saving with neither.
- **Storing the suggestions in `ledger`.** Keeps the queue's inputs local, but `ledger` cannot call
  the model without importing `analysis`, which would create a cycle; splitting the AI artefacts
  across two slices is worse than one plain input parameter.
- **Generalising `AiClient.complete` with a schema parameter.** One method instead of two, but it
  changes the analyst reading's request type and every test around it for no product gain.
- **Sending history examples and household subcategory names.** Better accuracy, but beyond what
  the owner approved (only the pending transactions' description, amount and direction) and more
  tokens; left as an open question the owner answered no on 2026-11-25.

## Amendments to other documents

### ADR-0004, new amendment

> ## Amendment 2026-11-25 (ADR-0014): category suggestions narrow the input rule
>
> - **The input rule is per use.** "No raw transactions, no free-text bank descriptions, no
>   personal identifiers" remains the analyst reading's contract, and the default for any new AI use.
>   ADR-0014 adds one exception: category suggestions send the description, absolute amount and
>   direction of the guided window's pending transactions that the household's history cannot place,
>   only when a member presses "Sugerir categorias com IA", through the household's own key. Nothing
>   else from a transaction (date, account, institution, documents) and nothing personal beyond what a
>   description itself contains is ever sent.
> - **It is classification, not interpretation.** The output is a subcategory id from a closed list,
>   or null, constrained by structured outputs and re-validated with Zod; it contains no number, so the
>   number validator does not apply, and it is never applied without a member saving it.
> - **Storage by reference.** "Every analysis is stored with its full input object" holds for
>   readings. A category suggestion stores the transaction it answers (whose row is the input of
>   record), the prompt version (which pins the taxonomy it was offered by hash) and the model, never a
>   copy of the description; it is reproducible while the transaction exists and is deleted with it.
> - **Limits.** Five presses per household per household-local day, one at a time, at most 40
>   description groups per call, under the same household-row lock as the on-demand quota.

### ADR-0013, new amendment

> ## Amendment 2026-11-25 (ADR-0014): a third family, for category suggestions
>
> `household_ai_settings.category_suggestion_family` (default `haiku`) is the family for category
> suggestions, chosen on Casa by an owner or admin beside the other two and resolved the same way.
> Its calls use a new tier, `light` (`low` effort); the Models API's `effort.low` capability is read
> as optional, so a listing without it only makes a model ineligible for this tier, never for the
> readings. The family exports with the other two to whoever last changed the settings.

### ADR-0008, data map rows (insert after "AI analyses")

> | AI category suggestions: per household and transaction, the product subcategory the model
> suggested or none, the prompt version and the answering model (`category_ai_suggestion`, ADR-0014)
> | Pre-filling guided categorization for transactions the household's history cannot place | Until
> the transaction is deleted (cascades with its account and connection) or the household is deleted;
> kept but never read while the account is assigned elsewhere; deleted by
> `analysis.runDailyPruneStep` 240 days after it was written | Household-scoped repository
> (`analysis.createCategorySuggestionsRepository`); every read and write is predicated on the
> transaction's account being assigned to the session's household (INSERT ... SELECT), never a
> client-supplied household id; no description, amount or author of its own; isolation tests in
> `analysis/category-suggestions.integration.test.ts` |
> | Category suggestion runs: household, who pressed, household day, status, prompt version,
> requested and answering model, groups and transactions sent, suggestions returned, token counts,
> failure reason (`category_suggestion_run`, ADR-0014) | Per-household daily quota and one-at-a-time
> lock on "Sugerir categorias com IA" (CLAUDE.md principle 7), attribution of each AI call to a
> household | 30 days, deleted by `analysis.runDailyPruneStep`; deleted with the household;
> `requested_by_user_id` is set null when that user is deleted | Holds no description, amount or
> transaction id; household-scoped repository; counted and inserted under a lock on the household
> row; isolation tests in `analysis/category-suggestions.integration.test.ts` |

### ADR-0008, other changes

> - In the "Audit log of access to financial data" row, the kind list becomes "(overview,
>   transactions, categories, reserve, export, analyses, category_suggestions)" and the parenthetical
>   adds "category_suggestions added 2026-11-25, ADR-0014".
> - Consequences, the bullet naming third parties: replace "analyses send computed numbers only,
>   never transactions" with "analyst readings send computed numbers only, never transactions;
>   category suggestions (ADR-0014) send the description, absolute amount and direction of pending
>   transactions, only on a member's press, through the household's own Anthropic key".
> - New consequence: "Category suggestions (amended 2026-11-25, ADR-0014) are a disclosure to
>   Anthropic chosen by a member at the moment of the press. The press is recorded as an access of
>   kind `category_suggestions` after the candidates are read and before the call, so a failed audit
>   write sends nothing. Terms and privacy policy moved to a new version, and the bank-connection
>   consent to a new scope version, because both said descriptions were never sent; consents accepted
>   under the previous scope version keep the text their users saw, and every user re-accepts the
>   terms before using Feudo again. Neither new table is exported: suggestions are household-wide
>   derived data with no author, runs are a short-lived usage control."

### CONTEXT.md, replacement for "Categorization suggestion" and a new entry after it

> **Categorization suggestion**:
> What Feudo proposes for an uncategorized transaction. First from the household's own history,
> deterministically: among the transactions its proposed rule text matches, in the same direction,
> the subcategory the household most often gave to those of the same absolute amount (ties go to the
> most recent); when none shares the amount, the subcategory they all agree on, and nothing from
> history when they disagree, because a generic description (a Pix, a boleto, a person's name) covers
> unrelated payments. With nothing from history, an AI category suggestion when the household asked
> for one; then income for money coming in, and nothing for money going out. Never applied until a
> member saves it.
>
> **AI category suggestion** (ADR-0014):
> A subcategory proposed by the household's AI model for an uncategorized transaction that history
> cannot place, shown on guided categorization as "Sugestão da IA" and only pre-filling the choice.
> Asked for only when a member presses "Sugerir categorias com IA": one call sends the description,
> amount and direction of up to 40 such transactions (one per distinct description, amount and
> direction) through the household's own Anthropic key, at the family chosen for category suggestions
> (Haiku by default); five presses per household per household-local day, one at a time. Only Feudo's
> own subcategories can be suggested, or none. A transaction is never sent twice for the same prompt
> version, and one that shares description, amount and direction with an asked one takes its answer.
> Belongs to the household that asked, like a deferral.
> _Avoid_: auto-categorization, AI categorization (nothing is categorized until a member saves)

### UBIQUITOUS_LANGUAGE.md

> - Row "Categorization suggestion": notes become "from the household's own history (same
>   description and amount first); then an AI category suggestion if one was asked for".
> - New row: `| AI category suggestion | sugestão da IA | "Sugerir categorias com IA"; only
pre-fills, never saves; product subcategories only |`
> - Row "Model family": notes become "Haiku, Sonnet or Opus; chosen per reading kind and for
>   category suggestions, never a pinned version".
