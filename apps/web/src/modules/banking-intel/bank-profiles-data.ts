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
            "Nubank Rewards was discontinued. The Nubank+ package became the Nubank Croma segment on 28 July 2026: Mastercard Platinum with 0.8% cashback or 1.4 points per US$ and a R$ 39 monthly fee, waived at R$ 4,000 of monthly card spend or R$ 30,000 invested or saved. Ultravioleta gives 2.2 points per US$ or 1.25% cashback, IOF exemption abroad and 4 Priority Pass visits a year, with a R$ 89 monthly fee waived at R$ 8,000 of monthly spend or R$ 50,000 invested or saved. A 28 October 2026 report, partly based on customer accounts, says Ultravioleta lost some perks (the cashback no longer earns 200% of CDI and the HBO Max benefit is no longer free). The entry card has no ongoing points programme.",
          summaryPtBr:
            "O Nubank Rewards foi encerrado. O pacote Nubank+ virou o segmento Nubank Croma em 28 de julho de 2026: cartão Mastercard Platinum com 0,8% de cashback ou 1,4 ponto por US$ e mensalidade de R$ 39, isenta com R$ 4.000 de gastos por mês no cartão ou R$ 30.000 investidos ou guardados. O Ultravioleta dá 2,2 pontos por US$ ou 1,25% de cashback, isenção de IOF no exterior e 4 acessos por ano ao Priority Pass, com mensalidade de R$ 89, isenta com R$ 8.000 de gastos por mês ou R$ 50.000 investidos ou guardados. Uma reportagem de 28 de outubro de 2026, em parte baseada em relatos de clientes, diz que o Ultravioleta perdeu vantagens (o cashback deixou de render 200% do CDI e o HBO Max deixou de ser gratuito). O cartão de entrada não tem programa de pontos contínuo.",
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
              checkedAt: "2026-11-01",
              finding:
                "Nubank+ terms: 0.8% cashback or 1.4 points per US$, R$ 39 monthly fee waived at R$ 4,000 of spend or R$ 30,000 invested (the segment is now called Croma).",
            },
            {
              url: "https://nubank.com.br/ultravioleta/cartao-black",
              kind: "primary",
              finding:
                "Ultravioleta: from 2.2 points per US$ or 1.25% cashback, IOF zero abroad, 4 Priority Pass visits a year; R$ 89 a month, waived at R$ 8,000 of monthly spend or R$ 50,000 invested or saved.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://nu.com/pt/sala-de-imprensa/companhia/nubank-anuncia-novo-segmento-croma",
              kind: "primary",
              finding:
                "Press release of 28 July 2026: Croma with 0.8% cashback or 1.4 points per US$, R$ 39 a month waived at R$ 4,000 of card spend or R$ 30,000 invested or saved.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://altarendablog.com.br/2026/10/28/nubank-poe-fim-a-beneficios-importantes-do-ultravioleta-e-eleva-a-mensalidade-para-r-89/",
              kind: "secondary",
              finding:
                "Ultravioleta cuts reported on 28 October 2026, part of them compiled from customer accounts.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding: "Tesouro Direto in the app.",
            },
            {
              url: "https://nubank.com.br/sobre-investimentos/taxas-e-precos",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding: "Investment fees and prices.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        appQuality: {
          status: "scored",
          score: 60,
          evidence:
            "The App Store listing shows 4.8 stars from about 1.7 million ratings (read directly); the Google Play listing shows no rating to automated reads, and an undated secondary source puts it at 4.6. The earlier figure of about 4.7 stars from about 5.5 million ratings was not re-read. Confirmed 2026 instability: 7 February (login, transfers and internet banking, about 6,820 Downdetector reports at the peak, resolved the same day per Nubank), 6 March (login, transfers and Pix, about 389 reports), a temporary Pix intermittency in late May that Nubank confirmed, 23 August (Pix instability confirmed by the Central Bank across many banks, Nubank among the most cited) and 4 September (Pix transfers failing, per Downdetector, with no official statement read).",
          summaryPtBr:
            "A página do app na App Store mostra 4,8 estrelas, com cerca de 1,7 milhão de avaliações (lida diretamente). A página do Google Play não mostra a nota para leitura automática, e uma fonte secundária sem data indica 4,6. O número anterior, cerca de 4,7 estrelas com cerca de 5,5 milhões de avaliações, não foi relido. Houve instabilidade confirmada em 2026: em 7 de fevereiro (login, transferências e internet banking, com cerca de 6.820 relatos no pico do Downdetector, resolvida no mesmo dia segundo o Nubank), em 6 de março (login, transferências e Pix, cerca de 389 relatos), uma intermitência temporária do Pix no fim de maio, confirmada pelo Nubank, em 23 de agosto (instabilidade do Pix confirmada pelo Banco Central em vários bancos, com o Nubank entre os mais citados) e em 4 de setembro (transferências por Pix falhando, segundo o Downdetector, sem comunicado oficial lido).",
          citations: [
            {
              url: "https://play.google.com/store/apps/details?id=com.nu.production",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding: "Listing found through search; the snippet shows no rating figure.",
            },
            {
              url: "https://www.mobills.com.br/blog/bancos/como-baixar-app-nubank/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding: "Undated: Play Store 4.6 and App Store 4.8.",
            },
            {
              url: "https://comunidade.nubank.com.br/vida-financeira/post/nubank-fora-do-ar-resolvido---07-02-2026-jawvM3kMEGDQQnk",
              kind: "primary",
              checkedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding: "Nubank confirmed a temporary Pix instability in the week of 27 May 2026.",
            },
            {
              url: "https://apps.apple.com/br/app/nubank-conta-cart%C3%A3o-e-mais/id814456780",
              kind: "primary",
              finding: "App Store listing: 4.8 stars, about 1.7 million ratings.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://tecnoblog.net/noticias/nubank-fora-do-ar-aplicativo-tem-instabilidade-nesta-sexta-4/",
              kind: "secondary",
              finding:
                "Pix transfers failing on Friday 4 September per Downdetector; no official statement in the text read.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.cnnbrasil.com.br/economia/money/macroeconomia/pix-instabilidade-hoje-23-agosto-2026/",
              kind: "secondary",
              finding:
                "23 August 2026: Central Bank confirmed Pix instability across banks, with a Downdetector peak of 2,444 reports.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding: "Security policy.",
            },
            {
              url: "https://blog.nubank.com.br/autenticacao-dois-fatores/",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding: "Two-factor authentication.",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding: "Contracts page lists TED, Pix and deposit by boleto at R$ 0.",
            },
            {
              url: "https://nubank.com.br/sobre-investimentos/taxas-e-precos",
              kind: "primary",
              checkedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding:
                "Registry page read: this institution did not report its tariffs; page last updated 25/08/2026.",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding: "Pix day and night limits.",
            },
            {
              url: "https://blog.nubank.com.br/limite-pix/",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Increases take 24 to 48 hours after the request; reductions apply immediately.",
            },
            {
              url: "https://comunidade.nubank.com.br/novidades/post/mais-seguranca-nas-transacoes-noturnas-em-sua-conta-4QKoa2N4jHuTsn3",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Night limit of up to R$ 1,000 on Pix and boleto payments between individuals, set by Banco Central.",
            },
            {
              url: "https://altarendablog.com.br/2026/10/13/nubank-agora-tem-5-cartoes-de-credito-veja-qual-e-o-seu-e-como-subir-de-nivel-em-2026/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "Croma and Ultravioleta fees are waived only above monthly spend or invested thresholds.",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
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
          reviewedAt: "2026-11-01",
        },
      },
      accountTypes: {
        joint: {
          status: "not-offered",
          evidence:
            "Nubank's own blog states it does not offer a joint account: 'o Nubank não oferece conta conjunta'.",
          summaryPtBr: "O próprio blog do Nubank diz que 'o Nubank não oferece conta conjunta'.",
          citations: [
            {
              url: "https://blog.nubank.com.br/conta-conjunta/",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding: "Blog states 'o Nubank não oferece conta conjunta', updated 28 Jul 2026.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        shared: {
          status: "offered",
          conditionPtBr: "só no Ultravioleta",
          evidence:
            "Ultravioleta clients get Saldo Compartilhado inside Espaço Família, where administrators share one balance from their own logins and spending is attributed pro rata to each person's deposits.",
          summaryPtBr:
            "Clientes Ultravioleta têm o Saldo Compartilhado no Espaço Família: os administradores dividem um mesmo saldo, cada um com seu login, e os gastos são atribuídos a cada pessoa na proporção do que depositou.",
          citations: [
            {
              url: "https://nu.com/pt/sala-de-imprensa/consumidores/espaco-familia-nubank-ultravioleta-lanca-recurso-de-saldo-compartilhado",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Press release: Espaço Família (Ultravioleta) shares one balance among the client and up to four others from their own logins; both administrators are notified and spending is attributed pro rata to each person's deposits.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        jointInvestment: {
          status: "not-found",
          evidence:
            "No source was found describing a joint investment account in the Nubank app, where the NuInvest investments now live (the NuInvest app was folded into it in May 2024); Nubank says it does not offer joint accounts, and its investment pages describe only individual holdings.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta no app do Nubank, onde hoje ficam os investimentos da NuInvest (o app NuInvest foi incorporado a ele em maio de 2024); o Nubank diz que não oferece conta conjunta, e suas páginas de investimentos descrevem apenas posições individuais.",
          reviewedAt: "2026-11-01",
          citations: [
            {
              url: "https://blog.nubank.com.br/nu-invest-tudo-sobre/",
              kind: "primary",
              finding:
                "NuInvest stays the broker but its app is integrated into the Nubank app, with a dedicated investments area; from 7 May the NuInvest app stopped accepting purchases.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.idinheiro.com.br/investimentos/corretoras/nu-invest/",
              kind: "secondary",
              finding:
                "Guide updated 07/08/2025: a NuInvest account can no longer be opened; clients invest through the Nubank app.",
              checkedAt: "2026-11-01",
            },
          ],
        },
        mei: {
          status: "offered",
          evidence:
            "Nubank's Conta PJ is available to MEI, with 'zero taxas de manutenção' and free unlimited Pix.",
          summaryPtBr:
            "A Conta PJ do Nubank está disponível para MEI, com 'zero taxas de manutenção' e Pix ilimitado grátis.",
          citations: [
            {
              url: "https://nubank.com.br/conta-pj/",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Conta PJ: 'Zero taxas de manutenção', free unlimited Pix, available to MEI; withdrawals R$ 6,50.",
            },
            {
              url: "https://nubank.com.br/empresas/conta",
              kind: "primary",
              finding:
                "Conta Nu Empresas is open to MEI, zero maintenance fee, free Pix and TED to other banks, R$ 6,50 per debit-card withdrawal.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding: "Inter Loop programme.",
            },
            {
              url: "https://altarendablog.com.br/2026/04/05",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding: "Card overview.",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding: "CDB offer.",
            },
            {
              url: "https://www.inter.co/pra-voce/investimentos/",
              kind: "primary",
              finding:
                "CDB from R$ 1.00, Tesouro Direto, funds, crypto and Brazilian and global stocks, with a free home broker.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        appQuality: {
          status: "scored",
          score: 60,
          evidence:
            "Branded content (CNN Brasil, undated in the excerpt read) says the app has been among the best-rated financial apps for nine months across more than 1.3 million users, with no independent figure; a secondary guide dated November 2025 puts Google Play at 4.5 and the App Store at 4.9. Confirmed instability on 7 February 2026, in July 2026 (login, Pix, purchases) and on 23 August 2026 (Pix instability confirmed by the Central Bank across many banks, Inter among the most cited).",
          summaryPtBr:
            "Conteúdo da própria marca (CNN Brasil, sem data no trecho lido) diz que o app está entre os mais bem avaliados do setor financeiro há nove meses, com mais de 1,3 milhão de usuários, sem número independente. Um guia secundário de novembro de 2025 indica 4,5 no Google Play e 4,9 na App Store. Houve instabilidade confirmada em 7 de fevereiro de 2026, em julho de 2026 (login, Pix, compras) e em 23 de agosto de 2026 (instabilidade do Pix confirmada pelo Banco Central em vários bancos, com o Inter entre os mais citados).",
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
            {
              url: "https://www.cnnbrasil.com.br/economia/money/negocios/super-app-do-inter-se-mantem-entre-os-mais-bem-avaliados-do-pais/",
              kind: "secondary",
              finding:
                "Branded content: Super App among the best-rated for nine consecutive months, over 1.3 million users.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://guiadoinvestidor.com.br/guias/corretoras/inter-corretora/",
              kind: "secondary",
              finding:
                "Guide dated November 2025: Google Play 4.5, App Store 4.9; app instability complaints.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.cnnbrasil.com.br/economia/money/macroeconomia/pix-instabilidade-hoje-23-agosto-2026/",
              kind: "secondary",
              finding:
                "23 August 2026: Central Bank confirmed Pix instability across banks, with a Downdetector peak of 2,444 reports.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
            {
              url: "https://tecnoblog.net/noticias/banco-inter-acordo-mpdft/",
              kind: "secondary",
              finding:
                "MPDFT analysis: 19,961 account holders exposed, 13,207 with account number, password, address and CPF; R$ 1.5 million agreement.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://seucreditodigital.com.br/banco-inter-confirma-vazamento-de-dados/",
              kind: "secondary",
              finding:
                "Inter's statement attributes the exposure to an authorised person who broke confidentiality, not an external attack.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
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
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding: "Night limit.",
            },
            {
              url: "https://www.reclameaqui.com.br/inter/demora-para-liberacao-de-limite-pix",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding: "Complaint, anecdotal.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        publicReviews: {
          status: "scored",
          score: 86,
          evidence:
            "Reclame Aqui: 8.6/10 over the last six months, maximum reputation (earlier review: 8.5/10, 98.4% response, 90% resolution, 78% would do business again, average response 9 days 13 hours; those figures were not visible in this read).",
          summaryPtBr:
            "Reclame Aqui: 8,6/10 nos últimos seis meses, reputação máxima (revisão anterior: 8,5/10, 98,4% de respostas, 90% de solução, 78% voltariam a fazer negócio, tempo médio de resposta de 9 dias e 13 horas; esses números não apareceram nesta leitura).",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/inter/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "Reclame Aqui page read through a search-engine snippet (the site refuses automated reads): maximum reputation, average 8.6/10 over the last six months.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
      },
      accountTypes: {
        joint: {
          status: "not-offered",
          conditionPtBr: "parou de abrir",
          evidence:
            "Inter's help center says 'Atualmente, não é possível ter uma conta conjunta no Inter' and that it only offers individual accounts tied to a CPF; it no longer opens joint accounts for new customers.",
          summaryPtBr:
            "A central de ajuda do Inter diz 'Atualmente, não é possível ter uma conta conjunta no Inter' e que o banco só oferece contas individuais ligadas a um CPF. O Inter não abre mais contas conjuntas para novos clientes.",
          citations: [
            {
              url: "https://ajuda.inter.co/conta-digital-pessoa-fisica-e-mei/posso-ter-uma-conta-conjunta-no-inter",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "'Atualmente, não é possível ter uma conta conjunta no Inter. A instituição oferece apenas contas individuais vinculadas ao CPF.'",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        shared: {
          status: "not-found",
          evidence:
            "No shared-access or shared-balance product was found; Inter offers only a cartão adicional (additional credit card) for a partner, which shares the card limit, not the account.",
          summaryPtBr:
            "Não foi encontrado produto de acesso ou saldo compartilhado; o Inter oferece apenas um cartão adicional para o parceiro, que compartilha o limite do cartão, não a conta.",
          reviewedAt: "2026-11-01",
          citations: [
            {
              url: "https://ajuda.inter.co/cartao/como-pedir-o-cartao-adicional",
              kind: "primary",
              finding:
                "Additional card: it can only be requested with credit active and the limit is shared between holder and dependents.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/inter/nao-consigo-acesso-sendo-procurador_KAny8KeBk2s5QU-l/",
              kind: "secondary",
              finding:
                "Inter reply to a procurador: it cannot allow third parties access to the dependent's account; only a 30-day statement was sent.",
              checkedAt: "2026-11-01",
            },
          ],
        },
        jointInvestment: {
          status: "not-found",
          evidence:
            "No source was found describing a joint investment account at Inter. Its Comunidades de Investimento let up to 20 investors pool balances to unlock higher CDB rates, but each investor keeps their own investments and the volume is not visible to the community, so it is a rate-tier feature rather than a joint account.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta no Inter. As Comunidades de Investimento deixam até 20 investidores somarem saldos para liberar taxas maiores em CDB, mas cada investidor mantém seus próprios investimentos e o volume não fica visível para a comunidade, então é um recurso de faixa de rentabilidade e não uma conta conjunta.",
          reviewedAt: "2026-11-01",
          citations: [
            {
              url: "https://inter.co/pra-voce/investimentos/comunidade-de-investimentos/",
              kind: "primary",
              finding:
                "Investment communities: a combined volume from R$ 250,000 earns a higher rate for everyone; each investor's volume is not visible to the community and movements are shared only by choice.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://blog.inter.co/crie-sua-comunidade-de-investimento/",
              kind: "primary",
              finding:
                "A community has up to 20 investors; the group total sets the rate tier (for example +0.5% of CDI on a CDB when the group holds R$ 251,000), even if one member holds little.",
              checkedAt: "2026-11-01",
            },
          ],
        },
        mei: {
          status: "offered",
          evidence:
            "Inter's blog describes the MEI account as '100% digital e gratuita' and 'livre de tarifas', opened from the PF app.",
          summaryPtBr:
            "O blog do Inter descreve a conta MEI como '100% digital e gratuita' e 'livre de tarifas', aberta a partir do app de pessoa física.",
          citations: [
            {
              url: "https://blog.inter.co/abrir-conta-mei",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "MEI account '100% digital e gratuita', 'livre de tarifas', opened from PF Super App. Updated 11/07/2023.",
            },
            {
              url: "https://inter.co/empresas/conta-digital/mei/",
              kind: "primary",
              finding:
                "Inter Empresas MEI page: digital, completely free MEI account, with the Inter Loop points programme.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://ajuda.inter.co/conta-digital-pessoa-fisica-e-mei/como-abrir-uma-conta-mei-no-inter",
              kind: "primary",
              finding:
                "Help centre: the Conta Digital MEI is for MEI companies with a CNPJ regular at the Receita Federal.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
            "Broad card ladder: Personnalité Black, LATAM Pass co-brand, Private Visa Infinite with DragonPass, Magalu up to 2% cashback (ladder not re-read this run). On 29 July 2026 Itaú changed the Uniclass Mastercard Black and Visa Infinite, rolling out through the end of 2026: invoices from R$ 4,000 earn up to 2.5 points per US$ and 4 lounge visits a year, below that 2 points per US$. The Uniclass Black fee is R$ 80 a month (R$ 960 a year), waived at R$ 8,000 of invoice spend, R$ 50,000 invested at Itaú or Minhas Vantagens level 4 or above. Personnalité The One carries a R$ 4,000 annual fee, waived with R$ 5 million invested, R$ 60,000 of invoice spend or level 5, and from January 2027 full points and unlimited lounges need R$ 4,000 of invoice spend.",
          summaryPtBr:
            "Vários níveis de cartão: Personnalité Black, parceria com LATAM Pass, Private Visa Infinite com DragonPass e Magalu com até 2% de cashback (a escada de cartões não foi relida nesta rodada). Em 29 de julho de 2026 o Itaú mudou os cartões Uniclass Mastercard Black e Visa Infinite, com implantação até o fim de 2026: faturas a partir de R$ 4.000 rendem até 2,5 pontos por US$ e 4 acessos por ano a salas VIP, e abaixo disso são 2 pontos por US$. A mensalidade do Uniclass Black é de R$ 80 (R$ 960 por ano), isenta com R$ 8.000 de fatura, R$ 50.000 investidos no Itaú ou nível 4 ou superior no Minhas Vantagens. O Personnalité The One tem anuidade de R$ 4.000, isenta com R$ 5 milhões investidos, R$ 60.000 de fatura ou nível 5, e a partir de janeiro de 2027 a pontuação máxima e as salas VIP ilimitadas exigem R$ 4.000 de fatura.",
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
              checkedAt: "2026-11-01",
              finding:
                "29 July 2026 change: invoices from R$ 4,000 earn up to 2.5 points per US$ and 4 yearly lounge visits, below that 2 points; rollout through the end of 2026.",
            },
            {
              url: "https://altarendablog.com.br/2026/10/30/novo-uniclass-black-do-itau-4-acessos-a-salas-vip-ate-25-pontos-por-dolar-e-2-meses-gratis-para-testar/",
              kind: "secondary",
              finding:
                "Uniclass Black: R$ 80 a month, waived at R$ 8,000 of invoice spend, R$ 50,000 invested or Minhas Vantagens level 4 or above; up to 2.5 points per US$ and 4 lounge visits.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://altarendablog.com.br/2026/10/01/fim-da-pontuacao-cheia-no-the-one-itau-cria-exigencia-de-gasto-para-2027-analise-da-mudanca/",
              kind: "secondary",
              finding:
                "The One: R$ 4,000 a year, waived with R$ 5 million invested, R$ 60,000 of spend or level 5; from January 2027 full points need R$ 4,000 of invoice spend.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding: "Tesouro Direto on íon.",
            },
            {
              url: "https://www.itaucorretora.com.br/nossosservicos/beneficios-no-itau.aspx",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding: "Brokerage benefits.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        appQuality: {
          status: "scored",
          score: 60,
          evidence:
            "The App Store listing shows 4.7 stars from about 3.3 million ratings; the Google Play rating could not be read. Scored 60 rather than 80 because of the confirmed 2026 outages, as for Nubank and Inter. Outages found: Central Bank-confirmed Pix instability on 23 August 2026 that hit Itaú among other banks, and an app, internet banking and Pix instability at Itaú on 30 October 2026 (about 100 Downdetector reports at the peak).",
          summaryPtBr:
            "A página do app na App Store mostra 4,7 estrelas, com cerca de 3,3 milhões de avaliações; a nota do Google Play não pôde ser lida. A nota é 60, e não 80, por causa das instabilidades confirmadas em 2026, como no Nubank e no Inter. Houve instabilidade do Pix em 23 de agosto de 2026, confirmada pelo Banco Central e que atingiu o Itaú entre outros bancos, e uma instabilidade do app, do internet banking e do Pix do Itaú em 30 de outubro de 2026, com cerca de 100 relatos no pico.",
          citations: [
            {
              url: "https://play.google.com/store/apps/details?id=com.itau",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "Listing found through search; the excerpt shows reviews but no rating figure.",
            },
            {
              url: "https://apps.apple.com/br/app/banco-ita%C3%BA-conta-cart%C3%A3o-e/id474505665",
              kind: "primary",
              finding: "App Store listing: 4.7 stars, about 3.3 million ratings.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.portaldecamaqua.com.br/noticias/112090/banco-itau-fora-do-ar-hoje-servicos-apresentam-instabilidade-nesta-sexta-dia-30-de-outubro-de-2026.html",
              kind: "secondary",
              finding:
                "Downdetector: internet banking, app login and Pix instability on 30 October 2026, about 100 reports at the peak.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.cnnbrasil.com.br/economia/money/macroeconomia/pix-instabilidade-hoje-23-agosto-2026/",
              kind: "secondary",
              finding:
                "23 August 2026: Central Bank confirmed Pix instability across banks, Itaú among them.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        security: {
          status: "scored",
          score: 60,
          evidence:
            "Itaú documents the iToken (temporary codes tied to the phone, activated by facial recognition), facial biometrics to confirm identity, a Modo Protegido (safe places and Wi-Fi networks, plus a value above which facial biometrics is mandatory outside them), a Segurança area in the Superapp (passwords, trusted device with iToken, card block, virtual card, transaction limit adjustment including at night) and an ISO 27001 certification of its online privacy management system. No confirmed breach of Itaú's systems was found: the 7 August 2023 outage was stated by the bank to be internal with no external attack, and complaints about data leaks are answered with 'no leak identified' and attributed to social engineering and phone-number spoofing (a December alert about two spoofed official numbers, year not shown in the excerpt). Absence of findings is not a clean record.",
          summaryPtBr:
            "O Itaú documenta o iToken (códigos temporários ligados ao celular, ativados por reconhecimento facial), a biometria facial para confirmar a identidade, um Modo Protegido (locais e redes Wi-Fi seguros, com um valor acima do qual a biometria facial é obrigatória fora deles), uma área de Segurança no Superapp (senhas, dispositivo de confiança com iToken, bloqueio de cartão, cartão virtual e ajuste de limites de transação, inclusive à noite) e a certificação ISO 27001 do seu sistema de gestão da privacidade online. Não foi encontrada violação confirmada dos sistemas do Itaú: o banco declarou que a queda de 7 de agosto de 2023 foi interna, sem ataque externo, e as reclamações sobre vazamento são respondidas com 'nenhum vazamento identificado' e atribuídas a engenharia social e falsificação de número de telefone (um alerta de dezembro sobre dois números oficiais falsificados, sem o ano no trecho lido). Não achar nada não significa histórico limpo.",
          citations: [
            {
              url: "https://www.itau.com.br/seguranca/itoken",
              kind: "primary",
              finding:
                "iToken generates temporary codes to validate digital transactions, activated by facial recognition in the app, cancellable if the phone is lost; the online privacy management system holds ISO 27001.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.itau.com.br/seguranca/area-de-seguranca",
              kind: "primary",
              finding:
                "Área de Segurança groups password management, facial image to confirm identity, a trusted device protected by iToken and digital wallets.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.itau.com.br/privacidade/biometria-facial",
              kind: "primary",
              finding:
                "Facial biometrics is used only to authenticate the user and prevent fraud; Itaú says it adapts security levels to fraud risk.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://feito.itau.com.br/seguranca-do-seu-jeito-personalize-as-funcoes-no-superapp/",
              kind: "primary",
              finding:
                "Superapp security area: iToken plus authorised device, facial recognition, password and access management, card block, virtual card; users can toggle facial biometrics, geolocation and when iToken is used.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://feito.itau.com.br/alerta-contra-o-golpe-da-biometria/",
              kind: "primary",
              finding:
                "Transaction limits can be reduced in the app, especially at night; the bank warns about the biometrics scam and says its system ties access to the holder on the registered device.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.melhorescartoes.com.br/itau-modo-protegido-ferramenta.html",
              kind: "secondary",
              finding:
                "Modo Protegido: customers set safe places and Wi-Fi networks and a maximum value above which facial biometrics is mandatory outside them (undated).",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://blog.itau.com.br/efake/efalso-itau-fora-do-ar-por-conta-de-ataque-hacker",
              kind: "primary",
              finding:
                "Itaú's statement on the 7 August 2023 outage: internal instability, no external attack of any kind, customer data safe.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://canaltech.com.br/seguranca/apos-ficar-fora-do-ar-itau-nega-ataque-cibernetico-e-tem-sistemas-normalizados-258882/",
              kind: "secondary",
              finding:
                "Press coverage of the same outage: Itaú denied a cyber attack and normalised its systems the next day.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://tecnoblog.net/noticias/itau-alerta-golpistas-usaram-numero-oficial-para-roubar-dados-de-clientes/",
              kind: "secondary",
              finding:
                "Itaú alerted customers on 15 December (year not shown) that scammers spoofed two official phone numbers; the article says this does not imply an intrusion into the bank's systems or a leak of customer data.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/itau/vazamento-de-dados-pessoais_QE22NuXRin7xZ5TK/",
              kind: "secondary",
              finding:
                "Itaú reply to a leak complaint: no data leak identified at the bank; reminds customers never to share the iToken code and lists the chip, token, biometrics and monitoring it uses.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding:
                "Standard packages I to IV R$ 16.10, 28.00, 37.40, 55.70; TED R$ 11.10 internet, R$ 20.70 in person; page last updated 23/09/2026.",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding: "Waiver conditions.",
            },
            {
              url: "https://altarendablog.com.br/2026/10/30/novo-uniclass-black-do-itau-4-acessos-a-salas-vip-ate-25-pontos-por-dolar-e-2-meses-gratis-para-testar/",
              kind: "secondary",
              finding:
                "Uniclass Black fee waived at R$ 8,000 of invoice spend, R$ 50,000 invested at Itaú or Minhas Vantagens level 4 or above.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        publicReviews: {
          status: "scored",
          score: 82,
          evidence:
            "Reclame Aqui: 8.2/10 over the last six months, 85.2% resolution, 73.5% would do business again, average response 6 days 8 hours (1 February to 31 July 2026). The earlier consumer average (7.02) and response rate (97.5%) were not visible in this read.",
          summaryPtBr:
            "Reclame Aqui: 8,2/10 nos últimos seis meses, 85,2% de solução, 73,5% voltariam a fazer negócio, tempo médio de resposta de 6 dias e 8 horas (1º de fevereiro a 31 de julho de 2026). A nota média anterior dos consumidores (7,02) e o índice de respostas (97,5%) não apareceram nesta leitura.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/itau/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "Reclame Aqui page and list read through search-engine snippets (the site refuses automated reads): 8.2/10, 85.2% resolution, 73.5% would do business again.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
      },
      accountTypes: {
        joint: {
          status: "offered",
          conditionPtBr: "só na agência",
          evidence:
            "Itaú's Conta Universal terms define a joint account ('E/OU' or 'E'), and the account FAQ confirms every holder opens one by going to a branch with documents; branch-only opening does not lower this status.",
          summaryPtBr:
            "Os termos da Conta Universal do Itaú definem a conta conjunta ('E/OU' ou 'E'), e o FAQ da conta confirma que cada titular a abre indo a uma agência com os documentos. A abertura só em agência não reduz este status.",
          citations: [
            {
              url: "https://www.itau.com.br/atendimento-itau/para-voce/conta-corrente/como-faco-para-abrir-uma-conta-corrente-no-itau",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "'Para abrir uma conta-conjunta, todos os titulares devem ir à agência com os documentos.'",
            },
            {
              url: "https://www.itau.com.br/_arquivosestaticos/Itau/PDF/para-voce/conta-corrente/condicoes-gerais-da-conta-universal-itau.pdf",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Conta Universal terms define joint 'E/OU' (one signature suffices) and 'E' (all holders must sign) accounts, with every holder jointly liable.",
            },
            {
              url: "https://www.itau.com.br/atendimento-itau/para-voce/conta-conjunta/como-incluir-um-titular-na-minha-conta-e-ter-uma-conta-conjunta",
              kind: "primary",
              finding:
                "A second holder is added at any Itaú branch with the original and a copy of RG and CPF; a provisional debit card is issued and the holder is included in about 10 business days.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.itau.com.br/contas/conta-corrente",
              kind: "primary",
              finding:
                "Online account opening does not yet cover joint current accounts; for more account options, go to a branch.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        shared: {
          status: "not-found",
          evidence:
            "No shared-access product such as a shared balance or an invited user was found. Itaú's FAQ on adding a procurador describes a power of attorney (accepted if issued in the last 36 months; in a joint account only one holder can grant it and the procurador represents only that holder), which is a legal mandate rather than a shared-account product; Itaú's cofrinhos can receive Pix contributions from other people, but that is not a shared account.",
          summaryPtBr:
            "Não foi encontrado produto de acesso compartilhado, como saldo compartilhado ou usuário convidado. O FAQ do Itaú sobre incluir um procurador descreve uma procuração (aceita se emitida nos últimos 36 meses; em conta conjunta, só um dos titulares pode concedê-la e o procurador representa apenas ele), que é um mandato legal e não um produto de conta compartilhada; os cofrinhos do Itaú podem receber contribuições via Pix de outras pessoas, mas isso não é uma conta compartilhada.",
          reviewedAt: "2026-11-01",
          citations: [
            {
              url: "https://www.itau.com.br/atendimento-itau/para-voce/conta-corrente/como-faco-para-incluir-um-procurador-na-conta",
              kind: "primary",
              finding:
                "Procurador: only powers of attorney issued in the last 36 months are accepted; in joint accounts only one holder can grant one and the procurador represents only that holder.",
              checkedAt: "2026-11-01",
            },
          ],
        },
        jointInvestment: {
          status: "not-found",
          evidence:
            "No source was found describing a joint brokerage or investment account at íon or Itaú Corretora. Itaú's poupança page says a joint savings account can be solidária or simples, but that is the savings account that comes with every joint Conta Universal (current and savings under one number, per its terms) and is already covered by the joint account type, so the status stays not-found.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta conjunta de corretora ou de investimentos no íon ou na Itaú Corretora. A página de poupança do Itaú diz que uma poupança conjunta pode ser solidária ou simples, mas essa é a poupança que acompanha toda Conta Universal conjunta (conta corrente e poupança sob um único número, segundo os termos) e já está coberta pelo tipo de conta conjunta, então o status segue como não encontrado.",
          reviewedAt: "2026-11-01",
          citations: [
            {
              url: "https://www.itau.com.br/investimentos/poupanca",
              kind: "primary",
              finding:
                "Poupança page: a joint account allows shared management of the resources and must be set up as solidária or simples; FGC cover up to R$ 250,000.",
              checkedAt: "2026-11-01",
            },
          ],
        },
        mei: {
          status: "offered",
          conditionPtBr: "plano pago, isentável",
          evidence:
            "Itaú Empresas, the full PJ account, opens online with CNPJ and CPF plus facial validation: its App Store listing is titled 'Conta MEI e PJ' and tells MEIs to open the account on the website, and Itaú's own business blog and a feito.itau article list MEI among eligible CNPJs. It is a paid plan: the Plano Adapt is a fixed monthly package that can be waived through sales received, investments (from R$ 280,000 invested for Plano Adapt 1) or payroll. Itaú Emps, the free digital PJ account, still says 'Por enquanto o Emps é para pequenas empresas que não sejam MEI'.",
          summaryPtBr:
            "O Itaú Empresas, a conta PJ completa, abre online com CNPJ e CPF e validação facial: a página do app na App Store se chama 'Conta MEI e PJ' e orienta o MEI a abrir a conta pelo site, e o blog empresarial do próprio Itaú e um texto do feito.itau listam o MEI entre os CNPJs aceitos. É um plano pago: o Plano Adapt tem mensalidade fixa, que pode ser zerada com vendas recebidas, investimentos (a partir de R$ 280 mil no Plano Adapt 1) ou folha de pagamento. O Itaú Emps, a conta PJ digital gratuita, ainda diz que 'Por enquanto o Emps é para pequenas empresas que não sejam MEI'.",
          citations: [
            {
              url: "https://www.itau.com.br/emps",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Itaú Emps, the free digital PJ account, still says 'Por enquanto o Emps é para pequenas empresas que não sejam MEI' and 'Ainda não, mas estamos trabalhando para liberar também para MEIs'.",
            },
            {
              url: "https://www.itau.com.br/empresas/abra-sua-conta",
              kind: "primary",
              finding:
                "Itaú Empresas: open the PJ account with CNPJ and CPF and facial validation; Plano Adapt is a fixed monthly package, waivable through sales received, investments (from R$ 280,000 for Plano Adapt 1) or payroll.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://apps.apple.com/pt/app/ita%C3%BA-empresas-conta-mei-e-pj/id348274534",
              kind: "primary",
              finding:
                "App Store listing 'Itaú Empresas: Conta MEI e PJ': 'Se você é MEI e deseja abrir conta, acesse o site e faça a abertura de conta online'.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://blog.itau.com.br/empresas/quem-pode-abrir-conta-pj",
              kind: "primary",
              finding:
                "Any company with an active CNPJ can open a business account, including MEIs; MEI uses the CCMEI as its document.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://feito.itau.com.br/itau-empresas-abra-sua-conta-e-simplifique-a-gestao-do-seu-negocio/",
              kind: "primary",
              finding:
                "Itaú Empresas sign-up needs an active CNPJ (MEI, microenterprise or small or medium company), started on the website or in the Itaú Empresas app.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://tecnoblog.net/guias/conta-gratuita-mei-sem-taxas/",
              kind: "secondary",
              finding:
                "Tecnoblog comparison: Itaú's MEI account is not free (service baskets from R$ 118 at the time of the guide, whose date was not checked).",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
            "Livelo points, which do not expire on the Principal cards. Waiver paths now documented: Prime Visa Infinite at R$ 10,000 of average monthly spend or R$ 250,000 invested (50% off from R$ 5,000 of spend); Principal Visa Infinite (own page: 2.5 points per US$ in Brazil, 3 abroad, 4 Bradesco Lounge visits a year) waived by spend or R$ 300,000 invested; the Aeternum annuity is R$ 1,920 a year, waived only with R$ 5 million invested. Earlier research found periodic waiver campaigns rather than a permanent waiver; that was not re-checked.",
          summaryPtBr:
            "Pontos Livelo, que não expiram nos cartões do Principal. As formas de isenção agora documentadas são: Prime Visa Infinite com R$ 10.000 de gasto médio mensal ou R$ 250.000 investidos (50% de desconto a partir de R$ 5.000 de gasto); Principal Visa Infinite (página própria: 2,5 pontos por US$ no Brasil, 3 no exterior, 4 acessos por ano ao Bradesco Lounge) isento por gastos ou com R$ 300.000 investidos; a anuidade do Aeternum é de R$ 1.920 por ano, isenta só com R$ 5 milhões investidos. A pesquisa anterior encontrou campanhas periódicas de isenção, e não uma isenção permanente; isso não foi conferido de novo.",
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
            {
              url: "https://banco.bradesco/html/principal/cartoes/visaprincipal/",
              kind: "primary",
              finding:
                "Principal Visa Infinite: 2.5 points per US$ in Brazil, 3 abroad, 4 yearly Bradesco Lounge visits.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://altarendablog.com.br/2026/10/03/bradesco-prime-2026-requisitos-isencao-de-tarifas-e-melhores-cartoes-com-pontos-livelo-que-nao-expiram/",
              kind: "secondary",
              finding:
                "Prime Visa Infinite waived at R$ 10,000 of average monthly spend or R$ 250,000 invested; 50% off from R$ 5,000.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://altarendablog.com.br/2026/10/11/bradesco-principal-oferece-salas-vip-conta-nos-eua-e-anuidade-zerada-e-quer-chegar-a-800-mil-clientes-ate-dezembro/",
              kind: "secondary",
              finding:
                "Principal Visa Infinite waiver by investments (R$ 300,000) or spend; annual saving of R$ 1,500.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://altarendablog.com.br/2026/01/17/os-onze-11-cartoes-de-credito-do-bradesco-com-as-maiores-anuidades/",
              kind: "secondary",
              finding: "Aeternum: R$ 1,920 a year (12 x R$ 160), waiver at R$ 5 million invested.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
            {
              url: "https://banco.bradesco/html/classic/portal-investimentos/agora-investimentos.shtm",
              kind: "primary",
              finding:
                "Ágora is Bradesco's investment house, reachable from the Bradesco app and internet banking, with a simplified sign-up for account holders; investments count toward the campaigns that waive the service basket fee; more than 1,600 products from R$ 1, and brokerage waived for stocks, options, BDRs, ETFs and FIIs on the Ágora home broker since 18 September 2023.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://banco.bradesco/html/classic/portal-investimentos/index.shtm",
              kind: "primary",
              finding:
                "Bradesco investments portal lists CDB, LCA, LCI, LIG, Poupança Fácil, funds, Ágora and private pension.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://banco.bradesco/html/classic/produtos-servicos/investimentos/tesouro-direto.shtm",
              kind: "primary",
              finding:
                "Tesouro Direto from R$ 36 through Ágora, with no custody fee from Ágora and only the B3 charge of 0.25% a year.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/agora-corretora/plataforma-agora-bradesco-informacoes-divergentes-sobre-tesouro-direto-e-e_6X00P2mYqt1xdk0l/",
              kind: "secondary",
              finding:
                "Customer complaint that the Bradesco app hand-off to Ágora is confusing and that the Treasury offer on Ágora differs from the official Treasury site, which fits the extra step between the two brands.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        appQuality: {
          status: "scored",
          score: 60,
          evidence:
            "The App Store listing shows 4.7 stars from about 3.1 million ratings (read directly). The earlier Google Play figure (about 4.7 stars from about 5.9 million ratings, a search aggregate) was not re-read. Scored 60 rather than 80 because of the confirmed 2026 outages, as for Nubank and Inter. Outages: Central Bank-confirmed Pix instability on 23 August 2026 (Bradesco among the banks cited) and an app and Pix instability on 30 October 2026 (about 150 Downdetector reports at the peak).",
          summaryPtBr:
            "A página do app na App Store mostra 4,7 estrelas, com cerca de 3,1 milhões de avaliações (lida diretamente). O número anterior do Google Play (cerca de 4,7 estrelas, com cerca de 5,9 milhões de avaliações, agregado de busca) não foi relido. A nota é 60, e não 80, por causa das instabilidades confirmadas em 2026, como no Nubank e no Inter. Quedas: instabilidade do Pix em 23 de agosto de 2026, confirmada pelo Banco Central, com o Bradesco entre os bancos citados, e instabilidade do app e do Pix em 30 de outubro de 2026, com cerca de 150 relatos no pico do Downdetector.",
          citations: [
            {
              url: "https://play.google.com/store/apps/details?id=com.bradesco",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Rating from a search-engine aggregate.",
            },
            {
              url: "https://apps.apple.com/br/app/banco-bradesco/id336954985",
              kind: "primary",
              finding: "App Store listing: 4.7 stars, about 3.1 million ratings.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.portaldecamaqua.com.br/noticias/112120/bradesco-fora-do-ar-hoje-servicos-apresentam-instabilidade-nesta-sexta-dia-30-de-outubro-de-2026.html",
              kind: "secondary",
              finding:
                "Downdetector: app and Pix instability on 30 October 2026, about 150 reports at the peak.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.cnnbrasil.com.br/economia/money/macroeconomia/pix-instabilidade-hoje-23-agosto-2026/",
              kind: "secondary",
              finding:
                "23 August 2026: Central Bank confirmed Pix instability across banks, Bradesco among them.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding: "2022 leak.",
            },
            {
              url: "https://canaltech.com.br/seguranca/bradesco-dados-clientes-expostosu-nidade-eua-256554/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding: "2023 incident.",
            },
            {
              url: "https://www.reclameaqui.com.br/bradesco/suspeita-de-vazamento-de-dados-e-acesso-indevido-a-informacoes-bancarias-apos-ligacao-editado-pelo-reclame-aqui_iZBNNGS9lG0y-8QN/",
              kind: "secondary",
              finding:
                "April 2026 bank reply to a customer: after analysis the bank says no data leak occurred and attributes the fraud call to social engineering with spoofed numbers; no new confirmed incident was found in 2026 searches.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding:
                "Standard packages I to IV R$ 18.65, 32.40, 43.40, 64.70; TED R$ 13.85 internet, R$ 29.45 in person; basic national card annuity R$ 108.00; page last updated 29/09/2026.",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding: "Tariff page.",
            },
            {
              url: "https://www.reclameaqui.com.br/bradesco/bradesco-nao-autoriza-alteracao-limite-pix-noturno_p1bfjaqxLUTB1zNM/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding: "Complaint, anecdotal.",
            },
            {
              url: "https://banco.bradesco/html/prime/produtos-servicos/tarifas/index.shtm",
              kind: "primary",
              finding:
                "Bradesco Prime tariff page: according to the volume invested, the monthly service basket fee can be waived by up to 100%.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/bradesco/nao-consigo-alterar-meu-limite-pix-no-aplicativo__e0UoOai7-Fp93PF/",
              kind: "secondary",
              finding:
                "Bradesco reply to a customer: the night period starts at 20h or 22h and lasts until 6h, the start time is adjustable in the app, limit increases take 24 to 48 hours and reductions are immediate.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://altarendablog.com.br/2026/10/03/bradesco-prime-2026-requisitos-isencao-de-tarifas-e-melhores-cartoes-com-pontos-livelo-que-nao-expiram/",
              kind: "secondary",
              finding:
                "October 2026: Prime service basket 100% waived with R$ 150,000 invested at the bank; card annuity waivers also depend on spend or investments.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-11-01",
        },
      },
      accountTypes: {
        joint: {
          status: "offered",
          evidence:
            "Bradesco's account-opening regulation defines Conta Conjunta Simples ('e') and Conta Conjunta Solidária ('e/ou') for new personal accounts, with every holder jointly liable, including for credit.",
          summaryPtBr:
            "O regulamento de abertura de contas do Bradesco define a Conta Conjunta Simples ('e') e a Conta Conjunta Solidária ('e/ou') para novas contas de pessoa física, com todos os titulares respondendo em conjunto, inclusive pelo crédito.",
          citations: [
            {
              url: "https://banco.bradesco/assets/classic/pdf/produtos-servicos/tipos-de-conta/regulamento-para-abertura-de-contas-de-depositos-produtos-e-servicos-pessoa-fisica.pdf",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Regulation 1.408-7E (04/2026) 2.4.2 defines joint types 'e' (simples) and 'e/ou' (solidária); holders are jointly liable for credit limits.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        shared: {
          status: "not-found",
          evidence:
            "No shared-access product was found; Bradesco offers additional credit cards and nextJoy for minors, neither of which shares access to the holder's own current account. A procurador holding a notarized power of attorney can register biometrics and a password at Bradesco ATMs, but that is a legal mandate handled at a branch, not a shared-account product.",
          summaryPtBr:
            "Não foi encontrado produto de acesso compartilhado; o Bradesco oferece cartões adicionais e o nextJoy para menores, nenhum dos quais compartilha o acesso à conta corrente do titular. Um procurador com procuração em cartório pode cadastrar biometria e senha nos caixas eletrônicos do Bradesco, mas isso é um mandato legal tratado na agência, não um produto de conta compartilhada.",
          reviewedAt: "2026-11-01",
          citations: [
            {
              url: "https://banco.bradesco/html/classic/canais-digitais/caixa-eletronico/",
              kind: "primary",
              finding:
                "A procurador with a notarized power of attorney goes to a branch to register biometrics and an exclusive password for ATM use; this is a mandate, not an app-level shared account.",
              checkedAt: "2026-11-01",
            },
          ],
        },
        jointInvestment: {
          status: "not-found",
          evidence: "No source was found describing a joint investment account at Bradesco.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta no Bradesco.",
          reviewedAt: "2026-11-01",
        },
        mei: {
          status: "offered",
          conditionPtBr: "grátis por 12 meses",
          evidence:
            "The MEI account opens in the Bradesco Empresas e Negócios app without visiting a branch; the 'Cesta de serviços MEI' is free for 12 months, then charged.",
          summaryPtBr:
            "A conta MEI é aberta no app Bradesco Empresas e Negócios, sem visitar uma agência; a 'Cesta de serviços MEI' é grátis por 12 meses e depois passa a ser cobrada.",
          citations: [
            {
              url: "https://banco.bradesco/mei/",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "MEI account opened in the app without a branch; MEI service basket free for 12 months; first annual card fee free.",
            },
            {
              url: "https://tecnoblog.net/guias/conta-gratuita-mei-sem-taxas/",
              kind: "secondary",
              finding:
                "Tecnoblog guide: Bradesco gives the MEI account only 12 months of exemption, after which the service basket is charged monthly.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
            "Ourocard Visa Infinite: 2 points per US$ in Brazil and 3 abroad on Livelo, or 1% cashback, or automatic investment, chosen in the app; 4 free Visa Airport Companion lounge visits a year; annuity R$ 996 a year (12 x R$ 83), waived at R$ 15,000 of monthly card spend per two guides (an undated comparison says R$ 10,000) or R$ 250,000 invested at BB; holding it gives 90% off the Elo Nanquim and 80% off the Mastercard Black annuity. Benefits concentrate on premium tiers. The earlier Gold cashback figure (0.30%) was not re-read.",
          summaryPtBr:
            "Ourocard Visa Infinite: 2 pontos por US$ no Brasil e 3 no exterior na Livelo, ou 1% de cashback, ou investimento automático, escolhidos no app. São 4 acessos gratuitos por ano a salas VIP pelo Visa Airport Companion. A anuidade é de R$ 996 por ano (12 x R$ 83), isenta com R$ 15.000 de gastos por mês no cartão, segundo dois guias (um comparativo sem data diz R$ 10.000), ou com R$ 250.000 investidos no BB. Quem tem o cartão ganha 90% de desconto na anuidade do Elo Nanquim e 80% na do Mastercard Black. Os benefícios se concentram nos níveis premium. O número anterior de cashback do Gold (0,30%) não foi relido.",
          citations: [
            {
              url: "https://pontospravoar.com/guia-completo-beneficios-cartao-banco-brasil-ourocard-visa-infinite/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "Visa Infinite: up to 3 points per US$, annuity waiver at R$ 15,000 of monthly spend or R$ 250,000 invested, additional cards at 50% of the annuity.",
            },
            {
              url: "https://www.melhorescartoes.com.br/banco-brasil-ourocard-cashback.html",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Cashback rates.",
            },
            {
              url: "https://cartoeseviagens.com.br/cartao/bb-visa-infinite",
              kind: "secondary",
              finding:
                "Visa Infinite: 2 points per US$ in Brazil, 3 abroad on Livelo, 1% cashback, 90% and 80% annuity discounts on a second card.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://altarendablog.com.br/2026/06/21/ourocard-visa-infinite-o-guia-completo-do-cartao-de-alta-renda-do-banco-do-brasil/",
              kind: "secondary",
              finding:
                "Annuity R$ 996 (12 x R$ 83); waiver by spend or R$ 250,000 invested; 4 lounge uses a year.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        investmentAccess: {
          status: "scored",
          score: 60,
          evidence:
            "Own brokerage (BB Investimentos) and an investments app with zero brokerage on shares, ETFs and FIIs: Tesouro Direto, CDB, LCI and LCA, debentures, CRI and CRA, COE, private pensions and more than 100 funds, from R$ 0.01, in Brazil and abroad, with an Open Finance portfolio aggregator. The listing calls the portfolio open, but whether third-party issuers are distributed was still not confirmed.",
          summaryPtBr:
            "Corretora própria (BB Investimentos) e um app de investimentos com corretagem zero para ações, ETFs e FIIs: Tesouro Direto, CDB, LCI e LCA, debêntures, CRI e CRA, COE, previdência e mais de 100 fundos, a partir de R$ 0,01, no Brasil e no exterior, com agregador de carteira por Open Finance. A página do app fala em carteira aberta, mas ainda não foi confirmado se há distribuição de emissores de terceiros.",
          citations: [
            {
              url: "https://play.google.com/store/apps/details?id=br.com.bb.investimentosbb",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Investimentos BB app listing: fixed income, Tesouro, funds, shares with zero brokerage, from R$ 0.01, Brazil and abroad.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        appQuality: {
          status: "scored",
          score: 60,
          evidence:
            "The App Store listing shows 4.8 stars from about 4.3 million ratings (read directly); the Google Play listing shows no rating to automated reads, and the earlier 4.4 to 4.6 range from search snippets was not re-read. Confirmed 2026 instability: 13 January (credit card and login, about 106 Downdetector reports), 1 February (Pix and app login, about 459 reports at the peak), 21 February (app and internet banking, about 114 reports), 26 June (BB confirmed its digital channels were unavailable in the late afternoon, card operations unaffected) and 23 August (Central Bank-confirmed Pix instability across many banks, BB among those cited).",
          summaryPtBr:
            "A página do app na App Store mostra 4,8 estrelas, com cerca de 4,3 milhões de avaliações (lida diretamente); a página do Google Play não mostra nota em leituras automáticas, e a faixa anterior de 4,4 a 4,6 vinda de trechos de busca não foi relida. Instabilidades confirmadas em 2026: 13 de janeiro (cartão de crédito e login, cerca de 106 relatos no Downdetector), 1º de fevereiro (Pix e login no app, cerca de 459 relatos no pico), 21 de fevereiro (app e internet banking, cerca de 114 relatos), 26 de junho (o BB confirmou a indisponibilidade dos canais digitais no fim da tarde, sem impacto nas operações de cartão) e 23 de agosto (instabilidade do Pix confirmada pelo Banco Central em vários bancos, com o BB entre os citados).",
          citations: [
            {
              url: "https://play.google.com/store/apps/details?id=br.com.bb.android",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Rating range from search snippets.",
            },
            {
              url: "https://apps.apple.com/br/app/bb-banco-cart%C3%A3o-cr%C3%A9dito/id330984271",
              kind: "primary",
              finding: "App Store listing: 4.8 stars, about 4.3 million ratings.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://play.google.com/store/apps/details?id=br.com.bb.android&hl=en_US",
              kind: "secondary",
              finding:
                "Google Play listing read again: it shows the app description but no rating figure to automated reads.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://canaltech.com.br/apps/banco-do-brasil-fora-do-ar-app-tem-instabilidade-nesta-sexta-feira-26/",
              kind: "secondary",
              finding:
                "26 June 2026: BB confirmed unavailable digital channels in the late afternoon, card operations not affected; Downdetector showed the problem did not hit other banks.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.portaldecamaqua.com.br/noticias/100433/banco-do-brasil-fora-do-ar-servicos-apresentam-instabilidade-hoje-neste-domingo-dia-1-de-fevereiro-de-2026.html",
              kind: "secondary",
              finding:
                "1 February 2026: Pix, app login and mobile banking instability, about 459 Downdetector reports at the peak.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.portaldecamaqua.com.br/noticias/101122/banco-do-brasil-fora-do-ar-servicos-apresentam-instabilidade-hoje-neste-sabado-dia-21-de-fevereiro-de-2026.html",
              kind: "secondary",
              finding:
                "21 February 2026: app and internet banking instability, about 114 Downdetector reports.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.portaldecamaqua.com.br/noticias/99912/banco-do-brasil-fora-do-ar-servicos-apresentam-instabilidade-hoje-nesta-terca-feira-dia-13-de-janeiro-de-2026.html",
              kind: "secondary",
              finding:
                "13 January 2026: credit card and login instability, about 106 Downdetector reports.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.cnnbrasil.com.br/economia/money/macroeconomia/pix-instabilidade-hoje-23-agosto-2026/",
              kind: "secondary",
              finding:
                "23 August 2026: Central Bank confirmed Pix instability across banks, Banco do Brasil among them.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        security: {
          status: "scored",
          score: 60,
          evidence:
            "Banco do Brasil's own biometrics page describes facial and fingerprint validation with image-authenticity and liveness checks as an extra layer in physical and digital channels, and the BB blog says facial biometrics is used to authorize devices and transactions; new devices are otherwise released with a QR code at a BB ATM. Searches in this run found no confirmed Banco do Brasil data breach; customers' complaints about fraud calls are answered by the bank as external social engineering, not a leak, and absence of findings is not a clean record.",
          summaryPtBr:
            "A página de biometria do próprio Banco do Brasil descreve validação biométrica facial e digital, com verificação de autenticidade da imagem e de prova de vida, como camada extra nos canais físicos e digitais, e o blog do BB diz que a biometria facial é usada para autorizar dispositivos e transações; novos aparelhos também são liberados com QR Code em um caixa eletrônico do BB. As buscas desta rodada não encontraram vazamento de dados confirmado no Banco do Brasil; as reclamações de clientes sobre ligações de golpistas são respondidas pelo banco como engenharia social externa, não como vazamento, e a ausência de achados não equivale a um histórico limpo.",
          citations: [
            {
              url: "https://www.bb.com.br/site/pra-voce/seguranca/solucoes-de-seguranca/biometria-pf/",
              kind: "primary",
              finding:
                "Biometrics page: facial and fingerprint validation, image-authenticity checks and liveness checks as an additional layer of security in physical and digital channels.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://blog.bb.com.br/biometria-facial/",
              kind: "primary",
              finding:
                "BB blog: facial recognition is an extra layer against fraud, to be used to authorize devices, financial transactions and limit increases; registered in App BB under Meu Perfil > Segurança.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/banco-do-brasil/vazamento-de-dados-pessoais_WdZFQk1OuR06DRbj/",
              kind: "secondary",
              finding:
                "Bank reply to a customer who suspected a leak after a fraud call: BB says it never calls to ask for app installs or passwords and points to its security guide; no leak was confirmed.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.idinheiro.com.br/bancos/erros-no-aplicativo-do-banco-do-brasil/",
              kind: "secondary",
              finding:
                "Updated 17 September 2026: a blocked device must be released at a BB ATM with a QR code; biometric or device checks can block access.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding:
                "Standard packages I to IV R$ 15.90, 27.90, 37.30, 55.60; TED R$ 14.00 internet, R$ 34.60 in person; basic national card annuity R$ 234.00; page last updated 25/09/2026.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        lockIn: {
          status: "scored",
          score: 40,
          evidence:
            "Night Pix limit R$ 1,000, which a customer can raise to R$ 3,000; the start of the night period can move to 22h. An increase must be confirmed in a second channel (ATM with biometrics or BB Code) and takes effect 24 hours later, while a reduction is immediate. Complaints in 2026 still describe salary portability requests refused or delayed, within the regulatory limit of 10 business days.",
          summaryPtBr:
            "Limite do Pix noturno de R$ 1.000, que o cliente pode elevar até R$ 3.000; o início do período noturno pode passar para as 22h. O aumento precisa ser confirmado em outro canal (caixa eletrônico com biometria ou BB Code) e vale 24 horas depois, enquanto a redução é imediata. Reclamações de 2026 ainda descrevem pedidos de portabilidade de salário recusados ou atrasados, dentro do prazo regulatório de 10 dias úteis.",
          citations: [
            {
              url: "https://www.idinheiro.com.br/contas/aumentar-limite-pix-no-banco-do-brasil/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding: "Pix limit.",
            },
            {
              url: "https://www.reclameaqui.com.br/banco-do-brasil/dificuldade-e-demora-na-portabilidade-de-salario-do-banco-do-brasil-para-caixa_IEEubtKvDiobXRvP/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding: "Portability complaint.",
            },
            {
              url: "https://www.reclameaqui.com.br/banco-do-brasil/aumento-de-limite-pix-nao-efetivado-apos-autorizacao-no-caixa-eletronico_tbjCK-aVetWpTdc5/",
              kind: "secondary",
              finding:
                "Bank reply: night limit raisable to R$ 3,000, night start movable from 20h to 22h in App BB, new limits 24 hours after confirmation; branch requests take effect immediately.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/banco-do-brasil/recusa-na-portabilidade-de-salario-do-banco-do-brasil-para-a-caixa-impedindo-o-recebimento-do-pagamento_SyxUYMfslvNTiDGx/",
              kind: "secondary",
              finding:
                "2026 complaint: salary portability to Caixa refused on the same day it was requested; the bank says the salary account was not yet open and the employer differed.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-11-01",
        },
      },
      accountTypes: {
        joint: {
          status: "offered",
          conditionPtBr: "até 4 titulares",
          evidence:
            "Banco do Brasil's own blog describes a joint account (solidária or simples) open to anyone 18 or older with up to four holders, each with their own App BB access and, per the blog, their own credit card.",
          summaryPtBr:
            "O blog do próprio Banco do Brasil descreve a conta conjunta (solidária ou simples), aberta a maiores de 18 anos, com até quatro titulares. Cada um tem seu acesso ao App BB e, segundo o blog, seu próprio cartão de crédito.",
          citations: [
            {
              url: "https://blog.bb.com.br/conta-conjunta-dez-perguntas-e-respostas-que-voce-precisa-conhecer/",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Anyone 18+, no family tie needed, up to 4 holders; each holder can have their own credit card and accesses the account individually via App BB or Internet Banking.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        shared: {
          status: "not-found",
          evidence:
            "No shared-access product was found; BB's Cofrinho lets the owner share a Pix link so others contribute to a pot, but that is not shared access to the account itself.",
          summaryPtBr:
            "Não foi encontrado produto de acesso compartilhado; o Cofrinho do BB permite que o titular compartilhe um link de Pix para que outras pessoas contribuam para uma meta, mas isso não é acesso compartilhado à conta em si.",
          reviewedAt: "2026-11-01",
        },
        jointInvestment: {
          status: "not-found",
          evidence: "No source was found describing a joint investment account at Banco do Brasil.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta no Banco do Brasil.",
          reviewedAt: "2026-11-01",
        },
        mei: {
          status: "offered",
          evidence:
            "Conta PJ Digital for MEI, EI and single-member SLU opens in App BB, with the 'Plano Digital' advertised as 'Mensalidade grátis', unlimited Pix, 4 free withdrawals a month and 10 payment links.",
          summaryPtBr:
            "A Conta PJ Digital para MEI, EI e SLU unipessoal é aberta no App BB, com o 'Plano Digital' anunciado como 'Mensalidade grátis', Pix ilimitado, 4 saques grátis por mês e 10 links de cobrança.",
          citations: [
            {
              url: "https://www.bb.com.br/site/pro-seu-negocio/contas/conta-pj-digital/",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Conta PJ Digital for MEI/EI/SLU opened in app; Plano Digital without monthly fee.",
            },
            {
              url: "https://blog.bb.com.br/conta-pj-para-mei-simplifique-a-gestao-do-seu-negocio/",
              kind: "primary",
              finding:
                "BB blog guide: the MEI Conta PJ Digital is opened online in App BB (Quero ser cliente > Produtos para empresa), with the CCMEI and an active CNPJ.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
      },
    },
    {
      institutionId: "caixa",
      criteria: {
        cardBenefits: {
          status: "scored",
          score: 60,
          evidence:
            "CAIXA's own card pages: points per US$ run from 1.2 (Visa Gold) to 2.3 domestic and 3.2 international (Visa Infinite and Elo Nanquim, 36-month validity), 3 and 4 (Elo Diners Club, no expiry) and 5 and 6 (Ícone Visa and Infinite Investidor, no expiry). Visa Infinite and Elo Nanquim carry an R$ 828 annuity (12 x R$ 69) with a 50% cashback of the instalment from R$ 4,000 of monthly spend and 100% from R$ 8,000, and 2 free lounge visits a year; the card for CAIXA Tem customers has a permanent zero annuity. Scored at the level given to Banco do Brasil and Bradesco (a points programme with spend-based waivers and premium-tier benefits); this replaces the earlier insufficient-evidence entry.",
          summaryPtBr:
            "Páginas próprias de cartões da CAIXA: os pontos por US$ vão de 1,2 (Visa Gold) a 2,3 no Brasil e 3,2 no exterior (Visa Infinite e Elo Nanquim, validade de 36 meses), 3 e 4 (Elo Diners Club, sem vencimento) e 5 e 6 (Ícone Visa e Infinite Investidor, sem vencimento). O Visa Infinite e o Elo Nanquim têm anuidade de R$ 828 (12 x R$ 69), com cashback de 50% da parcela a partir de R$ 4.000 de gastos por mês e de 100% a partir de R$ 8.000, e 2 acessos gratuitos por ano a salas VIP. O cartão para clientes CAIXA Tem tem anuidade zero permanente. A nota segue o nível dado ao Banco do Brasil e ao Bradesco (programa de pontos com isenção por gastos e benefícios nos níveis premium); ela substitui a entrada anterior de evidência insuficiente.",
          citations: [
            {
              url: "https://www.caixa.gov.br/voce/cartoes/programa-pontos/Paginas/default.aspx",
              kind: "primary",
              finding:
                "Points per US$ by card, annuity values and the cashback-of-annuity tiers; CAIXA Tem card with permanent zero annuity.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.caixa.gov.br/voce/cartoes/credito/nanquim/Paginas/default.aspx",
              kind: "primary",
              finding:
                "Elo Nanquim: 2.3 points domestic, 3.2 international, R$ 69 a month, 2 yearly Priority Pass visits, 100% or 50% cashback of the instalment by spend.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://altarendablog.com.br/2026/09/26/cartoes-caixa-veja-a-pontuacao-a-anuidade-e-os-beneficios-de-cada-modelo/",
              kind: "secondary",
              finding:
                "Card-by-card points, annuity and lounge access summary of 26 September 2026.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        investmentAccess: {
          status: "scored",
          score: 40,
          evidence:
            "CDB (CDI-linked from R$ 200, prefixed from R$ 1,000, progressive, IPCA+), LCI, LCA, funds and poupança, all Caixa paper or Caixa-distributed, plus Tesouro Direto, where Caixa waives its custody fee but orders go through the Tesouro Direto site rather than the app, and the Ações Online home broker for shares and real estate funds, which has no custody fee but charges brokerage under the tariff table. No sign of an open third-party platform.",
          summaryPtBr:
            "CDB (pós-fixado a partir de R$ 200, prefixado a partir de R$ 1.000, progressivo e IPCA+), LCI, LCA, fundos e poupança, todos emitidos ou distribuídos pela Caixa, além do Tesouro Direto, em que a Caixa dispensa a taxa de custódia, mas as ordens passam pelo site do Tesouro Direto e não pelo app, e do home broker Ações Online para ações e fundos imobiliários, sem taxa de custódia, mas com corretagem conforme a tabela de tarifas. Sem sinal de plataforma aberta de terceiros.",
          citations: [
            {
              url: "https://www.caixa.gov.br/investimentos/Paginas/default.aspx",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding: "Investment products.",
            },
            {
              url: "https://www.caixa.gov.br/voce/poupanca-e-investimentos/cdb/cdb-flex/paginas/default.aspx",
              kind: "primary",
              finding:
                "CDB CAIXA DI: CDI-linked, from R$ 200, FGC cover up to R$ 250,000, invested from a Caixa current account.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.caixa.gov.br/voce/poupanca-e-investimentos/tesouro-direto/Paginas/default.aspx",
              kind: "primary",
              finding:
                "Tesouro Direto: operations are made on the Tesouro Direto site, Caixa acts as custody agent and waives its custody fee; account holders only.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.caixa.gov.br/voce/poupanca-e-investimentos/acoes-online/custos-operacionais/Paginas/default.aspx",
              kind: "primary",
              finding:
                "Ações Online: Caixa waives custody and inactivity fees; brokerage is charged under the tariff table.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.caixa.gov.br/voce/contas/Documents/tabela-de-tarifas.pdf",
              kind: "primary",
              finding:
                "Tariff table disclosed 1 October 2026: brokerage fee applies on shares, PIBB units and real estate fund units.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/caixa-economica-federal/tesouro-direto-nao-esta-disponivel-no-app_zzXR8nIiA6_J9jaw/",
              kind: "secondary",
              finding:
                "Customer complaint: Tesouro Direto does not appear in the Caixa app; Caixa replies that it is reached through the website, then the Tesouro Direto site.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        appQuality: {
          status: "scored",
          score: 40,
          evidence:
            "A secondary source names Caixa among the worst-rated bank apps on both stores; Caixa Tem users report crashes after updates. The App CAIXA and CAIXA Tem listings were read again but show no rating figure to automated reads, so there is still no exact rating. Instability found in 2026: 19 January (login and Pix), 8 May (about 744 Downdetector reports), 4 July (about 100), 23 August (Central Bank-confirmed Pix instability across banks, Caixa among them), 26 and 27 August (App CAIXA about 1,000 reports on the 26th and Caixa Tem up to about 1,600, still more than 760 on the 27th, with payment days for benefits affected; Caixa said it normalized the system) and 14 October (about 150).",
          summaryPtBr:
            "Uma fonte secundária cita a Caixa entre os apps de banco pior avaliados nas duas lojas, e usuários do Caixa Tem relatam travamentos após atualizações. As páginas do App CAIXA e do CAIXA Tem foram relidas, mas não mostram nota em leituras automáticas, então continua sem nota exata. Instabilidades encontradas em 2026: 19 de janeiro (login e Pix), 8 de maio (cerca de 744 relatos no Downdetector), 4 de julho (cerca de 100), 23 de agosto (instabilidade do Pix confirmada pelo Banco Central em vários bancos, com a Caixa entre eles), 26 e 27 de agosto (App CAIXA com cerca de 1.000 relatos no dia 26 e Caixa Tem com até cerca de 1.600, ainda mais de 760 no dia 27, em dias de pagamento de benefícios; a Caixa disse ter normalizado o sistema) e 14 de outubro (cerca de 150).",
          citations: [
            {
              url: "https://seucreditodigital.com.br/banrisul-e-caixa-sao-piores-apps-de-banco-no-google-play-store-e-app-store/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Store ranking coverage.",
            },
            {
              url: "https://apps.apple.com/br/app/caixa/id490813624",
              kind: "secondary",
              finding:
                "App Store listing for App CAIXA read again: description and update notes, no rating figure to automated reads.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://play.google.com/store/apps/details?id=br.com.gabba.Caixa&hl=en_US",
              kind: "secondary",
              finding:
                "Google Play listing for App CAIXA read again: user reviews include login, device-registration and account-opening complaints; no rating figure to automated reads.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://dol.com.br/noticias/brasil/961121/caixa-tem-apresenta-instabilidade-pelo-segundo-dia-e-acumula-reclamacoes",
              kind: "secondary",
              finding:
                "27 August 2026: Caixa Tem unstable for a second day, more than 760 Downdetector reports; more than 1,600 the day before.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://exame.com/invest/minhas-financas/o-caixa-tem-esta-fora-do-ar-usuarios-reclamam-de-instabilidade-no-app-pelo-2o-dia-consecutivo/",
              kind: "secondary",
              finding:
                "Exame, updated 27 August 2026: Caixa Tem instability since 26 August; Caixa says the system was normalized.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.portaldecamaqua.com.br/noticias/107545/caixa-fora-do-ar-hoje-servicos-apresentam-instabilidade-nesta-quarta-dia-26-de-agosto-de-2026.html",
              kind: "secondary",
              finding:
                "26 August 2026: app, login and website instability, about 1,000 Downdetector reports at the peak.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.portaldecamaqua.com.br/noticias/110620/caixa-fora-do-ar-hoje-servicos-apresentam-instabilidade-nesta-quarta-feira-dia-14-de-outubro-de-2026.html",
              kind: "secondary",
              finding:
                "14 October 2026: app, login and transfers instability, about 150 Downdetector reports.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.portaldecamaqua.com.br/noticias/105082/caixa-fora-do-ar-hoje-servicos-apresentam-instabilidade-neste-sabado-dia-4-de-julho-de-2026.html",
              kind: "secondary",
              finding:
                "4 July 2026: login, app and transfer instability, about 100 Downdetector reports.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.portaldecamaqua.com.br/noticias/103253/caixa-fora-do-ar-hoje-servicos-apresentam-instabilidade-nesta-sexta-feira-dia-8-de-maio-de-2026.html",
              kind: "secondary",
              finding:
                "8 May 2026: login, app and transfer instability, about 744 Downdetector reports.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.portaldecamaqua.com.br/noticias/100062/caixa-fora-do-ar-servicos-apresentam-instabilidade-hoje-nesta-segunda-feira-dia-19-de-janeiro-de-2026.html",
              kind: "secondary",
              finding: "19 January 2026: app login, internet banking login and Pix instability.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.cnnbrasil.com.br/economia/money/macroeconomia/pix-instabilidade-hoje-23-agosto-2026/",
              kind: "secondary",
              finding:
                "23 August 2026: Central Bank confirmed Pix instability across banks, Caixa among them.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        security: {
          status: "scored",
          score: 60,
          evidence:
            "Dedicated biometrics page (fingerprint authentication at ATMs, facial biometrics in the apps) and a security page describing app blocks on rooted, developer-mode or insecure-keyboard devices and two separate passwords for internet banking. The Central Bank reported a leak of registration data tied to 644 Pix keys under Caixa's responsibility (no passwords, balances or movements; Caixa called it a one-off incident, fixed it and notified customers; the excerpts read do not state the year); a 2026 Caixa reply to a customer says it has no record of an incident involving that customer's data.",
          summaryPtBr:
            "Página dedicada à biometria (impressão digital nos caixas eletrônicos e biometria facial nos apps) e página de segurança que descreve bloqueio dos apps em aparelhos com root, modo desenvolvedor ou teclado inseguro e duas senhas separadas no internet banking. O Banco Central divulgou um vazamento de dados cadastrais ligados a 644 chaves Pix sob responsabilidade da Caixa (sem senhas, saldos ou movimentações; a Caixa o chamou de incidente pontual, corrigiu e notificou os clientes; os trechos lidos não informam o ano); em 2026, a Caixa respondeu a um cliente que não há registro de incidente com os dados dele.",
          citations: [
            {
              url: "https://www.caixa.gov.br/seguranca/biometria/Paginas/default.aspx",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding: "Biometrics.",
            },
            {
              url: "https://www.caixa.gov.br/seguranca/Paginas/default.aspx",
              kind: "primary",
              finding:
                "Security page: apps block devices with developer mode, insecure keyboards, root or jailbreak; guidance on lost or stolen devices and the Celular Seguro programme.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.caixa.gov.br/seguranca/na-internet/paginas/default.aspx",
              kind: "primary",
              finding:
                "Internet banking and apps use two separate passwords, one for access and one for transactions.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://canaltech.com.br/seguranca/caixa-teve-vazamento-de-dados-pix-de-cliente-diz-banco-central/",
              kind: "secondary",
              finding:
                "Central Bank alert: leak of registration data for more than 600 Pix keys of Caixa customers; Caixa says 644 keys, a one-off incident, fixed, customers notified; no passwords, movements or balances.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/caixa-economica-federal/vazamento-de-senha-e-falta-de-notificacao-da-caixa-lgpd_sgaxHeTolaaePNrU/",
              kind: "secondary",
              finding:
                "2026 Caixa reply to a customer whose password appeared in a public breach list: no record of a security incident or leak under Caixa's custody.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding:
                "Standard packages I to IV R$ 16.00, 26.90, 35.50, 53.00; TED R$ 13.00 internet, R$ 25.00 in person; basic national card annuity R$ 156.00; page last updated 23/09/2026.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        lockIn: {
          status: "scored",
          score: 60,
          evidence:
            "Night Pix limit R$ 1,000 for individuals, the market default (an earlier R$ 1,500 figure from a secondary source is not confirmed by Caixa's own FAQ); the night window can start at 22h, increases take 24 to 48 hours, reductions are immediate and a branch request is immediate. CAIXA Tem accounts have a fixed limit that cannot be raised, and a higher App CAIXA limit needs the Mobile Forte device validation at an ATM. Salary portability to Caixa takes up to 5 business days. No complaint evidence about account closure friction was gathered.",
          summaryPtBr:
            "Limite do Pix noturno de R$ 1.000 para pessoas físicas, o padrão do mercado (o valor anterior de R$ 1.500, vindo de fonte secundária, não é confirmado pelo FAQ da própria Caixa); o horário noturno pode começar às 22h, o aumento leva de 24 a 48 horas, a redução é imediata e o pedido na agência vale na hora. As contas do CAIXA Tem têm limite fixo, que não pode ser aumentado, e um limite maior no App CAIXA exige a validação do aparelho (Mobile Forte) em um caixa eletrônico. A portabilidade de salário para a Caixa leva até 5 dias úteis. Não foram levantadas reclamações sobre dificuldade para encerrar a conta.",
          citations: [
            {
              url: "https://www.idinheiro.com.br/bancos/quais-sao-os-limites-de-ted-e-pix/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Pix limits.",
            },
            {
              url: "https://www.caixa.gov.br/pix/perguntas-frequentes/Paginas/default.aspx",
              kind: "primary",
              finding:
                "Pix FAQ: night start can move from 20h to 22h; increases processed in 24 to 48 hours under BCB Resolution 142/21, reductions immediate; Mobile Forte raises limits for the registered smartphone.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/caixa-economica-federal/dificuldade-em-aumentar-limite-pix-e-problemas-com-atendimento-telefonico-da-caixa_D6lDIB8IrK2vlNuX/",
              kind: "secondary",
              finding:
                "Caixa reply: individuals' night limit to third parties is automatically R$ 1,000; increases through digital channels take 24 to 48 hours, branch requests are immediate.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.caixa.gov.br/faleconosco/como-podemos-te-ajudar/pix/Paginas/default.aspx",
              kind: "primary",
              finding:
                "Help page: CAIXA Tem users currently have a fixed Pix limit that cannot be increased; App CAIXA users can raise it with Mobile Forte.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.caixa.gov.br/voce/salario-na-caixa/Paginas/default.aspx",
              kind: "primary",
              finding:
                "Salary portability to Caixa can be requested in the app and takes up to 5 business days to be accepted by the origin bank.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        publicReviews: {
          status: "scored",
          score: 70,
          evidence:
            "Reclame Aqui: 7.0/10 over the last six months (earlier review, March to August 2026: 7.2/10, 69.9% resolution, 65.6% would do business again; those figures were not visible in this read).",
          summaryPtBr:
            "Reclame Aqui: 7,0/10 nos últimos seis meses (revisão anterior, de março a agosto de 2026: 7,2/10, 69,9% de solução, 65,6% voltariam a fazer negócio; esses números não apareceram nesta leitura).",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/caixa-economica-federal/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "Reclame Aqui page read through a search-engine snippet (the site refuses automated reads): 7.0/10 over the last six months.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
      },
      accountTypes: {
        joint: {
          status: "offered",
          conditionPtBr: "corrente ou poupança",
          evidence:
            "Caixa's account-opening contract defines joint current and savings accounts, solidária (any holder moves alone) or não-solidária (all must act together), each holder with their own app login by CPF. A Caixa reply to a customer adds that investments in a joint account are visible and movable only by the first holder.",
          summaryPtBr:
            "O contrato de abertura de conta da Caixa define contas correntes e poupanças conjuntas, solidárias (qualquer titular movimenta sozinho) ou não solidárias (todos precisam agir juntos). Cada titular tem seu próprio login no app, pelo CPF. Uma resposta da Caixa a um cliente acrescenta que os investimentos de uma conta conjunta só aparecem e só podem ser movimentados pelo primeiro titular.",
          citations: [
            {
              url: "https://www.caixa.gov.br/Downloads/contas-pessoa-fisica/Contrato-Pessoa-Fisica-10-11-2021.pdf",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Cláusulas Gerais (37.105 v023) define joint current/savings accounts as solidária or não-solidária; a holder can leave without the others' authorisation, adding one needs all of them.",
            },
            {
              url: "https://www.caixa.gov.br/atendimento/canais-digitais/app-caixa-internet-banking/perguntas-frequentes/Paginas/default.aspx",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding: "Each joint holder registers their own user and access password by CPF.",
            },
            {
              url: "https://www.reclameaqui.com.br/caixa-economica-federal/restricao-de-acesso-a-investimentos-em-conta-conjunta-da-caixa-economica-fe_VGNFyTxEwG6myxWo/",
              kind: "secondary",
              finding:
                "Caixa reply: in joint accounts, consultation and movement of investments are available only to the first holder because investments are registered in that person's name.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        shared: {
          status: "not-found",
          evidence:
            "No shared-access product was found in App CAIXA beyond additional credit cards, which share a card limit, not account access.",
          summaryPtBr:
            "Não foi encontrado produto de acesso compartilhado no App CAIXA além dos cartões adicionais, que compartilham o limite do cartão, não o acesso à conta.",
          reviewedAt: "2026-11-01",
        },
        jointInvestment: {
          status: "not-offered",
          evidence:
            "Caixa itself says that in a joint account the investments are registered exclusively in the first holder's name, and only that holder can see or move them, so there is no joint investing.",
          summaryPtBr:
            "A própria Caixa diz que, em uma conta conjunta, os investimentos são registrados exclusivamente no nome do primeiro titular, e só ele pode vê-los ou movimentá-los, então não há investimento conjunto.",
          reviewedAt: "2026-11-01",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/caixa-economica-federal/restricao-de-acesso-a-investimentos-em-conta-conjunta-da-caixa-economica-fe_VGNFyTxEwG6myxWo/",
              kind: "secondary",
              finding:
                "Caixa reply to a joint-account holder: investments are registered exclusively in the first holder's name and are available only to that holder in digital channels.",
              checkedAt: "2026-11-01",
            },
          ],
        },
        mei: {
          status: "offered",
          evidence:
            "Conta Digital MEI through the CAIXA Tem app has no maintenance fee when opened digitally and offers unlimited free Pix; it requires a CAIXA Tem PF digital savings account (the Poupança Social Digital is not eligible until upgraded) and an active MEI CNPJ, and it is opened only in the app.",
          summaryPtBr:
            "A Conta Digital MEI pelo app CAIXA Tem não tem taxa de manutenção quando aberta digitalmente e tem Pix ilimitado grátis; exige uma conta poupança digital CAIXA Tem de pessoa física (a Poupança Social Digital não é elegível até passar por upgrade) e um CNPJ MEI ativo, e é aberta apenas no app.",
          citations: [
            {
              url: "https://www.caixa.gov.br/empresa/contas/conta-mei/Paginas/default.aspx",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Conta Digital MEI CAIXA Tem: no maintenance fee when opened digitally; free Pix; requires CAIXA Tem PF savings and active MEI; one per CNPJ.",
            },
            {
              url: "https://www.reclameaqui.com.br/caixa-economica-federal/erro-persistente-na-criacao-de-conta-mei-pelo-caixa-tem-sem-suporte-via-telefone-ou-agencia_Kj_o10fFaiy_lLVs/",
              kind: "secondary",
              finding:
                "Caixa reply: the MEI PJ account is opened exclusively in the CAIXA Tem app and requires an active CAIXA Tem savings account; the Poupança Social Digital is not eligible and must be upgraded first.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
      },
    },
    {
      institutionId: "santander",
      criteria: {
        cardBenefits: {
          status: "scored",
          score: 60,
          evidence:
            "Santander's card comparison page lists a card with up to 3 points per US$ (up to 4.5 with the Santander Rewards programme) or 1.2% cashback, with Visa Airport Companion lounges, and entry cards with 1.5 points per US$ (up to 2.25 with Rewards) or 0.8% cashback, cashback capped at R$ 500 per invoice, plus a card with a free annuity for life. The Unlimited annuity is R$ 2,200 a year (12 x R$ 183.33), waived at R$ 30,000 of invoice spend or R$ 5 million invested at Santander or Toro, with up to 6 points per US$ depending on Rewards level; a September 2026 report says lounge access now needs a monthly spend. Scored at the level given to Banco do Brasil and Bradesco; this replaces the earlier insufficient-evidence entry.",
          summaryPtBr:
            "A página de comparação de cartões do Santander lista um cartão com até 3 pontos por US$ (até 4,5 com o programa Santander Rewards) ou 1,2% de cashback, com salas VIP do Visa Airport Companion, e cartões de entrada com 1,5 ponto por US$ (até 2,25 com o Rewards) ou 0,8% de cashback, com cashback limitado a R$ 500 por fatura, além de um cartão com anuidade grátis para sempre. A anuidade do Unlimited é de R$ 2.200 por ano (12 x R$ 183,33), isenta com R$ 30.000 de fatura ou R$ 5 milhões investidos no Santander ou na Toro, com até 6 pontos por US$ conforme o nível no Rewards. Uma reportagem de setembro de 2026 diz que o acesso às salas VIP passou a exigir gasto mensal. A nota segue o nível dado ao Banco do Brasil e ao Bradesco; ela substitui a entrada anterior de evidência insuficiente.",
          citations: [
            {
              url: "https://www.santander.com.br/cartao-de-credito",
              kind: "primary",
              finding:
                "Card comparison: up to 3 points per US$ (4.5 with Rewards) or 1.2% cashback; entry cards 1.5 points (2.25 with Rewards) or 0.8% cashback, capped at R$ 500 per invoice; a free-for-life annuity card.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.santander.com.br/cartao-credito-santander/unlimited",
              kind: "primary",
              finding:
                "Unlimited: 12 x R$ 183.33, waived at R$ 5 million invested or R$ 30,000 of invoice spend.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://pontospravoar.com/guia-completo-cartao-santander-unlimited/",
              kind: "secondary",
              finding:
                "Unlimited: R$ 2,199.96 a year, up to 6 points per US$ by Rewards level, minimum spend for free lounge access.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://altarendablog.com.br/2026/09/03/santander-zera-anuidade-do-unlimited-em-nova-proposta-especial-veja-os-detalhes/",
              kind: "secondary",
              finding: "September 2026: new spend criterion for Unlimited lounge access.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding:
                "Toro became Santander Corretora: an open platform with Bolsa (shares, BDRs, FIIs, ETFs), fixed income (Tesouro Direto, LCI, LCA, LC, debentures, CRI, CRA) and funds from Santander and third parties; the migration ran from December 2025 to February 2026.",
            },
            {
              url: "https://www.santander.com.br/investimentos/produtos-da-corretora",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Brokerage products.",
            },
            {
              url: "https://investimentos.santander.com.br/corretora/nova-experiencia",
              kind: "primary",
              finding:
                "Santander Corretora: open platform with more than 500 fixed-income assets and 1,000 funds, shares and Tesouro Direto migrated at no cost; investments there still count for the bank's fee-waiver policy.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.toroinvestimentos.com.br/conta-santander-toro",
              kind: "primary",
              finding:
                "Santander Corretora: zero brokerage on main B3 assets (shares, FIIs, ETFs, BDRs), more than 1,000 funds, IPOs; B3 fees still apply.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        appQuality: {
          status: "scored",
          score: 40,
          evidence:
            "No rating could be read for the main app: the Santander Brasil Google Play and App Store listings show descriptions and developer replies but no rating figure to automated reads. The only rating found earlier (4.10 from 1.4 million ratings) belongs to Santander Way, which the Play listing now says was integrated into the Santander Brasil app. Instability found in 2026: 6 February (about 140 Downdetector reports, app and Pix), 8 February and 11 to 12 February (customers unable to open the app, per Reclame Aqui complaints answered by the bank), 19 March (app down for hours, per a complaint) and 23 August (Central Bank-confirmed Pix instability across banks, Santander among them).",
          summaryPtBr:
            "Não foi possível ler nota do app principal: as páginas do Santander Brasil no Google Play e na App Store mostram descrições e respostas do desenvolvedor, mas nenhuma nota em leituras automáticas. A única nota encontrada antes (4,10, com 1,4 milhão de avaliações) é do Santander Way, que a página do Play agora diz ter sido integrado ao app Santander Brasil. Instabilidades encontradas em 2026: 6 de fevereiro (cerca de 140 relatos no Downdetector, app e Pix), 8 de fevereiro e 11 a 12 de fevereiro (clientes sem conseguir abrir o app, segundo reclamações no Reclame Aqui respondidas pelo banco), 19 de março (app fora do ar por horas, segundo uma reclamação) e 23 de agosto (instabilidade do Pix confirmada pelo Banco Central em vários bancos, com o Santander entre eles).",
          citations: [
            {
              url: "https://apps.apple.com/br/app/banco-santander-brasil/id613365711",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "App Store listing read again: update notes and privacy details, no rating figure to automated reads.",
            },
            {
              url: "https://play.google.com/store/apps/details?id=com.santander.app&hl=en_US",
              kind: "secondary",
              finding:
                "Google Play listing for Santander Brasil: Way integrated into the main app; no rating figure to automated reads.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.portaldecamaqua.com.br/noticias/100586/santander-fora-do-ar-servicos-apresentam-instabilidade-hoje-nesta-sexta-feira-dia-6-de-fevereiro-de-2026.html",
              kind: "secondary",
              finding:
                "6 February 2026: personal-banking app, business website and Pix instability, about 140 Downdetector reports at the peak.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/santander/santander-fora-do-ar-08022026_hmGW7V9cqiJPqCgH/",
              kind: "secondary",
              finding:
                "8 February 2026: customer unable to access the app; the bank's reply points to cache clearing and re-enabling the device.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/santander/aplicativo-do-banco-santander-fora-do-ar-impede-pagamento-de-aluguel_XwBao2rFIF68vmE-/",
              kind: "secondary",
              finding:
                "12 February 2026: customer says the app has not opened since the day before.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/santander/santander-sistema-fora-do-ar-e-falha-no-aplicativo-impedem-transacoes-bancarias_89Sx2QhTfaqvRhSF/",
              kind: "secondary",
              finding:
                "19 March 2026 complaint: app and system down for hours; the bank's 24 March reply says access was normalized.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.cnnbrasil.com.br/economia/money/macroeconomia/pix-instabilidade-hoje-23-agosto-2026/",
              kind: "secondary",
              finding:
                "23 August 2026: Central Bank confirmed Pix instability across banks, Santander among them.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        security: {
          status: "scored",
          score: 60,
          evidence:
            "Santander's own pages describe ID Santander, a two-step verification that replaced the key-fob token and is mandatory for every account holder, facial biometrics for transactions and device enabling, and an Immediate Block service for lost devices with identity layers on the request. In May 2024 an attack on a third-party provider exposed bank details and passwords of customers and former employees in Chile, Spain and Uruguay; Santander says Brazilian customers were not affected. On 4 September 2025 a hacker attack briefly disturbed Pix via QR Code, with no funds diverted and no data leak according to the bank. Customers' fraud complaints are answered as social engineering, not a leak; no confirmed leak of Brazilian customer data was found, and absence of findings is not a clean record.",
          summaryPtBr:
            "As páginas do próprio Santander descrevem o ID Santander, uma verificação em duas etapas que substituiu o token chaveiro e é obrigatória para todos os correntistas, a biometria facial para transações e habilitação de aparelhos e o Bloqueio Imediato para aparelhos perdidos, com camadas de confirmação de identidade no pedido. Em maio de 2024, um ataque a um provedor terceirizado expôs dados bancários e senhas de clientes e ex-funcionários no Chile, na Espanha e no Uruguai; o Santander diz que clientes brasileiros não foram afetados. Em 4 de setembro de 2025, um ataque hacker perturbou por pouco tempo o Pix por QR Code, sem desvio de recursos nem vazamento de dados, segundo o banco. As reclamações de fraude de clientes são respondidas como engenharia social, não como vazamento; não foi encontrado vazamento confirmado de dados de clientes brasileiros, e a ausência de achados não equivale a um histórico limpo.",
          citations: [
            {
              url: "https://www.santander.com.br/blog/seguranca-digital-santander",
              kind: "primary",
              finding:
                "Santander blog: ID Santander is a two-step verification that replaced the key-fob token; facial biometrics; Immediate Block with identity layers; encryption and two-factor authentication.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.santander.com.br/biometria-facial",
              kind: "primary",
              finding:
                "Facial biometrics are registered in the app under Configurações > Segurança; Immediate Block is offered for lost or stolen devices.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.santander.com.br/blog/autenticacao-em-dois-fatores",
              kind: "primary",
              finding:
                "Two two-factor options in the app, facial biometrics and ID Santander; facial biometrics recommended.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://canaltech.com.br/seguranca/banco-santander-confirma-vazamento-de-dados-de-clientes-apos-ataque-289443/",
              kind: "secondary",
              finding:
                "May 2024: attack on a third-party provider exposed customer and former-employee data in Chile, Spain and Uruguay; the Brazilian unit says Brazilian customers were not affected.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://altarendablog.com.br/2025/09/06/santander-sofre-ataque-hacker-pix-via-qr-code-apresenta-instabilidade-veja-detalhes/",
              kind: "secondary",
              finding:
                "4 September 2025: hacker attack caused momentary instability in Pix via QR Code; the bank said no funds were diverted and no data leaked.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/santander/inseguranca-vazamento-de-dados-pessoais_8dKPCRwKVCTV9xtb/",
              kind: "secondary",
              finding:
                "Bank reply to a customer alleging a leak: the contested transactions were made with the password and ID validation, which are the customer's responsibility; the bank does not call customers to ask for data.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding:
                "Standard packages I to IV R$ 16.85, 28.95, 38.70, 57.50; TED R$ 14.10 internet, R$ 26.70 in person; page last updated 24/09/2026.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        lockIn: {
          status: "scored",
          score: 20,
          evidence:
            "The service package fee is waived only with R$ 80,000 (Conta Plus) or R$ 150,000 (Select Plus) invested at the bank, and halved with R$ 80,000 or a salary portability, under the bonus programme disclosed on 24 December 2025. 2026 complaints still describe accounts closed unilaterally 'for lack of commercial interest' (a 10 March 2026 letter, with the bank citing clause 14 of the contract), a preventive block of products on 16 January 2026 and obstructed salary portability.",
          summaryPtBr:
            "A tarifa do pacote de serviços só é zerada com R$ 80.000 (Conta Plus) ou R$ 150.000 (Select Plus) investidos no banco, e cai pela metade com R$ 80.000 ou com portabilidade de salário, conforme o programa de bonificação divulgado em 24 de dezembro de 2025. Reclamações de 2026 ainda descrevem contas encerradas pelo banco por conta própria 'por desinteresse comercial' (uma carta de 10 de março de 2026, com o banco citando a cláusula 14 do contrato), um bloqueio preventivo de produtos em 16 de janeiro de 2026 e portabilidade de salário dificultada.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/santander/encerramento-unilateral-de-conta-salario-e-dificuldade-para-receber-salario_G8b-M8HBKb55CxV3/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding: "Closure complaint.",
            },
            {
              url: "https://cms.santander.com.br/sites/WPS/documentos/Urlarq-Programa-Bonificacao-Conta-Plus-Select/25-10-01_191640_programa-bonificacao-conta-plus-select.pdf",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding: "Fee bonus programme.",
            },
            {
              url: "https://cms.santander.com.br/sites/WPS/documentos/arq-tarifas-e-pacotes-pessoa-fisica-lista3-conta-plus-select/25-12-24_140851_programa-de-bonificacao-conta-plus-e-select-3.pdf",
              kind: "primary",
              finding:
                "Bonus programme of 24 December 2025: Conta Plus package fee free from R$ 80,000 invested; Select Plus 50% off from R$ 80,000 or salary portability and free from R$ 150,000; benefits not cumulative.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.santander.com.br/select/conta/",
              kind: "primary",
              finding:
                "Select account: package R$ 99.95 a month, 50% off from R$ 80,000 and free from R$ 150,000 of eligible investments.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/santander/encerramento-unilateral-de-contas-santander-por-desinteresse-comercial_nGOXoPwTzdM090xI/",
              kind: "secondary",
              finding:
                "Complaint about a 10 March 2026 letter closing accounts unilaterally for commercial disinterest; the bank cites clause 14 of the contract and says closure is definitive.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/santander/encerramento-de-conta-dificuldades-para-receber-salario-e-impedimento-de-portabilidade-no-santander_k1iAHRzqjuKCJiAj/",
              kind: "secondary",
              finding:
                "Complaint about account closure and obstructed portability; the bank replies that closure is allowed by clause 14 and that the portability was concluded on 20 August 2025.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-11-01",
        },
      },
      accountTypes: {
        joint: {
          status: "offered",
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
            {
              url: "https://cms.santander.com.br/sites/WPS/documentos/arq-condicoes-gerais-conta-corrente/25-10-23_134811_condicoes-gerais-conta-corrente.pdf",
              kind: "primary",
              finding:
                "General terms (October 2025): joint accounts of type 'OU' (either holder) or 'E' (together); clause 2.1 movement by holders alone or together; clause 7.2 one debit card per holder.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/santander/conta-conjunta_5Gc2lV2M1dVWzGGU/",
              kind: "secondary",
              finding:
                "Santander reply: a joint account is contracted only at branches with the holders present.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        shared: {
          status: "not-found",
          evidence:
            "No shared-access product was found beyond the joint account itself and an additional credit card, which shares a card limit, not account access.",
          summaryPtBr:
            "Não foi encontrado produto de acesso compartilhado além da própria conta conjunta e de um cartão adicional, que compartilha o limite do cartão, não o acesso à conta.",
          reviewedAt: "2026-11-01",
        },
        jointInvestment: {
          status: "not-offered",
          evidence:
            "Santander's current-account terms restrict investment and financial-application information in a joint account to one holder, so the account cannot be a shared, two-person investment account.",
          summaryPtBr:
            "Os termos de conta corrente do Santander restringem a um único titular as informações de investimento ou aplicação financeira em uma conta conjunta, de modo que ela não pode ser uma conta de investimento compartilhada entre as duas pessoas.",
          citations: [
            {
              url: "https://cms.santander.com.br/sites/WPS/documentos/arq-condicoes-gerais-conta-corrente/25-11-07_143048_condicoes-gerais-conta-corrente-nov25.pdf",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Terms 1614-S06 (10/2025) clause 3.9.1: 'As informações relacionadas à Conta Conjunta serão acessadas e conhecidas por qualquer um dos titulares, com exceção de investimento ou aplicação financeira que fica restrito a um dos titulares.'",
            },
            {
              url: "https://cms.santander.com.br/sites/WPS/documentos/arq-condicoes-gerais-conta-corrente/25-10-23_134811_condicoes-gerais-conta-corrente.pdf",
              kind: "primary",
              finding:
                "General terms (October 2025) clause 3.9.1: joint-account information is visible to every holder except investments and financial applications, which stay restricted to one holder.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        mei: {
          status: "offered",
          conditionPtBr: "R$ 69, isentável",
          evidence:
            "Conta MEI+ is opened in the app or site without a branch, with a monthly fee of R$ 69,00 that is fully waived by paying the DAS through automatic debit in a Santander Empresas account, or by combining the CNPJ as a Pix key plus 5 payments a month (50%) with R$ 1.000/month billed on a Getnet card machine (50%).",
          summaryPtBr:
            "A Conta MEI+ é aberta no app ou no site, sem agência, com mensalidade de R$ 69,00 totalmente isenta ao pagar o DAS em débito automático em uma conta Santander Empresas, ou ao combinar o CNPJ como chave Pix mais 5 pagamentos por mês (50%) com R$ 1.000 por mês faturados em uma maquininha Getnet (50%).",
          citations: [
            {
              url: "https://www.santander.com.br/empresas/contas/mei/",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Conta MEI+ opened via app/site; R$ 69,00 monthly fee, waivable 100% under Pix-key, payments and Getnet criteria.",
            },
            {
              url: "https://www.santander.com.br/conta-pessoa-juridica/mei",
              kind: "primary",
              finding:
                "Conta MEI+: R$ 69,00 monthly fee, 100% waived by DAS in automatic debit; opened 100% online with the CNPJ and a selfie.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.santander.com.br/pacotes-servicos-santander-pj/conta-mei",
              kind: "primary",
              finding:
                "MEI+ package: DAS in automatic debit gives 100% exemption, or Pix key plus 5 payments (50%) and R$ 1,000 on Getnet (50%); the discount applies two months after the activity.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding: "C6 Carbon.",
            },
            {
              url: "https://www.mobills.com.br/blog/cartao-de-credito/cartao-c6-carbon/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding: "C6 Carbon.",
            },
            {
              url: "https://www.c6bank.com.br/cartao-c6-carbon-mastercard-black/",
              kind: "primary",
              finding:
                "C6 Carbon: annuity R$ 98 a month, waived by spend or investment criteria; up to 1.7% cashback and up to 3.5 points per US$; points do not expire.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.melhorescartoes.com.br/c6-bank-oferece-anuidade-gratis-c6-carbon-jul26.html",
              kind: "secondary",
              finding:
                "C6 Carbon: waiver at R$ 8,000 of spend or R$ 50,000 invested; 4 free DragonPass visits a year.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        investmentAccess: {
          status: "scored",
          score: 80,
          evidence:
            "C6 Invest in the same app: CDB from R$ 20 (CDI-linked, prefixed, IPCA+), Letras Financeiras, repurchase agreements, Tesouro Direto from R$ 30 with no brokerage, more than 250 funds from R$ 1, shares, FIIs, ETFs, BDRs and futures with zero brokerage and custody, private pension, and C6 Global Invest for US shares, ETFs, REITs and time deposits. C6 charges no custody fee on fixed income.",
          summaryPtBr:
            "C6 Invest no mesmo app: CDB a partir de R$ 20 (pós-fixado, prefixado e IPCA+), Letras Financeiras, compromissadas, Tesouro Direto a partir de R$ 30 sem corretagem, mais de 250 fundos a partir de R$ 1, ações, FIIs, ETFs, BDRs e mercado futuro com corretagem e custódia zero, previdência privada e o C6 Global Invest para ações americanas, ETFs, REITs e time deposits. O C6 não cobra taxa de custódia na renda fixa.",
          citations: [
            {
              url: "https://www.c6bank.com.br/c6-invest/renda-fixa/",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding: "Fixed income page.",
            },
            {
              url: "https://www.c6bank.com.br/c6-invest/",
              kind: "primary",
              finding:
                "C6 Invest brings shares, funds, CDBs, Tesouro Direto and private pension into one app; no custody fee on fixed income and zero brokerage and custody on equities.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.c6bank.com.br/tesouro-direto/",
              kind: "primary",
              finding: "Tesouro Direto from R$ 30 with no brokerage in the C6 app.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.c6bank.com.br/blog/c6-bank-amplia-horario-para-aplicacao-e-resgate-de-cdbs",
              kind: "primary",
              finding:
                "More than 250 funds in several categories, equities (shares, ETFs, BDRs, FIIs, futures) and private pension on the C6 platform.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.c6bank.com.br/home/",
              kind: "primary",
              finding:
                "C6 Global Invest: US shares, ADRs, ETFs, REITs, treasuries and time deposits through the app.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        appQuality: {
          status: "insufficient-evidence",
          reason:
            "No rating figure could be read for the C6 Bank app: the App Store and Google Play listings show descriptions and reviews but no rating to automated reads, and earlier sources disagreed (Google Play 4.8 versus 3.6).",
          summaryPtBr:
            "Não há evidência suficiente. Nenhuma nota do app do C6 Bank pôde ser lida: as páginas da App Store e do Google Play mostram descrições e avaliações, mas nenhuma nota em leituras automáticas, e fontes anteriores divergiam (Google Play 4,8 contra 3,6).",
          reviewedAt: "2026-11-01",
          citations: [
            {
              url: "https://apps.apple.com/br/app/c6-bank-cart%C3%A3o-conta-e-mais/id1463463143",
              kind: "secondary",
              finding:
                "App Store listing read again: description and update notes, no rating figure to automated reads.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://play.google.com/store/apps/details?id=com.c6bank.app&hl=en_US",
              kind: "secondary",
              finding:
                "Google Play listing read again: description only, no rating figure to automated reads.",
              checkedAt: "2026-11-01",
            },
          ],
        },
        security: {
          status: "scored",
          score: 80,
          evidence:
            "New devices need password plus facial recognition, and the app disables itself on a device if another face is detected; hardware-bound in-app token; Locais Seguros and Contatos Seguros limit investments and night transfers to registered places and contacts; facial biometrics with liveness at account opening. A secondary article (undated in the excerpt read) reports a fraud that diverted R$ 23 million through a flaw in the investments system, schemes by third-party contractor staff and a hacked Twitter profile; the score stays at 80 because no dated or primary source confirms them, unlike the confirmed incidents that put BTG at 60.",
          summaryPtBr:
            "Dispositivos novos exigem senha e reconhecimento facial, e o app se desativa no aparelho se outro rosto for detectado; o token dentro do app é vinculado ao hardware; Locais Seguros e Contatos Seguros limitam investimentos e transferências noturnas a locais e contatos cadastrados; a biometria facial com prova de vida é usada na abertura da conta. Uma reportagem secundária (sem data no trecho lido) relata uma fraude que desviou R$ 23 milhões por uma falha no sistema de investimentos, esquemas de funcionários de terceirizadas e um perfil do Twitter invadido; a nota continua 80 porque nenhuma fonte primária ou datada confirma esses casos, ao contrário dos incidentes confirmados que levaram o BTG a 60.",
          citations: [
            {
              url: "https://www.c6bank.com.br/blog/6-recursos-de-seguranca-que-o-c6-bank-usa-para-proteger-o-cliente",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding: "Security features.",
            },
            {
              url: "https://www.c6bank.com.br/portal-de-seguranca/",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding: "Security portal.",
            },
            {
              url: "https://www.c6bank.com.br/blog/recursos-de-seguranca-do-c6-bank",
              kind: "primary",
              finding:
                "Locais Seguros, Contatos Seguros, geolocation sharing, card block and contactless toggle in the app.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://tecnoblog.net/noticias/em-meio-a-criticas-c6-bank-lista-recursos-de-seguranca-para-clientes/",
              kind: "secondary",
              finding:
                "Tecnoblog (undated in the excerpt): reports a R$ 23 million fraud through a flaw in the investments system, contractor-staff schemes with more than R$ 50 million diverted and a hacked Twitter profile, alongside the bank's list of security features.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding:
                "TED R$ 4.00; basic national and international card annuity R$ 98.00, listed with a periodicity of every 30 days; page last updated 15/10/2026.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        lockIn: {
          status: "scored",
          score: 60,
          evidence:
            "Card annuity waiver tied to use of the card or investments made through the app (R$ 50,000 in C6 CDBs in the earlier read). Night Pix limit R$ 1,000 per transaction, the night start can move between 20h and 23h30, and a limit increase is applied only after 24 hours (10h of the next business day if asked on a Friday, Saturday or holiday eve). Daily-liquidity CDB redeems in the app on business days 07:30 to 19:00, while the Limite Garantido CDB credits in 2 business days.",
          summaryPtBr:
            "A isenção da anuidade do cartão depende de uso do cartão ou de investimentos feitos pelo app (R$ 50.000 em CDBs do C6 na leitura anterior). Limite do Pix noturno de R$ 1.000 por transação, com início do período noturno ajustável entre 20h e 23h30, e o aumento do limite só vale depois de 24 horas (10h do próximo dia útil se pedido em sexta, sábado ou véspera de feriado). O CDB de liquidez diária é resgatado no app em dias úteis, das 7h30 às 19h, e o CDB Limite Garantido credita em 2 dias úteis.",
          citations: [
            {
              url: "https://seucreditodigital.com.br/c6-bank-aumenta-remuneracao-do-cdb-liquidez-diaria-confira-quanto/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "CDB redemption rules.",
            },
            {
              url: "https://www.c6bank.com.br/blog/o-que-e-o-horario-noturno-e-como-ajustar",
              kind: "primary",
              finding:
                "Night default R$ 1,000 per transaction for Pix, TED and TEF; the night start can be set between 20h and 23h30, the end stays at 6h.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.c6bank.com.br/blog/limite-de-transferencia-como-ajustar-no-c6-bank",
              kind: "primary",
              finding:
                "Limit increases take 24 hours (10h next business day from Friday, Saturday or holiday eve), a Central Bank requirement.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.c6bank.com.br/c6-invest/renda-fixa/",
              kind: "primary",
              finding:
                "Daily-liquidity CDB redeems in the app with same-day credit, 07:30 to 19:00 on business days; Limite Garantido takes 2 business days; prefixed and IPCA+ CDBs have no early redemption.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.c6bank.com.br/limite-garantido/",
              kind: "primary",
              finding:
                "Limite Garantido CDB: redemption 07:30 to 19:00 on business days, paid within 2 business days, only if not committed to card spending.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-11-01",
        },
      },
      accountTypes: {
        joint: {
          status: "not-offered",
          evidence:
            "C6 has no joint account, as its own blog states, offering Conta Compartilhada instead.",
          summaryPtBr:
            "Como diz o próprio blog, o C6 não tem conta conjunta. Oferece no lugar a Conta Compartilhada.",
          citations: [
            {
              url: "https://www.c6bank.com.br/blog/conta-conjunta",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Fetch blocked (403); search snippet: C6 has no conta conjunta, offers conta compartilhada; transactions made in the titular's name; invitee must be a C6 client.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        shared: {
          status: "offered",
          conditionPtBr: "uma pessoa convidada",
          evidence:
            "C6 offers Conta Compartilhada: the holder invites one other C6 client as a procurador who moves the account independently from their own login, without becoming a co-holder. The product is subject to the bank's analysis and is not available to every account.",
          summaryPtBr:
            "O C6 oferece a Conta Compartilhada: o titular convida outro cliente do C6 como procurador, que movimenta a conta de forma independente, com o próprio login, sem se tornar cotitular. O produto está sujeito à análise do banco e não está disponível para todas as contas.",
          citations: [
            {
              url: "https://ajuda.c6bank.com.br/s/article/O-que-%C3%A9-conta-compartilhada",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "'A Conta Compartilhada é quando uma pessoa física compartilha sua conta corrente com uma outra pessoa... convidado, com poderes de procurador... movimentação de crédito, débito... de forma independente.'",
            },
            {
              url: "https://www.c6bank.com.br/blog/conta-conjunta",
              kind: "primary",
              finding:
                "C6 blog: no joint account, but Conta Compartilhada (subject to analysis) lets the holder invite another C6 client to move money independently.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/c6-bank/dificuldade-em-abrir-conta-conjunta-no-c6-bank_gE07vmJZnqnGUI6g/",
              kind: "secondary",
              finding:
                "C6 reply: the shared-account feature is not eligible for every customer's registration.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        jointInvestment: {
          status: "not-found",
          evidence: "No source was found describing a joint investment account at C6.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta no C6.",
          reviewedAt: "2026-11-01",
        },
        mei: {
          status: "offered",
          conditionPtBr: "R$ 12, isentável",
          evidence:
            "C6 MEI costs R$ 12/month, waivable by receiving R$ 500 via Pix, keeping R$ 3.000 in C6 CDBs, R$ 1.000 in card spend, or keeping CNPJ and phone as Pix keys.",
          summaryPtBr:
            "A conta C6 MEI custa R$ 12 por mês, isentável ao receber R$ 500 via Pix, manter R$ 3.000 em CDBs do C6, R$ 1.000 em gastos no cartão, ou manter o CNPJ e o telefone como chaves Pix.",
          citations: [
            {
              url: "https://ajuda.c6bank.com.br/s/article/%C3%89-poss%C3%ADvel-ser-isento-da-tarifa-da-conta-C6-MEI",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "MEI R$ 12/month with waiver criteria (Pix receipts, investments, card spend, Pix keys, etc.).",
            },
            {
              url: "https://www.c6bank.com.br/blog/tipos-de-conta-c6-bank",
              kind: "primary",
              finding:
                "C6 MEI: R$ 12 monthly fee unless exemption criteria are met, such as Pix receipts, card spend, R$ 500 in Limite Garantido or R$ 3,000 in other C6 CDBs.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.c6bank.com.br/blog/como-abrir-uma-conta-mei-no-c6-bank",
              kind: "primary",
              finding:
                "C6 MEI account opened in the app; R$ 12 monthly fee charged only when exemption criteria are not met.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
            "BTG Black is modular: a R$ 30 monthly base, plus R$ 20 for cashback (1% of the invoice) or R$ 50 for points (up to 2.2 per US$), plus R$ 40 per benefit module; the Travel module adds 4 free DragonPass lounge visits and IOF zero on international purchases (an indefinite campaign that can end without notice). The fee falls R$ 10 for every R$ 10,000 invested or R$ 1,000 spent in the month, whichever discount is larger, so the cashback variant (R$ 50) is waived at R$ 50,000 invested or R$ 5,000 of monthly spend. The Ultrablue costs R$ 400 a month, waived above R$ 400,000 invested. This replaces the earlier waiver description (R$ 120,000 invested).",
          summaryPtBr:
            "O BTG Black é modular: base de R$ 30 por mês, mais R$ 20 para cashback (1% da fatura) ou R$ 50 para pontos (até 2,2 por US$), mais R$ 40 por módulo de benefícios. O módulo Viagem acrescenta 4 acessos gratuitos a salas VIP DragonPass e IOF zero em compras internacionais (campanha por tempo indeterminado, que pode acabar sem aviso). A mensalidade cai R$ 10 a cada R$ 10.000 investidos ou R$ 1.000 gastos no mês, valendo o maior desconto, então a versão com cashback (R$ 50) fica isenta com R$ 50.000 investidos ou R$ 5.000 de gastos por mês. O Ultrablue custa R$ 400 por mês, isento acima de R$ 400.000 investidos. Isso substitui a descrição anterior da isenção (R$ 120.000 investidos).",
          citations: [
            {
              url: "https://www.idinheiro.com.br/cartao-de-credito/cartao-black-btg-pactual/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "BTG Black: 1% cashback or 2.2 points per US$, with fee discounts through investments or spend (page updated 18/06/2025).",
            },
            {
              url: "https://renovainvest.com.br/blog/cartao-black-btg-pactual/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "Reseller page still says 4 LoungeKey visits and 3.28% cashback on international purchases; BTG's own page now says DragonPass and IOF zero.",
            },
            {
              url: "https://banking.btgpactual.com/cartao-de-credito/cartao-black",
              kind: "primary",
              finding:
                "Black: 1% cashback or up to 2.2 points per US$; R$ 10 off the fee per R$ 10,000 invested or R$ 1,000 spent; Travel module with 4 DragonPass visits and IOF zero.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://banking.btgpactual.com/assets/files/tabela-de-tarifas.pdf?v=1",
              kind: "primary",
              finding: "August 2026 tariff table: progressive fee discount by spend or investment.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://altarendablog.com.br/2026/09/20/%F0%9F%92%B3-btg-pactual-veja-as-tarifas-anuidades-e-beneficios-de-cada-cartao-em-setembro-de-2026/",
              kind: "secondary",
              finding: "Ultrablue R$ 400 a month, waived above R$ 400,000 invested.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        investmentAccess: {
          status: "scored",
          score: 100,
          evidence:
            "Investment bank at the core. The BTG Pactual Investimentos app offers Tesouro Direto, CDBs and other fixed income with several issuers and indexers, funds (fixed income, equities, FX, multimarket), shares, FIIs, FX and private pension; its Google Play listing advertises zero brokerage on shares, FIIs and BDRs, while secondary guides still describe a brokerage table, and most fixed income starts at R$ 1,000 against R$ 1 for funds.",
          summaryPtBr:
            "Banco de investimentos no centro do negócio. O app BTG Pactual Investimentos oferece Tesouro Direto, CDBs e outros papéis de renda fixa com vários emissores e indexadores, fundos (renda fixa, ações, câmbio e multimercado), ações, FIIs, câmbio e previdência privada; a página do Google Play anuncia corretagem zero em ações, FIIs e BDRs, enquanto guias secundários ainda descrevem uma tabela de corretagem, e a maior parte da renda fixa começa em R$ 1.000, contra R$ 1 nos fundos.",
          citations: [
            {
              url: "https://play.google.com/store/apps/details?id=com.btg.pactual.digital.mobile",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding: "App description.",
            },
            {
              url: "https://apps.apple.com/br/app/btg-pactual-investimentos/id1041958375",
              kind: "primary",
              finding:
                "App Store description: Tesouro, CDBs, funds, shares, FIIs, FX and private pension in the BTG Pactual Investimentos app, with advisers.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://play.google.com/store/apps/details?id=com.btg.pactual.digital.mobile&hl=en_US",
              kind: "primary",
              finding:
                "Google Play description: zero brokerage on shares, FIIs and BDRs, recommended portfolios, loans with investment collateral.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.idinheiro.com.br/investimentos/btg-pactual-como-investir/",
              kind: "secondary",
              finding:
                "Guide: funds from R$ 1, most fixed income from R$ 1,000, shares with a brokerage fee (R$ 4.50 in the guide) plus B3 costs.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        appQuality: {
          status: "insufficient-evidence",
          reason:
            "No rating figure could be read: the BTG Pactual Banking and BTG Pactual Investimentos listings on both stores show descriptions and reviews but no rating to automated reads, the earlier single snippet (4.7 App Store, 4.6 Google Play) was not confirmed, and BTG splits across separate Banking, Investimentos and Trader apps.",
          summaryPtBr:
            "Não há evidência suficiente. Nenhuma nota pôde ser lida: as páginas do BTG Pactual Banking e do BTG Pactual Investimentos nas duas lojas mostram descrições e avaliações, mas nenhuma nota em leituras automáticas, o trecho de busca anterior (4,7 na App Store, 4,6 no Google Play) não foi confirmado, e o BTG se divide em apps separados de Banking, Investimentos e Trader.",
          reviewedAt: "2026-11-01",
          citations: [
            {
              url: "https://play.google.com/store/apps/details?id=com.btg.pactual.banking&hl=en_US",
              kind: "secondary",
              finding:
                "BTG Pactual Banking Google Play listing: description and user reviews (including false root detection complaints), no rating figure to automated reads.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://apps.apple.com/us/app/btg-pactual-banking/id1467956990",
              kind: "secondary",
              finding:
                "BTG Pactual Banking App Store listing: description only, no rating figure to automated reads.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://play.google.com/store/apps/details?id=com.btg.pactual.homebroker.mobile&hl=en_US",
              kind: "secondary",
              finding: "BTG Pactual Trader listing: the bank says it keeps separate apps for now.",
              checkedAt: "2026-11-01",
            },
          ],
        },
        security: {
          status: "scored",
          score: 60,
          evidence:
            "BTG's help pages describe a one-time token bound to the device, a facial or fingerprint biometric check on top of login and password, a selfie registered at account opening that is independent of the device, notices when a new device accesses the account, and a safe-place mode for the investments menu. Confirmed incidents: the Central Bank reported a leak of registration data tied to 8,032 Pix keys between 23 July and 5 August 2024 (BTG says its systems were not breached and only agency and account data appeared in CPF-based queries), and on Sunday 22 March 2026 a cyber attack diverted about R$ 100 million from the bank, with Pix suspended for a day; BTG says no customer account was accessed and no customer data was exposed. The score reflects documented controls with confirmed incidents.",
          summaryPtBr:
            "As páginas de ajuda do BTG descrevem um token de uso único vinculado ao aparelho, uma checagem de biometria facial ou digital além de login e senha, uma selfie cadastrada na abertura da conta e independente do aparelho, avisos quando um novo aparelho acessa a conta e um modo lugar seguro para o menu de investimentos. Incidentes confirmados: o Banco Central divulgou um vazamento de dados cadastrais ligados a 8.032 chaves Pix entre 23 de julho e 5 de agosto de 2024 (o BTG diz que seus sistemas não foram invadidos e que só apareceram dados de agência e conta em consultas feitas com CPFs), e em domingo, 22 de março de 2026, um ataque cibernético desviou cerca de R$ 100 milhões do banco, com o Pix suspenso por um dia; o BTG diz que nenhuma conta de cliente foi acessada e nenhum dado de cliente foi exposto. A nota reflete controles documentados com incidentes confirmados.",
          citations: [
            {
              url: "https://banking.btgpactual.com/ajuda/acessoaconta/seguranca",
              kind: "primary",
              finding:
                "Help page: besides login and password the device needs the token active, and the app still requires a facial or fingerprint validation; a notification is sent whenever a new device accesses the account.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://empresas.btgpactual.com/seguranca",
              kind: "primary",
              finding:
                "BTG Empresas security page: one-time token bound to authorised devices; a selfie registered at opening, independent of the device, validates sensitive operations.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://banking.btgpactual.com/",
              kind: "primary",
              finding:
                "BTG Banking page: access with facial recognition or fingerprint, a safe-place mode for the investments menu, a virtual card with a dynamic security code.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://canaltech.com.br/seguranca/bc-notifica-vazamento-de-dados-de-8-mil-chaves-pix-do-btg-pactual/",
              kind: "secondary",
              finding:
                "Central Bank notice of registration data tied to about 8,000 Pix keys; BTG says CPF-based queries showed only agency and account data and that no system was breached.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.cnnbrasil.com.br/economia/macroeconomia/vazamento-de-dados-de-pix-notificacoes-do-bc-subiram-de-1-para-10-em-2024/",
              kind: "secondary",
              finding:
                "Central Bank 2024 list: 8,032 Pix keys at BTG Pactual between 23 July and 5 August 2024.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://seucreditodigital.com.br/ataque-hacker-atinge-btg/",
              kind: "secondary",
              finding:
                "Hacker attack on BTG on Sunday the 22nd diverted about R$ 100 million from the bank; Pix was suspended; the bank says no customer account access or personal data exposure.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.cnnbrasil.com.br/economia/macroeconomia/btg-pactual-suspende-operacoes-pix-apos-verificar-atividades-atipicas/",
              kind: "secondary",
              finding:
                "BTG suspended Pix operations as a precaution after atypical activity; the bank says no customer account was accessed and no customer data was exposed.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding:
                "14 items reported, all R$ 0.00 except administrative cheque R$ 40.00; no packages or annuity listed; page last updated 22/07/2026.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        lockIn: {
          status: "scored",
          score: 40,
          evidence:
            "Card fee discounts scale with relationship: R$ 10 off per R$ 10,000 invested or R$ 1,000 of monthly spend, with the cashback Black fee reaching zero at R$ 50,000 invested or R$ 5,000 of spend, so the earlier single R$ 120,000 threshold no longer describes the card. The account has no maintenance fee; Pix limits are customised in the app with increases analysed within about 4 hours, the night limit follows the R$ 1,000 default with one 2026 complaint about a refused increase, and salary portability to BTG is offered. No closure friction evidence was gathered.",
          summaryPtBr:
            "Os descontos na mensalidade do cartão crescem com o relacionamento: R$ 10 de desconto a cada R$ 10.000 investidos ou R$ 1.000 de gasto mensal, e a mensalidade do Black com cashback chega a zero com R$ 50.000 investidos ou R$ 5.000 de gastos, então o patamar único anterior de R$ 120.000 não descreve mais o cartão. A conta não tem tarifa de manutenção; os limites do Pix são personalizados no app, com aumentos analisados em cerca de 4 horas, o limite noturno segue o padrão de R$ 1.000, com uma reclamação de 2026 sobre aumento recusado, e a portabilidade de salário para o BTG é oferecida. Não foram levantadas evidências de dificuldade para encerrar a conta.",
          citations: [
            {
              url: "https://www.idinheiro.com.br/cartao-de-credito/cartao-black-btg-pactual/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Waiver conditions.",
            },
            {
              url: "https://banking.btgpactual.com/cartao-de-credito/cartao-black",
              kind: "primary",
              finding:
                "Black card modular fee: discount of R$ 10 per R$ 10,000 invested or R$ 1,000 spent monthly; Black with cashback goes to zero with R$ 50,000 invested or R$ 5,000 spend.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://exame.com/invest/btg-insights/mensalidade-zero-com-r-50-mil-investidos-como-funciona-o-black-com-cashback-do-btg-pactual/",
              kind: "secondary",
              finding:
                "Exame: zero monthly fee with R$ 50,000 invested on the Black with cashback.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://banking.btgpactual.com/ajuda/contacorrente/limitesdetransferencia",
              kind: "primary",
              finding:
                "Help page: transfer limits are customised by each client in the Central de segurança of the app.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/btg-mais/mentiras-e-enrolacoes-sobre-aumento-do-pix-noturno_M_RuDqP0_TCI5FfC/",
              kind: "secondary",
              finding:
                "Complaint and BTG reply: the night Pix limit is R$ 1,000 by Central Bank rule and the bank analyses increases by risk profile.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/btg-mais/btg-tira-meu-limite-de-pix_LfPA0kzglfDc-WHQ/",
              kind: "secondary",
              finding:
                "BTG reply: Pix limit changes are made in the app (Meus limites da conta > Pix) and analysed in up to 4 hours.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://banking.btgpactual.com/",
              kind: "primary",
              finding:
                "BTG Banking page: current account with no opening or maintenance fee, 4 free withdrawals a month, free and unlimited Pix and transfers.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        publicReviews: {
          status: "scored",
          score: 85,
          evidence:
            "Reclame Aqui is split by entity. BTG Pactual Banking, the banking entity, shows 8.5/10 over the last six months (a sibling listing page showed 8.4), a consumer average of 7.47 over 838 rated complaints, 75% would do business again and 88.3% resolved; BTG Pactual Investimentos shows 8.6/10 with maximum reputation. The earlier score of 74 followed the banking consumer average (7.39); it now follows the six-month reputation of the banking entity, as for the other banks.",
          summaryPtBr:
            "O Reclame Aqui separa por empresa. O BTG Pactual Banking, a entidade bancária, mostra 8,5/10 nos últimos seis meses (uma página de listagem vizinha mostrou 8,4), nota média dos consumidores de 7,47 em 838 reclamações avaliadas, 75% voltariam a fazer negócio e 88,3% de solução. O BTG Pactual Investimentos mostra 8,6/10, com reputação máxima. A nota anterior de 74 seguia a nota média dos consumidores do banking (7,39); agora ela segue a reputação dos últimos seis meses da entidade bancária, como nos demais bancos.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/btg-mais/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "Reclame Aqui page read through a search-engine snippet (the site refuses automated reads): BTG Pactual Banking 8.5/10 over the last six months; consumer average 7.47, 75% would do business again, 88.3% resolved.",
            },
            {
              url: "https://www.reclameaqui.com.br/empresa/btg-pactual-digital/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "Reclame Aqui page read through a search-engine snippet (the site refuses automated reads): BTG Pactual Investimentos 8.6/10, maximum reputation.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
      },
      accountTypes: {
        joint: {
          status: "not-offered",
          evidence:
            "BTG Pactual Banking's FAQ says a joint current account 'não é possível' and offers Conta Compartilhada instead; a 2026 BTG reply to a customer repeats that all accounts are individual and tied to a single CPF, and the help page stresses that a joint account would involve co-ownership.",
          summaryPtBr:
            "O FAQ do BTG Pactual Banking diz que conta corrente conjunta 'não é possível' e oferece a Conta Compartilhada em seu lugar; uma resposta do BTG a um cliente em 2026 repete que todas as contas são individuais e vinculadas a um único CPF, e a página de ajuda ressalta que uma conta conjunta envolveria cotitularidade.",
          citations: [
            {
              url: "https://banking.btgpactual.com/services/api/faq",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "'Por enquanto, não é possível abrir uma conta conjunta pelo BTG Pactual Banking'; Conta Compartilhada gives an invited representative full access except Investments and Financing, not co-ownership.",
            },
            {
              url: "https://banking.btgpactual.com/ajuda/contacorrente/contacompartilhada",
              kind: "primary",
              finding:
                "Help page: Conta Compartilhada lets one person grant another access without co-ownership, unlike a joint account that involves co-ownership; the account remains the holder's legal responsibility.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/btg-mais/impossibilidade-de-abertura-de-conta-para-acesso-a-investimentos-conjuntos_7ZTxikPe82qwYkD4/",
              kind: "secondary",
              finding:
                "BTG reply: the bank does not offer a joint account; all accounts are individual and tied exclusively to the holder's CPF.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        shared: {
          status: "offered",
          conditionPtBr: "sem acesso aos investimentos",
          evidence:
            "BTG offers Conta Compartilhada: the holder invites one other BTG client as a representative who switches into the account from their own login with full access except Investments and Financing, without co-ownership.",
          summaryPtBr:
            "O BTG oferece a Conta Compartilhada: o titular convida outro cliente do BTG como representante, que entra na conta com o próprio login e tem acesso total, exceto a Investimentos e Financiamentos, sem ser cotitular.",
          citations: [
            {
              url: "https://banking.btgpactual.com/services/api/faq",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Representative has full access except Investments/Financing menus; not co-ownership; invite flow by CPF, name, email, phone; either side can revoke at any time.",
            },
            {
              url: "https://banking.btgpactual.com/ajuda/contacorrente/contacompartilhada",
              kind: "primary",
              finding:
                "Help page: the invited representative can query the holder's account and perform various functions; the holder cannot access the representative's account unless invited in turn; access can be deactivated in the app.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        jointInvestment: {
          status: "not-offered",
          evidence:
            "BTG told a customer that it does not offer a joint account and that all accounts are individual and tied to the holder's CPF, which it applied to a request for joint access to investments; a secondary guide dated September 2025 also says there is no joint BTG Investimentos account. A separate older complaint shows a customer who asked for a joint investment account at BTG Pactual Investimentos and waited for weeks, so legacy or adviser-assisted cases cannot be ruled out.",
          summaryPtBr:
            "O BTG disse a um cliente que não oferece conta conjunta e que todas as contas são individuais e vinculadas ao CPF do titular, o que aplicou a um pedido de acesso conjunto a investimentos; um guia secundário de setembro de 2025 também diz que não existe conta conjunta no BTG Investimentos. Uma reclamação separada e mais antiga mostra um cliente que pediu uma conta de investimento conjunta no BTG Pactual Investimentos e esperou semanas, então casos antigos ou via assessor não podem ser descartados.",
          citations: [
            {
              url: "https://guiadoinvestidor.com.br/guias/conta-conjunta-btg-pactual/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "Guide dated 2025-09-23: no traditional joint account; Conta Compartilhada; no joint investment account ('No momento, a resposta é não').",
            },
            {
              url: "https://www.reclameaqui.com.br/btg-mais/impossibilidade-de-abertura-de-conta-para-acesso-a-investimentos-conjuntos_7ZTxikPe82qwYkD4/",
              kind: "secondary",
              finding:
                "BTG reply to a customer who wanted joint access to investments: no joint account is offered, all accounts are individual and tied to the holder's CPF.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/btg-pactual-digital/abertura-de-conta-conjunta_UHWljBD32gqOd3S_/",
              kind: "secondary",
              finding:
                "Older complaint: a customer waited almost a month for a joint investment account at BTG Pactual Investimentos, which the bank said was in internal security verification.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        mei: {
          status: "offered",
          evidence:
            "BTG Pactual Empresas is 'disponível para todos os tipos de empresas (MEI, LTDA, S.A. e outros)', with zero maintenance fee and unlimited free Pix.",
          summaryPtBr:
            "A BTG Pactual Empresas está 'disponível para todos os tipos de empresas (MEI, LTDA, S.A. e outros)', com tarifa zero de manutenção e Pix ilimitado grátis.",
          citations: [
            {
              url: "https://www.btgpactual.com/empresas",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Conta Digital PJ 'livre de taxas', available to MEI, LTDA, S.A.; 'Tarifa zero de manutenção'; FAQ confirms MEI and 'isenta de tarifas de manutenção'.",
            },
            {
              url: "https://play.google.com/store/apps/details?id=com.btg.business&hl=en_US",
              kind: "primary",
              finding:
                "BTG Pactual Empresas app: free digital business account with 100% online management; Pix, TEDs and boletos at no additional cost.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
            "XP Visa Infinite has a zero annuity and no spend requirement for the card itself. The reward is chosen in the app: Investback of up to 2% or points of up to 2.2 per US$ (up to 3 with salary portability), transferable to Livelo. The 4 yearly DragonPass lounge visits need R$ 3,000 of spend on the previous invoice or R$ 300,000 invested; the lighter XP One card needs R$ 5,000 invested and gives 2 visits.",
          summaryPtBr:
            "O XP Visa Infinite tem anuidade zero e não exige gasto mínimo para manter o cartão. A recompensa é escolhida no app: Investback de até 2% ou pontos de até 2,2 por US$ (até 3 com portabilidade de salário), transferíveis para a Livelo. Os 4 acessos anuais a salas VIP DragonPass exigem R$ 3.000 de gastos na fatura anterior ou R$ 300.000 investidos; o cartão XP One, mais simples, exige R$ 5.000 investidos e dá 2 acessos.",
          citations: [
            {
              url: "https://www.melhorescartoes.com.br/cartao-xp-visa-infinite.html",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "No annuity; reward choice of points (2.2 up to 3 per US$) or Investback; 4 DragonPass visits with a R$ 3,000 spend or R$ 300,000 invested requirement.",
            },
            {
              url: "https://altarendablog.com.br/2026/08/02/xp-visa-infinite-mantem-beneficios-em-2026-dragonpass-investback-pontos-turbinados-e-anuidade-zero/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "2026 benefits: zero annuity, Investback up to 2% or up to 2.2 points per US$, lounge access.",
            },
            {
              url: "https://altarendablog.com.br/2026/10/26/mudou-tudo-nos-cartoes-xp-infinite-chega-a-3-pontos-por-dolar-e-one-comeca-com-r-5-mil-investidos/",
              kind: "secondary",
              finding:
                "Infinite up to 3 points per US$ with salary portability; One from R$ 5,000 invested; both with zero annuity; points convert to Investback after 24 months unused.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding:
                "XP platform: shares, CDB, LCA and LCI, COE, CRI and CRA, funds, futures, Tesouro and more in one account.",
            },
            {
              url: "https://www.xpi.com.br/produtos/",
              kind: "primary",
              finding:
                "XP products page: real estate funds, futures, public offers and structured strategies alongside fixed income and equities.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://guiadoinvestidor.com.br/guias/corretoras/xp-investimentos/",
              kind: "secondary",
              finding:
                "Guide: no fee for account opening or maintenance, custody, COE or transfers; XP waives its own Tesouro Direto fee; brokerage on shares varies by segment and campaign.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        appQuality: {
          status: "insufficient-evidence",
          reason:
            "No rating figure could be read: the XP Investimentos, XP Trader and XP Empresas listings on both stores show descriptions and reviews but no rating to automated reads, and XP splits across several apps.",
          summaryPtBr:
            "Não há evidência suficiente. Nenhuma nota pôde ser lida: as páginas do XP Investimentos, do XP Trader e do XP Empresas nas duas lojas mostram descrições e avaliações, mas nenhuma nota em leituras automáticas, e a XP se divide em vários apps.",
          reviewedAt: "2026-11-01",
          citations: [
            {
              url: "https://apps.apple.com/br/app/xp-investimentos/id1300713021",
              kind: "secondary",
              finding:
                "App Store listing for the XP app read: no rating figure to automated reads.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://play.google.com/store/apps/details?id=br.com.xp.carteira&hl=en_US",
              kind: "secondary",
              finding:
                "Google Play listing for the XP app read: new-app description, no rating figure to automated reads.",
              checkedAt: "2026-11-01",
            },
          ],
        },
        security: {
          status: "scored",
          score: 40,
          evidence:
            "Confirmed leak: on 22 March 2025 a database hosted at an external XP supplier was accessed without authorisation, exposing customers' registration data (name, phone, email, birth date, postcode, marital status, gender, job title, nationality) and their XP account number, balance, position, adviser name and credit limit for March; XP says no password, electronic signature, biometrics, CPF or document was reached, no account was accessed and no transaction was made, and the Clear brokerage was also notified. XP's security page describes device authorisation by a security token with facial validation or SMS token, personalised Pix and TED limits, alerts on suspected scams and temporary cards.",
          summaryPtBr:
            "Vazamento confirmado: em 22 de março de 2025, uma base de dados hospedada em um fornecedor externo da XP teve acesso não autorizado, expondo dados cadastrais dos clientes (nome, telefone, e-mail, data de nascimento, CEP, estado civil, gênero, cargo, nacionalidade) e o número da conta na XP, o saldo, a posição, o nome do assessor e o limite de crédito de março; a XP diz que nenhuma senha, assinatura eletrônica, biometria, CPF ou documento foi alcançado, que nenhuma conta foi acessada e que nenhuma operação foi feita, e a corretora Clear também avisou seus clientes. A página de segurança da XP descreve a autorização do aparelho por token de segurança com validação facial ou token por SMS, limites de Pix e TED personalizáveis, alertas de suspeita de golpe e cartões temporários.",
          citations: [
            {
              url: "https://lps.xpi.com.br/seguranca-xp/",
              kind: "primary",
              finding:
                "XP security page: device authorised through a security token with facial validation or SMS token; customisable Pix and TED limits; alerts on suspected scams; temporary cards.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://canaltech.com.br/seguranca/xp-comunica-vazamento-de-dados-incluindo-saldo-da-conta-aos-clientes/",
              kind: "secondary",
              finding:
                "XP notified customers (and Clear customers) of unauthorised access to a database at an external supplier on 22 March 2025, exposing account number, balance, credit limit and registration data; no accounts accessed.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.cnnbrasil.com.br/economia/macroeconomia/xp-informa-acesso-indevido-a-dados-de-clientes/",
              kind: "secondary",
              finding:
                "XP statement: no leak of passwords, electronic signatures, tokens or access credentials; the exposed data listed includes registration data, account number, balance, position, adviser name and credit limit.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://guiadoinvestidor.com.br/noticias/vazamento-dados-xp-mar-2025/",
              kind: "secondary",
              finding:
                "Guide reproducing XP's notice: incident learned of on 22 March 2025, access blocked, no password, signature, biometrics, CPF or ID accessed.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding:
                "TED R$ 0.00; standard packages I to IV R$ 18.00, 18.00, 29.50, 41.00; card annuity R$ 18,000.00; page last updated 14/08/2026.",
            },
            {
              url: "https://www.xpi.com.br/documentos/tarifas_20_01_22/",
              kind: "primary",
              checkedAt: "2026-11-01",
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
          reviewedAt: "2026-11-01",
        },
        lockIn: {
          status: "scored",
          score: 40,
          evidence:
            "Card benefits (lounges, Investback rate) depend on R$ 50,000 invested at XP or R$ 3,000 monthly spend. The deposit contract lets XP close the digital account, including after 6 months without movement, which also ends the linked card, credit and FX products, and 2026 complaints describe accounts closed 'for commercial disinterest' with the customer told to move the balance to another institution. Pix limits follow the Central Bank rules and the customer can set them in the app, with increases taking effect after a minimum delay.",
          summaryPtBr:
            "Os benefícios do cartão (salas VIP, taxa do Investback) dependem de R$ 50.000 investidos na XP ou R$ 3.000 de gastos por mês. O contrato da conta permite que a XP encerre a conta digital, inclusive após 6 meses sem movimentação, o que também encerra os produtos de cartão, crédito e câmbio ligados a ela, e reclamações de 2026 descrevem contas encerradas 'por desinteresse comercial', com o cliente orientado a transferir o saldo para outra instituição. Os limites do Pix seguem as regras do Banco Central e o cliente pode ajustá-los no app, com aumentos valendo após um prazo mínimo.",
          citations: [
            {
              url: "https://guiadoinvestidor.com.br/guias/cartao-xp-visa-infinite/",
              kind: "secondary",
              checkedAt: "2026-09-09",
              finding: "Benefit conditions.",
            },
            {
              url: "https://www.xpi.com.br/documentos/contrato-de-abertura-de-conta-banco-xp-s-a/",
              kind: "primary",
              finding:
                "Account contract summary: either party may close the digital account; closure may end the linked card, credit, insurance, FX and digital-asset products.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.xpi.com.br/documentos/termos-e-condicoes-conta-digital/",
              kind: "primary",
              finding:
                "Digital account contract: Pix limits follow the Central Bank, customers set their own limits in the app, with a minimum delay before an increase.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/xp-investimentos/reativacao-de-conta-encerrada-por-desinteresse-comercial-e-contestacoes-de-pix_h5N0-ONFdPGfAQef/",
              kind: "secondary",
              finding:
                "XP reply quoting clause 18.2: the bank may close the digital account by notice, or if the customer does not use it for 6 months with no balance.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/xp-investimentos/transacao-cancelada_uXC78jZIN1vlta5r/",
              kind: "secondary",
              finding:
                "2026 complaint: account blocked on 1 June and closed on 17 July 2026 for commercial disinterest; the bank says the customer was informed and must move the balance to another bank.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        publicReviews: {
          status: "scored",
          score: 80,
          evidence:
            "Reclame Aqui: 8.0/10 over the last six months, 83% resolution, 67.6% would do business again, consumer average 6.6; complaints about advisors' recommendations remain among recent cases.",
          summaryPtBr:
            "Reclame Aqui: 8,0/10 nos últimos seis meses, 83% de solução, 67,6% voltariam a fazer negócio, nota média dos consumidores de 6,6. Reclamações sobre as recomendações dos assessores continuam entre os casos recentes.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/xp-investimentos/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-11-01",
        },
      },
      accountTypes: {
        joint: {
          status: "not-offered",
          conditionPtBr: "Conta Digital não tem opção conjunta",
          evidence:
            "The Conta Digital, XP's everyday account, explicitly has no joint option, and a 2025 XP reply says moving a Conta Digital as a joint account is not yet available; XP's only joint product is the investment account.",
          summaryPtBr:
            "A Conta Digital, a conta do dia a dia da XP, não tem opção conjunta, e isso é dito de forma explícita; uma resposta da XP em 2025 diz que a movimentação da Conta Digital como conta conjunta ainda não está disponível; o único produto conjunto da XP é a conta de investimentos.",
          citations: [
            {
              url: "https://atendimento.xpi.com.br/categoria/conta-digital/duvidas-gerais",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Article 2499: 'A Conta digital permitirá conta conjunta?' answered not available.",
            },
            {
              url: "https://www.reclameaqui.com.br/xp-investimentos/conta-conjunta-que-nao-permite-movimentacao_rn0E_JuPXrOJGw6P/",
              kind: "secondary",
              finding:
                "XP reply (5 March 2025): moving the Conta Digital as a joint account is not yet available; the Conta Conjunta Investimento links two people to one investment account.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        shared: {
          status: "not-found",
          evidence:
            "No shared-access product was found beyond the joint investment account and additional cards, which share a card limit, not account access.",
          summaryPtBr:
            "Não foi encontrado produto de acesso compartilhado além da conta de investimento conjunta e dos cartões adicionais, que compartilham o limite do cartão, não o acesso à conta.",
          reviewedAt: "2026-11-01",
        },
        jointInvestment: {
          status: "offered",
          conditionPtBr: "pedida ao assessor",
          evidence:
            "XP's joint option exists only for the investment account, Conta Conjunta Investimento, linking exactly one co-holder requested through an advisor.",
          summaryPtBr:
            "A XP só oferece conta conjunta na conta de investimentos, a Conta Conjunta Investimento, que vincula exatamente um cotitular, solicitado por meio de um assessor.",
          citations: [
            {
              url: "https://atendimento.xpi.com.br/categoria/minha-conta-e-login/conta-investimento-conjunta",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Conta Investimento Conjunta links two people to one investment account, PF only, one co-holder maximum, requested through the advisor.",
            },
            {
              url: "https://guiadoinvestidor.com.br/guias/conta-conjunta-xp/",
              kind: "secondary",
              finding:
                "Guide: Conta Conjunta Investimento links exactly one co-holder, is requested through an adviser and accepted digitally by both; not usable for everyday payments.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/xp-investimentos/conta-conjunta-que-nao-permite-movimentacao_rn0E_JuPXrOJGw6P/",
              kind: "secondary",
              finding:
                "XP reply: the Conta Conjunta Investimento lets the co-holder access and operate the investment account once both approve in the logged area.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        mei: {
          status: "not-found",
          evidence:
            "MEI eligibility for XP Empresas Conta Digital PJ is not stated in the sources found; a September 2026 review says MEI is not explicitly mentioned in XP's FAQ.",
          summaryPtBr:
            "A elegibilidade de MEI para a Conta Digital PJ da XP Empresas não é indicada nas fontes encontradas; uma análise de setembro de 2026 diz que o MEI não é mencionado de forma explícita no FAQ da XP.",
          citations: [
            {
              url: "https://altarendablog.com.br/2026/09/29/xp-libera-nova-conta-para-empresas-que-nao-cobra-mensalidade-e-ainda-da-acesso-a-um-visa-infinite-sem-anuidade-analise-definitiva/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "2026-09-29 review: no opening/monthly fee, no minimum; boletos and cash withdrawals charged; opens via cadastro.xpempresas.com.br or app; MEI not explicitly mentioned in XP FAQ.",
            },
            {
              url: "https://conteudos.xpi.com.br/aprenda-a-investir/relatorios/xp-empresas/",
              kind: "secondary",
              finding:
                "XP content page: the PJ account is aimed mainly at mid-size companies with revenue above R$ 20 million; MEI is not mentioned.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
            "Sicoob replaced its card line in 2026: the new portfolio is Gold, Gold Plus, Platinum, Verth (the former Mastercard Black and Visa Infinite), Merith and Zenith, while Clássico, Vooz and Cabal cards are being discontinued and migrated by profile. Coopera points reach up to 4 points per US$ (Zenith); the annuity varies by cooperative and the 'Comprou, Zerou' programme waives it by monthly spend or investments.",
          summaryPtBr:
            "O Sicoob trocou a linha de cartões em 2026: o novo portfólio tem Gold, Gold Plus, Platinum, Verth (os antigos Mastercard Black e Visa Infinite), Merith e Zenith, enquanto os cartões Clássico, Vooz e Cabal estão sendo descontinuados e migrados conforme o perfil. Os pontos Coopera chegam a até 4 pontos por US$ (Zenith). A anuidade varia por cooperativa, e o programa 'Comprou, Zerou' a elimina conforme os gastos mensais ou os investimentos.",
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
            {
              url: "https://www.sicoob.com.br/web/sicoob/cartoes-voce",
              kind: "primary",
              finding:
                "New card portfolio (Gold, Gold Plus, Platinum, Verth, Merith, Zenith); Clássico, Vooz and Cabal being discontinued; annuity revised yearly by product.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.sicoob.com.br/web/sicoobcredicaru/noticias/-/asset_publisher/xAioIawpOI5S/content/id/307547791",
              kind: "primary",
              finding:
                "Coopera points up to 4 per US$; annuity varies by cooperative; 'Comprou, Zerou' waiver by monthly spend.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://altarendablog.com.br/2026/07/24/sicoob-divulga-as-novas-regras-para-seus-novos-cartoes-e-atualizacao-para-publico-alta-renda/",
              kind: "secondary",
              finding:
                "New Zenith variant with up to 4.0 points per US$ and spend- or investment-based annuity waivers.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        investmentAccess: {
          status: "scored",
          score: 40,
          evidence:
            "Poupança and cooperative-issued RDC, plus LCI, LCA, Letras Financeiras, Tesouro Direto (with a custody-fee exemption for Sicoob investors), DI-referenced and equity funds and an investments platform in the app; which products a member sees depends on the cooperative, since not every cooperative offers every RDC type. No open third-party investment platform was found.",
          summaryPtBr:
            "Poupança e RDC emitido pelas cooperativas, além de LCI, LCA, Letras Financeiras, Tesouro Direto (com isenção da taxa de custódia para investidores do Sicoob), fundos referenciados DI e de ações e uma plataforma de investimentos no app; os produtos que o associado vê dependem da cooperativa, pois nem toda cooperativa oferece todos os tipos de RDC. Não foi encontrada plataforma aberta de investimentos de terceiros.",
          citations: [
            {
              url: "https://www.sicoob.com.br/web/sicoob/contas-voce/-/asset_publisher/LMoNGCDcFEXS/content/id/1164656",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Poupança page.",
            },
            {
              url: "https://www.sicoob.com.br/web/sicoob/investimentos-voce/-/asset_publisher/CkzUFuuzBPzi/content/id/189155780",
              kind: "primary",
              finding:
                "Fixed income page: RDC issued only by cooperatives, LCI, LCA, LF and Tesouro Direto with an exclusive custody-fee exemption for Sicoob investors; an investments platform for applications.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.sicoob.com.br/web/sicoob/investimentos-voce",
              kind: "primary",
              finding:
                "Investments page: RDC prefixed or CDI-linked, rate set by each cooperative, not every cooperative offers prefixed RDC; poupança, RDC, LCA and funds.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.sicoob.com.br/web/sicoobcoopmil/investimentos-voce",
              kind: "primary",
              finding:
                "A cooperative's investments page: RDC, LCI and LCA, poupança, Tesouro Direto, DI-referenced funds and equity funds.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        appQuality: {
          status: "scored",
          score: 80,
          evidence:
            "App Store rating 4.9 and Google Play rating 4.8 with more than 20 million downloads, both stated in Sicoob's own store listings (not independently measured); Sicoob also reported second place in an app-satisfaction ranking across both stores. The separate Sicoob Moob engagement app is listed at 4.0 on Google Play.",
          summaryPtBr:
            "Nota 4,9 na App Store e 4,8 no Google Play, com mais de 20 milhões de downloads, ambas informadas nas próprias páginas do Sicoob nas lojas (não medidas de forma independente); o Sicoob também informou o segundo lugar em um ranking de satisfação de apps nas duas lojas. O app separado Sicoob Moob aparece com 4,0 no Google Play.",
          citations: [
            {
              url: "https://www.sicoob.com.br/web/sicoob/noticias/-/asset_publisher/xAioIawpOI5S/content/id/48620204",
              kind: "primary",
              checkedAt: "2026-09-09",
              finding: "Sicoob press release.",
            },
            {
              url: "https://apps.apple.com/br/app/sicoob/id416696406",
              kind: "primary",
              finding: "App Store listing text: rated 4.9 on the App Store.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://play.google.com/store/apps/details?id=br.com.sicoobnet&hl=en_US",
              kind: "primary",
              finding:
                "Google Play listing text: rated 4.8 in reviews, more than 20 million downloads.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://play.google.com/store/apps/developer?id=Sicoob+Confedera%C3%A7%C3%A3o&hl=en_US",
              kind: "secondary",
              finding: "Developer page: Sicoob Moob at 4.0 stars.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        security: {
          status: "scored",
          score: 40,
          evidence:
            "Sicoob describes three layers of protection (network defences, device registration with facial biometrics in use since April 2020, and AI that can deny a transaction or ask for a new facial check), a 24/7 security operations centre, day and night limits set by the member and a Modo Guardião that asks for facial biometrics when the app is used outside registered Wi-Fi. Confirmed incidents: Sicoob confirmed a cyber attack on a Monday the 24th (the excerpt read gives no month or year) that a ransomware group claimed with more than 1 TB of data, saying cooperative and member transactions run in a separate structure whose integrity was preserved, and Sicoob Centro Oeste BR issued an official notice that on 16 December 2024 an information-security incident compromised the confidentiality of certain information.",
          summaryPtBr:
            "O Sicoob descreve três camadas de proteção (defesas de rede, cadastro de dispositivos com biometria facial, em uso desde abril de 2020, e inteligência artificial que pode negar uma transação ou pedir nova checagem facial), um centro de operações de segurança 24 horas, limites diurnos e noturnos definidos pelo associado e um Modo Guardião que pede biometria facial quando o app é usado fora de redes Wi-Fi cadastradas. Incidentes confirmados: o Sicoob confirmou um ataque cibernético em uma segunda-feira, dia 24 (o trecho lido não informa mês nem ano), reivindicado por um grupo de ransomware com mais de 1 TB de dados, dizendo que as transações das cooperativas e dos associados rodam em estrutura separada, com a integridade preservada, e o Sicoob Centro Oeste BR divulgou um comunicado oficial dizendo que em 16 de dezembro de 2024 um incidente de segurança da informação comprometeu a confidencialidade de certas informações.",
          citations: [
            {
              url: "https://www.sicoob.com.br/web/sicoob/noticias/-/asset_publisher/xAioIawpOI5S/content/id/165476942",
              kind: "primary",
              finding:
                "Sicoob news: three-layer protection, facial biometrics for device release since April 2020, AI validation of transactions, 24/7 SOC, day and night limits.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.sicoob.com.br/web/sicoobcredisul/noticias/-/asset_publisher/xAioIawpOI5S/content/id/267681089",
              kind: "primary",
              finding:
                "Modo Guardião: outside registered Wi-Fi networks the app limits transactions to the member's chosen values and asks for facial biometrics for larger ones.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.sicoob.com.br/web/sicoob/dicas-seguranca",
              kind: "primary",
              finding:
                "Security tips page: computer registration for internet banking, virtual keyboard, guidance on fraud contacts.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.sicoob.com.br/documents/135597389/244187555/Comunicac%CC%A7a%CC%83o+-+Sicoob-Centro+Br++(1).pdf/f4e32358-1267-c06c-cc00-4a6f9b89513b?t=1738620111858",
              kind: "primary",
              finding:
                "Official notice from Sicoob Centro Oeste BR: on 16 December 2024 it identified an information-security incident that compromised the confidentiality of certain information.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://canaltech.com.br/seguranca/sicoob-confirma-que-sofreu-ataque-cibernetico-nesta-segunda-24-293831/",
              kind: "secondary",
              finding:
                "Sicoob confirmed a cyber attack on a Monday the 24th; a ransomware group claimed more than 1 TB of data; Sicoob says transactions are processed in a separate structure and integrity is preserved.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        fees: {
          status: "insufficient-evidence",
          reason:
            "Each cooperative publishes its own tariff table. The Central Bank registry entry for Banco Sicoob (packages R$ 4.00 to R$ 24.00, TED R$ 12.00) is not the table a member pays.",
          summaryPtBr:
            "Não há evidência suficiente. Cada cooperativa publica a própria tabela de tarifas. O registro do Banco Central para o Banco Sicoob (pacotes de R$ 4,00 a R$ 24,00, TED de R$ 12,00) não é a tabela que o associado paga.",
          reviewedAt: "2026-11-01",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/02038232.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
              finding: "Complaint thread.",
            },
            {
              url: "https://www.sicoob.com.br/web/sicoob/contas-voce",
              kind: "primary",
              finding:
                "The capital quota is paid on opening, kept in a capital account that cannot be moved like a current account; contributions and withdrawal conditions follow each cooperative's statute.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/sicoob/resgate-conta-capital-apos-encerramento-de-conta_u8fmmG4aOLvkEmna/",
              kind: "secondary",
              finding:
                "Cooperative reply: immediate redemption of quotas is not possible, it is a statutory rule decided at the general assembly, which can be the next year.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/sicoob/devolucao-do-capital-inicial_F-Lcf0Dkd6qpgm_d/",
              kind: "secondary",
              finding:
                "Cooperative reply quoting its statute: quotas returned after the assembly approves the balance of the year of exit, in up to 60 monthly instalments above a small amount.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        publicReviews: {
          status: "scored",
          score: 66,
          evidence:
            "Reclame Aqui: a listing page shows 6.6/10 over the last six months with 96.3% response; the company-page snippet shows 6.8, which matches the earlier all-period figure, so the six-month 6.6 stands. The earlier reading gave a consumer average of 5.51/10.",
          summaryPtBr:
            "Reclame Aqui: uma página de listagem mostra 6,6/10 nos últimos seis meses, com 96,3% de respostas; o trecho da página da empresa mostra 6,8, que é o mesmo número do período total da leitura anterior, então vale o 6,6 dos seis meses. A leitura anterior trazia nota média dos consumidores de 5,51/10.",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/sicoob/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "Reclame Aqui page read through a search-engine snippet; the site refuses automated reads (HTTP 403).",
            },
          ],
          reviewedAt: "2026-11-01",
        },
      },
      accountTypes: {
        joint: {
          status: "offered",
          conditionPtBr: "presencial, regras por cooperativa",
          evidence:
            "Sicoob lists conta conjunta among its personal account types, and its FAQ describes opening one by both people going in person to a cooperative with proof of residence, income and ID; branch-only opening does not lower this status. Sicoob is a system of independent cooperatives, so exact rules can vary by cooperative.",
          summaryPtBr:
            "O Sicoob lista a conta conjunta entre os tipos de conta de pessoa física, e o FAQ descreve a abertura com as duas pessoas indo a uma cooperativa, com comprovante de residência, renda e documento de identidade. A abertura só presencial não reduz este status. O Sicoob é um sistema de cooperativas independentes, então as regras exatas podem variar por cooperativa.",
          citations: [
            {
              url: "https://www.sicoob.com.br/web/sicoob/faq-contas/-/most_viewed_assets/i44fjP4SVO9M/content/id/1197104",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "'Como faço para abrir uma conta conjunta?': both must go in person to a cooperative with proof of residence, income, ID and CPF.",
            },
            {
              url: "https://www.sicoob.com.br/web/sicoob/contas-voce/-/most_viewed_assets/EWVRVG56fx5a/content/id/1197104",
              kind: "primary",
              finding:
                "'Como faço para abrir uma conta conjunta?': both people go in person to a cooperative with the listed documents.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        shared: {
          status: "not-found",
          evidence:
            "No shared-access product was found on the national site beyond additional Sicoobcard cards, which share a card limit, not account access.",
          summaryPtBr:
            "Não foi encontrado produto de acesso compartilhado no site nacional além dos cartões adicionais Sicoobcard, que compartilham o limite do cartão, não o acesso à conta.",
          reviewedAt: "2026-11-01",
        },
        jointInvestment: {
          status: "not-found",
          evidence: "No source was found describing a joint investment account at Sicoob.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta no Sicoob.",
          reviewedAt: "2026-11-01",
        },
        mei: {
          status: "offered",
          conditionPtBr: "preço por cooperativa",
          evidence:
            "Sicoob lists MEI among its account types and its Associação Digital page offers PF or MEI opening 100% in the app (the national FAQ on MEI still says to go in person to a cooperative, so the flow varies by cooperative); cost depends on the tariff package set by each cooperative.",
          summaryPtBr:
            "O Sicoob lista a conta MEI entre os seus tipos de conta e a página de Associação Digital oferece a abertura de conta PF ou MEI 100% pelo app (o FAQ nacional sobre MEI ainda diz para ir pessoalmente a uma cooperativa, então o fluxo varia por cooperativa); o custo depende do pacote de tarifas definido por cada cooperativa.",
          citations: [
            {
              url: "https://www.sicoob.com.br/web/sicoob/faq-geral/-/most_viewed_assets/lZeezSQ9cmrj/content/como-faco-para-abrir-uma-conta-para-minha-empresa-pessoa-juridic-2/20128",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Lists account types 'PF, PJ, MEI, poupança e conjunta'; opening 'pode ser feito de maneira totalmente digital' via App Sicoob or at a cooperative.",
            },
            {
              url: "https://www.sicoob.com.br/web/sicoob/associacaodigital",
              kind: "primary",
              finding: "Associação digital: open a PF or MEI account 100% in the app, free.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.sicoob.com.br/web/sicoob/contas-voce/-/most_viewed_assets/EWVRVG56fx5a/content/id/1197081",
              kind: "primary",
              finding:
                "National FAQ: to open an MEI account, go in person to a cooperative with the listed documents.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.sicoob.com.br/web/sicoobcredirural/contadigital",
              kind: "primary",
              finding:
                "A cooperative's digital account page: PF and MEI accounts opened entirely in the app from anywhere in Brazil.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
      },
    },
    {
      institutionId: "picpay",
      criteria: {
        cardBenefits: {
          status: "scored",
          score: 60,
          evidence:
            "Only the Gold card is annuity-free. The cashback cards carry annuities with spend or investment waivers: Platinum 0.5% cashback, Black 1.2% and Black Epic 1.3% in Brazil and 4% abroad ('em suas versões com anuidade'); PicPay's own table lists R$ 418.80 a year for Platinum, R$ 588.00 for Black and R$ 598.80 for Black Epic, and the card pages describe waivers at about R$ 5,000 of monthly spend or R$ 50,000 invested (R$ 2,000 or R$ 20,000 for Platinum). Cashback goes to a Cofrinho earning 102% of CDI, and the Cofrinho balance raises the card limit. This replaces the earlier 'zero-annuity cards' description.",
          summaryPtBr:
            "Só o cartão Gold não tem anuidade. Os cartões com cashback têm anuidade com isenção por gastos ou investimentos: Platinum com 0,5% de cashback, Black com 1,2% e Black Epic com 1,3% no Brasil e 4% no exterior ('em suas versões com anuidade'). A tabela do próprio PicPay lista R$ 418,80 por ano para o Platinum, R$ 588,00 para o Black e R$ 598,80 para o Black Epic, e as páginas dos cartões descrevem isenção com cerca de R$ 5.000 de gastos por mês ou R$ 50.000 investidos (R$ 2.000 ou R$ 20.000 no Platinum). O cashback vai para um Cofrinho que rende 102% do CDI, e o saldo do Cofrinho aumenta o limite do cartão. Isso substitui a descrição anterior de 'cartões sem anuidade'.",
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
            {
              url: "https://meajuda.picpay.com/hc/pt-br/articles/43838801209619-O-que-%C3%A9-o-Cofrinho-de-Cashback-do-PicPay-Card",
              kind: "primary",
              finding:
                "Cashback on the Platinum (0.5%), Black (1.2%) and Epic (1.3%) cards 'em suas versões com anuidade'; Cofrinho at 102% of CDI.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://picpay.com/docs/bu/taxas-e-tarifas/tabela-de-tarifas-pessoa-fisica-10-07-2026.pdf",
              kind: "primary",
              finding:
                "Tariff table: card annuities of R$ 418.80 (Platinum), R$ 588.00 (Black) and R$ 598.80 (Black Epic); card versions without rewards are exempt.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://picpay.com/pt-br/pf/cartao-de-credito",
              kind: "primary",
              finding:
                "PicPay Card: zero annuity on the Gold version, cashback and the Cofrinho that raises the card limit.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://cartoeseviagens.com.br/cartoes-banco-picpay",
              kind: "secondary",
              finding:
                "Only the Gold is fully free; Black Epic free for 12 months then R$ 49.90 a month, waived at R$ 5,000 of spend or R$ 50,000 invested.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        investmentAccess: {
          status: "scored",
          score: 60,
          evidence:
            "PicPay Invest in the same app: CDBs (Cofrinho at 102% of CDI, Cofrinho Turbinado at 121% within limits, CDBs from R$ 100), other fixed income, Tesouro Direto and other public bonds, investment funds, private pension, private credit, BDRs and crypto, advertised without brokerage fee; no home-broker access to Brazilian shares was found.",
          summaryPtBr:
            "PicPay Invest no mesmo app: CDBs (Cofrinho a 102% do CDI, Cofrinho Turbinado a 121% dentro de limites, CDBs a partir de R$ 100), outros títulos de renda fixa, Tesouro Direto e outros títulos públicos, fundos de investimento, previdência privada, crédito privado, BDRs e cripto, anunciados sem taxa de corretagem; não foi encontrado acesso de home broker a ações brasileiras.",
          citations: [
            {
              url: "https://meajuda.picpay.com/hc/pt-br/articles/7141763591571-O-que-%C3%A9-CDB-e-como-ele-funciona-no-PicPay",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "CDB of the account and Cofrinhos has a 3-year term, Cofrinho Turbinado 1 year; PicPay Bank CDBs have FGC cover within limits.",
            },
            {
              url: "https://picpay.com/pt-br/pf/investimentos",
              kind: "primary",
              finding:
                "Investments page: CDBs, funds, crypto, private pension and a selection of assets from managers; products without brokerage fee; FGC on selected products and Modo Seguro.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://meajuda.picpay.com/hc/pt-br/categories/5633097296019-Investimentos",
              kind: "primary",
              finding:
                "Help centre: invest in CDB, fixed income, funds, private pension, private credit and BDRs through PicPay Invest; public bonds can be followed in the app.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://meajuda.picpay.com/hc/pt-br/articles/41204753424531-Como-fa%C3%A7o-para-investir-no-CDB-do-PicPay",
              kind: "primary",
              finding: "CDB investments from R$ 100 with several maturities.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        appQuality: {
          status: "insufficient-evidence",
          reason:
            "No rating figure could be read from the PicPay listings on either store (descriptions and reviews only); an undated secondary guide puts Google Play at 4.4 and the App Store at 4.3, which is not citable as a current rating.",
          summaryPtBr:
            "Não há evidência suficiente. Nenhuma nota pôde ser lida nas páginas do PicPay nas duas lojas (apenas descrições e avaliações); um guia secundário sem data indica 4,4 no Google Play e 4,3 na App Store, o que não serve como nota atual.",
          reviewedAt: "2026-11-01",
          citations: [
            {
              url: "https://apps.apple.com/br/app/picpay-conta-cart%C3%A3o-e-pix/id561524792",
              kind: "secondary",
              finding:
                "App Store listing read: description and cards, no rating figure to automated reads.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://play.google.com/store/apps/details?id=com.picpay&hl=en_US",
              kind: "secondary",
              finding:
                "Google Play listing read: description, reviews mention instability, no rating figure to automated reads.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.mobills.com.br/blog/bancos/como-funciona-o-picpay/",
              kind: "secondary",
              finding: "Undated guide: Play Store 4.4 and App Store 4.3.",
              checkedAt: "2026-11-01",
            },
          ],
        },
        security: {
          status: "scored",
          score: 60,
          evidence:
            "PicPay's help centre and store listing describe Modo Seguro (protected and invisible balances), facial biometrics required when the device changes and for sensitive operations, optional biometrics on payments, a device-management area, a Central de Segurança and Pix limits split by day and night. Searches in this run found no confirmed PicPay data breach; the bank answers customers' fraud complaints by saying transactions were authorised on the registered device with biometrics, and absence of findings is not a clean record.",
          summaryPtBr:
            "A central de ajuda e a página do app do PicPay descrevem o Modo Seguro (saldos protegidos e invisíveis), a biometria facial exigida na troca de aparelho e em operações sensíveis, a biometria opcional nos pagamentos, uma área de gestão de dispositivos, uma Central de Segurança e limites de Pix separados por dia e noite. As buscas desta rodada não encontraram vazamento de dados confirmado no PicPay; o banco responde às reclamações de fraude dizendo que as transações foram autorizadas no aparelho cadastrado com biometria, e a ausência de achados não equivale a um histórico limpo.",
          citations: [
            {
              url: "https://meajuda.picpay.com/hc/pt-br/categories/360006546032-Seguran%C3%A7a-e-Privacidade",
              kind: "primary",
              finding:
                "Help centre security category: Modo Seguro, biometrics, access protection, device management, Central de Segurança, MED for Pix fraud.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://meajuda.picpay.com/hc/pt-br/articles/29232357541011-O-que-%C3%A9-e-como-ativar-a-biometria-nos-pagamentos-e-atividades",
              kind: "primary",
              finding:
                "Biometrics on payments and activities can be enabled in the Central de segurança.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://apps.apple.com/br/app/picpay-conta-cart%C3%A3o-e-pix/id561524792",
              kind: "primary",
              finding:
                "Store description: Modo Seguro and extra layers of protection for Pix, payments, transfers and purchases.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/picpay/erro-no-reconhecimento-facial-para-acesso-a-conta-picpay-apos-troca-de-aparelho-telefonico_jMWHJavHOwxzpzlV/",
              kind: "secondary",
              finding:
                "PicPay reply: a device change requires mandatory facial recognition before access is released.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/picpay/picpay-hackeado_vVXsSNcqgeDjyUJ5/",
              kind: "secondary",
              finding:
                "PicPay reply to a fraud complaint: transactions came from the device authorised by biometrics, the bank found no intrusion and opened an MED request.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        fees: {
          status: "scored",
          score: 100,
          evidence:
            "PicPay Bank declares R$ 0.00 for TED, every standard package and both card annuities; the registry now lists a registration fee of R$ 94,900.00 (R$ 200.00 in the earlier read, probably a reporting error since PicPay's own table lists R$ 150.00) and two paper-statement items. PicPay's payment institution reports no table (not re-read: the registry page could not be fetched).",
          summaryPtBr:
            "O PicPay Bank declara R$ 0,00 para TED, todos os pacotes padrão e as duas anuidades de cartão. O cadastro agora lista uma tarifa de cadastro de R$ 94.900,00 (eram R$ 200,00 na leitura anterior, provavelmente um erro de informação, já que a tabela do próprio PicPay lista R$ 150,00) e dois itens de extrato em papel. A instituição de pagamento do PicPay não informa tabela (não relido: a página do cadastro não pôde ser lida).",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/09516419.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "TED, standard packages I to IV and card annuities R$ 0.00; registration R$ 94,900.00; page last updated 30/10/2026.",
            },
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/22896431.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-10-02",
              finding: "The registry says this institution did not report its tariffs.",
            },
            {
              url: "https://picpay.com/docs/bu/taxas-e-tarifas/tabela-de-tarifas-pessoa-fisica-10-07-2026.pdf",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "PicPay's own table: registration R$ 150.00, TED over the internet exempt; effective from 14/11/2026.",
            },
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/22896431.asp?seg=bancossegmento09&frame=1",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Automated read failed (url_not_accessible); the registry page for the payment institution was not re-read.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        lockIn: {
          status: "scored",
          score: 60,
          evidence:
            "Night Pix limit R$ 1,000 per transaction (night start 20h or 22h) with a 24 to 48 hour analysis for increases that can be approved fully, partly or refused, plus a complaint about refused increases; since July 2025 each deposit must sit through a rolling 30-day cycle to earn the account yield (balances below R$ 10 earn nothing), and the card Cofrinho follows a 30-day cycle too. Closing an account takes up to 30 days and a new PicPay account can be opened only after 90 days.",
          summaryPtBr:
            "Limite do Pix noturno de R$ 1.000 por transação (início da noite às 20h ou às 22h), com análise de 24 a 48 horas para aumentos, que podem ser aprovados total ou parcialmente ou recusados, e há uma reclamação sobre aumentos recusados; desde julho de 2025, cada depósito precisa ficar parado por um ciclo móvel de 30 dias para render na conta (saldos abaixo de R$ 10 não rendem), e o Cofrinho do cartão também segue um ciclo de 30 dias. O encerramento da conta leva até 30 dias, e uma nova conta do PicPay só pode ser aberta depois de 90 dias.",
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
            {
              url: "https://meajuda.picpay.com/hc/pt-br/articles/360058187372-Existe-limite-di%C3%A1rio-de-Pix-no-PicPay",
              kind: "primary",
              finding:
                "Night limit R$ 1,000 per transaction; increases analysed in 24 to 48 hours with full, partial or no approval.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://meajuda.picpay.com/hc/pt-br/articles/4408058807187-Como-aumentar-o-limite-di%C3%A1rio-do-Pix-no-PicPay",
              kind: "primary",
              finding:
                "Night period can run from 20h or from 22h to 5h59; PJ has a single limit all day.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://meajuda.picpay.com/hc/pt-br/articles/42887860533011-Como-funciona-o-rendimento-do-saldo-da-minha-conta-PicPay",
              kind: "primary",
              finding:
                "Each amount entering the account from 10 July 2025 starts a 30-day cycle and must stay to earn yield.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://meajuda.picpay.com/hc/pt-br/articles/42810303330067-Por-que-o-meu-saldo-n%C3%A3o-est%C3%A1-rendendo",
              kind: "primary",
              finding:
                "Amounts moved before 30 days earn nothing; balances below R$ 10 are not credited.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://meajuda.picpay.com/hc/pt-br/articles/4407302956819-Como-eu-cancelo-minha-conta-do-PicPay",
              kind: "primary",
              finding:
                "Closing can take up to 30 days; after closure a 90-day wait applies before creating a new account.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://meajuda.picpay.com/hc/pt-br/articles/38450692328211-O-que-%C3%A9-o-Cofrinho-do-Cart%C3%A3o",
              kind: "primary",
              finding: "Card Cofrinho: from 4 August 2025 new deposits earn after 30 days.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
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
              checkedAt: "2026-11-01",
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
          reviewedAt: "2026-11-01",
        },
      },
      accountTypes: {
        joint: {
          status: "not-offered",
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
            {
              url: "https://www.idinheiro.com.br/contas/digital/conta-conjunta-digital-qual-escolher/",
              kind: "secondary",
              finding:
                "Guide: PicPay does not allow joint accounts at the moment; every account is individual and tied to one CPF.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        shared: {
          status: "not-found",
          evidence:
            "Saldo Compartilhado do PicPay Benefícios only shares a corporate-benefits balance (meal, food and similar) with family members, not the regular wallet balance; no shared access to the everyday account was found.",
          summaryPtBr:
            "O Saldo Compartilhado do PicPay Benefícios só compartilha um saldo de benefícios corporativos (como alimentação), não o saldo comum da conta; não foi encontrado acesso compartilhado à conta do dia a dia.",
          citations: [
            {
              url: "https://meajuda.picpay.com/hc/pt-br/articles/16044961167507-Como-funciona-o-Saldo-Compartilhado-do-PicPay-Benef%C3%ADcios",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Saldo Compartilhado shares the total benefits balance with any number of people; used by QR code; no adicional card.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        jointInvestment: {
          status: "not-found",
          evidence: "No source was found describing a joint investment account at PicPay.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta no PicPay.",
          reviewedAt: "2026-11-01",
        },
        mei: {
          status: "offered",
          evidence:
            "PicPay's own Google Play listing for PicPay Empresas says the app serves 'MEI (Individual Microentrepreneur) and CNPJ' with Pix, a card machine and payment links, its PJ page advertises a free, 100% digital account and its Pix page gives MEI examples; the account can be opened in the PicPay Empresas app or from the personal app.",
          summaryPtBr:
            "A página do próprio PicPay Empresas no Google Play diz que o app atende 'MEI (Microempreendedor Individual) e CNPJ' com Pix, maquininha e link de pagamento, a página PJ anuncia uma conta gratuita e 100% digital e a página de Pix traz exemplos de MEI; a conta pode ser aberta no app PicPay Empresas ou pelo app de pessoa física.",
          reviewedAt: "2026-11-01",
          conditionPtBr: "conta PJ gratuita",
          citations: [
            {
              url: "https://play.google.com/store/apps/details?id=com.picpay.business&hl=en_US",
              kind: "primary",
              finding:
                "PicPay Empresas listing: for MEI (Individual Microentrepreneur) and CNPJ: Pix, card machine and payment link to the business account.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://picpay.com/pt-br/pj",
              kind: "primary",
              finding:
                "PicPay Empresas page: free, 100% digital PJ account with card machine and credit card.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://picpay.com/pt-br/pj/pix",
              kind: "primary",
              finding:
                "PicPay Empresas Pix page with MEI examples (manicure and driver MEIs), up to 20 Pix keys.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://meajuda.picpay.com/hc/pt-br/articles/42718651627923-O-que-%C3%A9-a-conta-PJ-do-PicPay-Empresas",
              kind: "primary",
              finding:
                "Help article: open the PJ account in the PicPay Empresas app or from the personal app.",
              checkedAt: "2026-11-01",
            },
          ],
        },
      },
    },
    {
      institutionId: "mercado-pago",
      criteria: {
        cardBenefits: {
          status: "scored",
          score: 60,
          evidence:
            "The card has a permanent zero annuity with no minimum spend. Cashback is paid in Meli Dólar and now only to Meli+ subscribers who pay with the Mercado Pago card: up to 3% at Mercado Livre (R$ 5 per purchase and R$ 15 a month; a press report says it was cut from 5%), 0.5% elsewhere (up to R$ 100 a month per that report) and up to 10% at partners. Up to 18 interest-free instalments on Mercado Livre are still advertised, although a press report says the extended-term instalment is no longer part of Meli+.",
          summaryPtBr:
            "O cartão tem anuidade zero permanente, sem gasto mínimo. O cashback é pago em Meli Dólar e agora só para assinantes do Meli+ que pagam com o cartão Mercado Pago: até 3% no Mercado Livre (R$ 5 por compra e R$ 15 por mês; uma reportagem diz que caiu de 5%), 0,5% nas demais compras (até R$ 100 por mês, segundo essa reportagem) e até 10% em parceiros. Ainda se divulgam até 18 parcelas sem juros no Mercado Livre, embora uma reportagem diga que o parcelamento com prazo extra deixou de fazer parte do Meli+.",
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
              checkedAt: "2026-11-01",
              finding:
                "No annuity or maintenance fee; Meli+ subscribers get up to 3% on selected Mercado Livre products and up to 5% at participating stores; instalments up to 18x on selected purchases.",
            },
            {
              url: "https://www.mercadopago.com.br/blog/como-receber-cashback-meli-dolar",
              kind: "primary",
              finding:
                "Cashback in Meli Dólar only for active Meli+ subscribers: up to 3% at Mercado Livre (R$ 5 per purchase, R$ 15 a month), up to 0.5% elsewhere, up to 10% at partners.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.mercadopago.com.br/blog/vantagens-cartao-credito-mercado-pago",
              kind: "primary",
              finding:
                "Zero annuity not tied to a minimum spend; instalments up to 18x on Mercado Livre.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://tecnoblog.net/noticias/mercado-livre-diminui-cashback-do-meli-veja-o-que-muda/",
              kind: "secondary",
              finding:
                "Cashback cut from 5% to 3% at Mercado Livre, R$ 5 per purchase and R$ 15 a month, 0.5% elsewhere capped at R$ 100 a month, card required.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        investmentAccess: {
          status: "scored",
          score: 60,
          evidence:
            "The app's Investimentos area sells CDBs (post- and pre-fixed, FGC-covered), LCI and LCA (maturities from 6 months to 3 years, post-fixed, pre-fixed or IPCA-linked, no fee to invest), investment funds and crypto (Bitcoin, Ethereum and Meli Dólar); the Cofrinhos are CDB-backed with no minimum deposit and pay at least 100% of CDI, 115% for those who bring R$ 1,000 a month into the account (up to R$ 5,000) and 120% for Meli+ subscribers (up to R$ 10,000). The blog also describes a seasonal CDB at 150% of CDI capped at R$ 3,000 for first-time CDB investors, not confirmed to be live. No home-broker access to shares and no Tesouro Direto sale in the app were found. Score stays 60: the range is broader than the earlier review recorded (funds, LCI and LCA do exist) but still has no shares or Tesouro Direto.",
          summaryPtBr:
            "A área de Investimentos do app vende CDBs (pós e prefixados, com cobertura do FGC), LCI e LCA (vencimentos de 6 meses a 3 anos, pós-fixados, prefixados ou atrelados ao IPCA, sem taxa para investir), fundos de investimento e cripto (Bitcoin, Ethereum e Meli Dólar); os Cofrinhos são lastreados em CDB, sem depósito mínimo, e rendem no mínimo 100% do CDI, 115% para quem traz R$ 1.000 por mês à conta (até R$ 5.000) e 120% para assinantes do Meli+ (até R$ 10.000). O blog também descreve um CDB sazonal de 150% do CDI, limitado a R$ 3.000, para quem investe em CDB pela primeira vez, sem confirmação de que esteja ativo. Não foram encontrados acesso a home broker de ações nem venda de Tesouro Direto no app.",
          citations: [
            {
              url: "https://www.mercadopago.com.br/blog/promocao-rendimento-CDB-mercado-pago",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "Seasonal CDB at 150% of CDI for a limited time: cap of R$ 3,000, about six months, daily liquidity, FGC cover, aimed at first-time CDB investors or new accounts; older customers are told to check the offers in their investments area.",
            },
            {
              url: "https://www.mercadopago.com.br/blog/quando-investir-em-lci-lca",
              kind: "primary",
              finding:
                "Mercado Pago: 'you find LCI, LCA, CDBs, investment funds and crypto' built directly in the app.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.mercadopago.com.br/ajuda/taxa-lci-lca_37131",
              kind: "primary",
              finding: "Help centre: no fee to invest in LCI and LCA.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.mercadopago.com.br/blog/erros-comuns-ao-investir-lci-lca",
              kind: "primary",
              finding:
                "LCI and LCA in the app with maturities of 6 months, 9 months, 1, 2 and 3 years; post-fixed (CDI), pre-fixed or hybrid (IPCA); FGC cover.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.mercadopago.com.br/blog/lci-lca-ou-outros-investimentos",
              kind: "primary",
              finding:
                "Investment options in the app: CDBs of several maturities, funds, Cofrinhos up to 120% of CDI and crypto (Bitcoin, Ethereum, Meli Dólar).",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.mercadopago.com.br/blog/investimento-cdb-cofrinhos-mercado-pago",
              kind: "primary",
              finding:
                "Cofrinhos are CDB-based with FGC cover up to R$ 250,000 per CPF; CDBs of all types are in the app; up to 120% of CDI for balances up to R$ 10,000.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.mercadopago.com.br/cofrinhos",
              kind: "primary",
              finding:
                "Cofrinhos: all pay from 100% of CDI, 115% by bringing R$ 1,000 a month into the account, 120% with Meli+; businesses get 115%; campaigns up to 140%.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        appQuality: {
          status: "insufficient-evidence",
          reason:
            "No rating figure could be read from the Mercado Pago listings on Google Play or the App Store (descriptions and reviews only); figures quoted by third-party guides carry no date, so none is citable as a current rating.",
          summaryPtBr:
            "Não há evidência suficiente. Nenhuma nota pôde ser lida nas páginas do Mercado Pago no Google Play e na App Store (apenas descrições e avaliações); os números citados por guias de terceiros não têm data e não servem como nota atual.",
          reviewedAt: "2026-11-01",
          citations: [
            {
              url: "https://play.google.com/store/apps/details?id=com.mercadopago.wallet&hl=en_US",
              kind: "secondary",
              finding:
                "Google Play listing read: app description, no rating figure to automated reads.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://apps.apple.com/br/app/mercado-pago-banco-digital/id925436649",
              kind: "secondary",
              finding:
                "App Store listing read: app description and reviews, no rating figure to automated reads.",
              checkedAt: "2026-11-01",
            },
          ],
        },
        security: {
          status: "scored",
          score: 60,
          evidence:
            "Mercado Pago's own blog describes two-step verification by facial recognition, cross-device QR code, SMS or WhatsApp codes, e-mail or an authenticator app (Google Authenticator), recommended right after opening the account, plus biometric or PIN unlock of the app, a list of devices that accessed the account, a 'modo blindado' that restricts the account outside trusted locations, security alerts, 'pessoas de confiança' who can flag odd activity or request a block, and an anti-fraud system that combines AI and manual review. Searches in this run found no confirmed Mercado Pago data breach. Customers keep complaining that the company declines refunds when a payment was approved on a device already logged in (one April 2026 complaint alleges a leak; the reply says no intrusion was found), and the company's own checklist says refunds are not automatic and depend on a contestation under its security fund. The earlier 'mandatory 2FA' wording could not be confirmed, since the blog presents 2FA as a recommended setting.",
          summaryPtBr:
            "O blog do próprio Mercado Pago descreve a verificação em duas etapas por reconhecimento facial, QR code entre dispositivos, códigos por SMS ou WhatsApp, e-mail ou app autenticador (Google Authenticator), recomendada logo após abrir a conta, além de desbloqueio do app por biometria ou PIN, lista de dispositivos que acessaram a conta, um 'modo blindado' que restringe a conta fora dos locais de confiança, alertas de segurança, 'pessoas de confiança' que podem sinalizar movimentações estranhas ou pedir o bloqueio e um sistema antifraude que combina inteligência artificial e revisão manual. As buscas desta rodada não encontraram vazamento de dados confirmado no Mercado Pago. Clientes seguem reclamando que a empresa nega reembolso quando o pagamento foi aprovado em um aparelho já conectado (uma reclamação de abril de 2026 alega vazamento, e a resposta diz que não houve invasão), e o próprio checklist da empresa diz que o reembolso não é automático e depende de uma contestação no fundo de segurança. A redação anterior de '2FA obrigatório' não pôde ser confirmada, já que o blog apresenta o 2FA como uma configuração recomendada.",
          citations: [
            {
              url: "https://www.mercadopago.com.br/blog/o-que-e-autenticacao-de-dois-fatores",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "Generic 2FA explainer on Mercado Pago's blog: password plus a code sent to the phone; recommends turning it on for bank, payment and investment accounts.",
            },
            {
              url: "https://www.mercadopago.com.br/blog/seguranca-digital-conta-mercado-pago",
              kind: "primary",
              finding:
                "2FA methods (facial recognition, QR code, SMS or WhatsApp codes, Google Authenticator), biometric unlock, security alerts, 'pessoas de confiança'.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.mercadopago.com.br/blog/checklist-seguranca-conta-mercado-pago",
              kind: "primary",
              finding:
                "Settings > Security lists every device that accessed the account; 'modo blindado' restricts the account outside trusted locations; biometrics or PIN before opening the app; refunds are not automatic and go through a contestation under the security fund.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.mercadopago.com.br/blog/autenticacao-dois-fatores-como-ativar",
              kind: "primary",
              finding:
                "Recommends enabling two-step verification as soon as the account is created (Settings > Security).",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://conteudo.mercadopago.com.br/como-deixar-sua-conta-mercado-pago-ainda-mais-segura",
              kind: "primary",
              finding:
                "Anti-fraud system combining artificial intelligence and manual review; Google Authenticator as a second factor.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.reclameaqui.com.br/mercado-pago/banco-mercado-pago-vazamento-de-dados-e-retirada-total-de-dinheiro-da-conta-apos-denuncia_mcS6cG03MM5Qz6wT/",
              kind: "secondary",
              finding:
                "April 2026 complaint alleging a leak; company reply: the payment was validated on an already known, logged-in device, so it cannot reverse it, and the account remains safe from outside intruders.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://tecnoblog.net/noticias/mercado-pago-nao-reembolsa-vitimas-de-invasao-em-contas/",
              kind: "secondary",
              finding:
                "Undated report: Mercado Pago declines to refund account-intrusion victims (one case of six transfers of R$ 712.29), arguing access used the victim's own data.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        fees: {
          status: "insufficient-evidence",
          reason:
            "Mercado Pago's payment institution reports no tariff table to the Central Bank registry. Its help centre lists a fee table, but the page did not load to an automated read, and the blog describing a free account (no maintenance fee, free Pix and TED, paid cash withdrawal) is marketing, not a schedule.",
          summaryPtBr:
            "Não há evidência suficiente. A instituição de pagamento do Mercado Pago não informa tabela de tarifas ao cadastro do Banco Central. A central de ajuda indica uma tabela de tarifas, mas a página não carregou na leitura automática, e o blog que descreve conta gratuita (sem tarifa de manutenção, Pix e TED gratuitos, saque em espécie pago) é material de divulgação, não uma tabela.",
          reviewedAt: "2026-11-01",
          citations: [
            {
              url: "https://www.bcb.gov.br/fis/tarifas/htms/10573521.asp?idpai=tarifa&frame=1",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "The registry says this institution did not report its tariffs; page last updated 04/09/2026.",
            },
            {
              url: "https://www.mercadopago.com.br/ajuda/tabela-taxas-tarifas_45243",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Help centre page titled 'Tabela de taxas e tarifas'; the content did not load to an automated read, on this run too (url_not_accessible).",
            },
            {
              url: "https://www.mercadopago.com.br/blog/conta-mercado-pago-quanto-custa",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Blog (direct read failed with url_not_accessible; search excerpt read): no maintenance fee, free Pix and TED to any institution, cash withdrawal is paid; no fee schedule.",
            },
          ],
        },
        lockIn: {
          status: "scored",
          score: 60,
          evidence:
            "Night Pix limit R$ 1,000 (the night start can be moved between 20h and 22h); increases are analysed in up to 24 hours (another Mercado Pago page says 24 to 48 hours) and decreases are immediate. Yield is conditional: Cofrinhos pay 100% of CDI by default, 115% only for those who bring R$ 1,000 a month into the account (up to R$ 5,000) and 120% only for Meli+ subscribers (up to R$ 10,000); the account balance earns 105% of CDI (up to R$ 20,000) under the same R$ 1,000 monthly rule; and a Cofrinho on the monthly-yield model can lose that cycle's yield if redeemed within 30 days. The earlier note that the account's free balance is not FGC-covered was not re-read.",
          summaryPtBr:
            "Limite do Pix noturno de R$ 1.000 (o início da noite pode ser movido entre 20h e 22h); aumentos são analisados em até 24 horas (outra página do Mercado Pago fala em 24 a 48 horas) e reduções são imediatas. O rendimento é condicionado: os Cofrinhos rendem 100% do CDI por padrão, 115% só para quem traz R$ 1.000 por mês à conta (até R$ 5.000) e 120% só para assinantes do Meli+ (até R$ 10.000); o saldo da conta rende 105% do CDI (até R$ 20.000) com a mesma regra de R$ 1.000 por mês; e um Cofrinho no modelo de rendimento mensal pode perder o rendimento do ciclo se for resgatado antes de 30 dias. A observação anterior de que o saldo comum da conta não tem cobertura do FGC não foi relida.",
          citations: [
            {
              url: "https://www.mercadopago.com.br/blog/como-funciona-limite-pix-mercado-pago",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "Pix limits: night limit R$ 1,000 (night start can be moved between 20h and 22h), limit increases analysed in up to 24 hours, reductions immediate.",
            },
            {
              url: "https://www.mercadopago.com.br/cofrinhos",
              kind: "primary",
              finding:
                "Cofrinhos pay from 100% of CDI; 115% requires bringing R$ 1,000 a month into the account; 120% requires Meli+; the limit of each yield applies.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.mercadopago.com.br/blog/dinheiro-no-cofrinho-mercado-pago-rende-mais",
              kind: "primary",
              finding:
                "120% of CDI needs an active Meli+ and a balance of up to R$ 10,000; Cofrinhos on the monthly-yield model may not credit that cycle's yield if redeemed before 30 days.",
              checkedAt: "2026-11-01",
            },
            {
              url: "https://www.mercadopago.com.br/blog/rendimento-conta-mercado-pago",
              kind: "primary",
              finding:
                "Account balance yields 100% of CDI, or 105% up to R$ 20,000 when R$ 1,000 or more comes into the account in the month.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        publicReviews: {
          status: "scored",
          score: 79,
          evidence:
            "Reclame Aqui: 7.9/10 over the last six months (earlier review: 8.0/10, 96.8% response, 81.3% resolution, 75.9% would do business again; those figures were not visible in this read).",
          summaryPtBr:
            "Reclame Aqui: 7,9/10 nos últimos seis meses (revisão anterior: 8,0/10, 96,8% de respostas, 81,3% de solução, 75,9% voltariam a fazer negócio; esses números não apareceram nesta leitura).",
          citations: [
            {
              url: "https://www.reclameaqui.com.br/empresa/mercado-pago/",
              kind: "secondary",
              checkedAt: "2026-11-01",
              finding:
                "Reclame Aqui page read through a search-engine snippet (the site refuses automated reads): 7.9/10 over the last six months.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
      },
      accountTypes: {
        joint: {
          status: "not-offered",
          evidence:
            "Mercado Pago's own blog presents only alternatives to a joint account (Dividir Gastos for personal expenses, Colaboradores for seller accounts), 'sem o compromisso de um contrato bancário'; it does not open joint accounts for personal customers.",
          summaryPtBr:
            "O blog do próprio Mercado Pago apresenta apenas alternativas à conta conjunta (Dividir Gastos para despesas pessoais e Colaboradores para contas de vendedores), 'sem o compromisso de um contrato bancário'. Não abre contas conjuntas para clientes pessoa física.",
          citations: [
            {
              url: "https://www.mercadopago.com.br/blog/como-funciona-conta-conjunta",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "Section 'Alternativas digitais à conta conjunta no Mercado Pago': Dividir Gastos for personal life, Colaboradores for PJ seller accounts, 'sem o compromisso de um contrato bancário'.",
            },
          ],
          reviewedAt: "2026-11-01",
        },
        shared: {
          status: "not-found",
          evidence:
            "Dividir Gastos splits bills among a group and sends payment requests, but it does not give anyone shared access to another person's account; no shared-access product was found.",
          summaryPtBr:
            "O Dividir Gastos reparte contas entre um grupo e envia cobranças, mas não dá a ninguém acesso compartilhado à conta de outra pessoa; não foi encontrado produto de acesso compartilhado.",
          reviewedAt: "2026-11-01",
        },
        jointInvestment: {
          status: "not-found",
          evidence: "No source was found describing a joint investment account at Mercado Pago.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta no Mercado Pago.",
          reviewedAt: "2026-11-01",
        },
        mei: {
          status: "offered",
          evidence:
            "Mercado Pago's blog describes the MEI account as 100% digital, 'sem anuidade, sem taxa de manutenção'.",
          summaryPtBr:
            "O blog do Mercado Pago descreve a conta MEI como 100% digital, 'sem anuidade, sem taxa de manutenção'.",
          citations: [
            {
              url: "https://www.mercadopago.com.br/blog/como-abrir-conta-pj-gratuita-para-mei",
              kind: "primary",
              checkedAt: "2026-11-01",
              finding:
                "12 Sep 2026: MEI account 100% digital, 'sem anuidade, sem taxa de manutenção'.",
            },
            {
              url: "https://www.mercadopago.com.br/conta-negocio",
              kind: "primary",
              finding:
                "Conta Negócio FAQ for MEI: with a CNPJ, open the account in the app; the process is 100% digital.",
              checkedAt: "2026-11-01",
            },
          ],
          reviewedAt: "2026-11-01",
        },
      },
    },
  ],
} satisfies BankProfilesDatasetInput;
