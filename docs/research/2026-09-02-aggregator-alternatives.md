# Open Finance data aggregator alternatives for Feudo (Brazil)

Research date: 2026-09-02. Every fact below is tagged "checked 2026-09-02" and sourced from a
primary page (vendor site, docs, ToS/pricing page) unless explicitly marked as a secondary or
community source, which is called out inline. Where a vendor hides pricing, this doc says
**"not public"** rather than guessing.

Context: Pluggy's commercial "Dados" plan is **R$ 2.500/month minimum**
([pluggy.ai/precos](https://www.pluggy.ai/precos), checked 2026-09-02), which is not viable for a
solo/non-commercial household app.

---

## 1. Meu Pluggy in depth

Meu Pluggy (`meu.pluggy.ai`) is Pluggy's free personal Open Finance product.

- **What a user gets**: a personal `clientId`/`clientSecret` pair ("Copie o Client ID e o Client
  Secret - São as credenciais que seu app vai usar") that can call the same Pluggy REST API used
  by paying customers, plus a hosted dashboard/Connect flow to link accounts.
  Source: [pluggy.ai/meu-pluggy](https://www.pluggy.ai/meu-pluggy), checked 2026-09-02.
- **Item/account limit**: no fixed number. The FAQ on that page states: _"Existe limite de contas
  que posso conectar no Meu Pluggy? Não, desde que todas as contas sejam suas, nominais."_ (No,
  as long as all accounts are yours, in your own name.)
  Source: [pluggy.ai/meu-pluggy](https://www.pluggy.ai/meu-pluggy), checked 2026-09-02.
- **Connect widget**: yes — Meu Pluggy uses Pluggy's own Connect flow internally to link banks
  ("Connect My Account" → add each bank). The Connect widget for an _external_ app is a separate,
  paid capability; Meu Pluggy's own web app is the only widget included free.
  Source: [meu.pluggy.ai](https://meu.pluggy.ai) + [pluggy.ai/meu-pluggy](https://www.pluggy.ai/meu-pluggy), checked 2026-09-02.
- **Pricing**: free indefinitely — _"gratuito por tempo indeterminado, sem prazo de expiração."_
  Source: [pluggy.ai/meu-pluggy](https://www.pluggy.ai/meu-pluggy), checked 2026-09-02.
- **Personal vs. commercial line, quoted verbatim** (all from
  [pluggy.ai/meu-pluggy](https://www.pluggy.ai/meu-pluggy) FAQ, checked 2026-09-02):
  - _"Posso usar essa API para fins comerciais? Não. Uso comercial exige o plano pago da Pluggy."_
  - _"Este fluxo é para uso pessoal"_ — and, on what pushes a user out of the free tier: _"Para
    atender clientes, conectar contas de múltiplos CPFs ou transformar em um produto comercial"_
    you need the paid plans.
- **What this means for a couple**: Meu Pluggy's own definition of "personal use" is scoped **per
  CPF** — one account, all-yours-and-nominal. The clause that requires the paid plan is connecting
  **multiple CPFs' accounts under one flow/product**, not two people each independently using
  Pluggy for their own money. The plain reading is that each partner opening their **own**
  Meu Pluggy account (own login, own `clientId`/`clientSecret`, own CPF's accounts only) and each
  plugging their own credentials into a shared self-hosted, not-for-sale app stays inside "uso
  pessoal" for each individual — the app never itself becomes a Pluggy customer routing multiple
  CPFs through one credential set. That said, **the general Terms and Conditions PDF
  ([pluggy.ai/legal](https://www.pluggy.ai/legal) →
  `termos-e-condicoes-de-uso.pdf`, checked 2026-09-02) contains no explicit clause addressing a
  household/couple scenario** — it is a generic B2B-style ToS (PLUGGY ↔ "Você"/Usuário ↔ "Empresa")
  and does not define "personal use" itself; that definition lives only on the marketing/FAQ page
  quoted above, not in a binding legal document. **This is a genuine gray area — worth a direct
  confirmation from Pluggy support before relying on it long-term**, since FAQ copy is not a
  contract clause and Pluggy could tighten it.

## 2. Pluggy development environment and "production" restriction

- Pluggy distinguishes three environments: **Sandbox** (synthetic test data only), **Development**
  (real API, real accounts, capped), and **Production** (real API, no cap, billed).
- **Development environment cap, quoted from the docs FAQ**: _"O ambiente de Desenvolvimento tem
  limite de criação de 100 itens."_ Production removes that cap: _"Não há limite de itemIds."_
  Each environment has its own `clientId`/`clientSecret`.
  Source: [docs.pluggy.ai/page/faq](https://docs.pluggy.ai/page/faq), checked 2026-09-02.
- There is no single sentence in the public docs literally reading "cannot be used in production."
  The practical mechanism is billing-based, not a hard technical block: creating a Dashboard
  account gives **14 days of full production trial access with no credit card**, and once the
  trial ends, _"conexões com contas de clientes reais são pausadas até você ativar um plano"_
  (real customer connections pause until you activate a plan) — confirmed via Pluggy's pricing
  page copy. Source: [pluggy.ai/precos](https://www.pluggy.ai/precos), checked 2026-09-02.
- **No hobby/startup/indie/usage-based plan below R$ 2.500/month exists on the public pricing
  page.** The only two published plans are **Dados (Data)** at **R$ 2.500/month minimum** and
  **Pagamentos (Pix)** at **R$ 500/month minimum**; above the minimum, "Precificação baseada em
  volume aplica-se acima dos limiares mínimos mensais" (volume-based pricing above the monthly
  minimum) — i.e., R$ 2.500/month is a floor, not a per-request starting price. There is no visible
  per-request/pay-as-you-go tier for small volumes.
  Source: [pluggy.ai/precos](https://www.pluggy.ai/precos), checked 2026-09-02.
- The only genuinely free, indefinite option for real (non-sandbox) data remains **Meu Pluggy**
  (Section 1), which Pluggy documentation itself calls out as the path for a single person's own,
  free API access. Source: [pluggy.ai/meu-pluggy](https://www.pluggy.ai/meu-pluggy), checked 2026-09-02.

## 3. Alternatives in Brazil

| Vendor                     | What it offers                                                                                                                                                        | Pricing model / cheapest public price                                                                                                                                       | Free/sandbox tier                                                                                                      | Hobby/individual-dev friendly?                                                                                                                                                                                                                                   | SDK/widget                         | Per-user self-auth                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| **Pluggy (Dados)**         | Open Finance (regulated) + proprietary screen-scraping fallback                                                                                                       | R$ 2.500/month minimum, volume above that                                                                                                                                   | Sandbox + 14-day full trial; Meu Pluggy free tier (Section 1)                                                          | Only via Meu Pluggy, not the paid API                                                                                                                                                                                                                            | Connect widget (paid tier)         | Yes, via Connect widget                                                       |
| **Belvo**                  | Open Finance (regulated) + proprietary; Brazil coverage explicit (Itaú, Caixa, Santander PJ in beta)                                                                  | **"Launch" plan starts at US$ 1.000/month**; "Growth" is quote-only                                                                                                         | Free sandbox, evaluation-only, no real accounts                                                                        | No — no free real-data tier                                                                                                                                                                                                                                      | Widget included                    | Yes                                                                           |
| **Klavi**                  | Open Finance data + credit analytics, Brazil-focused                                                                                                                  | **Not public** — no self-serve pricing page found; sales-led                                                                                                                | Not documented publicly                                                                                                | Not established from public sources                                                                                                                                                                                                                              | Not documented                     | Not documented                                                                |
| **Celcoin (Open Finance)** | Open Finance + broader banking/payments infra (BaaS)                                                                                                                  | **Not public** — "pricing considers transactions processed, no setup fee," but no rate card; sandbox creds requested from sales with CNPJ                                   | Free sandbox, but _requesting access requires a CNPJ, company name and product list_ — not built for a lone individual | No — onboarding assumes a company                                                                                                                                                                                                                                | Docs + SDKs for partners           | Yes, in principle                                                             |
| **Finansystech**           | Not found as a distinct public product in this research — no dedicated pricing/sandbox page surfaced                                                                  | **Not public** / not confirmed                                                                                                                                              | Not confirmed                                                                                                          | Not confirmed                                                                                                                                                                                                                                                    | Not confirmed                      | Not confirmed                                                                 |
| **Iniciador**              | Payment initiation (PISP) + Open Finance data, Bacen-authorized ITP                                                                                                   | **Not public**, sales-led B2B                                                                                                                                               | Not documented publicly                                                                                                | No — enterprise/B2B positioning                                                                                                                                                                                                                                  | White-label backoffice + APIs      | Yes, in principle                                                             |
| **Quanto**                 | Not independently verified in this research pass — searches returned no distinct Quanto (data aggregator) pricing/product page separate from TecnoSpeed/other vendors | **Not public** / not confirmed                                                                                                                                              | Not confirmed                                                                                                          | Not confirmed                                                                                                                                                                                                                                                    | Not confirmed                      | Not confirmed                                                                 |
| **Lina Open X**            | Open Finance infra (payment initiation + data reception) via RTM partnership                                                                                          | **Not public**, sales-led B2B infra play                                                                                                                                    | Sandbox exists (`docs.linaopenx.com.br`) but access process not public                                                 | No — enterprise infra provider                                                                                                                                                                                                                                   | APIs, docs                         | Yes, in principle                                                             |
| **Bankly**                 | BaaS / payments infra; no dedicated Open Finance _data aggregation_ product surfaced                                                                                  | **Not public**                                                                                                                                                              | Not confirmed                                                                                                          | No — B2B BaaS                                                                                                                                                                                                                                                    | Not confirmed                      | Not applicable in this research                                               |
| **Dock**                   | BaaS / issuing / core banking infra; Open Finance mentioned as part of broader platform, not a standalone cheap data API                                              | **Not public**                                                                                                                                                              | Not confirmed                                                                                                          | No — enterprise infra                                                                                                                                                                                                                                            | Not confirmed                      | Not confirmed                                                                 |
| **Kobana**                 | Multi-bank charges (boletos/Pix) + a "unified API for connecting to multiple banks"; developer-oriented docs and sandbox exist per product                            | **Not public** on the researched pages                                                                                                                                      | Sandbox exists across products                                                                                         | Positions itself as "an API built for developers," more approachable than the enterprise players, but still no published self-serve/free tier for real bank-account data                                                                                         | Docs, sandbox per product          | Not confirmed for account-data product                                        |
| **Tecban / Open TecBan**   | Open Finance "hub"/marketplace connecting banks and companies (via Ozone API partnership), monetizes "premium APIs"                                                   | **Not public**                                                                                                                                                              | Not confirmed                                                                                                          | No — B2B marketplace/infra for banks and large companies                                                                                                                                                                                                         | Not confirmed                      | Not applicable                                                                |
| **Efí (Gerencianet)**      | Primarily Pix payment-initiation API (`efi-pay/api-open-finance`), **not** a general accounts/transactions data aggregator                                            | Pix API has promotional free tiers for PJ; not a data-aggregation price                                                                                                     | Sandbox ("ambiente de testes controlável")                                                                             | Community thread shows a pessoa física explicitly asking whether they can access Open Finance APIs to read their own statement/card data for personal dashboards — the thread had no visible public answer at fetch time, so treat PF self-access as unconfirmed | SDKs in major languages            | Not confirmed for data (only for Pix payments)                                |
| **TecnoSpeed (PlugBank)**  | Open Finance statement/invoice sync into ERPs, 47+ banks, no VAN/Bacen bureaucracy needed by the client                                                               | **Not public** on the product page itself; community source (TabNews, secondary) cites **R$ 1.500 setup + R$ 540/month** as the cheapest of the paid options compared there | "Sandbox imediato" mentioned, details not public                                                                       | Signup asks for company name, employee count, business sector — **built for software houses, not individuals**                                                                                                                                                   | JSON API, no SDK/widget documented | Yes, "cliente autoriza o compartilhamento... com autenticação digital segura" |

Also checked from **openbankingtracker.com**: the site returned HTTP 429 (rate-limited) on fetch
at research time and could not be read directly; no Brazil-specific participant list could be
confirmed from it in this pass. Treat this source as **not verified**.
Source: [openbankingtracker.com](https://www.openbankingtracker.com/), checked 2026-09-02 (fetch failed, HTTP 429).

### Bank-run free developer APIs for personal account data

- **Banco Inter**: has a full developer portal (`developers.inter.co`) with statement/balance
  APIs, and the account itself is free to open — but _"para utilizar a integração bancária
  automática com o Inter, é necessário ser correntista cliente PJ... cliente PF e MEI não possuem
  acesso à integração bancária automática"_ (automated banking integration requires a PJ account;
  PF and MEI clients do not have access). **Limited to business accounts.**
  Source: secondary aggregation of Inter's own developer materials via
  [developers.inter.co](https://developers.inter.co/) and partner integration docs, checked 2026-09-02.
- **Banco do Brasil**: `bb.com.br/site/developers` is free to access, but _"o uso das APIs de Open
  Banking é destinado a pessoa jurídica"_ — **Open Banking/account-movement APIs are for PJ, not
  PF.** Source: [bb.com.br/site/developers](https://www.bb.com.br/site/developers/), checked 2026-09-02.
- **Bradesco, Itaú**: both expose developer/Open Finance APIs, but in every source found they are
  positioned for corporate/PJ integration (ERP, accounting software) — no evidence of a free
  personal-account API for individuals in either bank's public developer materials as surfaced by
  this research.
- **Nubank**: has no public developer API at all (confirmed by absence in all searches, consistent
  with `CLAUDE.md`'s own note that "Nubank has none").

## 4. Direct Open Finance Brasil participation (three lines)

Only institutions **authorized to operate by the Central Bank of Brazil (Bacen)** — banks, payment
institutions, credit unions, and Bacen-licensed fintechs — can register as Open Finance Brasil
participants (data transmitters or data receivers); registration requires proof of that Bacen
authorization in the Participants Directory. An individual person or a non-regulated software
company **cannot** become a direct participant/data receiver on their own. The regulation instead
lets an already-authorized participant partner with unauthorized entities to share data onward
(the mechanism vendors like Pluggy and Belvo use to serve non-bank apps) — so an app like Feudo
can only reach Open Finance data indirectly, through a licensed aggregator.
Source: [openfinancebrasil.org.br/quem-participa/](https://openfinancebrasil.org.br/quem-participa/)
and [openfinancebrasil.org.br/modelo-de-participacao/](https://openfinancebrasil.org.br/modelo-de-participacao/), checked 2026-09-02.

## 5. No-aggregator fallback: manual OFX/CSV export by bank

| Bank                  | Formats confirmed                                                                                                                                                                                                                                                                                 | Known limitations                                                                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nubank**            | OFX, CSV, PDF for the **credit card invoice**, sent to registered e-mail per closed invoice                                                                                                                                                                                                       | Historically CSV/OFX export was for the **card invoice only**; per Nubank's own X/Twitter support account, export is per closed fatura, not a live running statement; checking-account (conta) statement export in OFX/CSV is inconsistent/limited per community reports. |
| **Itaú**              | OFX (Money 2000) via Internet Banking, "Consultar extrato por período" → "Salvar em outros formatos"                                                                                                                                                                                              | Reported to require the desktop/Internet Banking flow (not app); must select "apenas lançamentos" to avoid extra noise.                                                                                                                                                   |
| **Bradesco**          | OFX and CSV via Internet Banking ("Saldos e Extratos" → "Extrato Mensal/Por Período" → "Salvar como arquivo")                                                                                                                                                                                     | Consolidated statement (incl. investments) export changed format since Sept 2024; historically PJ-oriented flows are documented more than PF.                                                                                                                             |
| **Banco do Brasil**   | OFX and CSV via Internet Banking ("Conta Corrente" → "Extrato" → "Salvar no Formato")                                                                                                                                                                                                             | Menu path changes periodically; both formats documented for checking account, not confirmed for card invoice.                                                                                                                                                             |
| **Caixa**             | OFX via Internet Banking ("Gerar Arquivo para Gerenciadores Financeiros")                                                                                                                                                                                                                         | **Only last 60 days available**, so exports must be done frequently; two OFX variants exist (complete/summarized) and only the complete one works with most integrations.                                                                                                 |
| **Santander**         | OFX (Money 2000+) via Internet Banking ("Conta Corrente" → "Extrato" → "Exportar")                                                                                                                                                                                                                | File must respect a max 5MB size and date-ordering constraints per third-party integration guides.                                                                                                                                                                        |
| **Inter**             | PDF statements up to 90 days confirmed; OFX/CSV export tied to the PJ API/integration flows, not clearly available to PF from the app                                                                                                                                                             | PF/MEI accounts excluded from the automated banking integration entirely (see Section 3).                                                                                                                                                                                 |
| **C6 Bank**           | **PF (personal)**: app-based "Exportar Extrato," but multiple 2024-2025 Reclame Aqui complaints report **no OFX/CSV option for PF, PDF only** for the checking account, and CSV/Excel for the card invoice. **PJ (business)**: full PDF/Excel/OFX/CSV export up to 180 days via the web platform. | **PF users report OFX/CSV specifically unavailable for the checking account** — a real limitation for a household app if either partner banks with C6 as PF.                                                                                                              |
| **BTG Pactual**       | PDF or Excel export via the BTG Banking app ("Extrato" → share icon)                                                                                                                                                                                                                              | No OFX confirmed in the sources found; investment statements are separate from the banking "Extrato" export.                                                                                                                                                              |
| **XP Investimentos**  | Credit card invoice: PDF or CSV via app. Trade notes ("Notas de Negociação"): per-day/per-month PDF download (B3 or XP model)                                                                                                                                                                     | No OFX confirmed for either invoices or trade notes in the sources found.                                                                                                                                                                                                 |
| **PicPay** (Empresas) | PDF, CSV, Excel, OFX via export icon + e-mail delivery — confirmed for **PicPay Empresas** (business)                                                                                                                                                                                             | PF export flow not separately confirmed in this pass.                                                                                                                                                                                                                     |
| **Mercado Pago**      | **PDF only** — Mercado Pago's own statement export has offered PDF only for some time per multiple third-party sources                                                                                                                                                                            | CSV/OFX require third-party PDF-to-OFX/CSV converters (unofficial, unverified accuracy).                                                                                                                                                                                  |

Sources are the banks' own Internet Banking flows as documented by accounting-integration help
centers (Conta Azul, Fintera, Superlógica) and the banks'/PicPay's own support articles, cross-
checked against community reports (Reclame Aqui, Nubank's official X account) for known gaps;
all checked 2026-09-02. Individual bank menu paths change without notice — treat exact click paths
as approximate, the format availability/limitation claims as the load-bearing facts.

## 6. Legal/compliance for a free, non-commercial app

- **LGPD applies regardless of business model.** A non-commercial app processing personal
  financial data of its users (even just the owner's household) is a data controller under LGPD;
  this is a constant across every vendor's own legal pages, e.g. Pluggy's Legal & Compliance page
  explicitly separates its own regulatory certifications from its customers' LGPD obligations.
  Source: [pluggy.ai/legal](https://www.pluggy.ai/legal), checked 2026-09-02.
- **Open Finance Brasil / Bacen licensing applies to the aggregator, not to the app consuming its
  API.** Pluggy's legal page links its own **BCB ITP (Iniciador de Transação de Pagamento)
  certificate**, its Central-Bank-authorized-institution listing, and its Open Finance Brasil
  Directory listing — these are Pluggy's regulatory credentials as the data-receiving participant,
  not something Feudo (as Pluggy's "Empresa"/client) needs to hold itself.
  Source: [pluggy.ai/legal](https://www.pluggy.ai/legal), checked 2026-09-02.
- **Where "commercial" is drawn, per Pluggy**: crossing from "uso pessoal" to needing a paid plan
  happens specifically at _"atender clientes, conectar contas de múltiplos CPFs ou transformar em
  um produto comercial"_ — i.e., serving other people as customers, aggregating several CPFs'
  accounts under one Pluggy relationship, or monetizing the product. A free, unsold, single-CPF-
  per-Meu-Pluggy-account household tool sits on the "personal" side of that line as written, though
  (per Section 1) this line is FAQ copy, not a contract clause.
  Source: [pluggy.ai/meu-pluggy](https://www.pluggy.ai/meu-pluggy), checked 2026-09-02.
- **Where "commercial" is drawn, per Belvo**: Belvo's public sandbox is explicitly
  _"testing and evaluation purposes only"_ and production access (real end-user accounts) requires
  a paid **Launch** plan starting at US$ 1.000/month — Belvo draws no free "personal use" line at
  all; any real account connection is treated as production/commercial from the first item.
  Source: [belvo.com/plans-and-pricing](https://belvo.com/plans-and-pricing/), checked 2026-09-02.
- No ISO certification or Bacen license is required of Feudo itself as long as it consumes data
  only through a Bacen-authorized aggregator (Pluggy/Belvo/etc.) under that aggregator's terms —
  the regulatory burden (FAPI/mTLS security certification, Open Finance Directory registration,
  BCB authorization) sits with the aggregator, confirmed structurally by the participation model
  described in Section 4.

---

## Comparison table

| Vendor                                                   | Data method                                                  | Cheapest entry                                           | Free tier                         | Hobby-friendly?                                                                  | Per-user auth widget?             |
| -------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------- | --------------------------------- |
| Pluggy (Meu Pluggy)                                      | Open Finance (regulated) + proprietary                       | Free, indefinite                                         | Yes — full API, own accounts only | **Yes**, but per-CPF; couple needs 2 separate accounts, gray area on ToS wording | Only inside Meu Pluggy's own flow |
| Pluggy (Dados/paid)                                      | Open Finance (regulated) + proprietary                       | R$ 2.500/month                                           | 14-day trial + sandbox            | No                                                                               | Yes (paid)                        |
| Belvo                                                    | Open Finance (regulated) + proprietary                       | US$ 1.000/month (Launch)                                 | Sandbox, eval-only                | No                                                                               | Yes                               |
| TecnoSpeed PlugBank                                      | Open Finance (regulated)                                     | Not public (community-reported ~R$1.5k setup + R$540/mo) | Sandbox mentioned, undocumented   | No (software-house onboarding)                                                   | Not documented                    |
| Celcoin                                                  | Open Finance (regulated) + BaaS                              | Not public                                               | Sandbox, requires CNPJ to request | No                                                                               | Yes (in principle)                |
| Klavi / Iniciador / Lina Open X / Dock / Bankly / Tecban | Open Finance (regulated), enterprise infra                   | Not public, sales-led                                    | Sandbox exists for some           | No                                                                               | Yes (in principle)                |
| Efí (Gerencianet)                                        | Pix payment initiation only (not accounts/transactions data) | Free/promotional for PJ Pix                              | Sandbox                           | Unclear for data use; PF self-access unconfirmed                                 | N/A for data                      |
| Bank OFX/CSV export                                      | Manual, self, no aggregator                                  | Free                                                     | N/A                               | Yes, but manual and inconsistent per bank (see Section 5)                        | N/A (you are the user)            |

## Ranked recommendation

**(i) Household only (2 people)**: **Meu Pluggy, one account per partner.** It is free, indefinite,
uses the regulated Open Finance rails, and each partner only ever authorizes their own CPF's
accounts — the reading in Section 1 places this inside "uso pessoal." Confirm with Pluggy support
in writing that two independent Meu Pluggy accounts feeding one shared, unsold app is acceptable,
since the ToS PDF itself is silent on the scenario and only the FAQ copy addresses it. Fall back to
manual OFX/CSV import (Section 5) for any institution where a partner's account type makes
Meu Pluggy connection impractical.

**(ii) Closed beta, ~10 households**: **Stay on Meu Pluggy only if Pluggy explicitly confirms in
writing that N separate Meu Pluggy accounts, each self-connecting and each plugging their own
credentials into the shared app, is within terms — otherwise this tier crosses into "atender
clientes" and requires Pluggy's paid Dados plan (R$ 2.500/month floor) or an equivalent regulated
aggregator.** At 10 households (~20 people), R$ 2.500/month amortized is close to viable for a
paid or cost-shared beta; Belvo's ~US$1.000/month floor is a second option if Pluggy declines the
multi-account Meu Pluggy pattern. Budget for this conversation with Pluggy before beta starts.

**(iii) Public launch**: **A paid, regulated aggregator (Pluggy Dados or Belvo) is required** — no
vendor researched here offers a public self-serve tier that scales past "one person's own data" for
free. At public-launch volume, negotiate directly with Pluggy/Belvo/Celcoin sales for a startup
rate (several of these vendors are quote-only specifically to allow such negotiation), and budget
Open Finance aggregator cost as a real line item before opening `REGISTRATION_MODE=open`.
