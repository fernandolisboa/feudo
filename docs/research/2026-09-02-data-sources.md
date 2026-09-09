# Data Sources Research: Pluggy, Bacen SGS, FGC, Brazilian Tax Rules

**Date Checked:** 2026-09-02  
**Research Scope:** Primary sources verification (Pluggy docs, Bacen, FGC, Receita Federal)

---

## 1. Pluggy Data Model

### Account & Transaction Structure

- **Account Types:** BANK (subtypes: CHECKING_ACCOUNT, SAVINGS_ACCOUNT) and CREDIT (CREDIT_CARD)
- **Transaction Fields:**
  - `amount`: For credit cards, positive = expenses (debits), negative = payments (credits); bank transactions follow normal debit/credit convention
  - `category` & `categoryId`: Hierarchical 3-level taxonomy (L1: Income, Loans and Financing, Investments, Transfers, Services, Shopping, Housing)
  - `type`: CREDIT or DEBIT
  - `description`, `merchant` (Pro subscription), `paymentData` with payer/receiver
  - `paymentData` fields: name, accountNumber, branchNumber, routingNumber, documentNumber (CPF/CNPJ), paymentMethod (TED, DOC, PIX, BOLETO), reason
  - **Counterpart exposure:** YES — CPF/CNPJ of payer and receiver fully exposed in paymentData for transfers

### Investment Model

- **Types:** FIXED_INCOME (CDB, RDB, LCI, LCA), MUTUAL_FUND, SECURITY (PGBL, RETIREMENT), ETF, COE, EQUITY (REAL_ESTATE_FUND)
- **Rate Exposure:** CDB/LCI/LCA yields exposed as `rate` (percentage value) + `rateType` (e.g., "CDI" for "% of CDI")
- **Fields:** `rate`, `rateType`, `fixedAnnualRate`, `balance`, `dueDate`, `isin`, `issuer`, `annualRate`, `lastMonthRate`, `lastTwelveMonthsRate`
- **Savings Products:** poupança exposed as BANK account (SAVINGS_ACCOUNT subtype) with balance field
- **Cofrinhos/Caixinhas:** Classified as CDB investments, fully supported and exposed in investments section

### Transaction Category Taxonomy

- **Top-level categories (L1):** Income, Loans and Financing, Investments, **Transfers**, Services, Shopping, Housing
- **Transfers category:** YES — includes sub-categories for TED, DOC, PIX, etc.
- **"Same person transfer" category:** Covered under Transfers hierarchy

### Item Update Mechanics

- **Initial sync:** 365 days of historical data on first Item creation
- **Manual update:** PATCH /items/{id} endpoint or Pluggy Connect widget
- **Auto-sync:** Daily automatic updates (Pluggy-managed, users cannot create batch processes)
- **Webhooks:** Mentioned in documentation; Open Finance rate limits per month per CPF/institution/product
- **Open Finance specific:** 7-day transaction history (today + 6 previous days)

### Pluggy Connect Widget & Open Finance

- **Open Finance support:** YES — regulated connectors marked with [OF] tag
- **Connector filtering:** Can restrict to Open Finance only via `connectorTypes` parameter in Connect configuration
- **Premium feature:** Open Finance connectors require contacting Pluggy sales team for activation

### Pricing

- **Free Trial:** 2 weeks, no credit card required, full functionality
- **Development Environment:** 100 items max
- **Billing:** Subscription-based with rate limit enforcement; free tier requires Connect Widget for item creation
- **Free tier item limits:** Not explicitly documented in searches

**Sources:**

