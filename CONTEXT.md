# Feudo

Household finances for people who pool their income: a shared ledger synced from their banks, an emergency-reserve target with placement ranking, and a scored view of how well banks serve the household.

## Language

### People and tenancy

**Household**:
The tenant. A group of people who pool income and manage money together. Every piece of financial data belongs to exactly one household.
_Avoid_: family, couple, team, workspace, tenant (in user-facing text)

**User**:
A person with a login. A user can belong to several households at once and works inside one at a time, the active household.
_Avoid_: account (reserved for bank accounts), customer

**Membership**:
The link between a user and a household, carrying the user's role in it.

**Role**:
What a membership allows. `Owner` administers people and settings and is the only one who can transfer ownership or delete the household. `Admin` administers people and settings. `Member` manages only their own bank connections. A household has exactly one owner.
_Avoid_: permission level, tier

**Active household**:
The household a user is currently working in. Everything the user sees and does is scoped to it.
_Avoid_: current workspace, selected tenant

**Invite**:
An offer, sent to an email address, to join a household with a given role.

### Banks and accounts

**Bank connection**:
A user's authorization for Feudo to read data from one institution through a data provider. It belongs to the user who authorized it; no other user can see, update or remove it. Meu Pluggy has no endpoint that lists a user's connections, so the user identifies the one to bring into Feudo by pasting its **Item ID**, Pluggy's own identifier, which is kept verbatim in copy for that reason. The connection's institution name is its owner's own label, typed when connecting or later through "Renomear"; left blank, it falls back to the provider's connector name, which Pluggy reports as "MeuPluggy" for every Meu Pluggy connection, never the underlying bank (ADR-0005). It is free text, not a reference to an **Institution**; the reserve reads it only as a default for which institution holds or issued an account, which the household can override (**Reserve mark**).
_Avoid_: item (Pluggy's term) to mean the connection itself, link, integration

**Bank-connection consent**:
The recorded acceptance that precedes every bank connection: the timestamp, the version and the exact text the user saw. It is user-scoped, backs exactly one connection, is deleted with it, and is honoured for a new connection only within 24 hours of acceptance; an accepted-but-abandoned consent is pruned by the daily job (ADR-0008).
_Avoid_: terms (that is the registration acceptance), authorization (ambiguous with the bank's own)

**Data provider**:
The service through which Feudo reads bank data on a user's behalf. Each user brings their own provider credentials; Feudo never pools several users' data under one credential.
_Avoid_: aggregator (in user-facing text), Pluggy (as a generic term)

**Provider credentials**:
The secret a user obtains from the data provider and hands to Feudo so it can read that user's data. Stored encrypted, shown to nobody, removable by the user at any time.

**Account**:
A checking, savings, credit-card or investment position that a bank connection exposes. An account is assigned to at most one household, always one its connection's owner belongs to, and is visible to every member of that household. The owner can move it, with its transactions and their manual categorizations and internal-transfer marks, to any other household they belong to; the source household's rules stay behind, and a transfer paired with an account that stays behind is no longer paired (ADR-0001). New accounts a connection starts listing land in the household its owner last chose for it (their active household when connecting, then wherever they last moved one of its accounts), and unassigned if they are no longer a member there.
_Avoid_: wallet, balance

**Unassigned account**:
An account in no household, visible only to its connection's owner, who sees it flagged under "Suas conexões" and can move it into a household. An account becomes unassigned when its household is deleted, or when its connection's owner leaves or is removed from that household: the household stops seeing it, and its transactions, in the same transaction that ends the membership (ADR-0001).
_Avoid_: orphan account, hidden account

**Shared account**:
An account the household treats as the household's own, for reporting purposes. The label never restricts visibility.

**Individual account**:
An account the household treats as one member's own, for reporting purposes. Every member still sees it in full. Default label for a newly assigned account.
_Avoid_: private account, personal account

**Sync**:
The daily read of every bank connection with its owner's own credentials, one connection at a time: its accounts, positions and transactions are read from the provider and stored. Feudo never asks the provider to re-read the bank; Meu Pluggy does that on its own every 24 hours (ADR-0005). The first sync of a connection reads from the first day of the month twelve months back, unless a narrower start is already remembered for it; later ones re-read from a week before the last successful sync, so late or revised postings are picked up without duplicates. A failed sync records why on the connection and leaves its data and last sync time untouched. The run has a deadline (the route's function limit minus headroom); a connection with too little time left to start is left `unreached`, one already deleted mid-run counts as `gone`. An error other than a tenant-ownership violation raised while attempting a connection is caught for that connection alone, counted `failed` and logged by the connection's id, so one connection's trouble does not fail the whole run. The connection queue (`listConnectionsToSync`) orders strictly by when a connection was last attempted (`bank_connection.last_sync_attempted_at`, stamped from the run's own clock at the start of every attempt, before any provider call, oldest/never-attempted first), never by how that attempt ended: ordering by error or last success instead would let a connection stuck failing the same way every day sort first forever. Each connection also gets its own abort budget, at most half the run's total, so even several connections stuck at once can cost at most half a run each, not the whole run between them; the rest still get their turn, since the queue rotates round-robin regardless of outcome (degraded throughput when connections are stuck, not starvation). A connection cut short by its own budget is recorded `too_slow` when it got its full half-run slice and still didn't finish (its own listing is the likely reason), or `timed_out` when the run itself was close enough to its deadline that the connection got less than its full slice (simply its turn in the queue, not its own doing). A first sync (no transactions in the ledger yet for this connection) that fails `too_slow` or a listing too long to page through (`listing_too_long`) sets its own sticky narrowing memory (`bank_connection.first_sync_since`) to the previous month, once, the first time it happens, if still unset. A lone `timed_out` does not narrow on its own, since it says nothing about this connection's own size; but two deadline aborts in a row for the same connection, this run's `timed_out` following a `too_slow` or `timed_out` from its previous attempt, do narrow, since that pattern means the connection keeps losing its slice to something else in the queue rather than to its own history. `first_sync_since` is set at most once and stops being read the moment the connection has an actual synced transaction; it is not touched again after that. When the connection wizard hits a too-long listing on a brand-new connection, it retries once with that narrowed window and, on success, persists the narrowed date as `first_sync_since` right away, so the daily job starts from it too instead of retrying the same twelve months.
_Avoid_: refresh (that is Meu Pluggy's own step, outside Feudo), import

**Manual sync**:
A member's "Sincronizar agora": the same read as the daily sync, limited to the connections with an account in their active household, each under its own owner's credentials. A household gets three per calendar day in its own time zone, shared by all its members; a press spends one whether the read succeeds or not, and a household with no account spends none. It only re-reads Meu Pluggy's snapshot: how fresh that is still depends on Meu Pluggy's own daily refresh (ADR-0005).

**Freshness**:
When Feudo last read an account successfully, shown in the household's time zone as "hoje, 06:10", "ontem, 22:15" or a date. An account not read for more than 48 hours is stale and the household is told so; a connection whose last sync failed says why, in plain language, and offers a retry through the manual sync.

**Institution**:
A bank or financial company a user can connect. Referenced by name, Open Finance identifier, financial conglomerate and FGC participation. The legal entity that holds the account can differ from the entity that carries the deposit guarantee: a payment institution (Nubank, PicPay, Mercado Pago) is not an FGC member, and the guarantee belongs to the bank or financing company in the same financial conglomerate. Distinct from a bank connection's institution name, which is a label its owner types and may not match.
_Avoid_: bank (in code; "bank" is fine in user-facing text), connector

### Ledger

**Transaction**:
A single movement on an account, synced from the bank: a purchase, a payment, a transfer, a yield credit. Amounts are integer centavos with a currency code. A transaction's day is its calendar day in the household's time zone, resolved at read time from the provider's instant when it gave one; a provider timestamp at exact midnight UTC carries no time-zone information and is read as a plain date instead.
_Avoid_: entry, movement, record

**Internal transfer**:
A pair of transactions moving money between two accounts of the same household, including a credit-card bill payment. Never spending, never income. Detected by pairing (same amount and currency, opposite direction, at most two business days apart, confirmed by the counterpart's document when the bank sends one), or marked by a member.
_Avoid_: own transfer, self transfer

**Internal-transfer mark**:
A member's manual statement about one transaction: it is an internal transfer, or it is not. Beats detection and every categorization; the member can clear it to go back to detection. Travels with the transaction when its account moves.
_Avoid_: flag, tag

**Income**:
An inbound transaction whose category is of kind income: salary, fees, rent received, yields. Internal transfers and refunds are never income.
_Avoid_: revenue, earnings, inflow

**Spending**:
An outbound transaction whose category is of kind fixed or variable. A credit-card purchase is spending on its purchase date, each installment on its own date; the bill payment is an internal transfer.
_Avoid_: expense, outflow, cost

**Category**:
A top-level classification of transactions defined by the product (for example Housing). Households cannot create categories.

**Subcategory**:
A finer classification under a category (for example Rent). The product ships a default set; a household can add its own, each with a kind.

**Kind**:
What a subcategory means for the calculations: `income`, `fixed`, `variable` or `transfer`. Calculations read kinds, never category names.

**Categorization rule**:
A household's instruction that assigns a subcategory to transactions whose description contains a pattern, optionally only credits or only debits. Applies to past and future transactions alike; manual recategorization always wins.

**Uncategorized**:
A transaction that no internal-transfer mark or pair, manual choice, household rule, product default or provider category places in a subcategory. It has no kind, counts in no total, and is shown with its count and amount until a member categorizes it.

**Fixed cost**:
Spending in subcategories of kind fixed. The product marks the usual ones as fixed by default and a household can override the kind per subcategory. Detected recurring spending is suggested as fixed, never applied silently.
_Avoid_: essential spending, mandatory expense

**Savings rate**:
Income minus spending, as a share of income, for a month.

### Reserve

**Reserve target**:
The amount the household should hold as an emergency reserve: the reserve multiple times the average monthly fixed cost, floored at zero (a negative average, from fixed-cost refunds exceeding fixed-cost debits, is a fact worth showing but never a negative target). The Reserva page always shows the live target, computed the same way and from the same six-month window as the Visão geral tile, so the two numbers can never disagree. Once a day, the daily job also records the target for the household-local month that just closed (the month before the household's own current month, resolved in its time zone); this recorded history is what a notice compares against, not what the page displays.
_Avoid_: emergency fund goal, safety net

**Reserve multiple**:
How many months of fixed cost the target covers. Default 6, adjustable per household between 3 and 12. Changing it recomputes the live target at once; it never records a month-close entry or triggers a notice by itself. Only the household's owner or admin can change it (Role); a member sees it read-only.

**Reserve target notice**:
A household-wide notice, created only when a month close moves the recorded target by strictly more than 10% from the latest earlier recorded one. The previous record's average fixed cost is rescaled to the household's _current_ reserve multiple before the comparison, so a household that only changed its multiple is never notified for that reason alone. Any member can dismiss it, for the whole household. Shown as a dismissible panel on the Reserva page and, compactly, as a banner on Visão geral; in-app only until web push ships (#29).
_Avoid_: reserve alert, target warning

**Reserve position**:
An account, including an investment position, that the household marks as part of its reserve. Any member can mark or unmark one; the mark belongs to the household, so an account moved to another household arrives unmarked there. The product suggests liquid, protected accounts that are not marked yet and warns when a marked position is not liquid or its liquidity is unknown. Coverage is the sum of the BRL balances of the household's reserve positions, shown in reais, as a share of the reserve target and in months of average fixed cost, each floored so it never claims more than there is.
_Avoid_: reserve account, emergency fund holding

**Reserve mark**:
What one household says about one of its accounts for the reserve: whether it is a reserve position; whether it can be redeemed within one business day, asked only where the product type cannot tell (a CDB, LCI or fund can; a checking account, poupança and Tesouro Selic always can); and which institution issued it, asked only for deposits and bank-issued instruments. The issuer defaults to the institution the connection's label names (`matchInstitutionByLabel`), and the household can pick another or say it is outside the reference list, which leaves its FGC coverage unverified.
_Avoid_: reserve flag, reserve setting

**Placement ranking**:
The answer to "where should the next reais of the reserve go" (ADR-0009): every account of the household that can hold money (not a credit card) is evaluated; those redeemable within one business day and covered (FGC or FGCoop with headroom left for the holder, or Tesouro Selic) are ranked by net real yield, ties broken by FGC headroom, Tesouro Selic first; the top three are shown as the ranking and the rest under "também avaliados", each ranked one with its place and each excluded one with every reason that applies. A balance at a payment institution (Nubank, PicPay, Mercado Pago) is not covered, while what the same conglomerate's bank issues is.
_Avoid_: recommendation, best investment

**Net real yield**:
What a reserve position earns after income tax, compared against the 12-month accumulated IPCA. The number the placement ranking orders by. The rate is first converted to an annual nominal rate: % of CDI compounded over 252 business days, a fixed annual rate as is, IPCA+ over the 12-month IPCA, Tesouro Selic at the effective Selic (the daily series, annualised), poupança by its legal rule on the Selic target without TR, and nothing for a checking account. Income tax is the regressive bracket for the position's real holding age today, the worst bracket when the acquisition date is unknown, and none for LCI, LCA, LIG and poupança.
_Avoid_: real return, net rate

**FGC headroom**:
How much more a CPF can hold in one financial conglomerate (as the Central Bank publishes it) while staying inside the FGC coverage limit. For a credit cooperative covered by FGCoop, the limit applies per cooperative instead; since the provider does not name the cooperative, every Sicoob position of a holder shares one limit, which can only understate the headroom. Computed over the household's own covered BRL positions of that holder; a position without a holder document is its own group. A holder with no headroom left in a conglomerate is excluded there.
_Avoid_: FGC room, remaining coverage

**Average fixed cost**:
The mean monthly fixed cost over the last six complete months, computed with at least three; with fewer, the target is an estimate labelled with the months used. A month counts toward this history only if it has at least one categorized transaction; a month with nothing categorized yet is a gap, not a zero, and is left out rather than silently pulling the average down.

### Market data

**Market data**:
Reference rates (CDI, Selic, IPCA) synced daily from Bacen's SGS API. Shared across every household, never scoped to one; the only domain table that belongs to no household and no user. Feudo's own annualised CDI and 12-month accumulated IPCA are computed values, distinguished from a rate Bacen itself publishes.
_Avoid_: indicators (ambiguous with dashboard stat tiles), rates table

### Banking intelligence

**Bank profile**:
Reference data about an institution: card benefits, investment access, app quality, security, fees, lock-in and public customer reviews (Reclame Aqui, consumidor.gov.br), each scored as an integer from 0 to 100 with cited evidence and a review date, or marked as insufficient evidence when no source backs a score. Higher is always better for the household. Maintained by the product, not by households.
_Avoid_: bank rating, bank review

**Lock-in**:
How hard an institution makes it for a customer to leave or move money out: arbitrary limits, pushed products, friction on transfers, portability and account closure. A property of the bank, scored from evidence so that 100 means the easiest to leave; Feudo itself only reads data.
_Avoid_: stickiness, retention tactics

**Bank comparison**:
A ranked list of up to three candidate institutions for a household, each with pros and cons against the institutions the household already uses, weighted by the household's own criteria weights. An institution's score is the mean of its evidenced criterion scores weighted by the household's weights, rounded to an integer from 0 to 100; a weighted criterion with insufficient evidence is left out of the mean and named, never guessed. Candidates are the top-scored institutions the household does not use, among those with a score; with thirteen profiled institutions there are three in practice. A pro or a con is a weighted criterion where the candidate is at least 10 points above or below the best score the household's own institutions reach on it. The institutions a household uses are inferred from the institution names of the connections behind its accounts, matched to an **Institution** by name or Open Finance brand; a name that matches none ("MeuPluggy") is shown as unrecognised, and a household with no recognised institution is compared with the median bank instead. Computed deterministically in `packages/core`; nothing is stored.
_Avoid_: bank ranking, recommendation engine

**Criteria weights**:
How much each bank-profile criterion counts for a household, an integer from 0 ("não conta", the criterion is left out) to 5. The product ships defaults; the household's owner or an admin can adjust them or go back to the defaults, and at least one criterion must count. Weights are normalised, so only their proportions matter. A household that never changed them has no stored row; a criterion added later starts at its default.

### Analysis

**Analyst reading**:
A short written interpretation of the household's own figures, produced by the AI layer (ADR-0004) and shown as "Leitura do analista" on Visão geral and Reserva. It reads the last closed month of the ledger and the reserve and bank comparison as they stand, quotes only figures the household can find on screen, names the trade-offs (liquidity × yield × risk) and always gives the counter-argument to whatever it leans towards. A **monthly reading** is written once per household per closed month by the daily cron with the deeper model; an **on-demand reading** is asked for with "Gerar nova leitura", three per household per household-local day, shared by every member, each press counting whether the reading succeeds or not. Every reading is stored with the exact facts it was given, the prompt version and the model, and the newest successful one is shown. It never changes a number and is not investment advice; with the analyst turned off, every screen works as before.
_Avoid_: AI advice, insight, recommendation

### Audit log

**Financial-data access**:
One row per server-side read of financial data — who, which household, what kind (overview, transactions, reserve, export), when (ADR-0008). Written at the server boundary of each read, concurrently with it, so a failed write fails the read too. Holds no amounts, descriptions, documents or filters; kept 12 calendar months, then purged by the daily job. Each member sees only their own recent access, on the Casa page ("Seus acessos recentes"), never another member's.
_Avoid_: access log content describing what was read, beyond its kind
