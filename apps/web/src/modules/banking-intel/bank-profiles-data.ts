import type { BankProfilesDatasetInput } from "./bank-profile";

export const BANK_PROFILES_DATASET = {
  version: 1,
  profiles: [
    {
      institutionId: "nubank",
      criteria: {
        cardBenefits: {
          status: "scored",
          score: 60,
          evidence:
            "Nubank Rewards was discontinued. Nubank+ gives 0.8% cashback or 1.4 points per US$ for a R$ 39 monthly fee that can be waived; Ultravioleta gives 2.2 points per US$, IOF exemption abroad and 4 lounge visits a year. The entry card has no ongoing points programme.",
          citations: [
            {
              url: "https://altarendablog.com.br/2026/06/09",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Ultravioleta benefits.",
            },
            {
              url: "https://setorneinvestidor.net/novo-cartao-nubank-mais-cashback-aumento-limite",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Nubank+ terms.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        investmentAccess: {
          status: "scored",
          score: 80,
          evidence:
            "NuInvest inside the same app: stocks, ETFs, BDRs, Tesouro Direto with no service fee, funds, CDB/LCI/LCA and crypto.",
          citations: [
            {
              url: "https://nubank.com.br/nu/investimentos/tesouro-direto",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Tesouro Direto in the app.",
            },
            {
              url: "https://nubank.com.br/sobre-investimentos/taxas-e-precos",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Investment fees and prices.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        appQuality: {
          status: "scored",
          score: 80,
          evidence:
            "Google Play shows about 4.7 stars from about 5.5 million ratings (search aggregate, not read from the live listing). No confirmed 2026 mass outage found.",
          citations: [
            {
              url: "https://play.google.com/store/apps/details?id=com.nu.production",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding:
                "Rating read from a search-engine aggregate; the listing truncated for automated reads.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "scored",
          score: 60,
          evidence:
            "Publishes its 2FA and TLS policy and recommends a biometric second factor. One March 2025 complaint alleges data sharing that enabled fraud; no confirmed mass breach.",
          citations: [
            {
              url: "https://nubank.com.br/transparencia/politicas-de-privacidade-e-seguranca/politica-de-seguranca",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Security policy.",
            },
            {
              url: "https://blog.nubank.com.br/autenticacao-dois-fatores/",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Two-factor authentication.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 100,
          evidence:
            "No account maintenance fee; free TED, Pix and boleto for individuals; no fee for Tesouro Direto or stock trading. Nu Pagamentos reports no tariff table to the Central Bank registry.",
          citations: [
            {
              url: "https://blog.nubank.com.br/quanto-custa-uma-ted-nos-bancos-tradicionais/",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Free transfers.",
            },
            {
              url: "https://nubank.com.br/sobre-investimentos/taxas-e-precos",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Investment fees.",
            },
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/18236120.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding: "The registry says this institution did not report its tariffs.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        lockIn: {
          status: "scored",
          score: 60,
          evidence:
            "Night Pix limit is the market-wide R$ 1,000 default, raised in 24 to 48 hours. Fee-free core account, but cashback, points and lounges on Nubank+ and Ultravioleta are gated by spend or account tier.",
          citations: [
            {
              url: "https://blog.nubank.com.br/meus-limites-pix-nubank-permite-definir-limites-diurno-e-noturno-para-transacoes/",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Pix day and night limits.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        publicReviews: {
          status: "scored",
          score: 80,
          evidence:
            "Reclame Aqui: reputation 8.7/10, consumer average 7.72, 99.6% response, 92.9% resolution, 81.1% would do business again. consumidor.gov.br rendered no data.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/nubank/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
            {
              url: "https://www.consumidor.gov.br/pages/empresa/20150204000053619/perfil",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Page rendered no indicators to an automated read.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
      },
    },
    {
      institutionId: "inter",
      criteria: {
        cardBenefits: {
          status: "scored",
          score: 60,
          evidence:
            "Zero-annuity cards with no spending condition on several variants; Inter Loop points convert to cashback, miles, dollars, bill discount or investments, with no programme fee.",
          citations: [
            {
              url: "https://inter.co/pra-voce/cartoes/programa-de-pontos/",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Inter Loop programme.",
            },
            {
              url: "https://altarendablog.com.br/2026/04/05",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Card overview.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        investmentAccess: {
          status: "scored",
          score: 80,
          evidence:
            "Inter Invest in the same app: CDB from R$ 1, Tesouro Direto with no Inter fee (only the B3 0.20% a year), funds, crypto, Brazilian and foreign stocks.",
          citations: [
            {
              url: "https://inter.co/pra-voce/investimentos/renda-fixa/cdb/",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "CDB offer.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        appQuality: {
          status: "scored",
          score: 60,
          evidence:
            "Only branded content claims top ratings, with no number or independent source. Confirmed instability on 7 February 2026 and in July 2026 (login, Pix, purchases).",
          citations: [
            {
              url: "https://dol.com.br/noticias/brasil/946160",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "App instability report.",
            },
            {
              url: "https://www.portaldecamaqua.com.br/noticias/100635",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "App instability report.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "scored",
          score: 40,
          evidence:
            "Confirmed leak: a public prosecutor investigation found about 19,961 customers' records exposed, 13,207 with account number, password, address and CPF; Inter attributed it to an insider.",
          citations: [
            {
              url: "https://tecnoblog.net/noticias/banco-inter-vazou-dados-correntistas-acao-mp/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Leak coverage.",
            },
            {
              url: "https://canaltech.com.br/hacker/banco-inter-atribui-vazamento-de-dados-a-ataque-interno-de-baixo-impacto-120346/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Inter statement.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 80,
          evidence:
            "The free digital account has no maintenance fee and free Pix. The Central Bank registry still lists maximum tariffs: TED up to R$ 15.00, packages R$ 20.00 to R$ 45.00, basic card annuity up to R$ 80.00. Scored one step below the all-zero registries (BTG, PicPay Bank).",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/00416968.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding:
                "TED R$ 15.00; standard packages I to III R$ 20.00, 30.00, 45.00; basic national card annuity R$ 80.00; updated 01/10/2026.",
            },
            {
              url: "https://www.cnnbrasil.com.br/economia/money/negocios/inter-cobra-taxa-de-manutencao-da-conta-tudo-sobre-a-estrutura-de-tarifas/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Free digital account.",
            },
          ],
          reviewedAt: "2026-10-02",
        },
        lockIn: {
          status: "scored",
          score: 60,
          evidence:
            "Market-wide R$ 1,000 night Pix default, 24 hours to raise. Free account and an ungated points programme; individual complaints about slow limit increases.",
          citations: [
            {
              url: "https://ajuda.inter.co/conta-digital-pessoa-fisica-e-mei/o-que-e-limite-noturno",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Night limit.",
            },
            {
              url: "https://www.reclameaqui.com.br/inter/demora-para-liberacao-de-limite-pix",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Complaint, anecdotal.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        publicReviews: {
          status: "scored",
          score: 60,
          evidence:
            "Reclame Aqui: 8.5/10, 98.4% response, 90% resolution, 78% would do business again, average response 9 days 13 hours.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/inter/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-09-09",
        },
      },
    },
    {
      institutionId: "itau",
      criteria: {
        cardBenefits: {
          status: "scored",
          score: 80,
          evidence:
            "Broad card ladder: Personnalité Black, LATAM Pass co-brand, Private Visa Infinite with DragonPass, Magalu up to 2% cashback. Annuity waiver from R$ 8,000 monthly spend or R$ 50,000 invested.",
          citations: [
            {
              url: "https://altarendablog.com.br/2026/01/28",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Card ladder.",
            },
            {
              url: "https://diariodopara.com.br/seu-bolso/itau-muda-regras-de-pontos-e-anuidade-dos-cartoes-veja-o-que-muda",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "2026 waiver rules.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        investmentAccess: {
          status: "scored",
          score: 80,
          evidence:
            "Itaú Corretora and íon: Tesouro Direto, stocks, funds; invested balance also counts toward fee waivers.",
          citations: [
            {
              url: "https://www.ion.itau/investimentos/produtos/tesouro-direto/",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Tesouro Direto on íon.",
            },
            {
              url: "https://www.itaucorretora.com.br/nossosservicos/beneficios-no-itau.aspx",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Brokerage benefits.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        appQuality: {
          status: "insufficient-evidence",
          reason:
            "No current store rating could be read for the Itaú app and no 2026 outage was found either way.",
          reviewedAt: "2026-09-09",
          citations: [
            {
              url: "https://play.google.com/store/apps/details?id=com.itau",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Listing truncated for automated reads.",
            },
          ],
        },
        security: {
          status: "insufficient-evidence",
          reason:
            "No Itaú-specific incident or security-feature evidence was found; absence of findings is not a clean record.",
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 40,
          evidence:
            "Bundled packages from R$ 16.10 to R$ 55.70 a month; TED up to R$ 11.10 online and R$ 20.70 in person; waivers tied to spend or investment.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/60701190.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding:
                "Standard packages I to IV R$ 16.10, 28.00, 37.40, 55.70; TED R$ 11.10 internet, R$ 20.70 in person; updated 01/10/2026.",
            },
          ],
          reviewedAt: "2026-10-02",
        },
        lockIn: {
          status: "scored",
          score: 40,
          evidence:
            "Account fee and card annuity waivers depend on R$ 4,000 to R$ 8,000 monthly spend or R$ 50,000 or more invested at Itaú: a structural reason to keep banking and investments there.",
          citations: [
            {
              url: "https://diariodopara.com.br/seu-bolso/itau-muda-regras-de-pontos-e-anuidade-dos-cartoes-veja-o-que-muda",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Waiver conditions.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        publicReviews: {
          status: "scored",
          score: 60,
          evidence:
            "Reclame Aqui: 8.1/10, consumer average 7.02, 97.5% response, 85.4% resolution, 74.2% would do business again.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/itau/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-09-09",
        },
      },
    },
    {
      institutionId: "bradesco",
      criteria: {
        cardBenefits: {
          status: "scored",
          score: 60,
          evidence:
            "Livelo points; periodic annuity-waiver campaigns rather than a permanent waiver; the top card waiver needs R$ 5 million invested.",
          citations: [
            {
              url: "https://altarendablog.com.br/2026/08/02",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Annuity campaign.",
            },
            {
              url: "https://altarendablog.com.br/2026/05/28",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Card overview.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        investmentAccess: {
          status: "scored",
          score: 60,
          evidence:
            "Ágora brokerage plus Tesouro Direto and CDB in the main app; the split across two brands adds a step.",
          citations: [
            {
              url: "https://investimentos.bradesco/",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Investments portal.",
            },
            {
              url: "https://banco.bradesco/naocorrentista/agorainvestimentos/index.shtm",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Ágora.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        appQuality: {
          status: "scored",
          score: 80,
          evidence:
            "About 4.7 stars from about 5.9 million ratings on Google Play (search aggregate, not read from the listing).",
          citations: [
            {
              url: "https://play.google.com/store/apps/details?id=com.bradesco",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Rating from a search-engine aggregate.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "scored",
          score: 40,
          evidence:
            "Two confirmed incidents: a 2022 Bradesco Financiamentos leak of about 53,000 vehicle-financing contracts and a 2023 cyber incident at its US securities subsidiary.",
          citations: [
            {
              url: "https://contec.org.br/bradesco-financiamentos-relata-possivel-vazamento-de-dados-de-53-mil-clientes/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "2022 leak.",
            },
            {
              url: "https://canaltech.com.br/seguranca/bradesco-dados-clientes-expostosu-nidade-eua-256554/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "2023 incident.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 40,
          evidence:
            "Bundled packages from R$ 18.65 to R$ 64.70 a month; TED R$ 13.85 online and R$ 29.45 in person; basic card annuity R$ 108.00.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/60746948.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding:
                "Standard packages I to IV R$ 18.65, 32.40, 43.40, 64.70; TED R$ 13.85 internet, R$ 29.45 in person; basic national card annuity R$ 108.00; updated 01/10/2026.",
            },
          ],
          reviewedAt: "2026-10-02",
        },
        lockIn: {
          status: "scored",
          score: 40,
          evidence:
            "Fee waivers are tied to the investment balance kept at the bank. One complaint alleges the night Pix limit cannot be raised (anecdotal).",
          citations: [
            {
              url: "https://banco.bradesco/html/exclusive/produtos-servicos/tarifas/index.shtm",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Tariff page.",
            },
            {
              url: "https://www.reclameaqui.com.br/bradesco/bradesco-nao-autoriza-alteracao-limite-pix-noturno",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Complaint, anecdotal.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        publicReviews: {
          status: "scored",
          score: 40,
          evidence:
            "Reclame Aqui: 6.9/10, consumer average 5.54, 100% response but 68.5% resolution, 58.3% would do business again.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/bradesco/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-09-09",
        },
      },
    },
    {
      institutionId: "banco-do-brasil",
      criteria: {
        cardBenefits: {
          status: "scored",
          score: 60,
          evidence:
            "Ourocard Visa Infinite: points, cashback or investment; 1% cashback on Infinite, 0.30% on Gold. Benefits concentrate on premium tiers.",
          citations: [
            {
              url: "https://pontospravoar.com/guia-completo-beneficios-cartao-banco-brasil-ourocard-visa-infinite/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Ourocard benefits.",
            },
            {
              url: "https://www.melhorescartoes.com.br/banco-brasil-ourocard-cashback.html",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Cashback rates.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        investmentAccess: {
          status: "scored",
          score: 60,
          evidence:
            "Own brokerage (BB Investimentos) and an investments app; whether third-party products are distributed was not checked.",
          citations: [
            {
              url: "https://play.google.com/store/apps/details?id=br.com.bb.investimentosbb",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Investments app listing.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        appQuality: {
          status: "scored",
          score: 60,
          evidence:
            "Search snippets put the main app at 4.4 to 4.6 stars on Google Play; the listing was not read directly.",
          citations: [
            {
              url: "https://play.google.com/store/apps/details?id=br.com.bb.android",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Rating range from search snippets.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "insufficient-evidence",
          reason: "No citable source was found; the research left this criterion unscored.",
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 40,
          evidence:
            "Bundled packages from R$ 15.90 to R$ 55.60 a month; TED R$ 14.00 online, R$ 34.60 in person; basic card annuity R$ 234.00.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/00000000.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding:
                "Standard packages I to IV R$ 15.90, 27.90, 37.30, 55.60; TED R$ 14.00 internet, R$ 34.60 in person; basic national card annuity R$ 234.00; updated 01/10/2026.",
            },
          ],
          reviewedAt: "2026-10-02",
        },
        lockIn: {
          status: "scored",
          score: 40,
          evidence:
            "Night Pix limit R$ 1,000 with up to 48 hours to raise; several complaints about salary portability requests denied or delayed up to 10 business days.",
          citations: [
            {
              url: "https://www.idinheiro.com.br/contas/aumentar-limite-pix-no-banco-do-brasil/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Pix limit.",
            },
            {
              url: "https://www.reclameaqui.com.br/banco-do-brasil/dificuldade-e-demora-na-portabilidade-de-salario-do-banco-do-brasil-para-caixa_IEEubtKvDiobXRvP/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Portability complaint.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        publicReviews: {
          status: "scored",
          score: 60,
          evidence:
            "Reclame Aqui: 7.5/10 (February to July 2026), 76.5% resolution, 68.4% would do business again, average response 9 days 16 hours.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/banco-do-brasil/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-09-09",
        },
      },
    },
    {
      institutionId: "caixa",
      criteria: {
        cardBenefits: {
          status: "insufficient-evidence",
          reason: "No citable source was found; the research left this criterion unscored.",
          reviewedAt: "2026-09-09",
        },
        investmentAccess: {
          status: "scored",
          score: 40,
          evidence:
            "CDB (prefixed, Flex, progressive), Tesouro Direto and poupança: mostly own or government paper, no sign of an open platform.",
          citations: [
            {
              url: "https://www.caixa.gov.br/investimentos/Paginas/default.aspx",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Investment products.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        appQuality: {
          status: "scored",
          score: 40,
          evidence:
            "A secondary source names Caixa among the worst-rated bank apps on both stores; Caixa Tem users report crashes after updates. No exact rating.",
          citations: [
            {
              url: "https://seucreditodigital.com.br/banrisul-e-caixa-sao-piores-apps-de-banco-no-google-play-store-e-app-store/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Store ranking coverage.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "scored",
          score: 60,
          evidence: "Dedicated biometrics page; fingerprint authentication at ATMs.",
          citations: [
            {
              url: "https://www.caixa.gov.br/seguranca/biometria/Paginas/default.aspx",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Biometrics.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 40,
          evidence:
            "Bundled packages from R$ 16.00 to R$ 53.00 a month; TED R$ 13.00 online, R$ 25.00 in person; basic card annuity R$ 156.00.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/00360305.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding:
                "Standard packages I to IV R$ 16.00, 26.90, 35.50, 53.00; TED R$ 13.00 internet, R$ 25.00 in person; basic national card annuity R$ 156.00; updated 01/10/2026.",
            },
          ],
          reviewedAt: "2026-10-02",
        },
        lockIn: {
          status: "scored",
          score: 60,
          evidence:
            "Night Pix limit R$ 1,500 and the night window can start at 22h. No portability or closure friction evidence was gathered.",
          citations: [
            {
              url: "https://www.idinheiro.com.br/bancos/quais-sao-os-limites-de-ted-e-pix/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Pix limits.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        publicReviews: {
          status: "scored",
          score: 60,
          evidence:
            "Reclame Aqui: 7.2/10 (March to August 2026), 69.9% resolution, 65.6% would do business again.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/caixa-economica-federal/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-09-09",
        },
      },
    },
    {
      institutionId: "santander",
      criteria: {
        cardBenefits: {
          status: "insufficient-evidence",
          reason:
            "Only a search snippet said Elite and Unique moved to cashback; no citable page was found.",
          reviewedAt: "2026-09-09",
        },
        investmentAccess: {
          status: "scored",
          score: 80,
          evidence:
            "Santander Corretora absorbed Toro: 500+ fixed-income assets, 1,000+ funds including third parties, equities, REITs, ETFs, BDRs, Tesouro Direto and pensions.",
          citations: [
            {
              url: "https://blog.toroinvestimentos.com.br/institucional/toro-santander-corretora/",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Toro merger.",
            },
            {
              url: "https://www.santander.com.br/investimentos/produtos-da-corretora",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Brokerage products.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        appQuality: {
          status: "scored",
          score: 40,
          evidence:
            "The only rating found (4.10, 1.4 million ratings) belongs to Santander Way, removed from Google Play on 2026-06-23; no rating for the main app.",
          citations: [
            {
              url: "https://apps.apple.com/br/app/banco-santander-brasil/id613365711",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "App Store listing.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "insufficient-evidence",
          reason: "No citable source was found; the research left this criterion unscored.",
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 40,
          evidence:
            "Bundled packages from R$ 16.85 to R$ 57.50 a month, the highest top end among the large banks; TED R$ 14.10 online, R$ 26.70 in person.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/90400888.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding:
                "Standard packages I to IV R$ 16.85, 28.95, 38.70, 57.50; TED R$ 14.10 internet, R$ 26.70 in person; updated 01/10/2026.",
            },
          ],
          reviewedAt: "2026-10-02",
        },
        lockIn: {
          status: "scored",
          score: 20,
          evidence:
            "Package fee zeroed only with R$ 50,000 to R$ 80,000 invested or salary portability; several complaints about unilateral account closure and obstructed portability.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/santander/encerramento-unilateral-de-conta-salario-e-dificuldade-para-receber-salario_G8b-M8HBKb55CxV3/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Closure complaint.",
            },
            {
              url: "https://cms.santander.com.br/sites/WPS/documentos/Urlarq-Programa-Bonificacao-Conta-Plus-Select/25-10-01_191640_programa-bonificacao-conta-plus-select.pdf",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Fee bonus programme.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        publicReviews: {
          status: "scored",
          score: 20,
          evidence:
            "Reclame Aqui: 5.7/10 (March to August 2026), 52.6% resolution, 44.3% would do business again.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/santander/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-09-09",
        },
      },
    },
    {
      institutionId: "c6",
      criteria: {
        cardBenefits: {
          status: "scored",
          score: 80,
          evidence:
            "C6 Carbon: annuity waived at R$ 8,000 monthly spend or R$ 50,000 in C6 CDBs; up to 3.5 points per US$ or 1.7% cashback; 4 lounge visits a year.",
          citations: [
            {
              url: "https://altarendablog.com.br/2026/06/10/anuidade-zero-e-ate-35-pontos-por-dolar-conheca-os-beneficios-do-c6-carbon-mastercard-black/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "C6 Carbon.",
            },
            {
              url: "https://www.mobills.com.br/blog/cartao-de-credito/cartao-c6-carbon/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "C6 Carbon.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        investmentAccess: {
          status: "scored",
          score: 60,
          evidence: "C6 Invest offers fixed income for all profiles; no product count found.",
          citations: [
            {
              url: "https://www.c6bank.com.br/c6-invest/renda-fixa/",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Fixed income page.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        appQuality: {
          status: "insufficient-evidence",
          reason:
            "Sources disagree (Google Play 4.8 versus 3.6) and no citable page pinned the rating.",
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "scored",
          score: 80,
          evidence:
            "New devices need password plus facial recognition, and the app disables itself on a device if another face is detected; hardware-bound in-app token.",
          citations: [
            {
              url: "https://www.c6bank.com.br/blog/6-recursos-de-seguranca-que-o-c6-bank-usa-para-proteger-o-cliente",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Security features.",
            },
            {
              url: "https://www.c6bank.com.br/portal-de-seguranca/",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Security portal.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 80,
          evidence:
            "TED R$ 4.00 and basic card annuity R$ 98.00 in the registry; most everyday items free.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/31872495.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding:
                "TED R$ 4.00; basic national and international card annuity R$ 98.00; updated 01/10/2026.",
            },
          ],
          reviewedAt: "2026-10-02",
        },
        lockIn: {
          status: "scored",
          score: 60,
          evidence:
            "Card annuity waiver tied to R$ 50,000 in C6 CDBs; daily-liquidity CDB redeems only on business days 07:30 to 19:00, credited within 24 business hours.",
          citations: [
            {
              url: "https://seucreditodigital.com.br/c6-bank-aumenta-remuneracao-do-cdb-liquidez-diaria-confira-quanto/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "CDB redemption rules.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        publicReviews: {
          status: "scored",
          score: 60,
          evidence:
            "Reclame Aqui: 7.2/10, 76.8% resolution and 59.6% would do business again (January to June 2026).",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/c6-bank/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-09-09",
        },
      },
    },
    {
      institutionId: "btg",
      criteria: {
        cardBenefits: {
          status: "scored",
          score: 60,
          evidence:
            "BTG Black: 2.2 points per US$ or 1% cashback, LoungeKey, reduced IOF abroad; annuity waived only above R$ 120,000 invested or R$ 10,000 invested plus R$ 1,000 monthly spend.",
          citations: [
            {
              url: "https://www.idinheiro.com.br/cartao-de-credito/cartao-black-btg-pactual/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "BTG Black.",
            },
            {
              url: "https://renovainvest.com.br/blog/cartao-black-btg-pactual/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "BTG Black.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        investmentAccess: {
          status: "scored",
          score: 100,
          evidence:
            "Investment bank at the core; its app lists 1,000+ products (not checked against a BTG page).",
          citations: [
            {
              url: "https://play.google.com/store/apps/details?id=com.btg.pactual.digital.mobile",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "App description.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        appQuality: {
          status: "insufficient-evidence",
          reason:
            "Only one search snippet (4.7 App Store, 4.6 Google Play) and BTG splits across several apps.",
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "insufficient-evidence",
          reason: "No citable source was found; the research left this criterion unscored.",
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 100,
          evidence:
            "Every item BTG reports to the Central Bank registry is R$ 0.00 (account opening, statements, TED, internal transfers) except an administrative cheque at R$ 40.00; it lists no packages or card annuity.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/30306294.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding:
                "14 items reported, all R$ 0.00 except administrative cheque R$ 40.00; no packages or annuity listed; updated 01/10/2026.",
            },
          ],
          reviewedAt: "2026-10-02",
        },
        lockIn: {
          status: "scored",
          score: 40,
          evidence:
            "Card annuity waiver needs R$ 120,000 invested, the steepest asset pull among the large banks. Pix limit and closure friction were not researched.",
          citations: [
            {
              url: "https://www.idinheiro.com.br/cartao-de-credito/cartao-black-btg-pactual/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Waiver conditions.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        publicReviews: {
          status: "scored",
          score: 80,
          evidence:
            "Reclame Aqui is split by entity: BTG+ banking 7.39/10 (87.6% resolution), BTG Pactual Investimentos 8.6/10 (90.9% resolution).",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/btg-mais/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
            {
              url: "https://www.reclameaqui.com.br/empresa/btg-pactual-digital/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-09-09",
        },
      },
    },
    {
      institutionId: "xp",
      criteria: {
        cardBenefits: {
          status: "scored",
          score: 80,
          evidence:
            "XP Visa Infinite: permanent zero annuity, DragonPass, Investback up to 1% of spend, points for miles; full benefits need R$ 50,000 invested or R$ 3,000 monthly spend.",
          citations: [
            {
              url: "https://www.melhorescartoes.com.br/cartao-xp-visa-infinite.html",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "XP Visa Infinite.",
            },
            {
              url: "https://altarendablog.com.br/2026/08/02/xp-visa-infinite-mantem-beneficios-em-2026-dragonpass-investback-pontos-turbinados-e-anuidade-zero/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "2026 benefits.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        investmentAccess: {
          status: "scored",
          score: 100,
          evidence:
            "Full investment platform in one app: fixed income, Tesouro, funds, equities and structured products.",
          citations: [
            {
              url: "https://www.xpi.com.br/",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "XP platform.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        appQuality: {
          status: "insufficient-evidence",
          reason: "No store rating was gathered for the XP app.",
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "insufficient-evidence",
          reason: "XP security features were not researched.",
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 60,
          evidence:
            "TED R$ 0.00 in the registry, but bundled packages run R$ 36.00 to R$ 82.00 and the card annuity ceiling is R$ 18,000 (premium card). The digital account is free.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/33264668.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding:
                "TED R$ 0.00; standard packages I to IV R$ 36.00, 36.00, 59.00, 82.00; card annuity R$ 18,000.00; updated 01/10/2026.",
            },
            {
              url: "https://itsmoney.com.br/onde-investir/conta-digital-xp-vale-a-pena",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Free digital account.",
            },
          ],
          reviewedAt: "2026-10-02",
        },
        lockIn: {
          status: "scored",
          score: 40,
          evidence:
            "Card benefits (lounges, Investback rate) depend on R$ 50,000 invested at XP or R$ 3,000 monthly spend; no exit friction found for the account itself.",
          citations: [
            {
              url: "https://guiadoinvestidor.com.br/guias/cartao-xp-visa-infinite/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Benefit conditions.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        publicReviews: {
          status: "scored",
          score: 80,
          evidence:
            "Reclame Aqui: 7.9/10, 83% resolution, 67.6% would do business again; recurring complaint about advisors pushing commissioned products.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/xp-investimentos/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-09-09",
        },
      },
    },
    {
      institutionId: "sicoob",
      criteria: {
        cardBenefits: {
          status: "scored",
          score: 60,
          evidence:
            "Sicoobcard annuity R$ 90 (Clássico) or R$ 150 (Gold), waivable by spend; Coopera points for products, miles, bill credit or pension.",
          citations: [
            {
              url: "https://www.idinheiro.com.br/cartao-de-credito/cartao-sicoob/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Card overview.",
            },
            {
              url: "https://www.sicoob.com.br/documents/1948589/203636812/Tarifas+Cart%C3%A3o+de+Cr%C3%A9dito+por+anuidade.pdf",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Card tariffs.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        investmentAccess: {
          status: "scored",
          score: 40,
          evidence:
            "Poupança and cooperative-issued fixed income; no open investment platform found (not researched exhaustively).",
          citations: [
            {
              url: "https://www.sicoob.com.br/web/sicoob/contas-voce/-/asset_publisher/LMoNGCDcFEXS/content/id/1164656",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Poupança page.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        appQuality: {
          status: "scored",
          score: 80,
          evidence:
            "App Store rating 4.9; Sicoob reports second place in an app-satisfaction ranking across both stores.",
          citations: [
            {
              url: "https://www.sicoob.com.br/web/sicoob/noticias/-/asset_publisher/xAioIawpOI5S/content/id/48620204",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Sicoob press release.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "insufficient-evidence",
          reason: "Sicoob security features were not researched.",
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "insufficient-evidence",
          reason:
            "Each cooperative publishes its own tariff table. The Central Bank registry entry for Banco Sicoob (packages R$ 4.00 to R$ 24.00, TED R$ 12.00) is not the table a member pays.",
          reviewedAt: "2026-10-02",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/02038232.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding:
                "Banco Sicoob: packages I to IV R$ 4.00, 12.00, 16.00, 24.00; TED R$ 12.00 internet; updated 01/10/2026.",
            },
          ],
        },
        lockIn: {
          status: "scored",
          score: 20,
          evidence:
            "Membership requires buying capital quotas, built up over up to 17 monthly instalments; capital is returned only after the fiscal-year assessment, and Reclame Aqui has a complaint category for capital not returned after closing the account.",
          citations: [
            {
              url: "https://www.sicoob.com.br/web/sicoob/contas-voce/-/asset_publisher/LMoNGCDcFEXS/content/id/1164397",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Membership rules.",
            },
            {
              url: "https://www.reclameaqui.com.br/sicoob/nao-devolucao-do-capital-social-e-saldos-apos-encerramento-de-conta-sicoob_04EzznmlwbInzASY/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Complaint thread.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        publicReviews: {
          status: "scored",
          score: 60,
          evidence: "Reclame Aqui: 6.8/10 overall, 96.3% response, consumer average 5.51/10.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/sicoob/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-09-09",
        },
      },
    },
    {
      institutionId: "picpay",
      criteria: {
        cardBenefits: {
          status: "scored",
          score: 80,
          evidence:
            "Zero-annuity cards; cashback 0.5% (Platinum) to 1.2% (Black); free additional card for children from 10; Cofrinho balance raises the card limit.",
          citations: [
            {
              url: "https://www.serasa.com.br/credito/blog/cartao-picpay/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Card overview.",
            },
            {
              url: "https://www.idinheiro.com.br/cartao-de-credito/cartao-picpay/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Card overview.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        investmentAccess: {
          status: "scored",
          score: 60,
          evidence:
            "CDBs through Cofrinho at 100% CDI or more; no broker-style access to stocks, funds or Tesouro found.",
          citations: [
            {
              url: "https://meajuda.picpay.com/hc/pt-br/articles/7141763591571-O-que-%C3%A9-CDB-e-como-ele-funciona-no-PicPay",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Help centre, read through a search snippet.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        appQuality: {
          status: "insufficient-evidence",
          reason: "No store rating was gathered for the PicPay app.",
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "insufficient-evidence",
          reason: "PicPay security features were not researched.",
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 100,
          evidence:
            "PicPay Bank declares R$ 0.00 for TED, every standard package and both card annuities; the only charges are registration (R$ 200.00) and two paper-statement items. PicPay's payment institution reports no table.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/09516419.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding:
                "TED, standard packages I to IV and card annuities R$ 0.00; registration R$ 200.00; updated 01/10/2026.",
            },
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/22896431.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding: "The registry says this institution did not report its tariffs.",
            },
          ],
          reviewedAt: "2026-10-02",
        },
        lockIn: {
          status: "scored",
          score: 60,
          evidence:
            "Night Pix limit R$ 1,000 with 24 to 48 hours to raise and a complaint about refused increases; since July 2025 each deposit must sit through a rolling 30-day cycle to earn the account yield.",
          citations: [
            {
              url: "https://exame.com/invest/minhas-financas/picpay-muda-rendimento-automatico-da-conta-corrente-veja-como-funcionara/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "30-day cycle.",
            },
            {
              url: "https://www.reclameaqui.com.br/picpay-bank-banco-multiplo/negativa-de-aumento-de-limite-pix-falta-de-informacao-e-mau-atendimento-no_no3EnosKMhX5enHR/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Complaint thread.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        publicReviews: {
          status: "scored",
          score: 100,
          evidence:
            "Reclame Aqui: 8.6/10 with the RA1000 seal, 97.6% response, 91.3% resolution, 76.6% would do business again; won the 2025 Reclame Aqui award.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/picpay/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
            {
              url: "https://blog.picpay.com/picpay-premio-reclame-aqui-2025/",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Award post.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
      },
    },
    {
      institutionId: "mercado-pago",
      criteria: {
        cardBenefits: {
          status: "scored",
          score: 80,
          evidence:
            "Permanent zero annuity with no minimum spend; cashback up to 3% on Mercado Livre, 0.5% elsewhere, paid as Meli Dólar; up to 18 interest-free instalments on Mercado Livre.",
          citations: [
            {
              url: "https://www.mercadopago.com.br/blog/cartao-com-cashback",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Cashback terms, read through a search snippet.",
            },
            {
              url: "https://cartoeseviagens.com.br/cartao-mercado-pago-analise-completa",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Card review.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        investmentAccess: {
          status: "scored",
          score: 60,
          evidence:
            "Cofrinho CDB tiers (100%, 120% with Meli+, 140% campaigns); no access to stocks, funds or Tesouro found.",
          citations: [
            {
              url: "https://www.mercadopago.com.br/blog/promocao-rendimento-CDB-mercado-pago",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Blog, read through a search snippet.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        appQuality: {
          status: "insufficient-evidence",
          reason: "No store rating was gathered for the Mercado Pago app.",
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "scored",
          score: 60,
          evidence:
            "Mandatory 2FA (facial recognition, cross-device QR code, SMS or WhatsApp codes); recurring complaints that 2FA is forced or inconvenient.",
          citations: [
            {
              url: "https://www.mercadopago.com.br/blog/o-que-e-autenticacao-de-dois-fatores",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "2FA explainer, read through a search snippet.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "insufficient-evidence",
          reason:
            "Mercado Pago's payment institution reports no tariff table to the Central Bank registry and no full fee schedule was found.",
          reviewedAt: "2026-10-02",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/10573521.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding: "The registry says this institution did not report its tariffs.",
            },
          ],
        },
        lockIn: {
          status: "scored",
          score: 60,
          evidence:
            "Night Pix limit R$ 1,000, increases in 24 to 48 hours, decreases immediate. The default account balance is not FGC-covered.",
          citations: [
            {
              url: "https://www.mercadopago.com.br/blog/como-funciona-limite-pix-mercado-pago",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Pix limits, read through a search snippet.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        publicReviews: {
          status: "scored",
          score: 80,
          evidence:
            "Reclame Aqui: 8.0/10, 96.8% response, 81.3% resolution, 75.9% would do business again.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/mercado-pago/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-09-09",
        },
      },
    },
  ],
} satisfies BankProfilesDatasetInput;