- [Pluggy API Documentation - Accounts](https://docs.pluggy.ai/docs/accounts)
- [Pluggy API Documentation - Transactions](https://docs.pluggy.ai/docs/transactions)
- [Pluggy API Documentation - Investments](https://docs.pluggy.ai/docs/investments)
- [Pluggy API Documentation - Transaction Categories](https://docs.pluggy.ai/docs/transaction-categories)
- [Pluggy API Documentation - Item Update](https://docs.pluggy.ai/reference/items-update)
- [Pluggy API Documentation - Open Finance](https://docs.pluggy.ai/docs/open-finance-regulated)

---

## 2. Bacen SGS Time Series API

### Series Codes & Periodicity

- **CDI (Certificado de Depósito Interbancário):** Series **12**, daily frequency
- **Selic Target (Meta Selic):** Series **432**, policy-defined frequency
- **Selic Daily Rate:** Series **11**, daily frequency
- **IPCA Monthly:** Series **433**, monthly frequency
- **IPCA-15:** Calculated over 15-day period mid-month to mid-month, released ~25th of month
- **IPCA 12-month Accumulated:** Series **13522** (not explicitly confirmed but referenced in searches)

### API URL Format & Access

```
https://api.bcb.gov.br/dados/serie/bcdata.sgs.{code}/dados?formato=json&dataInicial=dd/mm/yyyy&dataFinal=dd/mm/yyyy
```

- Date range format: dd/mm/yyyy
- Data window limit: 10 years maximum
- Query exceeding 10-year window returns error
- Formats supported: JSON, CSV, SOAP webservices

### CDI Annualization

- **Convention:** 252 business days (excludes weekends and holidays)
- **Formula:** Daily rate compounded over 252 trading days
- Daily rate is used in investment calculations and yield comparisons

### Rate Limits & Data Availability

- **Historical data:** 10-year rolling window for daily series
- **Monthly series:** Full historical availability
- **Rate limits:** Filtering required for large datasets; queries managed per request

**Sources:**

- [Bacen SGS Open Data Portal](https://dadosabertos.bcb.gov.br/dataset/11-taxa-de-juros---selic)
- [Bacen SGS Meta Selic Series 432](https://dadosabertos.bcb.gov.br/dataset/432-taxa-de-juros---meta-selic-definida-pelo-copom)
- [Bacen SGS IPCA Series 433](https://www3.bcb.gov.br/sgspub/consultarvalores/consultarValoresSeries.do?method=consultarSeries&series=433)
- [Bacen CDI Correction Calculator](https://www3.bcb.gov.br/CALCIDADAO/jsp/ajudaGeralCalCidadao.jsp)

---

## 3. FGC (Fundo Garantidor de Créditos)

### Coverage Limits

- **Per CPF per Financial Conglomerate:** R$ 250,000
- **Global Cap (4-year period):** R$ 1,000,000 maximum per person across all institutions
- **4-year cycle:** Coverage limit renews after 4-year period

### Covered Products

- Checking accounts (conta corrente)
- Savings accounts (poupança)
- CDB (Certificado de Depósito Bancário)
- RDB (Recibo de Depósito Bancário)
- LCI (Letra de Crédito Imobiliário)
- LCA (Letra de Crédito do Agronegócio)
- Real estate notes (cédula de crédito imobiliário)
- Mortgage notes (cédula hipotecária)
- Bills of exchange (letra de câmbio)
- Repurchase operations

### NOT Covered

- Investment funds (fundos de investimento)
- Tesouro Direto (federal treasury bonds)
- Foreign deposits
- Subordinated instruments
- Government program-related operations

### Joint Accounts (Conta Conjunta)

- **Coverage:** R$ 250,000 limit applies
- **Division:** Limit divided equally among account holders
- **Entitlement:** All holders entitled to guarantee up to their proportional share

### Payment Timeline

- 10-15 business days after receipt of documents from liquidator/intervener
- Payment clock starts upon liquidation event

**Sources:**

- [FGC Official Website](https://www.fgc.org.br)
- [FGC FAQ - Coverage & Guarantees](https://www.fgc.org.br/en/faq)
- [FGC Regulation](https://www.fgc.org.br/documents/d/asset-library-52554/regulamento-fgc240905-1)
- [FGC R$ 1 Million Limit FAQ](https://fgc.org.br/garantia-fgc/perguntas-e-respostas-teto-r1-milhao)

---

## 4. Brazilian Taxation on Investments (2025-2026)

### Income Tax (IR) on Fixed Income - Regressive Table

- **≤ 180 days holding:** 22.5% IR
- **181-360 days:** 20% IR
- **361-720 days:** 17.5% IR
- **> 720 days:** 15% IR
- Applies to: CDB, RDB, and similar fixed-income instruments

### LCI & LCA Tax Treatment

- **Individuals:** 0% IR (tax-exempt) on yield
- **Status:** Exemption remains in effect for 2025-2026 (no legislative changes confirmed)
- **Regulatory basis:** Aimed at incentivizing real estate and agribusiness financing

### Poupança (Savings Account) Tax Treatment

- **Tax rate:** 0% (exempt from income tax)
- **Yield rule when Selic ≤ 8.5%:** 70% of Selic target rate per month + TR (Taxa Referencial)
- **Yield rule when Selic > 8.5%:** 0.5% per month + TR
- **TR component:** Taxa Referencial applied monthly on anniversary date

### Tesouro Direto (Federal Treasury Bonds)

- **Taxation:** Exclusive/definitive taxation at source
- **Tesouro Selic:** Follows exclusive taxation regime
- **Custody fee:** Applicable (varies by institution)
- **Filing requirement:** Must report in asset section at acquisition value; net income on sales/maturity/interest taxed exclusively

### IOF (Imposto sobre Operações Financeiras)

- Applied on early redemptions (< 30 days)
- Rate varies by product and holding period
- Specific rates: Not detailed in available searches

### Recent Changes (2025-2026)

- **LCI/LCA exemption:** No legislative changes confirmed; exemption status stable
- **Poupança rules:** No changes confirmed to 70% Selic / 0.5% + TR formula
- **Fixed income IR table:** No changes confirmed to regressive brackets

**Sources:**

- [Tesouro Direto - IR Declaration Guide](http://www.tesouro.gov.br/-/veja-como-informar-os-seus-investimentos-na-declaracao-do-ir)
- [Bacen - Savings Account Remuneration](https://www.bcb.gov.br/pec/poupanca/poupanca.asp?frame=1)
- [Bacen Citizen Calculator](https://www3.bcb.gov.br/CALCIDADAO/publico/exibirFormCorrecaoValores.do?aba=5&method=exibirFormCorrecaoValores)

---

## Summary

Pluggy exposes a complete fintech data model covering accounts (checking, savings, credit cards), transactions with counterpart CPF/CNPJ details, and investments (CDB, LCI, LCA, mutual funds, ETFs) with yield data in "% of CDI" format. The platform supports both credential-based and regulated Open Finance connectors, with automatic daily syncs after 365-day initial load.

Bacen SGS provides real-time access to CDI (series 12), Selic rates (series 11 & 432), and IPCA inflation data via a 10-year rolling API window, using 252 business days for annualization. FGC guarantees R$ 250,000 per CPF per conglomerate (R$ 1M per 4-year cycle) covering bank accounts, CDB, LCI, LCA, and poupança—but not Tesouro Direto or funds.

Brazilian taxation remains stable: fixed income faces regressive IR (22.5%-15%), while LCI/LCA and poupança enjoy full exemptions. The 252-day CDI convention and 70% Selic rule for savings are standard for real-yield comparisons.

## Pricing and Limits

**Date Checked:** 2026-09-02

### Plan Names & Pricing (Public)

- **Dados (Data):** R$ 2,500/month minimum
- **Pagamentos (Payments):** R$ 500/month minimum
- **Meu Pluggy:** Free indefinitely for personal use

### Billed Unit Definition

Per API request. Each read call for balance, transaction, or investment data counts as one billed unit. Pluggy charges based on usage exceeding the minimum included in subscription plans.

### Free/Trial Tier

- **14-day free trial:** Available in production environment, no credit card required, full functionality
- **Meu Pluggy free tier:** Personal use access to 50+ institutions (Nubank, Itaú, Bradesco, BB, Inter, XP, BTG, etc.) via dashboard credentials at https://meu.pluggy.ai. Commercial use requires paid Dados or Pagamentos plan.

### Open Finance vs. Credential-Based Pricing

Not found. Platform distinguishes Open Finance connectors (regulated, user-consent based) from credential-based/proprietary connectors (unregulated, direct access). No explicit pricing difference documented between connector types.

### MeuPluggy Free Service

Free for personal use indefinitely (no expiration). Provides access to 50+ Brazilian financial institutions. Enables users to connect their accounts and pull balances, transactions, and investments. For commercial use (multiple customer accounts or product commercialization), requires activation of paid Dados or Pagamentos plans.

### "100 Items" Limit in Development Environment

Development environment limited to maximum 100 items (connections). An "item" represents one connection between a user and a financial institution, including all associated data. Production environment offers unlimited items. Development environment cannot be used in production; separate production credentials required.

### Development Environment Expiration

Not found. No expiration documented; development environments persist but limited to 100 items max.

### Pricing Public Status

Public. Full pricing available at https://pluggy.ai/pricing (Portuguese) and https://pluggy.ai/en/pricing (English).

**Sources:**

- [Pluggy Pricing Page](https://pluggy.ai/pricing)
- [Pluggy Main Site](https://pluggy.ai)
- [Pluggy Documentation - FAQ](https://docs.pluggy.ai/page/faq)
- [Pluggy Documentation - Environments & Configurations](https://docs.pluggy.ai/docs/environments-and-configurations)
- [Meu Pluggy Official](https://www.pluggy.ai/meu-pluggy)
- [Meu Pluggy Access Portal](https://meu.pluggy.ai/en)
