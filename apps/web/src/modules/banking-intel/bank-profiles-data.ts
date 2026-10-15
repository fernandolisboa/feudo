import type { BankProfilesDatasetInput } from "@feudo/core/reference-data";

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
          summaryPtBr:
            "O Nubank Rewards foi encerrado. O Nubank+ dá 0,8% de cashback ou 1,4 ponto por US$, com mensalidade de R$ 39 que pode ser isenta. O Ultravioleta dá 2,2 pontos por US$, isenção de IOF no exterior e 4 acessos a salas VIP por ano. O cartão de entrada não tem programa de pontos contínuo.",
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
          summaryPtBr:
            "NuInvest dentro do mesmo app: ações, ETFs, BDRs, Tesouro Direto sem taxa de serviço, fundos, CDB/LCI/LCA e criptomoedas.",
          citations: [
            {
              url: "https://nubank.com.br/nu/investimentos/tesouro-direto",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding: "Tesouro Direto in the app.",
            },
            {
              url: "https://nubank.com.br/sobre-investimentos/taxas-e-precos",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding: "Investment fees and prices.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        appQuality: {
          status: "scored",
          score: 60,
          evidence:
            "Secondary sources put the app at about 4.6 stars on Google Play and 4.8 on the App Store (undated); the earlier figure of about 4.7 stars from about 5.5 million ratings was not re-read and the store listing does not show a rating to automated reads. Confirmed 2026 instability: 7 February (login, transfers and internet banking, about 6,820 Downdetector reports at the peak, resolved the same day per Nubank), 6 March (login, transfers and Pix, about 389 reports) and a temporary Pix intermittency in late May that Nubank confirmed.",
          summaryPtBr:
            "Fontes secundárias indicam cerca de 4,6 estrelas no Google Play e 4,8 na App Store (sem data). O número anterior, cerca de 4,7 estrelas com cerca de 5,5 milhões de avaliações, não foi relido, e a página da loja não mostra a nota para leitura automática. Houve instabilidade confirmada em 2026: em 7 de fevereiro (login, transferências e internet banking, com cerca de 6.820 relatos no pico do Downdetector, resolvida no mesmo dia segundo o Nubank), em 6 de março (login, transferências e Pix, cerca de 389 relatos) e uma intermitência temporária do Pix no fim de maio, confirmada pelo Nubank.",
          citations: [
            {
              url: "https://play.google.com/store/apps/details?id=com.nu.production",
              kind: "secondary",
              checkedAt: "2026-10-15",
              finding: "Listing found through search; the snippet shows no rating figure.",
            },
            {
              url: "https://www.mobills.com.br/blog/bancos/como-baixar-app-nubank/",
              kind: "secondary",
              checkedAt: "2026-10-15",
              finding: "Undated: Play Store 4.6 and App Store 4.8.",
            },
            {
              url: "https://comunidade.nubank.com.br/vida-financeira/post/nubank-fora-do-ar-resolvido---07-02-2026-jawvM3kMEGDQQnk",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding: "Nubank community post: app instability on 07/02/2026 resolved at 17:00.",
            },
            {
              url: "https://www.portaldecamaqua.com.br/noticias/100630/nubank-fora-do-ar-servicos-apresentam-instabilidade-hoje-neste-sabado-dia-7-de-fevereiro-de-2026.html",
              kind: "secondary",
              checkedAt: "2026-10-15",
              finding:
                "Downdetector: login, transfers and internet banking on 7 February 2026, about 6,820 reports at the peak.",
            },
            {
              url: "https://www.portaldecamaqua.com.br/noticias/101518/nubank-fora-do-ar-hoje-servicos-apresentam-instabilidade-nesta-sexta-dia-6-de-marco-de-2026.html",
              kind: "secondary",
              checkedAt: "2026-10-15",
              finding:
                "Downdetector: login, transfers and Pix on 6 March 2026, about 389 reports at the peak.",
            },
            {
              url: "https://altarendablog.com.br/2026/05/29/pix-fora-do-ar-nubank-itau-bradesco-santander-e-inter-registram-falhas-e-clientes-entram-em-alerta/",
              kind: "secondary",
              checkedAt: "2026-10-15",
              finding: "Nubank confirmed a temporary Pix instability in the week of 27 May 2026.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        security: {
          status: "scored",
          score: 60,
          evidence:
            "Publishes its 2FA and TLS policy and recommends a biometric second factor. One March 2025 complaint alleges data sharing that enabled fraud; no confirmed mass breach.",
          summaryPtBr:
            "Publica sua política de 2FA e TLS e recomenda biometria como segundo fator. Uma reclamação de março de 2025 alega compartilhamento de dados que facilitou fraude. Não há vazamento em massa confirmado.",
          citations: [
            {
              url: "https://nubank.com.br/transparencia/politicas-de-privacidade-e-seguranca/politica-de-seguranca",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding: "Security policy.",
            },
            {
              url: "https://blog.nubank.com.br/autenticacao-dois-fatores/",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding: "Two-factor authentication.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        fees: {
          status: "scored",
          score: 100,
          evidence:
            "No account maintenance fee; free TED, Pix and boleto for individuals; no fee for Tesouro Direto or stock trading. Nu Pagamentos reports no tariff table to the Central Bank registry.",
          summaryPtBr:
            "Sem tarifa de manutenção de conta. TED, Pix e boleto gratuitos para pessoas físicas. Sem tarifa para Tesouro Direto ou negociação de ações. A Nu Pagamentos não informa tabela de tarifas ao cadastro do Banco Central.",
          citations: [
            {
              url: "https://blog.nubank.com.br/quanto-custa-uma-ted-nos-bancos-tradicionais/",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding: "Free transfers.",
            },
            {
              url: "https://nubank.com.br/contratos",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding: "Contracts page lists TED, Pix and deposit by boleto at R$ 0.",
            },
            {
              url: "https://nubank.com.br/sobre-investimentos/taxas-e-precos",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "No service fee for Tesouro Direto, CDB, LCI, LCA, stocks or BDRs; only the B3 custody fee on Tesouro.",
            },
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/18236120.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding: "The registry says this institution did not report its tariffs.",
            },
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/18236120.asp?seg=bancossegmento09&frame=1",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "Automated read failed (url_not_accessible); the registry page was not re-read, only its listing was seen.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        lockIn: {
          status: "scored",
          score: 60,
          evidence:
            "Night Pix limit is the market-wide R$ 1,000 default, raised in 24 to 48 hours and lowered immediately. Fee-free core account, but cashback, points and lounges on Croma and Ultravioleta are gated by spend or account tier.",
          summaryPtBr:
            "O limite do Pix noturno é o padrão de R$ 1.000 adotado em todo o mercado, aumentado em 24 a 48 horas e reduzido na hora. A conta básica não tem tarifa, mas o cashback, os pontos e as salas VIP do Croma e do Ultravioleta dependem de gastos ou do nível da conta.",
          citations: [
            {
              url: "https://blog.nubank.com.br/meus-limites-pix-nubank-permite-definir-limites-diurno-e-noturno-para-transacoes/",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding: "Pix day and night limits.",
            },
            {
              url: "https://blog.nubank.com.br/limite-pix/",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "Increases take 24 to 48 hours after the request; reductions apply immediately.",
            },
            {
              url: "https://comunidade.nubank.com.br/novidades/post/mais-seguranca-nas-transacoes-noturnas-em-sua-conta-4QKoa2N4jHuTsn3",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "Night limit of up to R$ 1,000 on Pix and boleto payments between individuals, set by Banco Central.",
            },
            {
              url: "https://altarendablog.com.br/2026/10/13/nubank-agora-tem-5-cartoes-de-credito-veja-qual-e-o-seu-e-como-subir-de-nivel-em-2026/",
              kind: "secondary",
              checkedAt: "2026-10-15",
              finding:
                "Croma and Ultravioleta fees are waived only above monthly spend or invested thresholds.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        publicReviews: {
          status: "scored",
          score: 87,
          evidence:
            "Reclame Aqui: reputation 8.7/10, consumer average 7.72, 99.6% response, 92.9% resolution, 81.1% would do business again. consumidor.gov.br rendered no data.",
          summaryPtBr:
            "Reclame Aqui: reputação 8,7/10, nota média dos consumidores 7,72, 99,6% de respostas, 92,9% de solução, 81,1% voltariam a fazer negócio. O consumidor.gov.br não trouxe dados.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/nubank/",
              kind: "secondary",
              checkedAt: "2026-10-15",
              finding:
                "Reclame Aqui page read through a search-engine snippet (the site refuses automated reads): maximum reputation, average 8.7/10 over the last 6 months, 99.6% response. Resolution and would-do-business-again figures were not visible in the snippet.",
            },
            {
              url: "https://www.consumidor.gov.br/pages/empresa/20150204000053619/perfil",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Page rendered no indicators to an automated read.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        jointBanking: {
          status: "scored",
          score: 65,
          evidence:
            "Nubank has no joint account by its own account: the blog says 'o Nubank não oferece conta conjunta'. Ultravioleta clients get Saldo Compartilhado inside Espaço Família, where administrators share one balance from their own logins and spending is attributed pro rata to each person's deposits.",
          summaryPtBr:
            "O próprio blog do Nubank diz que 'o Nubank não oferece conta conjunta'. Clientes Ultravioleta têm o Saldo Compartilhado no Espaço Família: os administradores dividem um mesmo saldo, cada um com seu login, e os gastos são atribuídos a cada pessoa na proporção do que depositou.",
          citations: [
            {
              url: "https://blog.nubank.com.br/conta-conjunta/",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding: "Blog states 'o Nubank não oferece conta conjunta', updated 28 Jul 2026.",
            },
            {
              url: "https://nu.com/pt/sala-de-imprensa/consumidores/espaco-familia-nubank-ultravioleta-lanca-recurso-de-saldo-compartilhado",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Press release: Espaço Família (Ultravioleta) shares one balance among the client and up to four others from their own logins; both administrators are notified and spending is attributed pro rata to each person's deposits.",
            },
          ],
          reviewedAt: "2026-10-13",
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
          summaryPtBr:
            "Cartões sem anuidade e, em várias versões, sem exigência de gasto. Os pontos do Inter Loop podem virar cashback, milhas, dólares, desconto na fatura ou investimentos, sem tarifa pelo programa.",
          citations: [
            {
              url: "https://inter.co/pra-voce/cartoes/programa-de-pontos/",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding: "Inter Loop programme.",
            },
            {
              url: "https://altarendablog.com.br/2026/04/05",
              kind: "secondary",
              checkedAt: "2026-10-15",
              finding: "Card overview.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        investmentAccess: {
          status: "scored",
          score: 80,
          evidence:
            "Inter Invest in the same app: CDB from R$ 1, Tesouro Direto with no Inter fee (only the B3 0.20% a year), funds, crypto, Brazilian and foreign stocks.",
          summaryPtBr:
            "Inter Invest no mesmo app: CDB a partir de R$ 1, Tesouro Direto sem taxa do Inter (só os 0,20% ao ano da B3), fundos, criptomoedas, ações brasileiras e estrangeiras.",
          citations: [
            {
              url: "https://inter.co/pra-voce/investimentos/renda-fixa/cdb/",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding: "CDB offer.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        appQuality: {
          status: "scored",
          score: 60,
          evidence:
            "Only branded content claims top ratings, with no number or independent source. Confirmed instability on 7 February 2026 and in July 2026 (login, Pix, purchases).",
          summaryPtBr:
            "Só conteúdo da própria marca fala em notas máximas, sem número nem fonte independente. Houve instabilidade confirmada em 7 de fevereiro de 2026 e em julho de 2026 (login, Pix, compras).",
          citations: [
            {
              url: "https://dol.com.br/noticias/brasil/946160",
              kind: "secondary",
              checkedAt: "2026-10-15",
              finding:
                "Login instability on 02/07/2026 per Downdetector, no official statement; read through the AMP mirror of the same article.",
            },
            {
              url: "https://www.portaldecamaqua.com.br/noticias/100635",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "App instability report.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        security: {
          status: "scored",
          score: 40,
          evidence:
            "Confirmed leak: a public prosecutor investigation found about 19,961 customers' records exposed, 13,207 with account number, password, address and CPF; Inter attributed it to an insider.",
          summaryPtBr:
            "Vazamento confirmado: uma investigação do Ministério Público encontrou dados de cerca de 19.961 clientes expostos, 13.207 deles com número da conta, senha, endereço e CPF. O Inter atribuiu o caso a uma pessoa de dentro da empresa.",
          citations: [
            {
              url: "https://tecnoblog.net/noticias/banco-inter-vazou-dados-correntistas-acao-mp/",
              kind: "secondary",
              checkedAt: "2026-10-15",
              finding: "Leak coverage.",
            },
            {
              url: "https://canaltech.com.br/hacker/banco-inter-atribui-vazamento-de-dados-a-ataque-interno-de-baixo-impacto-120346/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Inter statement.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        fees: {
          status: "scored",
          score: 80,
          evidence:
            "The free digital account has no maintenance fee and free Pix. The Central Bank registry still lists maximum tariffs: TED up to R$ 15.00, packages R$ 20.00 to R$ 45.00, basic card annuity up to R$ 80.00. Scored one step below the all-zero registries (BTG, PicPay Bank).",
          summaryPtBr:
            "A conta digital gratuita não tem tarifa de manutenção e o Pix é gratuito. O cadastro do Banco Central ainda lista tarifas máximas: TED até R$ 15,00, pacotes de R$ 20,00 a R$ 45,00, anuidade do cartão básico até R$ 80,00. Recebeu nota um nível abaixo dos cadastros com tudo zerado (BTG, PicPay Bank).",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/00416968.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "TED R$ 15.00; standard packages I to III R$ 20.00, 30.00, 45.00; basic national card annuity R$ 80.00; page last updated 08/09/2026.",
            },
            {
              url: "https://www.cnnbrasil.com.br/economia/money/negocios/inter-cobra-taxa-de-manutencao-da-conta-tudo-sobre-a-estrutura-de-tarifas/",
              kind: "secondary",
              checkedAt: "2026-10-15",
              finding: "Free digital account.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        lockIn: {
          status: "scored",
          score: 60,
          evidence:
            "Market-wide R$ 1,000 night Pix default, 24 hours to raise. Free account and an ungated points programme; individual complaints about slow limit increases.",
          summaryPtBr:
            "Padrão de mercado de R$ 1.000 no Pix noturno, com 24 horas para aumentar. Conta gratuita e programa de pontos sem condições. Há reclamações individuais sobre demora no aumento de limite.",
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
          score: 85,
          evidence:
            "Reclame Aqui: 8.5/10, 98.4% response, 90% resolution, 78% would do business again, average response 9 days 13 hours.",
          summaryPtBr:
            "Reclame Aqui: 8,5/10, 98,4% de respostas, 90% de solução, 78% voltariam a fazer negócio, tempo médio de resposta de 9 dias e 13 horas.",
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
        jointBanking: {
          status: "scored",
          score: 0,
          evidence:
            "Inter's help center says 'Atualmente, não é possível ter uma conta conjunta no Inter' and that it only offers individual accounts tied to a CPF; it no longer opens joint accounts for new customers.",
          summaryPtBr:
            "A central de ajuda do Inter diz 'Atualmente, não é possível ter uma conta conjunta no Inter' e que o banco só oferece contas individuais ligadas a um CPF. O Inter não abre mais contas conjuntas para novos clientes.",
          citations: [
            {
              url: "https://ajuda.inter.co/conta-digital-pessoa-fisica-e-mei/posso-ter-uma-conta-conjunta-no-inter",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "'Atualmente, não é possível ter uma conta conjunta no Inter. A instituição oferece apenas contas individuais vinculadas ao CPF.'",
            },
          ],
          reviewedAt: "2026-10-13",
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
          summaryPtBr:
            "Vários níveis de cartão: Personnalité Black, parceria com LATAM Pass, Private Visa Infinite com DragonPass e Magalu com até 2% de cashback. A anuidade é isenta a partir de R$ 8.000 de gastos por mês ou R$ 50.000 investidos.",
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
          summaryPtBr:
            "Itaú Corretora e íon: Tesouro Direto, ações e fundos. O saldo investido também conta para a isenção de tarifas.",
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
          summaryPtBr:
            "Não há evidência suficiente. Não foi possível ler a nota atual do app do Itaú, e não se encontrou nenhuma queda em 2026 que confirme ou descarte problemas.",
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
          summaryPtBr:
            "Não há evidência suficiente. Não foram encontrados incidentes nem recursos de segurança específicos do Itaú. Não achar nada não significa histórico limpo.",
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 40,
          evidence:
            "Bundled packages from R$ 16.10 to R$ 55.70 a month; TED up to R$ 11.10 online and R$ 20.70 in person; waivers tied to spend or investment.",
          summaryPtBr:
            "Pacotes de R$ 16,10 a R$ 55,70 por mês. TED de até R$ 11,10 online e R$ 20,70 no atendimento presencial. Isenções ligadas a gastos ou investimentos.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/60701190.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "Standard packages I to IV R$ 16.10, 28.00, 37.40, 55.70; TED R$ 11.10 internet, R$ 20.70 in person; page last updated 23/09/2026.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        lockIn: {
          status: "scored",
          score: 40,
          evidence:
            "Account fee and card annuity waivers depend on R$ 4,000 to R$ 8,000 monthly spend or R$ 50,000 or more invested at Itaú: a structural reason to keep banking and investments there.",
          summaryPtBr:
            "A isenção da tarifa da conta e da anuidade do cartão depende de R$ 4.000 a R$ 8.000 de gastos por mês ou de R$ 50.000 ou mais investidos no Itaú. É um motivo estrutural para manter conta e investimentos lá.",
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
          score: 81,
          evidence:
            "Reclame Aqui: 8.1/10, consumer average 7.02, 97.5% response, 85.4% resolution, 74.2% would do business again.",
          summaryPtBr:
            "Reclame Aqui: 8,1/10, nota média dos consumidores 7,02, 97,5% de respostas, 85,4% de solução, 74,2% voltariam a fazer negócio.",
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
        jointBanking: {
          status: "scored",
          score: 100,
          evidence:
            "Itaú's Conta Universal terms define a joint account ('E/OU' or 'E'), and the account FAQ confirms every holder opens one by going to a branch with documents; branch-only opening does not lower this score.",
          summaryPtBr:
            "Os termos da Conta Universal do Itaú definem a conta conjunta ('E/OU' ou 'E'), e o FAQ da conta confirma que cada titular a abre indo a uma agência com os documentos. A abertura só em agência não reduz esta nota.",
          citations: [
            {
              url: "https://www.itau.com.br/atendimento-itau/para-voce/conta-corrente/como-faco-para-abrir-uma-conta-corrente-no-itau",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "'Para abrir uma conta-conjunta, todos os titulares devem ir à agência com os documentos.'",
            },
            {
              url: "https://www.itau.com.br/_arquivosestaticos/Itau/PDF/para-voce/conta-corrente/condicoes-gerais-da-conta-universal-itau.pdf",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Conta Universal terms define joint 'E/OU' (one signature suffices) and 'E' (all holders must sign) accounts, with every holder jointly liable.",
            },
          ],
          reviewedAt: "2026-10-13",
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
          summaryPtBr:
            "Pontos Livelo. Há campanhas periódicas de isenção de anuidade, e não uma isenção permanente. A isenção do cartão topo de linha exige R$ 5 milhões investidos.",
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
          summaryPtBr:
            "Corretora Ágora, além de Tesouro Direto e CDB no app principal. A divisão entre duas marcas acrescenta um passo.",
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
          summaryPtBr:
            "Cerca de 4,7 estrelas, com cerca de 5,9 milhões de avaliações no Google Play (agregado de busca, não lido na página).",
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
          summaryPtBr:
            "Dois incidentes confirmados: um vazamento de 2022 na Bradesco Financiamentos, com cerca de 53.000 contratos de financiamento de veículos, e um incidente cibernético em 2023 na subsidiária de valores mobiliários nos EUA.",
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
          summaryPtBr:
            "Pacotes de R$ 18,65 a R$ 64,70 por mês. TED de R$ 13,85 online e R$ 29,45 no atendimento presencial. Anuidade do cartão básico de R$ 108,00.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/60746948.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "Standard packages I to IV R$ 18.65, 32.40, 43.40, 64.70; TED R$ 13.85 internet, R$ 29.45 in person; basic national card annuity R$ 108.00; page last updated 29/09/2026.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        lockIn: {
          status: "scored",
          score: 40,
          evidence:
            "Fee waivers are tied to the investment balance kept at the bank. One complaint alleges the night Pix limit cannot be raised (anecdotal).",
          summaryPtBr:
            "As isenções de tarifas dependem do saldo investido mantido no banco. Uma reclamação alega que o limite do Pix noturno não pode ser aumentado (relato isolado).",
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
          score: 69,
          evidence:
            "Reclame Aqui: 6.9/10, consumer average 5.54, 100% response but 68.5% resolution, 58.3% would do business again.",
          summaryPtBr:
            "Reclame Aqui: 6,9/10, nota média dos consumidores 5,54, 100% de respostas, mas 68,5% de solução e 58,3% voltariam a fazer negócio.",
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
        jointBanking: {
          status: "scored",
          score: 100,
          evidence:
            "Bradesco's account-opening regulation defines Conta Conjunta Simples ('e') and Conta Conjunta Solidária ('e/ou') for new personal accounts, with every holder jointly liable, including for credit.",
          summaryPtBr:
            "O regulamento de abertura de contas do Bradesco define a Conta Conjunta Simples ('e') e a Conta Conjunta Solidária ('e/ou') para novas contas de pessoa física, com todos os titulares respondendo em conjunto, inclusive pelo crédito.",
          citations: [
            {
              url: "https://banco.bradesco/assets/classic/pdf/produtos-servicos/tipos-de-conta/regulamento-para-abertura-de-contas-de-depositos-produtos-e-servicos-pessoa-fisica.pdf",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Regulation 1.408-7E (04/2026) 2.4.2 defines joint types 'e' (simples) and 'e/ou' (solidária); holders are jointly liable for credit limits.",
            },
          ],
          reviewedAt: "2026-10-13",
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
          summaryPtBr:
            "Ourocard Visa Infinite: pontos, cashback ou investimento. Cashback de 1% no Infinite e de 0,30% no Gold. Os benefícios se concentram nos níveis premium.",
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
          summaryPtBr:
            "Corretora própria (BB Investimentos) e um app de investimentos. Não foi verificado se há distribuição de produtos de terceiros.",
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
          summaryPtBr:
            "Trechos de busca indicam de 4,4 a 4,6 estrelas para o app principal no Google Play. A página não foi lida diretamente.",
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
          summaryPtBr:
            "Não há evidência suficiente. Nenhuma fonte citável foi encontrada, e a pesquisa deixou este critério sem nota.",
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 40,
          evidence:
            "Bundled packages from R$ 15.90 to R$ 55.60 a month; TED R$ 14.00 online, R$ 34.60 in person; basic card annuity R$ 234.00.",
          summaryPtBr:
            "Pacotes de R$ 15,90 a R$ 55,60 por mês. TED de R$ 14,00 online e R$ 34,60 no atendimento presencial. Anuidade do cartão básico de R$ 234,00.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/00000000.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "Standard packages I to IV R$ 15.90, 27.90, 37.30, 55.60; TED R$ 14.00 internet, R$ 34.60 in person; basic national card annuity R$ 234.00; page last updated 25/09/2026.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        lockIn: {
          status: "scored",
          score: 40,
          evidence:
            "Night Pix limit R$ 1,000 with up to 48 hours to raise; several complaints about salary portability requests denied or delayed up to 10 business days.",
          summaryPtBr:
            "Limite do Pix noturno de R$ 1.000, com até 48 horas para aumentar. Há várias reclamações sobre pedidos de portabilidade de salário negados ou atrasados em até 10 dias úteis.",
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
          score: 75,
          evidence:
            "Reclame Aqui: 7.5/10 (February to July 2026), 76.5% resolution, 68.4% would do business again, average response 9 days 16 hours.",
          summaryPtBr:
            "Reclame Aqui: 7,5/10 (fevereiro a julho de 2026), 76,5% de solução, 68,4% voltariam a fazer negócio, tempo médio de resposta de 9 dias e 16 horas.",
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
        jointBanking: {
          status: "scored",
          score: 100,
          evidence:
            "Banco do Brasil's own blog describes a joint account (solidária or simples) open to anyone 18 or older with up to four holders, each with their own App BB access and, per the blog, their own credit card.",
          summaryPtBr:
            "O blog do próprio Banco do Brasil descreve a conta conjunta (solidária ou simples), aberta a maiores de 18 anos, com até quatro titulares. Cada um tem seu acesso ao App BB e, segundo o blog, seu próprio cartão de crédito.",
          citations: [
            {
              url: "https://blog.bb.com.br/conta-conjunta-dez-perguntas-e-respostas-que-voce-precisa-conhecer/",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Anyone 18+, no family tie needed, up to 4 holders; each holder can have their own credit card and accesses the account individually via App BB or Internet Banking.",
            },
          ],
          reviewedAt: "2026-10-13",
        },
      },
    },
    {
      institutionId: "caixa",
      criteria: {
        cardBenefits: {
          status: "insufficient-evidence",
          reason: "No citable source was found; the research left this criterion unscored.",
          summaryPtBr:
            "Não há evidência suficiente. Nenhuma fonte citável foi encontrada, e a pesquisa deixou este critério sem nota.",
          reviewedAt: "2026-09-09",
        },
        investmentAccess: {
          status: "scored",
          score: 40,
          evidence:
            "CDB (prefixed, Flex, progressive), Tesouro Direto and poupança: mostly own or government paper, no sign of an open platform.",
          summaryPtBr:
            "CDB (prefixado, Flex, progressivo), Tesouro Direto e poupança. São, na maioria, papéis próprios ou do governo, sem sinal de plataforma aberta.",
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
          summaryPtBr:
            "Uma fonte secundária cita a Caixa entre os apps de banco pior avaliados nas duas lojas. Usuários do Caixa Tem relatam travamentos após atualizações. Sem nota exata.",
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
          summaryPtBr:
            "Página dedicada à biometria e autenticação por impressão digital nos caixas eletrônicos.",
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
          summaryPtBr:
            "Pacotes de R$ 16,00 a R$ 53,00 por mês. TED de R$ 13,00 online e R$ 25,00 no atendimento presencial. Anuidade do cartão básico de R$ 156,00.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/00360305.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "Standard packages I to IV R$ 16.00, 26.90, 35.50, 53.00; TED R$ 13.00 internet, R$ 25.00 in person; basic national card annuity R$ 156.00; page last updated 23/09/2026.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        lockIn: {
          status: "scored",
          score: 60,
          evidence:
            "Night Pix limit R$ 1,500 and the night window can start at 22h. No portability or closure friction evidence was gathered.",
          summaryPtBr:
            "Limite do Pix noturno de R$ 1.500, e o horário noturno pode começar às 22h. Não foram levantadas evidências de dificuldade para portabilidade ou encerramento da conta.",
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
          score: 72,
          evidence:
            "Reclame Aqui: 7.2/10 (March to August 2026), 69.9% resolution, 65.6% would do business again.",
          summaryPtBr:
            "Reclame Aqui: 7,2/10 (março a agosto de 2026), 69,9% de solução, 65,6% voltariam a fazer negócio.",
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
        jointBanking: {
          status: "scored",
          score: 100,
          evidence:
            "Caixa's account-opening contract defines joint current and savings accounts, solidária (any holder moves alone) or não-solidária (all must act together), each holder with their own app login by CPF.",
          summaryPtBr:
            "O contrato de abertura de conta da Caixa define contas correntes e poupanças conjuntas, solidárias (qualquer titular movimenta sozinho) ou não solidárias (todos precisam agir juntos). Cada titular tem seu próprio login no app, pelo CPF.",
          citations: [
            {
              url: "https://www.caixa.gov.br/Downloads/contas-pessoa-fisica/Contrato-Pessoa-Fisica-10-11-2021.pdf",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Cláusulas Gerais (37.105 v023) define joint current/savings accounts as solidária or não-solidária; a holder can leave without the others' authorisation, adding one needs all of them.",
            },
            {
              url: "https://www.caixa.gov.br/atendimento/canais-digitais/app-caixa-internet-banking/perguntas-frequentes/Paginas/default.aspx",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding: "Each joint holder registers their own user and access password by CPF.",
            },
          ],
          reviewedAt: "2026-10-13",
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
          summaryPtBr:
            "Não há evidência suficiente. Só um trecho de busca dizia que Elite e Unique passaram para cashback, e nenhuma página citável foi encontrada.",
          reviewedAt: "2026-09-09",
        },
        investmentAccess: {
          status: "scored",
          score: 80,
          evidence:
            "Santander Corretora absorbed Toro: 500+ fixed-income assets, 1,000+ funds including third parties, equities, REITs, ETFs, BDRs, Tesouro Direto and pensions.",
          summaryPtBr:
            "A Santander Corretora absorveu a Toro: mais de 500 ativos de renda fixa, mais de 1.000 fundos, inclusive de terceiros, ações, fundos imobiliários, ETFs, BDRs, Tesouro Direto e previdência.",
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
          summaryPtBr:
            "A única nota encontrada (4,10, com 1,4 milhão de avaliações) é do Santander Way, retirado do Google Play em 23 de junho de 2026. Não há nota para o app principal.",
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
          summaryPtBr:
            "Não há evidência suficiente. Nenhuma fonte citável foi encontrada, e a pesquisa deixou este critério sem nota.",
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 40,
          evidence:
            "Bundled packages from R$ 16.85 to R$ 57.50 a month, the highest top end among the large banks; TED R$ 14.10 online, R$ 26.70 in person.",
          summaryPtBr:
            "Pacotes de R$ 16,85 a R$ 57,50 por mês, o valor máximo mais alto entre os grandes bancos. TED de R$ 14,10 online e R$ 26,70 no atendimento presencial.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/90400888.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "Standard packages I to IV R$ 16.85, 28.95, 38.70, 57.50; TED R$ 14.10 internet, R$ 26.70 in person; page last updated 24/09/2026.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        lockIn: {
          status: "scored",
          score: 20,
          evidence:
            "Package fee zeroed only with R$ 50,000 to R$ 80,000 invested or salary portability; several complaints about unilateral account closure and obstructed portability.",
          summaryPtBr:
            "A tarifa do pacote só é zerada com R$ 50.000 a R$ 80.000 investidos ou com portabilidade de salário. Há várias reclamações sobre encerramento de conta feito pelo banco por conta própria e sobre portabilidade dificultada.",
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
          score: 57,
          evidence:
            "Reclame Aqui: 5.7/10 (March to August 2026), 52.6% resolution, 44.3% would do business again.",
          summaryPtBr:
            "Reclame Aqui: 5,7/10 (março a agosto de 2026), 52,6% de solução, 44,3% voltariam a fazer negócio.",
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
        jointBanking: {
          status: "scored",
          score: 100,
          evidence:
            "Santander's current-account terms define joint accounts of type 'OU' (either holder moves alone) or 'E' (all act together), with one debit card issued per holder.",
          summaryPtBr:
            "Os termos de conta corrente do Santander definem contas conjuntas do tipo 'OU' (qualquer titular movimenta sozinho) ou 'E' (todos agem juntos), com um cartão de débito emitido para cada titular.",
          citations: [
            {
              url: "https://cms.santander.com.br/sites/WPS/documentos/arq-condicoes-gerais-conta-corrente/25-11-07_143048_condicoes-gerais-conta-corrente-nov25.pdf",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Terms 1614-S06 (10/2025) define joint 'OU'/'E' types; clause 7.2: one debit card issued per holder.",
            },
          ],
          reviewedAt: "2026-10-13",
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
          summaryPtBr:
            "C6 Carbon: anuidade isenta com R$ 8.000 de gastos por mês ou R$ 50.000 em CDBs do C6. Até 3,5 pontos por US$ ou 1,7% de cashback. 4 acessos a salas VIP por ano.",
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
          summaryPtBr:
            "O C6 Invest oferece renda fixa para todos os perfis. Não foi encontrado o número de produtos.",
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
          summaryPtBr:
            "Não há evidência suficiente. As fontes divergem (Google Play 4,8 contra 3,6) e nenhuma página citável confirmou a nota.",
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "scored",
          score: 80,
          evidence:
            "New devices need password plus facial recognition, and the app disables itself on a device if another face is detected; hardware-bound in-app token.",
          summaryPtBr:
            "Dispositivos novos exigem senha e reconhecimento facial, e o app se desativa no aparelho se outro rosto for detectado. O token dentro do app é vinculado ao hardware.",
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
          summaryPtBr:
            "TED de R$ 4,00 e anuidade do cartão básico de R$ 98,00 no cadastro. A maior parte dos itens do dia a dia é gratuita.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/31872495.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "TED R$ 4.00; basic national and international card annuity R$ 98.00, listed with a periodicity of every 30 days; page last updated 15/10/2026.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        lockIn: {
          status: "scored",
          score: 60,
          evidence:
            "Card annuity waiver tied to R$ 50,000 in C6 CDBs; daily-liquidity CDB redeems only on business days 07:30 to 19:00, credited within 24 business hours.",
          summaryPtBr:
            "A isenção da anuidade do cartão depende de R$ 50.000 em CDBs do C6. O CDB com liquidez diária só é resgatado em dias úteis, das 7h30 às 19h, com crédito em até 24 horas úteis.",
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
          score: 72,
          evidence:
            "Reclame Aqui: 7.2/10, 76.8% resolution and 59.6% would do business again (January to June 2026).",
          summaryPtBr:
            "Reclame Aqui: 7,2/10, 76,8% de solução e 59,6% voltariam a fazer negócio (janeiro a junho de 2026).",
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
        jointBanking: {
          status: "scored",
          score: 65,
          evidence:
            "C6 has no joint account, as its own blog states, and instead offers Conta Compartilhada: the holder invites one other C6 client as a procurador who moves the account independently from their own login, without becoming a co-holder.",
          summaryPtBr:
            "Como diz o próprio blog, o C6 não tem conta conjunta. Oferece no lugar a Conta Compartilhada: o titular convida outro cliente do C6 como procurador, que movimenta a conta de forma independente, com o próprio login, sem se tornar cotitular.",
          citations: [
            {
              url: "https://ajuda.c6bank.com.br/s/article/O-que-%C3%A9-conta-compartilhada",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "'A Conta Compartilhada é quando uma pessoa física compartilha sua conta corrente com uma outra pessoa... convidado, com poderes de procurador... movimentação de crédito, débito... de forma independente.'",
            },
          ],
          reviewedAt: "2026-10-13",
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
          summaryPtBr:
            "BTG Black: 2,2 pontos por US$ ou 1% de cashback, LoungeKey e IOF reduzido no exterior. A anuidade só é isenta acima de R$ 120.000 investidos ou com R$ 10.000 investidos mais R$ 1.000 de gastos por mês.",
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
          summaryPtBr:
            "Banco de investimentos no centro do negócio. O app lista mais de 1.000 produtos (não conferido em página do BTG).",
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
          summaryPtBr:
            "Não há evidência suficiente. Há só um trecho de busca (4,7 na App Store, 4,6 no Google Play), e o BTG se divide em vários apps.",
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "insufficient-evidence",
          reason: "No citable source was found; the research left this criterion unscored.",
          summaryPtBr:
            "Não há evidência suficiente. Nenhuma fonte citável foi encontrada, e a pesquisa deixou este critério sem nota.",
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 100,
          evidence:
            "Every item BTG reports to the Central Bank registry is R$ 0.00 (account opening, statements, TED, internal transfers) except an administrative cheque at R$ 40.00; it lists no packages or card annuity.",
          summaryPtBr:
            "Todos os itens que o BTG informa ao cadastro do Banco Central são R$ 0,00 (abertura de conta, extratos, TED, transferências internas), exceto um cheque administrativo a R$ 40,00. Não lista pacotes nem anuidade de cartão.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/30306294.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "14 items reported, all R$ 0.00 except administrative cheque R$ 40.00; no packages or annuity listed; page last updated 22/07/2026.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        lockIn: {
          status: "scored",
          score: 40,
          evidence:
            "Card annuity waiver needs R$ 120,000 invested, the steepest asset pull among the large banks. Pix limit and closure friction were not researched.",
          summaryPtBr:
            "A isenção da anuidade do cartão exige R$ 120.000 investidos, a maior exigência de patrimônio entre os grandes bancos. Limite do Pix e dificuldade para encerrar a conta não foram pesquisados.",
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
          score: 74,
          evidence:
            "Reclame Aqui is split by entity: BTG+ banking 7.39/10 (87.6% resolution), BTG Pactual Investimentos 8.6/10 (90.9% resolution).",
          summaryPtBr:
            "O Reclame Aqui separa por empresa: BTG+ banking 7,39/10 (87,6% de solução) e BTG Pactual Investimentos 8,6/10 (90,9% de solução).",
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
        jointBanking: {
          status: "scored",
          score: 65,
          evidence:
            "BTG Pactual Banking's FAQ says a joint current account 'não é possível' and offers Conta Compartilhada instead: the holder invites one other BTG client as a representative who switches into the account from their own login with full access except Investments and Financing, without co-ownership.",
          summaryPtBr:
            "O FAQ do BTG Pactual Banking diz que conta corrente conjunta 'não é possível' e oferece a Conta Compartilhada: o titular convida outro cliente do BTG como representante, que entra na conta com o próprio login e tem acesso total, exceto a Investimentos e Financiamentos, sem ser cotitular.",
          citations: [
            {
              url: "https://banking.btgpactual.com/services/api/faq",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "'Por enquanto, não é possível abrir uma conta conjunta pelo BTG Pactual Banking'; Conta Compartilhada gives an invited representative full access except Investments and Financing, not co-ownership.",
            },
          ],
          reviewedAt: "2026-10-13",
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
          summaryPtBr:
            "XP Visa Infinite: anuidade zero permanente, DragonPass, Investback de até 1% dos gastos e pontos para milhas. Os benefícios completos exigem R$ 50.000 investidos ou R$ 3.000 de gastos por mês.",
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
          summaryPtBr:
            "Plataforma de investimentos completa em um só app: renda fixa, Tesouro, fundos, ações e produtos estruturados.",
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
          summaryPtBr:
            "Não há evidência suficiente. Não foi levantada nota nas lojas para o app da XP.",
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "insufficient-evidence",
          reason: "XP security features were not researched.",
          summaryPtBr:
            "Não há evidência suficiente. Os recursos de segurança da XP não foram pesquisados.",
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 80,
          evidence:
            "TED R$ 0.00 in the registry and standard packages I to IV now R$ 18.00, 18.00, 29.50 and 41.00 (were R$ 36.00 to R$ 82.00 until XP's table of 05/09/2026). The card annuity ceiling is still R$ 18,000 (Privilege Visa Infinite); XP's own table shows the practised annuity is zero on XP, Rico and One Visa Infinite, R$ 4,200 on Legacy and R$ 18,000 on Privilege. The digital account is free. Scored level with Inter and C6, one step below the all-zero registries.",
          summaryPtBr:
            "TED de R$ 0,00 no cadastro e pacotes padronizados I a IV agora de R$ 18,00, R$ 18,00, R$ 29,50 e R$ 41,00 (antes de R$ 36,00 a R$ 82,00, até a tabela da XP de 05/09/2026). O teto da anuidade do cartão continua em R$ 18.000 (Privilege Visa Infinite). A própria tabela da XP mostra que a anuidade cobrada é zero nos cartões XP, Rico e One Visa Infinite, R$ 4.200 no Legacy e R$ 18.000 no Privilege. A conta digital é gratuita. A nota fica no mesmo nível do Inter e do C6, um degrau abaixo dos cadastros com tudo zerado.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/33264668.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "TED R$ 0.00; standard packages I to IV R$ 18.00, 18.00, 29.50, 41.00; card annuity R$ 18,000.00; page last updated 14/08/2026.",
            },
            {
              url: "https://www.xpi.com.br/documentos/tarifas_20_01_22/",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "Banco XP table published 05/08/2026, in force from 05/09/2026: packages I to IV R$ 18.00, 18.00, 29.50, 41.00; TED and transfers by electronic means zero; annuity practised zero on XP, Rico and One Visa Infinite, R$ 4,200 Legacy, R$ 18,000 Privilege.",
            },
            {
              url: "https://itsmoney.com.br/onde-investir/conta-digital-xp-vale-a-pena",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Free digital account.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        lockIn: {
          status: "scored",
          score: 40,
          evidence:
            "Card benefits (lounges, Investback rate) depend on R$ 50,000 invested at XP or R$ 3,000 monthly spend; no exit friction found for the account itself.",
          summaryPtBr:
            "Os benefícios do cartão (salas VIP, taxa do Investback) dependem de R$ 50.000 investidos na XP ou R$ 3.000 de gastos por mês. Não foi encontrada dificuldade para sair da conta em si.",
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
          score: 79,
          evidence:
            "Reclame Aqui: 7.9/10, 83% resolution, 67.6% would do business again; recurring complaint about advisors pushing commissioned products.",
          summaryPtBr:
            "Reclame Aqui: 7,9/10, 83% de solução, 67,6% voltariam a fazer negócio. Há uma reclamação recorrente sobre assessores que empurram produtos com comissão.",
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
        jointBanking: {
          status: "scored",
          score: 30,
          evidence:
            "XP's joint option exists only for the investment account, Conta Conjunta Investimento, linking exactly one co-holder requested through an advisor; the Conta Digital, XP's everyday account, explicitly has no joint option.",
          summaryPtBr:
            "A XP só oferece conta conjunta na conta de investimentos, a Conta Conjunta Investimento, que vincula exatamente um cotitular, solicitado por meio de um assessor. A Conta Digital, a conta do dia a dia da XP, não tem opção conjunta, e isso é dito de forma explícita.",
          citations: [
            {
              url: "https://atendimento.xpi.com.br/categoria/minha-conta-e-login/conta-investimento-conjunta",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Conta Investimento Conjunta links two people to one investment account, PF only, one co-holder maximum, requested through the advisor.",
            },
            {
              url: "https://atendimento.xpi.com.br/categoria/conta-digital/duvidas-gerais",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Article 2499: 'A Conta digital permitirá conta conjunta?' answered not available.",
            },
          ],
          reviewedAt: "2026-10-13",
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
          summaryPtBr:
            "Anuidade do Sicoobcard de R$ 90 (Clássico) ou R$ 150 (Gold), com isenção possível por gastos. Pontos Coopera para produtos, milhas, crédito na fatura ou previdência.",
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
          summaryPtBr:
            "Poupança e renda fixa emitida pelas cooperativas. Não foi encontrada plataforma de investimentos aberta (pesquisa não exaustiva).",
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
          summaryPtBr:
            "Nota 4,9 na App Store. O Sicoob informa o segundo lugar em um ranking de satisfação de apps nas duas lojas.",
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
          summaryPtBr:
            "Não há evidência suficiente. Os recursos de segurança do Sicoob não foram pesquisados.",
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "insufficient-evidence",
          reason:
            "Each cooperative publishes its own tariff table. The Central Bank registry entry for Banco Sicoob (packages R$ 4.00 to R$ 24.00, TED R$ 12.00) is not the table a member pays.",
          summaryPtBr:
            "Não há evidência suficiente. Cada cooperativa publica a própria tabela de tarifas. O registro do Banco Central para o Banco Sicoob (pacotes de R$ 4,00 a R$ 24,00, TED de R$ 12,00) não é a tabela que o associado paga.",
          reviewedAt: "2026-10-15",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/02038232.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "Banco Sicoob: packages I to IV R$ 4.00, 12.00, 16.00, 24.00; TED R$ 12.00 internet; page last updated 13/08/2026.",
            },
          ],
        },
        lockIn: {
          status: "scored",
          score: 20,
          evidence:
            "Membership requires buying capital quotas, built up over up to 17 monthly instalments; capital is returned only after the fiscal-year assessment, and Reclame Aqui has a complaint category for capital not returned after closing the account.",
          summaryPtBr:
            "Para se associar, é preciso comprar cotas de capital, pagas em até 17 parcelas mensais. O capital só é devolvido após a apuração do exercício, e o Reclame Aqui tem uma categoria de reclamação para capital não devolvido após o encerramento da conta.",
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
          score: 66,
          evidence:
            "Reclame Aqui: 6.6/10 over the last six months (6.8 overall), 96.3% response, consumer average 5.51/10.",
          summaryPtBr:
            "Reclame Aqui: 6,6/10 nos últimos seis meses (6,8 no geral), 96,3% de respostas, nota média dos consumidores 5,51/10.",
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
        jointBanking: {
          status: "scored",
          score: 100,
          evidence:
            "Sicoob lists conta conjunta among its personal account types, and its FAQ describes opening one by both people going in person to a cooperative with proof of residence, income and ID; branch-only opening does not lower this score.",
          summaryPtBr:
            "O Sicoob lista a conta conjunta entre os tipos de conta de pessoa física, e o FAQ descreve a abertura com as duas pessoas indo a uma cooperativa, com comprovante de residência, renda e documento de identidade. A abertura só presencial não reduz esta nota.",
          citations: [
            {
              url: "https://www.sicoob.com.br/web/sicoob/faq-contas/-/most_viewed_assets/i44fjP4SVO9M/content/id/1197104",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "'Como faço para abrir uma conta conjunta?': both must go in person to a cooperative with proof of residence, income, ID and CPF.",
            },
          ],
          reviewedAt: "2026-10-13",
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
          summaryPtBr:
            "Cartões sem anuidade. Cashback de 0,5% (Platinum) a 1,2% (Black). Cartão adicional gratuito para crianças a partir de 10 anos. O saldo do Cofrinho aumenta o limite do cartão.",
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
          summaryPtBr:
            "CDBs pelo Cofrinho a 100% do CDI ou mais. Não foi encontrado acesso a ações, fundos ou Tesouro como numa corretora.",
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
          summaryPtBr:
            "Não há evidência suficiente. Não foi levantada nota nas lojas para o app do PicPay.",
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "insufficient-evidence",
          reason: "PicPay security features were not researched.",
          summaryPtBr:
            "Não há evidência suficiente. Os recursos de segurança do PicPay não foram pesquisados.",
          reviewedAt: "2026-09-09",
        },
        fees: {
          status: "scored",
          score: 100,
          evidence:
            "PicPay Bank declares R$ 0.00 for TED, every standard package and both card annuities; the only charges are registration (R$ 200.00) and two paper-statement items. PicPay's payment institution reports no table.",
          summaryPtBr:
            "O PicPay Bank declara R$ 0,00 para TED, todos os pacotes padrão e as duas anuidades de cartão. As únicas cobranças são o cadastro (R$ 200,00) e dois itens de extrato em papel. A instituição de pagamento do PicPay não informa tabela.",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/09516419.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "TED, standard packages I to IV and card annuities R$ 0.00; registration R$ 200.00; page last updated 15/10/2026.",
            },
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/22896431.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding: "The registry says this institution did not report its tariffs.",
            },
          ],
          reviewedAt: "2026-10-15",
        },
        lockIn: {
          status: "scored",
          score: 60,
          evidence:
            "Night Pix limit R$ 1,000 with 24 to 48 hours to raise and a complaint about refused increases; since July 2025 each deposit must sit through a rolling 30-day cycle to earn the account yield.",
          summaryPtBr:
            "Limite do Pix noturno de R$ 1.000, com 24 a 48 horas para aumentar, e há uma reclamação sobre aumentos recusados. Desde julho de 2025, cada depósito precisa ficar parado por um ciclo móvel de 30 dias para render na conta.",
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
          score: 86,
          evidence:
            "Reclame Aqui: 8.6/10 with the RA1000 seal, 97.6% response, 91.3% resolution, 76.6% would do business again; won the 2025 Reclame Aqui award.",
          summaryPtBr:
            "Reclame Aqui: 8,6/10 com o selo RA1000, 97,6% de respostas, 91,3% de solução, 76,6% voltariam a fazer negócio. Venceu o prêmio Reclame Aqui 2025.",
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
        jointBanking: {
          status: "scored",
          score: 0,
          evidence:
            "PicPay's help center says PicPay Empresas has no joint-account option and that, as in PF, only one account is allowed per CPF; no PF joint-account product was found.",
          summaryPtBr:
            "A central de ajuda do PicPay diz que o PicPay Empresas não tem opção de conta conjunta e que, como na pessoa física, só é permitida uma conta por CPF. Não foi encontrado produto de conta conjunta para pessoa física.",
          citations: [
            {
              url: "https://meajuda.picpay.com/hc/pt-br/articles/42718886279955-Posso-ter-conta-conjunta-PJ",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "'No PicPay Empresas não existe a opção de conta conjunta'; one account per CNPJ, 'assim como em PF que é permitido apenas uma conta por CPF'.",
            },
          ],
          reviewedAt: "2026-10-13",
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
          summaryPtBr:
            "Anuidade zero permanente, sem gasto mínimo. Cashback de até 3% no Mercado Livre e de 0,5% nas demais compras, pago em Meli Dólar. Até 18 parcelas sem juros no Mercado Livre.",
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
          summaryPtBr:
            "Faixas de CDB no Cofrinho (100%, 120% com Meli+ e 140% em campanhas). Não foi encontrado acesso a ações, fundos ou Tesouro.",
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
          summaryPtBr:
            "Não há evidência suficiente. Não foi levantada nota nas lojas para o app do Mercado Pago.",
          reviewedAt: "2026-09-09",
        },
        security: {
          status: "scored",
          score: 60,
          evidence:
            "Mandatory 2FA (facial recognition, cross-device QR code, SMS or WhatsApp codes); recurring complaints that 2FA is forced or inconvenient.",
          summaryPtBr:
            "2FA obrigatório (reconhecimento facial, QR code entre dispositivos, códigos por SMS ou WhatsApp). Há reclamações recorrentes de que o 2FA é forçado ou incômodo.",
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
            "Mercado Pago's payment institution reports no tariff table to the Central Bank registry. Its help centre lists a fee table, but the page did not load to an automated read, and the blog describing a free account (no maintenance fee, free Pix and TED, paid cash withdrawal) is marketing, not a schedule.",
          summaryPtBr:
            "Não há evidência suficiente. A instituição de pagamento do Mercado Pago não informa tabela de tarifas ao cadastro do Banco Central. A central de ajuda indica uma tabela de tarifas, mas a página não carregou na leitura automática, e o blog que descreve conta gratuita (sem tarifa de manutenção, Pix e TED gratuitos, saque em espécie pago) é material de divulgação, não uma tabela.",
          reviewedAt: "2026-10-15",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/10573521.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "The registry says this institution did not report its tariffs; page last updated 04/09/2026.",
            },
            {
              url: "https://www.mercadopago.com.br/ajuda/tabela-taxas-tarifas_45243",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "Help centre page titled 'Tabela de taxas e tarifas'; the content did not load to an automated read.",
            },
            {
              url: "https://www.mercadopago.com.br/blog/conta-mercado-pago-quanto-custa",
              kind: "primary",
              checkedAt: "2026-10-15",
              finding:
                "Blog: no maintenance fee, free Pix and TED to any institution, cash withdrawal is paid; no fee schedule.",
            },
          ],
        },
        lockIn: {
          status: "scored",
          score: 60,
          evidence:
            "Night Pix limit R$ 1,000, increases in 24 to 48 hours, decreases immediate. The default account balance is not FGC-covered.",
          summaryPtBr:
            "Limite do Pix noturno de R$ 1.000, com aumento em 24 a 48 horas e redução imediata. O saldo padrão da conta não é coberto pelo FGC.",
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
          summaryPtBr:
            "Reclame Aqui: 8,0/10, 96,8% de respostas, 81,3% de solução, 75,9% voltariam a fazer negócio.",
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
        jointBanking: {
          status: "scored",
          score: 0,
          evidence:
            "Mercado Pago's own blog presents only alternatives to a joint account (Dividir Gastos for personal expenses, Colaboradores for seller accounts), 'sem o compromisso de um contrato bancário'; it does not open joint accounts for personal customers.",
          summaryPtBr:
            "O blog do próprio Mercado Pago apresenta apenas alternativas à conta conjunta (Dividir Gastos para despesas pessoais e Colaboradores para contas de vendedores), 'sem o compromisso de um contrato bancário'. Não abre contas conjuntas para clientes pessoa física.",
          citations: [
            {
              url: "https://www.mercadopago.com.br/blog/como-funciona-conta-conjunta",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Section 'Alternativas digitais à conta conjunta no Mercado Pago': Dividir Gastos for personal life, Colaboradores for PJ seller accounts, 'sem o compromisso de um contrato bancário'.",
            },
          ],
          reviewedAt: "2026-10-13",
        },
      },
    },
  ],
} satisfies BankProfilesDatasetInput;
