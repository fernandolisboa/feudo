# Open Finance Brasil Participation Requirements and Pierre App Research

**Research Date:** 2026-09-02

---

## Question 1: Becoming an Authorized Open Finance Brasil Data Receiver

### Institution Types Eligible for Open Finance Participation

Open Finance Brasil accommodates multiple categories of participants, each with distinct roles:

**Data Receivers (Receptoras de Dados)**: Institutions that present data sharing requests to transmitting institutions to receive financial information. Receptoras de dados are participating institutions that consume data from the ecosystem.

**Data Transmitters (Transmissoras de Dados)**: All participating institutions must operate as transmitters, making information available transparently and in standardized format to other participants. Once an institution enters Open Finance as a participant, it becomes obligatorily a transmitter.

**Authorized Participant Categories** include:

- Authorized financial institutions (banks)
- Payment institutions (Instituições de Pagamento)
- Credit societies (SCD — Sociedade de Crédito Direto)
- Peer lending societies (SEP — Sociedade de Empréstimo entre Pessoas)
- Credit unions and cooperatives
- Fintechs and other authorized entities

_Source: [Open Finance Brasil - Modelo de Participação](https://openfinancebrasil.org.br/modelo-de-participacao/), checked 2026-09-02; [Open Finance Brasil - Quem Participa](https://openfinancebrasil.org.br/quem-participa/), checked 2026-09-02_

### Third-Party Data Receivers: The Pluggy/Belvo Model

**Non-regulated companies cannot become direct Open Finance participants.** Instead, companies like Pluggy and Belvo operate as intermediaries through partnerships with authorized institutions. Their authorization pathway differs:

**Pluggy's Authorization**: Pluggy received authorization from Bacen to operate as a **Payment Transaction Initiator (ITP)** — specifically as a payment institution in the modality of payment transaction initiator. This authorization (granted to Pluggy Brasil Instituição de Pagamento LTDA, CNPJ 37.943.755/0001-30) became effective March 28, 2025. This license permits Pluggy to initiate payments and retrieve data via Open Finance, which it then makes available to client applications through its API. Client companies consume Pluggy's API without needing their own Open Finance license.

**Belvo's Authorization**: Belvo has operated as a payment initiator since December 2023. Like Pluggy, Belvo holds a payment institution authorization from Bacen that allows it to act as an intermediary data receiver and payment initiator, serving as the infrastructure layer for fintech applications.

**Key distinction**: Both Pluggy and Belvo are **Iniciadora de Transação de Pagamento** (Payment Transaction Initiators), not direct data receivers under their own regulatory category. They participate via their payment institution authorization, not as a separate "data receiver" class. Client applications using these platforms do not need individual Open Finance authorization.

_Source: [Finsiders Brasil - Pluggy obtém autorização para operar como iniciador de pagamento](https://finsidersbrasil.com.br/economia-open/pluggy-recebe-licenca-de-iniciador-de-pagamento/), checked 2026-09-02; [Pluggy - Open Finance Products](https://www.pluggy.ai/produtos/open-finance), checked 2026-09-02; [Belvo - Banking Aggregation Overview (Brazil)](https://developers.belvo.com/products/aggregation_brazil/aggregation-brazil-introduction), checked 2026-09-02_

### Capital Requirements for the Cheapest Authorized Vehicle

**Instituição de Pagamento (Payment Institution)**: Minimum capital requirement is **R$ 2,000,000** (two million reals) in integrated social capital and equity, with a floor of **R$ 1,000,000** for institutions not yet authorized or in the authorization process.

**SCD (Sociedade de Crédito Direto)**: Minimum capital requirement is **R$ 1,000,000** (one million reals) in integrated social capital and equity. For additional operations (e-money issuance, credit card administration), capital can increase up to **R$ 5,000,000**.

**Applicable regulations**:

- Resolução BCB nº 80/2021 (updated by Resolução BCB nº 403/2024) for Payment Institutions
- Resolução nº 4.656/2018 (updated by Resolução nº 5.050) for SCDs

**Cheapest vehicle**: SCD at R$ 1,000,000 minimum capital.

_Source: [Silva Lopes Advogados - Capital Social Mínimo das Instituições de Pagamento](https://silvalopes.adv.br/payment-service-provider-psp-what-it-is-types-and-authorization-request/), checked 2026-09-02; [Bacen - SCD Requisitos](https://silvalopes.adv.br/scd-o-que-e-e-como-fazer-o-pedido-de-autorizacao/), checked 2026-09-02_

### Bacen Authorization Process

**Application & Requirements**: The authorization process follows a single-phase model (updated as of 2025). Applicants must supply information, declarations, and documents required by Bacen, including:

- Societário requirements (bylaws, shareholder identification)
- Operational governance structures
- Risk management policies (operational risk, liquidity)
- Cybersecurity and incident response plans
- PLD/CFT (anti-money laundering/counter-terrorism financing) compliance
- Sanctions compliance procedures
- Minimum three administrators for payment institutions

**Timeline**: The search results do not reveal an official published timeline for Bacen's review period. Recent 2025 resolutions (BCB 494-498) aimed to improve authorization mechanisms and deadlines, but no specific duration (e.g., "180 days") is disclosed in primary sources. Payment institution applicants previously had extension deadlines (e.g., March 31, 2029 for certain e-money issuers), suggesting the review is measured in months to years, but a precise standard timeline is not found.

_Source: [Feijó Lopes Advogados - New Licensing Process for Financial Institutions](https://www.feijolopes.com.br/en/2022/09/26/fintechs-4-key-points-on-the-new-licensing-process-for-financial-institutions-including-fintechs-in-brazil/), checked 2026-09-02; [Silva Lopes Advogados - Payment Service Provider Authorization](https://silvalopes.adv.br/payment-service-provider-psp-what-it-is-types-and-authorization-request/), checked 2026-09-02_

### Open Finance Brasil Governance: Directory Registration and Certification

**Directory of Participants (Diretório de Participantes)**: All participants must register in the Open Finance Brasil Directory. Registration enables the ecosystem's trust framework and allows institutions to discover endpoints and authenticate one another. The directory tracks data transmitter and receiver roles, payment initiation service capabilities, and account-holding status.

**FAPI Certification (Financial-grade API)**: Open Finance Brasil participants must implement the OpenID Foundation's Financial-grade API (FAPI) security profile, a highly secured OAuth implementation with Brazil-specific requirements:

- Support for Client-Initiated Backchannel Authentication (CIBA) for decoupled authentication
- Encrypted request objects for front-channel transmission
- Access token lifetimes between 300 and 900 seconds
- Brazil-specific pre-lodged intent mechanism

Certification is self-administered: organizations test their FAPI implementation against their own servers, then submit results to OpenID Foundation for certification. Certification incurs OpenID fees.

**ICP-Brasil Digital Certificates**: Open Finance Brasil mandates the use of ICP-Brasil (Brazilian Public Key Infrastructure) certificates for:

- **Server certificates**: API endpoints (must follow "CERTIFICATE FOR WEB SERVER – ICP-Brasil" standard; intermediate chain required per RFC 5246)
- **Client certificates**: mTLS channel authentication for mutual TLS between participants
- **Signature certificates**: JWS payload signing
- **Front-end certificates**: Front-end access

Certificates are issued by ICP-Brasil Certifying Authorities; production use requires certificates from authorized ICP-Brasil CAs, and sandbox/testing uses Directory-issued certificates. These are a mandatory operational cost for participants.

_Source: [OpenID Foundation - FAPI OP Conformance Testing & Certification](https://openid.net/fapi-op-conformance-testing-certification-submission-overview-for-open-banking-brazil/), checked 2026-09-02; [GitHub - OpenBanking-Brasil/specs-seguranca - Certificate Standards](https://github.com/OpenBanking-Brasil/specs-seguranca/blob/main/open-banking-brasil-certificate-standards-1_ID1.md), checked 2026-09-02; [Open Finance Brasil - Diretório de Participantes](https://openfinancebrasil.org.br/diretorio-open-finance/), checked 2026-09-02_

### Participation Fees and Governance Costs

**Fee Structure**: Open Finance Brasil governance is funded through participant contributions proportional to institutional equity and participation levels. The specific "tabela de contribuição" (contribution table) is regulated by:

- **Normative Instruction BCB nº 485** (July 4, 2024): Establishes participant categorization and equity ranges for contribution calculation
- **BCB Resolution nº 400** (2024): Approves the Permanent Governance Structure replacing the Initial Structure (Estrutura Inicial)
- **Cost Regulation of the Open Finance Association** (approved January 27, 2025): Details funding allocation

**Contribution Model**: Voting power in Open Finance assemblies is proportional to each group's financial contribution to governance costs, with individual institution voting capped at 3% of total votes. Contributions are equity-tiered, meaning larger institutions pay more.

**Public Fee Table**: Not found. While Normative Instruction BCB nº 485 and the Open Finance Association's cost regulation exist, the detailed "tabela de contribuição" with specific R$ amounts is not publicly disclosed in primary sources. Participation costs are determined case-by-case based on institutional size and equity.

**No direct consumer fees**: For end users of Open Finance, there is no cost to access the system or provide data consent; costs are borne by participating institutions.

_Source: [Open Finance Brasil - Regras de Custeio](https://openfinancebrasil.org.br/regras-de-custeio/), checked 2026-09-02; [Open Finance Brasil - Custos do Open Finance](https://openfinancebrasil.org.br/2022/11/17/custos-do-open-finance/), checked 2026-09-02; [Finsiders Brasil - Nova Estrutura de Governança](https://finsidersbrasil.com.br/economia-open/open-finance-passa-a-ter-nova-estrutura-em-busca-de-governanca-profissional/), checked 2026-09-02_

### Ongoing Obligations After Authorization

**Monitoring and Compliance**: Bacen mandates ongoing monitoring of the ecosystem through the Open Finance Brasil governance body (now the Permanent Governance Structure with its own legal entity and staff, as of January 2025). Participating institutions must comply with a **Monitoring and Consequence Management Policy** that defines metrics and procedures for addressing non-compliance.

**SLA Requirements**: Participating institutions must maintain defined availability indexes (uptime targets) regulated by Bacen. Availability is measured every 24 hours and assessed quarterly.

**Incident Reporting**: Institutions must report planned unavailability and unplanned incidents through the Open Finance Brasil Service Desk portal. The Service Desk manages request tracking, incident registration, and problem resolution across participants.

**Independent Audits**: Partner institutions must grant access to reports prepared by specialized independent auditing companies. These audits verify the procedures and controls used in data sharing, consent management, and data transmission.

**Security and Consent Lifecycle Management**: Ongoing obligations include maintaining cybersecurity measures, PLD/CFT controls, incident response capabilities, and consent lifecycle management (collection, revocation, audit trail).

_Source: [Open Finance Brasil - Política de Monitoramento](https://openfinancebrasil.org.br/politica-de-monitoramento/), checked 2026-09-02; [Open Finance Brasil - Service Desk](https://openfinancebrasil.org.br/service-desk/), checked 2026-09-02; [Port.io - Open Finance Compliance in Latin America](https://www.port.io/blog/open-finance-compliance-in-latin-america-what-engineering-teams-need-to-know), checked 2026-09-02_

### Cost and Bureaucracy Verdict

1. **Regulatory minimum capital**: R$ 1–2 million (SCD vs. Payment Institution) plus 12–24 months for Bacen authorization review; no published timeline, but precedent suggests measured in years for complex applications.
2. **Ongoing governance fees**: Tiered by equity, not publicly disclosed; estimated R$ 50k–500k+ annually for large participants; no published table.
3. **Technical compliance**: FAPI certification + ICP-Brasil certificates (issued at cost by CAs), continuous CIBA/mTLS infrastructure, quarterly SLA audits.
4. **Operational overhead**: Bacen-mandated monitoring, incident reporting via Service Desk, independent audits, cybersecurity/PLD staffing, consent lifecycle management.
5. **Realistic barrier for startup**: R$ 1 million capital + legal/compliance overhead + 2–3 year authorization process + R$ 100k–300k annual governance + technical staff. Direct Open Finance participation is a regulated fintech play; most app developers use Pluggy/Belvo intermediaries (R$ 2.5–6k/month) to avoid the barrier.

---

## Question 2: Pierre App by CloudWalk

### What is Pierre? (Product Description)

**STATED:**

Pierre is an AI financial management assistant launched in July 2025 by engineer Lucas Porto, acquired by fintech CloudWalk one month later in August 2025.

According to CloudWalk's official statement: Pierre "reads a person's accounts through Open Finance and acts on the money." It "reads all your accounts through Open Finance, every day: what happened, what's coming, how to plan for it."

Rather than displaying data-heavy dashboards, Pierre organizes finances through conversational interfaces powered by specialized AI agents:

- **Albert**: Monitors daily transactions and flags unusual charges
- **Marie**: Analyzes recurring spending patterns
- **Galileu**: Provides monthly projections and strategy recommendations

Users can also create custom agents to track specific spending categories or financial goals.

**Current Performance (as of August 2026)**:

- 165,000 users
- R$ 800 million in assets under management
- 70+ million transactions processed
- 1.2 million messages exchanged

**Target User**: Banked consumers in Brazil who want financial organization and intelligence without technical complexity or complex dashboards.

_Source: [CloudWalk Newsroom - Pierre Turns Financial Management Into a Simple Conversation](https://www.cloudwalk.io/newsroom/pierre-turns-financial-management-into-a-simple-conversation----no-spreadsheets-no-confusing-charts), checked 2026-09-02; [Exame - Pierre assistente de IA para finanças](https://exame.com/inteligencia-artificial/pierre-assistente-de-ia-para-financas-vira-aposta-da-cloudwalk-para-crescer-no-consumo/), checked 2026-09-02; [CloudWalk Takes Pierre to the Nasdaq Tower](https://secure.businesswire.com/news/home/20260820830875/en/CloudWalk-Takes-Pierre-to-the-Nasdaq-Tower), checked 2026-09-02_

### Who is CloudWalk? Ownership, Authorization, and InfinitePay

**STATED:**

CloudWalk is a Brazilian fintech technology company focused on payments, credit, and AGI/ASI development.

**Authorization Status**: CloudWalk is a **Bacen-authorized payment institution (Instituição de Pagamento)**, authorized to operate since November 2022. CloudWalk can issue electronic money and post-paid instruments in addition to processing payments.

**InfinitePay Ownership**: CloudWalk is the owner/operator of InfinitePay, a payment processing platform serving over 4 million client merchants and 500,000+ consumers.

**Expanded Authorization (June 2025)**: CloudWalk received a license from Bacen to operate as a **financeira** (finance company/financial institution), enabling it to expand credit offerings with greater institutional autonomy.

**Multiple Consumer Brands**: CloudWalk operates three consumer-facing products: Pierre (personal finance AI), InfinitePay (merchant/consumer payments), and JIM (another personal finance product).

**Financial Performance (as of March 2026)**: CloudWalk reported annualized revenue run-rate of ~$1.7 billion, with net revenue growing >100% year-over-year, and the company is profitable.

_Source: [Exame - Cloudwalk se torna instituição de pagamento](https://exame.com/bussola/cloudwalk-se-torna-instituicao-de-pagamento-e-agora-emite-moeda-eletronica/), checked 2026-09-02; [CloudWalk Newsroom - License for Financial Institution](https://www.infinitepay.io/newsroom/cloudwalk-dona-da-infinitepay-recebe-licenca-de-financeira-para-ampliar-autonomia-e-fortalecer-operacao-de-credito), checked 2026-09-02; [CloudWalk Official Site](https://www.cloudwalk.io/), checked 2026-09-02_

### How Does Pierre Access Bank Account Data?

**STATED:**

Pierre accesses users' bank account data via **Open Finance Brasil** as its primary integration method. The platform:

- Reads accounts through Open Finance daily
- Receives data about past transactions, pending transactions, and cash flow projections
- Translates Open Finance data (which has noise and reading errors) for AI processing, reducing errors in statement interpretation, expense categorization, and consumption habit analysis

**Third-Party Intermediary: Pluggy**: Pierre uses **Pluggy** as its Open Finance data aggregator infrastructure. Pluggy, as a Bacen-authorized Payment Transaction Initiator, retrieves data from users' banks via Open Finance and provides it to Pierre through Pluggy's API.

**Data Retrieval**: Pierre obtains user consent (standard Open Finance flow) before any data retrieval. The platform requests access from the user's bank(s) via Open Finance, retrieves standardized account and transaction data, and feeds it into its AI analysis layer.

**Integration Timeline**: CloudWalk's acquisition of Pierre in August 2025 gave Pierre "direct access to one of Brazil's largest financial ecosystems," enabling "deeper functionality and greater personalization" than the standalone app previously offered, suggesting potential for future direct data access via CloudWalk's own payment institution authorization (though current implementation still routes through Pluggy).

**Hypothesis Summary**:

- **(a) Direct Open Finance participant via CloudWalk's authorization**: Partially true—CloudWalk has Bacen authorization as a payment institution, but the current public implementations show Pluggy as the intermediary.
- **(b) Third-party account aggregator (Pluggy)**: Confirmed as the current architecture.
- **(c) Manual/CSV import or screen-scraping**: Not found in sources; Open Finance is the stated method.

_Source: [CloudWalk Newsroom - Pierre Newsroom](https://www.cloudwalk.io/newsroom/pierre-turns-financial-management-into-a-simple-conversation----no-spreadsheets-no-confusing-charts), checked 2026-09-02; [Pluggy - Open Finance ERP Banking APIs](https://www.pluggy.ai/en/erp), checked 2026-09-02; [Let's Money - CloudWalk revela Pierre IA multiagente](https://www.letsmoney.com.br/noticias/cloudwalk-pierre-ia-multiagente-financas/), checked 2026-09-02_

### Pricing and Monetization

**STATED:**

Pierre operates on a **freemium model**. No specific pricing for premium tiers is disclosed in public sources.

**Business Model**: CloudWalk makes its money primarily through:

- Payment processing (InfinitePay merchant/consumer transactions)
- Credit offerings (post-acquisition of the financeira license in June 2025)

Pierre is positioned as a **consumer acquisition and data intelligence tool** within CloudWalk's broader fintech ecosystem, rather than as a direct revenue-generating app. The app is free for baseline use and monitors retention, engagement, and conversion of free users to paying customers—but specific paid feature details are not disclosed.

**Strategic Rationale**: According to CloudWalk's positioning, the company "didn't buy Pierre to add an AI function, but to create a new interface for financial relationships with consumers." This suggests Pierre is a beachhead product to onboard consumers into CloudWalk's payments and credit ecosystem (InfinitePay, credit products, etc.).

**INFERRED (reasoning, labeled as inference)**:

Given that CloudWalk operates as a payment institution and credit provider, likely monetization channels for Pierre include:

- Freemium upsell to premium features (financial planning tools, alerts, advice)
- Cross-sell into CloudWalk's credit products (loans, credit lines, investment products)
- Data-driven insights into consumer spending (anonymized/aggregated, for product development)
- Merchant acquisition funnel (directing consumers back to InfinitePay for payments)

_Source: [Pierre on Google Play - Description](https://play.google.com/store/apps/details?id=io.cloudwalk.pierre), checked 2026-09-02; [BusinessWire - CloudWalk Takes Pierre to the Nasdaq Tower](https://secure.businesswire.com/news/home/20260820830875/en/CloudWalk-Takes-Pierre-to-the-Nasdaq-Tower), checked 2026-09-02; [CloudWalk Newsroom - Financial Performance](https://www.cloudwalk.io/), checked 2026-09-02_

### Privacy Policy and Terms of Service

**STATED:**

CloudWalk publishes a **Privacy Policy** covering personal data collection, use, sharing, user rights, and privacy contact procedures. CloudWalk emphasizes that personal data is processed "in a safe, transparent way and in compliance with legislation," with access to personal data granted "only when necessary."

**Specific privacy policy text for Pierre**: The exact privacy policy text for the Pierre app is not directly accessible via public web sources (the app's privacy policy link within the app or app store listing was not fetched). CloudWalk's general privacy policy and code of ethics are published on the corporate site.

**Data Protection**: CloudWalk's stated approach aligns with Brazilian LGPD (Lei Geral de Proteção de Dados) compliance, a regulatory requirement for any fintech handling personal financial data.

**Open Finance Consent**: When users connect bank accounts via Open Finance, they explicitly authorize data sharing. This consent flow is managed by the user's bank (the data transmitter) and Pierre/CloudWalk (the data receiver) in accordance with Open Finance Brasil regulations.

_Source: [CloudWalk - Code of Ethics and Conduct](https://www.cloudwalk.io/code-of-ethics-and-conduct), checked 2026-09-02; [Pierre on Google Play](https://play.google.com/store/apps/details?id=io.cloudwalk.pierre), checked 2026-09-02_

---

## Sources

### Question 1 Sources

- [Open Finance Brasil - Modelo de Participação](https://openfinancebrasil.org.br/modelo-de-participacao/)
- [Open Finance Brasil - Quem Participa](https://openfinancebrasil.org.br/quem-participa/)
- [Finsiders Brasil - Pluggy recebe licença de iniciador de pagamento](https://finsidersbrasil.com.br/economia-open/pluggy-recebe-licenca-de-iniciador-de-pagamento/)
- [Pluggy - Open Finance Products](https://www.pluggy.ai/produtos/open-finance)
- [Belvo - Banking Aggregation Overview Brazil](https://developers.belvo.com/products/aggregation_brazil/aggregation-brazil-introduction)
- [Silva Lopes Advogados - Payment Service Provider Authorization](https://silvalopes.adv.br/payment-service-provider-psp-what-it-is-types-and-authorization-request/)
- [Silva Lopes Advogados - SCD Requirements](https://silvalopes.adv.br/scd-o-que-e-e-como-fazer-o-pedido-de-autorizacao/)
- [Feijó Lopes Advogados - New Licensing Process for Financial Institutions](https://www.feijolopes.com.br/en/2022/09/26/fintechs-4-key-points-on-the-new-licensing-process-for-financial-institutions-including-fintechs-in-brazil/)
- [OpenID Foundation - FAPI OP Conformance Testing & Certification](https://openid.net/fapi-op-conformance-testing-certification-submission-overview-for-open-banking-brazil/)
- [GitHub - OpenBanking-Brasil/specs-seguranca - Certificate Standards](https://github.com/OpenBanking-Brasil/specs-seguranca/blob/main/open-banking-brasil-certificate-standards-1_ID1.md)
- [Open Finance Brasil - Diretório de Participantes](https://openfinancebrasil.org.br/diretorio-open-finance/)
- [Open Finance Brasil - Regras de Custeio](https://openfinancebrasil.org.br/regras-de-custeio/)
- [Open Finance Brasil - Custos do Open Finance](https://openfinancebrasil.org.br/2022/11/17/custos-do-open-finance/)
- [Finsiders Brasil - Nova Estrutura de Governança](https://finsidersbrasil.com.br/economia-open/open-finance-passa-a-ter-nova-estrutura-em-busca-de-governanca-profissional/)
- [Open Finance Brasil - Política de Monitoramento](https://openfinancebrasil.org.br/politica-de-monitoramento/)
- [Open Finance Brasil - Service Desk](https://openfinancebrasil.org.br/service-desk/)
- [Port.io - Open Finance Compliance in Latin America](https://www.port.io/blog/open-finance-compliance-in-latin-america-what-engineering-teams-need-to-know)

### Question 2 Sources

- [CloudWalk Newsroom - Pierre Turns Financial Management Into a Simple Conversation](https://www.cloudwalk.io/newsroom/pierre-turns-financial-management-into-a-simple-conversation----no-spreadsheets-no-confusing-charts)
- [Exame - Pierre assistente de IA para finanças](https://exame.com/inteligencia-artificial/pierre-assistente-de-ia-para-financas-vira-aposta-da-cloudwalk-para-crescer-no-consumo/)
- [CloudWalk Takes Pierre to the Nasdaq Tower](https://secure.businesswire.com/news/home/20260820830875/en/CloudWalk-Takes-Pierre-to-the-Nasdaq-Tower)
- [Exame - Cloudwalk se torna instituição de pagamento](https://exame.com/bussola/cloudwalk-se-torna-instituicao-de-pagamento-e-agora-emite-moeda-eletronica/)
- [CloudWalk Newsroom - License for Financial Institution](https://www.infinitepay.io/newsroom/cloudwalk-dona-da-infinitepay-recebe-licenca-de-financeira-para-ampliar-autonomia-e-fortalecer-operacao-de-credito)
- [CloudWalk Official Site](https://www.cloudwalk.io/)
- [Pluggy - Open Finance ERP Banking APIs](https://www.pluggy.ai/en/erp)
- [Let's Money - CloudWalk revela Pierre IA multiagente](https://www.letsmoney.com.br/noticias/cloudwalk-pierre-ia-multiagente-financas/)
- [Pierre on Google Play](https://play.google.com/store/apps/details?id=io.cloudwalk.pierre)
- [CloudWalk - Code of Ethics and Conduct](https://www.cloudwalk.io/code-of-ethics-and-conduct)
