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
A user's authorization for Feudo to read data from one institution through a data provider. It belongs to the user who authorized it; no other user can see, update or remove it. Meu Pluggy has no endpoint that lists a user's connections, so the user identifies the one to bring into Feudo by pasting its **Item ID**, Pluggy's own identifier, which is kept verbatim in copy for that reason.
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
A checking, savings, credit-card or investment position that a bank connection exposes. An account is assigned to exactly one household and is visible to every member of that household.
_Avoid_: wallet, balance

**Shared account**:
An account the household treats as the household's own, for reporting purposes. The label never restricts visibility.

**Individual account**:
An account the household treats as one member's own, for reporting purposes. Every member still sees it in full. Default label for a newly assigned account.
_Avoid_: private account, personal account

**Sync**:
The daily read of every bank connection with its owner's own credentials, one connection at a time: its accounts, positions and transactions are read from the provider and stored. Feudo never asks the provider to re-read the bank; Meu Pluggy does that on its own every 24 hours (ADR-0005). The first sync of a connection reads from the first day of the month twelve months back, unless a narrower start is already remembered for it; later ones re-read from a week before the last successful sync, so late or revised postings are picked up without duplicates. A failed sync records why on the connection and leaves its data and last sync time untouched. The run has a deadline (the route's function limit minus headroom); a connection with too little time left to start is left `unreached`, one already deleted mid-run counts as `gone`. An error other than a tenant-ownership violation raised while attempting a connection is caught for that connection alone, counted `failed` and logged by the connection's id, so one connection's trouble does not fail the whole run. The connection queue (`listConnectionsToSync`) orders strictly by when a connection was last attempted (`bank_connection.last_sync_attempted_at`, stamped from the run's own clock at the start of every attempt, before any provider call, oldest/never-attempted first), never by how that attempt ended: ordering by error or last success instead would let a connection stuck failing the same way every day sort first forever. Each connection also gets its own abort budget, at most half the run's total, so even several connections stuck at once can cost at most half a run each, not the whole run between them; the rest still get their turn, since the queue rotates round-robin regardless of outcome (degraded throughput when connections are stuck, not starvation). A connection cut short by its own budget is recorded `too_slow` when it got its full half-run slice and still didn't finish (its own listing is the likely reason), or `timed_out` when the run itself was close enough to its deadline that the connection got less than its full slice (simply its turn in the queue, not its own doing). A first sync (no transactions in the ledger yet for this connection) that fails `too_slow` or a listing too long to page through (`listing_too_long`) sets its own sticky narrowing memory (`bank_connection.first_sync_since`) to the previous month, once, the first time it happens, if still unset. A lone `timed_out` does not narrow on its own, since it says nothing about this connection's own size; but two deadline aborts in a row for the same connection, this run's `timed_out` following a `too_slow` or `timed_out` from its previous attempt, do narrow, since that pattern means the connection keeps losing its slice to something else in the queue rather than to its own history. `first_sync_since` is set at most once and stops being read the moment the connection has an actual synced transaction; it is not touched again after that. When the connection wizard hits a too-long listing on a brand-new connection, it retries once with that narrowed window and, on success, persists the narrowed date as `first_sync_since` right away, so the daily job starts from it too instead of retrying the same twelve months.
_Avoid_: refresh (that is Meu Pluggy's own step, outside Feudo), import

**Institution**:
A bank or financial company a user can connect. Referenced by name, Open Finance identifier, financial conglomerate and FGC participation.
_Avoid_: bank (in code; "bank" is fine in user-facing text), connector

### Ledger

**Transaction**:
A single movement on an account, synced from the bank: a purchase, a payment, a transfer, a yield credit. Amounts are integer centavos with a currency code.
_Avoid_: entry, movement, record

**Internal transfer**:
A pair of transactions moving money between two accounts of the same household, including a credit-card bill payment. Never spending, never income.
_Avoid_: own transfer, self transfer

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
A household's instruction that assigns a subcategory to transactions matching a pattern. Applied on sync; manual recategorization always wins.

**Fixed cost**:
Spending in subcategories of kind fixed. The product marks the usual ones as fixed by default and a household can override the kind per subcategory. Detected recurring spending is suggested as fixed, never applied silently.
_Avoid_: essential spending, mandatory expense

**Savings rate**:
Income minus spending, as a share of income, for a month.

### Reserve

**Reserve target**:
The amount the household should hold as an emergency reserve: the reserve multiple times the average monthly fixed cost.
_Avoid_: emergency fund goal, safety net

**Reserve multiple**:
How many months of fixed cost the target covers. Default 6, adjustable per household between 3 and 12.

**Reserve position**:
An account, including an investment position, that the household marks as part of its reserve. The product suggests liquid instruments and warns when a marked position is not liquid or its liquidity is unknown.
_Avoid_: reserve account, emergency fund holding

**Net real yield**:
What a reserve position earns after income tax, compared against the 12-month accumulated IPCA. The number the placement ranking orders by.
_Avoid_: real return, net rate

**FGC headroom**:
How much more a CPF can hold in one financial conglomerate while staying inside the FGC coverage limit.
_Avoid_: FGC room, remaining coverage

**Average fixed cost**:
The mean monthly fixed cost over the last six complete months, computed with at least three; with fewer, the target is an estimate labelled with the months used.

### Market data

**Market data**:
Reference rates (CDI, Selic, IPCA) synced daily from Bacen's SGS API. Shared across every household, never scoped to one; the only domain table that belongs to no household and no user. Feudo's own annualised CDI and 12-month accumulated IPCA are computed values, distinguished from a rate Bacen itself publishes.
_Avoid_: indicators (ambiguous with dashboard stat tiles), rates table

### Banking intelligence

**Bank profile**:
Reference data about an institution: card benefits, investment access, app quality, security, fees, lock-in and public customer reviews (Reclame Aqui, consumidor.gov.br), each scored with cited evidence and a review date. Maintained by the product, not by households.
_Avoid_: bank rating, bank review

**Lock-in**:
How hard an institution makes it for a customer to leave or move money out: arbitrary limits, pushed products, friction on transfers, portability and account closure. A property of the bank, scored from evidence; Feudo itself only reads data.
_Avoid_: stickiness, retention tactics

**Bank comparison**:
A ranked list of two or three candidate institutions for a household, each with pros and cons against the institutions the household already uses, weighted by the household's own criteria weights.
_Avoid_: bank ranking, recommendation engine

**Criteria weights**:
How much each bank-profile criterion counts for a household. The product ships defaults; the household can adjust them.
