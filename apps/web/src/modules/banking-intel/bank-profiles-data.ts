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
            "No source was found describing a joint investment account inside NuInvest; Nubank's investment pages describe only individual holdings.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta dentro da NuInvest; as páginas de investimentos do Nubank descrevem apenas posições individuais.",
          reviewedAt: "2026-10-13",
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
              checkedAt: "2026-10-13",
              finding:
                "'Atualmente, não é possível ter uma conta conjunta no Inter. A instituição oferece apenas contas individuais vinculadas ao CPF.'",
            },
          ],
          reviewedAt: "2026-10-13",
        },
        shared: {
          status: "not-found",
          evidence:
            "No shared-access or shared-balance product was found; Inter offers only a cartão adicional (additional credit card) for a partner, which shares the card limit, not the account.",
          summaryPtBr:
            "Não foi encontrado produto de acesso ou saldo compartilhado; o Inter oferece apenas um cartão adicional para o parceiro, que compartilha o limite do cartão, não a conta.",
          reviewedAt: "2026-10-13",
        },
        jointInvestment: {
          status: "not-found",
          evidence: "No source was found describing a joint investment account at Inter.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta no Inter.",
          reviewedAt: "2026-10-13",
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
              checkedAt: "2026-10-13",
              finding:
                "MEI account '100% digital e gratuita', 'livre de tarifas', opened from PF Super App. Updated 11/07/2023.",
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
          status: "insufficient-evidence",
          reason:
            "The App Store listing shows 4.7 stars from about 3.3 million ratings, but the Google Play rating could not be read, so no score was assigned. Outages found: Central Bank-confirmed Pix instability on 23 August 2026 that hit Itaú among other banks, and an app, internet banking and Pix instability at Itaú on 30 October 2026 (about 100 Downdetector reports at the peak).",
          summaryPtBr:
            "Não há evidência suficiente. A página do app na App Store mostra 4,7 estrelas, com cerca de 3,3 milhões de avaliações, mas a nota do Google Play não pôde ser lida, então nenhuma nota foi atribuída. Houve instabilidade do Pix em 23 de agosto de 2026, confirmada pelo Banco Central e que atingiu o Itaú entre outros bancos, e uma instabilidade do app, do internet banking e do Pix do Itaú em 30 de outubro de 2026, com cerca de 100 relatos no pico.",
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
        shared: {
          status: "not-found",
          evidence:
            "No shared-access product such as a procurador or a shared balance was found; Itaú's cofrinhos can receive Pix contributions from other people, but that is not a shared account.",
          summaryPtBr:
            "Não foi encontrado produto de acesso compartilhado, como procurador ou saldo compartilhado; os cofrinhos do Itaú podem receber contribuições via Pix de outras pessoas, mas isso não é uma conta compartilhada.",
          reviewedAt: "2026-10-13",
        },
        jointInvestment: {
          status: "not-found",
          evidence: "No source was found describing a joint investment account at Itaú.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta no Itaú.",
          reviewedAt: "2026-10-13",
        },
        mei: {
          status: "not-found",
          conditionPtBr: "Emps ainda não é para MEI",
          evidence:
            "Itaú Emps, the free digital PJ account, says 'Por enquanto o Emps é para pequenas empresas que não sejam MEI' and 'Ainda não [para MEI], mas estamos trabalhando'; no other current source confirms or rules out a MEI account at Itaú.",
          summaryPtBr:
            "O Itaú Emps, a conta PJ digital gratuita, diz 'Por enquanto o Emps é para pequenas empresas que não sejam MEI' e 'Ainda não [para MEI], mas estamos trabalhando'; nenhuma outra fonte atual confirma ou descarta uma conta MEI no Itaú.",
          citations: [
            {
              url: "https://www.itau.com.br/emps",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Itaú Emps is a free digital PJ account, but 'Por enquanto o Emps é para pequenas empresas que não sejam MEI'.",
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
          ],
          reviewedAt: "2026-09-09",
        },
        appQuality: {
          status: "scored",
          score: 80,
          evidence:
            "The App Store listing shows 4.7 stars from about 3.1 million ratings (read directly). The earlier Google Play figure (about 4.7 stars from about 5.9 million ratings, a search aggregate) was not re-read. Outages: Central Bank-confirmed Pix instability on 23 August 2026 (Bradesco among the banks cited) and an app and Pix instability on 30 October 2026 (about 150 Downdetector reports at the peak).",
          summaryPtBr:
            "A página do app na App Store mostra 4,7 estrelas, com cerca de 3,1 milhões de avaliações (lida diretamente). O número anterior do Google Play (cerca de 4,7 estrelas, com cerca de 5,9 milhões de avaliações, agregado de busca) não foi relido. Quedas: instabilidade do Pix em 23 de agosto de 2026, confirmada pelo Banco Central, com o Bradesco entre os bancos citados, e instabilidade do app e do Pix em 30 de outubro de 2026, com cerca de 150 relatos no pico do Downdetector.",
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
              checkedAt: "2026-10-13",
              finding:
                "Regulation 1.408-7E (04/2026) 2.4.2 defines joint types 'e' (simples) and 'e/ou' (solidária); holders are jointly liable for credit limits.",
            },
          ],
          reviewedAt: "2026-10-13",
        },
        shared: {
          status: "not-found",
          evidence:
            "No shared-access product was found; Bradesco offers additional credit cards and nextJoy for minors, neither of which shares access to the holder's own current account.",
          summaryPtBr:
            "Não foi encontrado produto de acesso compartilhado; o Bradesco oferece cartões adicionais e o nextJoy para menores, nenhum dos quais compartilha o acesso à conta corrente do titular.",
          reviewedAt: "2026-10-13",
        },
        jointInvestment: {
          status: "not-found",
          evidence: "No source was found describing a joint investment account at Bradesco.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta no Bradesco.",
          reviewedAt: "2026-10-13",
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
              checkedAt: "2026-10-13",
              finding:
                "MEI account opened in the app without a branch; MEI service basket free for 12 months; first annual card fee free.",
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
              checkedAt: "2026-10-13",
              finding:
                "Anyone 18+, no family tie needed, up to 4 holders; each holder can have their own credit card and accesses the account individually via App BB or Internet Banking.",
            },
          ],
          reviewedAt: "2026-10-13",
        },
        shared: {
          status: "not-found",
          evidence:
            "No shared-access product was found; BB's Cofrinho lets the owner share a Pix link so others contribute to a pot, but that is not shared access to the account itself.",
          summaryPtBr:
            "Não foi encontrado produto de acesso compartilhado; o Cofrinho do BB permite que o titular compartilhe um link de Pix para que outras pessoas contribuam para uma meta, mas isso não é acesso compartilhado à conta em si.",
          reviewedAt: "2026-10-13",
        },
        jointInvestment: {
          status: "not-found",
          evidence: "No source was found describing a joint investment account at Banco do Brasil.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta no Banco do Brasil.",
          reviewedAt: "2026-10-13",
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
              checkedAt: "2026-10-13",
              finding:
                "Conta PJ Digital for MEI/EI/SLU opened in app; Plano Digital without monthly fee.",
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
        shared: {
          status: "not-found",
          evidence:
            "No shared-access product was found in App CAIXA beyond additional credit cards, which share a card limit, not account access.",
          summaryPtBr:
            "Não foi encontrado produto de acesso compartilhado no App CAIXA além dos cartões adicionais, que compartilham o limite do cartão, não o acesso à conta.",
          reviewedAt: "2026-10-13",
        },
        jointInvestment: {
          status: "not-found",
          evidence: "No source was found describing a joint investment account at Caixa.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta na Caixa.",
          reviewedAt: "2026-10-13",
        },
        mei: {
          status: "offered",
          evidence:
            "Conta Digital MEI through the CAIXA Tem app has no maintenance fee when opened digitally and offers unlimited free Pix; it requires a CAIXA Tem PF digital savings account and an active MEI CNPJ.",
          summaryPtBr:
            "A Conta Digital MEI pelo app CAIXA Tem não tem taxa de manutenção quando aberta digitalmente e tem Pix ilimitado grátis; exige uma conta poupança digital CAIXA Tem de pessoa física e um CNPJ MEI ativo.",
          citations: [
            {
              url: "https://www.caixa.gov.br/empresa/contas/conta-mei/Paginas/default.aspx",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Conta Digital MEI CAIXA Tem: no maintenance fee when opened digitally; free Pix; requires CAIXA Tem PF savings and active MEI; one per CNPJ.",
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
          ],
          reviewedAt: "2026-10-13",
        },
        shared: {
          status: "not-found",
          evidence:
            "No shared-access product was found beyond the joint account itself and an additional credit card, which shares a card limit, not account access.",
          summaryPtBr:
            "Não foi encontrado produto de acesso compartilhado além da própria conta conjunta e de um cartão adicional, que compartilha o limite do cartão, não o acesso à conta.",
          reviewedAt: "2026-10-13",
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
          ],
          reviewedAt: "2026-10-13",
        },
        mei: {
          status: "offered",
          conditionPtBr: "R$ 69, isentável",
          evidence:
            "Conta MEI+ is opened in the app or site without a branch, with a monthly fee of R$ 69,00 that can be fully waived by registering the CNPJ as a Pix key plus 5 payments a month, and R$ 1.000/month billed on a Getnet card machine.",
          summaryPtBr:
            "A Conta MEI+ é aberta no app ou no site, sem agência, com mensalidade de R$ 69,00 que pode ser totalmente isenta ao cadastrar o CNPJ como chave Pix e fazer 5 pagamentos por mês, mais R$ 1.000 por mês faturados em uma maquininha Getnet.",
          citations: [
            {
              url: "https://www.santander.com.br/empresas/contas/mei/",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Conta MEI+ opened via app/site; R$ 69,00 monthly fee, waivable 100% under Pix-key, payments and Getnet criteria.",
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
              checkedAt: "2026-10-13",
              finding:
                "Fetch blocked (403); search snippet: C6 has no conta conjunta, offers conta compartilhada; transactions made in the titular's name; invitee must be a C6 client.",
            },
          ],
          reviewedAt: "2026-10-13",
        },
        shared: {
          status: "offered",
          conditionPtBr: "uma pessoa convidada",
          evidence:
            "C6 offers Conta Compartilhada: the holder invites one other C6 client as a procurador who moves the account independently from their own login, without becoming a co-holder.",
          summaryPtBr:
            "O C6 oferece a Conta Compartilhada: o titular convida outro cliente do C6 como procurador, que movimenta a conta de forma independente, com o próprio login, sem se tornar cotitular.",
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
        jointInvestment: {
          status: "not-found",
          evidence: "No source was found describing a joint investment account at C6.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta no C6.",
          reviewedAt: "2026-10-13",
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
            "BTG Pactual Banking's FAQ says a joint current account 'não é possível' and offers Conta Compartilhada instead.",
          summaryPtBr:
            "O FAQ do BTG Pactual Banking diz que conta corrente conjunta 'não é possível' e oferece a Conta Compartilhada em seu lugar.",
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
          ],
          reviewedAt: "2026-10-13",
        },
        jointInvestment: {
          status: "not-found",
          evidence:
            "Whether a joint investment account exists at BTG Pactual Investimentos is not verified: the Banking FAQ hints that some legacy or advisor joint investment accounts may exist, while a secondary guide from September 2025 says BTG does not offer one.",
          summaryPtBr:
            "Não está verificado se existe uma conta de investimento conjunta na BTG Pactual Investimentos: o FAQ do Banking sugere que contas conjuntas de investimento legadas ou via assessor podem existir, enquanto um guia secundário de setembro de 2025 diz que a BTG não oferece essa opção.",
          citations: [
            {
              url: "https://guiadoinvestidor.com.br/guias/conta-conjunta-btg-pactual/",
              kind: "secondary",
              checkedAt: "2026-10-13",
              finding:
                "Guide dated 2025-09-23: no traditional joint account; Conta Compartilhada; no joint investment account ('No momento, a resposta é não').",
            },
          ],
          reviewedAt: "2026-10-13",
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
            "The Conta Digital, XP's everyday account, explicitly has no joint option; XP's only joint product is the investment account.",
          summaryPtBr:
            "A Conta Digital, a conta do dia a dia da XP, não tem opção conjunta, e isso é dito de forma explícita; o único produto conjunto da XP é a conta de investimentos.",
          citations: [
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
        shared: {
          status: "not-found",
          evidence:
            "No shared-access product was found beyond the joint investment account and additional cards, which share a card limit, not account access.",
          summaryPtBr:
            "Não foi encontrado produto de acesso compartilhado além da conta de investimento conjunta e dos cartões adicionais, que compartilham o limite do cartão, não o acesso à conta.",
          reviewedAt: "2026-10-13",
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
              checkedAt: "2026-10-13",
              finding:
                "Conta Investimento Conjunta links two people to one investment account, PF only, one co-holder maximum, requested through the advisor.",
            },
          ],
          reviewedAt: "2026-10-13",
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
              checkedAt: "2026-10-13",
              finding:
                "2026-09-29 review: no opening/monthly fee, no minimum; boletos and cash withdrawals charged; opens via cadastro.xpempresas.com.br or app; MEI not explicitly mentioned in XP FAQ.",
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
              checkedAt: "2026-09-09",
              finding: "Complaint thread.",
            },
          ],
          reviewedAt: "2026-09-09",
        },
        publicReviews: {
          status: "scored",
          score: 68,
          evidence:
            "Reclame Aqui: 6.8/10 over the last six months on the company page (a sibling listing page still showed the earlier 6.6 with 96.3% response, and the earlier reading gave a consumer average of 5.51/10).",
          summaryPtBr:
            "Reclame Aqui: 6,8/10 nos últimos seis meses na página da empresa (uma página de listagem vizinha ainda mostrava o 6,6 anterior, com 96,3% de respostas, e a leitura anterior trazia nota média dos consumidores de 5,51/10).",
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
          ],
          reviewedAt: "2026-10-13",
        },
        shared: {
          status: "not-found",
          evidence:
            "No shared-access product was found on the national site beyond additional Sicoobcard cards, which share a card limit, not account access.",
          summaryPtBr:
            "Não foi encontrado produto de acesso compartilhado no site nacional além dos cartões adicionais Sicoobcard, que compartilham o limite do cartão, não o acesso à conta.",
          reviewedAt: "2026-10-13",
        },
        jointInvestment: {
          status: "not-found",
          evidence: "No source was found describing a joint investment account at Sicoob.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta no Sicoob.",
          reviewedAt: "2026-10-13",
        },
        mei: {
          status: "offered",
          conditionPtBr: "preço por cooperativa",
          evidence:
            "Sicoob lists MEI among its account types and offers a fully digital opening flow in App Sicoob; cost depends on the tariff package set by each cooperative.",
          summaryPtBr:
            "O Sicoob lista a conta MEI entre os seus tipos de conta e oferece abertura totalmente digital pelo App Sicoob; o custo depende do pacote de tarifas definido por cada cooperativa.",
          citations: [
            {
              url: "https://www.sicoob.com.br/web/sicoob/faq-geral/-/most_viewed_assets/lZeezSQ9cmrj/content/como-faco-para-abrir-uma-conta-para-minha-empresa-pessoa-juridic-2/20128",
              kind: "primary",
              checkedAt: "2026-10-13",
              finding:
                "Lists account types 'PF, PJ, MEI, poupança e conjunta'; opening 'pode ser feito de maneira totalmente digital' via App Sicoob or at a cooperative.",
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
          ],
          reviewedAt: "2026-10-13",
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
          reviewedAt: "2026-10-13",
        },
        jointInvestment: {
          status: "not-found",
          evidence: "No source was found describing a joint investment account at PicPay.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta no PicPay.",
          reviewedAt: "2026-10-13",
        },
        mei: {
          status: "not-found",
          evidence:
            "PicPay Empresas' PJ account has no fetched source confirming MEI eligibility; third-party sources say MEI is accepted, but this was not verified against PicPay's own pages.",
          summaryPtBr:
            "Não há fonte verificada do próprio PicPay confirmando a elegibilidade de MEI na conta PJ do PicPay Empresas; fontes de terceiros dizem que MEI é aceito, mas isso não foi confirmado nas páginas oficiais.",
          reviewedAt: "2026-10-13",
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
              checkedAt: "2026-10-13",
              finding:
                "Section 'Alternativas digitais à conta conjunta no Mercado Pago': Dividir Gastos for personal life, Colaboradores for PJ seller accounts, 'sem o compromisso de um contrato bancário'.",
            },
          ],
          reviewedAt: "2026-10-13",
        },
        shared: {
          status: "not-found",
          evidence:
            "Dividir Gastos splits bills among a group and sends payment requests, but it does not give anyone shared access to another person's account; no shared-access product was found.",
          summaryPtBr:
            "O Dividir Gastos reparte contas entre um grupo e envia cobranças, mas não dá a ninguém acesso compartilhado à conta de outra pessoa; não foi encontrado produto de acesso compartilhado.",
          reviewedAt: "2026-10-13",
        },
        jointInvestment: {
          status: "not-found",
          evidence: "No source was found describing a joint investment account at Mercado Pago.",
          summaryPtBr:
            "Não foi encontrada fonte que descreva uma conta de investimento conjunta no Mercado Pago.",
          reviewedAt: "2026-10-13",
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
              checkedAt: "2026-10-13",
              finding:
                "12 Sep 2026: MEI account 100% digital, 'sem anuidade, sem taxa de manutenção'.",
            },
          ],
          reviewedAt: "2026-10-13",
        },
      },
    },
  ],
} satisfies BankProfilesDatasetInput;
