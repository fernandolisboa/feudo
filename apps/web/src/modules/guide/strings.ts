const en = {
  overline: "Help",
  title: "How to use Feudo",
  intro:
    "What each screen does and the steps nobody can guess on their own. If you are just getting started, begin with the first two sections.",
  tocLabel: "On this page",
  goTo: "Go to {screen}",
  sections: {
    firstSteps: {
      title: "First steps",
      screen: "Household",
      topics: [
        {
          title: "Create a household or accept an invite",
          body: "After you confirm your email, Feudo asks you to create a household or to join one you were invited to. The household is where you and the people who share your finances follow the money together.",
        },
        {
          title: "Invite your partner",
          body: "On the Household screen, the owner and the admins invite people by email. The invite expires in 24 hours; if it expires, send a new one.",
        },
        {
          title: "More than one household",
          body: "You can belong to several households and work in one at a time. Switch the active household in the Household selector, in the navigation bar (with the side menu expanded; on a phone, at the top of the screen): every screen then shows that household's data.",
        },
      ],
    },
    meuPluggy: {
      title: "Connect your bank (Meu Pluggy)",
      screen: "Connect bank",
      topics: [
        {
          title: "Two Pluggy sites",
          body: "Feudo reads your banks through Meu Pluggy, Pluggy's free personal Open Finance service. At meu.pluggy.ai you connect your banks. The credentials Feudo asks for come from another site, the Pluggy Dashboard (dashboard.pluggy.ai), where you create your own account.",
        },
        {
          title: "Client id and client secret",
          body: "In the Pluggy Dashboard, create an application. Its Application tab shows the client id and the client secret. You paste them once; Feudo stores them encrypted and never shows them again.",
        },
        {
          title: "What the Item ID is",
          body: "Inside the application, create a connection with the MeuPluggy connector (not your bank's) and sign in with your Meu Pluggy account. Each bank becomes one connection, and its Item ID, a code in the 8-4-4-4-12 format, is in the connection details. Connect the first bank with the wizard and the next ones with Add connection, which reuses your saved credentials.",
        },
        {
          title: "Each person connects with their own CPF",
          body: "Meu Pluggy is personal: one account per CPF, with only that person's banks. So each member of the household connects their own banks with their own credentials, and Feudo never shares them. Only you see and manage your connections; the household sees the accounts, balances and transactions.",
        },
        {
          title: "Consent and attempt limit",
          body: "Before the first connection, Feudo explains what it reads and asks for your authorization; each new connection asks for it again. You can make 5 connection attempts every 15 minutes, failed ones and added connections included. Past that, wait 15 minutes without trying: each attempt in the meantime restarts the wait.",
        },
      ],
    },
    accounts: {
      title: "Accounts and households",
      screen: "Overview",
      topics: [
        {
          title: "Individual account and household account",
          body: "The accounts you connect join your active household as individual accounts. In Accounts, at the bottom of the Overview, whoever connected an account can mark it as a household account. Everyone in the household sees the accounts, balances and transactions, whatever the label.",
        },
        {
          title: "No household",
          body: "An account with no household is still yours, but it shows up in no household: only you see it, in Your connections, until you move it to one. It happens when you leave a household or are removed from one.",
        },
        {
          title: "Moving an account",
          body: "In Your connections, Move takes an account to another household you belong to, with its balance and its transaction history. Categorization rules stay behind: the other household's rules apply there. Accounts the same connection lists later go to that household too.",
        },
        {
          title: "When someone leaves",
          body: "A member who leaves or is removed takes along the accounts they connected: those accounts leave the household and wait, with no household, until that person moves them. If the last member leaves, the household is deleted.",
        },
        {
          title: "Bank name",
          body: "Pluggy calls every Meu Pluggy connection MeuPluggy. Use Rename in Your connections to give it your bank's name. Only the name in Feudo changes.",
        },
      ],
    },
    sync: {
      title: "Sync",
      screen: "Overview",
      topics: [
        {
          title: "Once a day",
          body: "Feudo reads every connection once a day, before dawn. The first sync brings up to 12 months of history; after that it reads the most recent days. Connecting a bank or adding a connection syncs it right away. Sync now, above Accounts, reads the household's connections again on the spot, up to 3 times a day per household; it only brings what Meu Pluggy has already updated.",
        },
        {
          title: "Where to see it",
          body: "The Last update column in Accounts shows when Feudo last read each account, and a notice appears when one has gone more than 48 hours without an update. Accounts flags with “Last sync failed” an account whose last sync did not go through, and a notice says why; the button then reads Try again. Your connections shows when each connection last synced.",
        },
        {
          title: "When a sync fails",
          body: "If Meu Pluggy was down, use Try again later, or let the next day's sync try on its own. If your credentials stopped working, remove them in Your connections and paste the new ones in Connect bank; if it then says the connection is already in Feudo, the new credentials were saved anyway. If your bank asks to be reconnected in Meu Pluggy, do it there: Feudo picks it up on the next sync.",
        },
      ],
    },
    transactions: {
      title: "Transactions",
      screen: "Transactions",
      topics: [
        {
          title: "Finding a transaction",
          body: "The screen opens on the current month. Use the arrows to change months and filter by account, category or kind, or search by description. The income and spending totals follow the filters.",
        },
        {
          title: "Categorizing",
          body: "Feudo recognizes many transactions on its own. For the rest, use Categorize and pick a subcategory. To do the same with every transaction whose description contains certain words, check the rule option: the rule becomes the household's, matches whole words, covers only incoming or only outgoing transactions (like the one you are categorizing) and applies to past and future transactions. Back to automatic undoes a choice made by hand.",
        },
        {
          title: "Transactions without a category",
          body: "A transaction without a category counts in no total until it gets one. The banner at the top says how many there are in the month and shows just those.",
        },
        {
          title: "Transfers between the household's accounts are not spending",
          body: "Money moving from one household account to another is not income or spending: it only changed place. Feudo pairs these transfers on its own (same amount, opposite directions, up to two business days apart) and leaves them out of the totals. When it misses one, mark it in Categorize, under Internal transfer.",
        },
        {
          title: "Credit card",
          body: "Each card purchase is spending on its own date, and each installment on the day it falls. Paying the bill is a transfer, not spending, so the same purchase never counts twice.",
        },
      ],
    },
    categories: {
      title: "Categories",
      screen: "Categories and rules",
      topics: [
        {
          title: "Categories and subcategories",
          body: "The categories are fixed, so every household's numbers mean the same thing. Inside each one, your household can create its own subcategories.",
        },
        {
          title: "Why a subcategory's kind matters",
          body: "Every subcategory has a kind: Income, Fixed, Variable or Transfer. Feudo calculates by kind, never by name. Fixed spending makes up the average fixed cost, and the average fixed cost sets the reserve target. A subcategory marked Variable when it is really a fixed expense lowers the target. Change the kind on the Categories screen; it applies to every month.",
        },
        {
          title: "Rules and suggestions",
          body: "The household's rules are listed there, and you can remove any of them. A choice made by hand beats a rule, a rule beats what Feudo recognizes, and that beats the bank's category. Looks like a fixed cost suggests subcategories that repeated with a similar amount in each of the last three months.",
        },
      ],
    },
    overview: {
      title: "Overview",
      screen: "Overview",
      topics: [
        {
          title: "The headline",
          body: "It says how much of its income the household kept in the month. In the current month, the numbers are partial.",
        },
        {
          title: "The tiles",
          body: "Income and Spending add up the month's transactions, with spending split into fixed and variable. The savings rate is the share of income that was not spent. Average fixed cost is the average of the last complete months; with less than three months of history, it is an estimate.",
        },
        {
          title: "Charts and accounts",
          body: "Spending by category shows where the money went in the month, and Last six months compares income and spending month by month. Transfers, transactions without a category and accounts in other currencies stay out of every number. Accounts and Your connections come right below.",
        },
        {
          title: "Analyst's reading",
          body: "Below the charts, an AI analyst writes a short reading of the last closed month, the reserve and the bank comparison, using only the figures Feudo already shows, and lists the figures it used. A new reading arrives at the start of each month; Generate new reading asks for one now, up to three a day for the whole household. It weighs trade-offs and always gives the counter-argument, but it does not change any number and is not investment advice. The same reading appears on Reserve.",
        },
      ],
    },
    reserve: {
      title: "Reserve",
      screen: "Reserve",
      topics: [
        {
          title: "Target",
          body: "The target is the reserve multiple times the average fixed cost, so categorizing well is what makes it right. The owner or an admin changes the multiple at the top of the screen.",
        },
        {
          title: "What is part of the reserve",
          body: "In Accounts and investments, use Adjust to say which accounts make up the reserve. When the product does not tell whether it can be redeemed within one business day, say so there too, and pick the issuing institution when the bank's name does not identify it. Coverage shows how much of the target the reserve holds, in reais, percent and months of fixed cost.",
        },
        {
          title: "Where the next reais should go",
          body: "Only what can be redeemed within one business day and is protected by the FGC, or is Tesouro Selic, enters the ranking, ordered by what it earns after income tax and inflation. Everything else is listed under Also evaluated with the reason. A balance at a payment institution, such as the Nubank, PicPay or Mercado Pago account, has no FGC.",
        },
      ],
    },
    banks: {
      title: "Banks",
      screen: "Banks",
      topics: [
        {
          title: "Candidates and scores",
          body: "Banks shows the three reviewed banks that best fit your household's weights, among the ones you do not use yet. Each criterion gets a score from 0 to 100 from sources Feudo cites and reviews, and the bank's score is the average weighted by the household's weights. A criterion with insufficient evidence stays out of the average and is shown as such. The review date sits under each bank.",
        },
        {
          title: "For and against",
          body: "For and against compare the candidate, criterion by criterion, with the best score the banks you already use reach. Feudo recognizes those banks by the name of each connection; if a connection still says MeuPluggy, whoever made it can rename it to the bank's name.",
        },
        {
          title: "Criteria weights",
          body: "The owner and the admins choose how much each criterion counts, from Doesn't count to Very high, and can go back to Feudo's defaults at any time. At least one criterion has to count.",
        },
      ],
    },
    privacy: {
      title: "Privacy",
      topics: [
        {
          title: "What Feudo reads",
          body: "Only what you connect in Meu Pluggy: accounts, cards and investments, with balances and transactions. It does not move money and does not see your bank password. The account holder's CPF is stored only as an irreversible code, used to tell your accounts from those of the people you share the household with.",
        },
        {
          title: "Stopping",
          body: "In Your connections, removing your credentials stops the sync and destroys them on the spot, and deleting a connection removes its accounts and their transactions. Revoking Feudo's access in Meu Pluggy only stops future syncs: what Feudo has already read stays here until you remove your credentials and delete your connections. After you remove your credentials, your accounts show “Last sync failed”; that is expected.",
        },
        {
          title: "What the analyst receives",
          body: "To write a reading, Feudo sends Anthropic, the company behind the AI model, only the figures it already computed for your household, with their labels: totals, rates, the reserve, the bank comparison. Never transactions, descriptions, account names, documents or your credentials.",
        },
        {
          title: "Export and deletion",
          body: "Downloading your data and deleting your account are on the way; this section will explain both when they arrive.",
        },
      ],
    },
    faq: {
      title: "Frequently asked questions",
      topics: [
        {
          title: "My transaction did not show up",
          body: "Meu Pluggy updates your banks once a day and Feudo reads Meu Pluggy once a day, so a new transaction can take up to two days. Sync now brings it as soon as it reaches Meu Pluggy. Also check the month, clear the filters and make sure the account is in this household.",
        },
        {
          title: "The sync failed",
          body: "See When a sync fails, in Sync. Most of the time the next day's sync fixes it on its own.",
        },
        {
          title: "The invite expired",
          body: "Invites last 24 hours. Ask the household's owner or an admin to send you a new one on the Household screen.",
        },
        {
          title: "I can't see the other members' accounts",
          body: "Each person connects their own banks. The other person needs to connect theirs, in the same household you are working in.",
        },
      ],
    },
  },
};

const ptBR = {
  overline: "Ajuda",
  title: "Como usar o Feudo",
  intro:
    "O que cada tela faz e os passos que ninguém descobre sozinho. Se está chegando agora, comece pelas duas primeiras seções.",
  tocLabel: "Nesta página",
  goTo: "Ir para {screen}",
  sections: {
    firstSteps: {
      title: "Primeiros passos",
      screen: "Casa",
      topics: [
        {
          title: "Crie uma casa ou aceite um convite",
          body: "Depois de confirmar seu e-mail, o Feudo pede que você crie uma casa ou entre numa casa para a qual foi convidado. A casa é onde você e as pessoas com quem divide as finanças acompanham o dinheiro juntas.",
        },
        {
          title: "Convide quem divide as contas com você",
          body: "Na tela Casa, o responsável e os administradores convidam pessoas por e-mail. O convite vale por 24 horas; se expirar, é só mandar um novo.",
        },
        {
          title: "Mais de uma casa",
          body: "Você pode participar de várias casas e trabalha em uma de cada vez. Mude a casa ativa no seletor Casa, na barra de navegação (com o menu lateral expandido; no celular, no topo da tela): todas as telas passam a mostrar os dados dela.",
        },
      ],
    },
    meuPluggy: {
      title: "Conectar seu banco (Meu Pluggy)",
      screen: "Conectar banco",
      topics: [
        {
          title: "Dois sites da Pluggy",
          body: "O Feudo lê seus bancos pelo Meu Pluggy, o serviço gratuito de Open Finance pessoal da Pluggy. No meu.pluggy.ai você conecta seus bancos. As credenciais que o Feudo pede vêm de outro site, o Pluggy Dashboard (dashboard.pluggy.ai), onde você cria uma conta sua.",
        },
        {
          title: "Client id e client secret",
          body: "No Pluggy Dashboard, crie uma aplicação. O client id e o client secret ficam na aba Aplicação. Você cola os dois uma vez só; o Feudo os guarda criptografados e nunca mais os exibe.",
        },
        {
          title: "O que é o Item ID",
          body: "Dentro da aplicação, crie uma conexão com o conector MeuPluggy (não com o do seu banco) e entre com sua conta do Meu Pluggy. Cada banco vira uma conexão, e o Item ID dela, um código no formato 8-4-4-4-12, aparece nos detalhes. Conecte o primeiro banco pelo assistente e os seguintes em Adicionar conexão, que reaproveita as credenciais salvas.",
        },
        {
          title: "Cada pessoa conecta com o próprio CPF",
          body: "O Meu Pluggy é pessoal: uma conta por CPF, só com os bancos daquela pessoa. Por isso cada membro da casa conecta os próprios bancos com as próprias credenciais, e o Feudo nunca as compartilha. Só você vê e administra suas conexões; a casa vê as contas, os saldos e as transações.",
        },
        {
          title: "Consentimento e limite de tentativas",
          body: "Antes da primeira conexão, o Feudo explica o que vai ler e pede sua autorização; cada conexão nova pede a autorização de novo. Dá para fazer 5 tentativas de conexão a cada 15 minutos, contando as que falharam e as conexões adicionadas. Passou disso, espere 15 minutos sem tentar: cada tentativa nesse meio-tempo recomeça a espera.",
        },
      ],
    },
    accounts: {
      title: "Contas e casas",
      screen: "Visão geral",
      topics: [
        {
          title: "Conta individual e conta da casa",
          body: "As contas que você conecta entram na sua casa ativa como conta individual. Em Contas, no fim da Visão geral, quem conectou a conta pode marcá-la como conta da casa. Todos na casa veem as contas, os saldos e as transações, independentemente do rótulo.",
        },
        {
          title: "Sem casa",
          body: "Uma conta sem casa continua sua, mas não aparece em nenhuma casa: só você a vê, em Suas conexões, até movê-la para uma. Isso acontece quando você sai de uma casa ou é removido dela.",
        },
        {
          title: "Mover uma conta",
          body: "Em Suas conexões, Mover leva a conta para outra casa da qual você participa, com o saldo e o histórico de transações. As regras de categorização não vão junto: lá valem as regras da outra casa. As contas que essa conexão trouxer depois também vão para essa casa.",
        },
        {
          title: "Quando alguém sai da casa",
          body: "Quem sai ou é removido leva consigo as contas que conectou: elas saem da casa e ficam sem casa até essa pessoa movê-las. Se o último membro sair, a casa é excluída.",
        },
        {
          title: "Nome do banco",
          body: "A Pluggy chama toda conexão do Meu Pluggy de MeuPluggy. Use Renomear, em Suas conexões, para dar a ela o nome do seu banco. Só muda o nome no Feudo.",
        },
      ],
    },
    sync: {
      title: "Sincronização",
      screen: "Visão geral",
      topics: [
        {
          title: "Uma vez por dia",
          body: "O Feudo lê cada conexão uma vez por dia, de madrugada. A primeira sincronização traz até 12 meses de histórico; depois, ele lê só os dias mais recentes. Ao conectar um banco ou adicionar uma conexão, ela é sincronizada na hora. O botão Sincronizar agora, acima de Contas, lê de novo as conexões da casa na hora, até 3 vezes por dia por casa; ele só traz o que o Meu Pluggy já atualizou.",
        },
        {
          title: "Onde acompanhar",
          body: "Em Contas, a coluna Atualização mostra quando o Feudo leu cada conta pela última vez, e um aviso aparece quando alguma passa de 48 horas sem atualização. O aviso “Última sincronização falhou” marca a conta cuja última leitura não deu certo, e outro aviso explica o motivo; o botão passa a se chamar Tentar de novo. Suas conexões mostra quando cada conexão foi sincronizada pela última vez.",
        },
        {
          title: "Quando a sincronização falha",
          body: "Se o Meu Pluggy estava fora do ar, use Tentar de novo mais tarde ou deixe a sincronização do dia seguinte tentar sozinha. Se suas credenciais pararam de funcionar, remova-as em Suas conexões e cole as novas em Conectar banco; se ele avisar que a conexão já está no Feudo, as credenciais novas foram salvas mesmo assim. Se o seu banco pedir uma nova conexão no Meu Pluggy, refaça por lá: o Feudo pega na próxima sincronização.",
        },
      ],
    },
    transactions: {
      title: "Transações",
      screen: "Transações",
      topics: [
        {
          title: "Encontrar uma transação",
          body: "A tela abre no mês atual. Use as setas para trocar de mês e filtre por conta, categoria ou tipo, ou busque pela descrição. Os totais de renda e gastos acompanham os filtros.",
        },
        {
          title: "Categorizar",
          body: "O Feudo reconhece muitas transações sozinho. Para as outras, use Categorizar e escolha uma subcategoria. Para fazer o mesmo com toda transação cuja descrição tenha certas palavras, marque a opção de regra: ela passa a valer para a casa inteira, procura palavras inteiras, vale só para entradas ou só para saídas (como a transação que você está categorizando) e se aplica às transações passadas e futuras. Voltar ao automático desfaz uma escolha feita à mão.",
        },
        {
          title: "Transações sem categoria",
          body: "Uma transação sem categoria fica fora de todos os totais até ganhar uma. O aviso no topo diz quantas existem no mês e mostra só elas.",
        },
        {
          title: "Transferência entre contas da casa não é gasto",
          body: "Dinheiro que passa de uma conta da casa para outra não é renda nem gasto: só mudou de lugar. O Feudo agrupa essas transferências automaticamente (mesmo valor, sentidos opostos, até dois dias úteis de diferença) e as deixa fora dos totais. Quando ele deixar passar alguma, marque em Categorizar, na parte Transferência interna.",
        },
        {
          title: "Cartão de crédito",
          body: "Cada compra no cartão é gasto na própria data, e cada parcela no dia em que cai. O pagamento da fatura é transferência, não gasto, e assim a mesma compra nunca conta duas vezes.",
        },
      ],
    },
    categories: {
      title: "Categorias",
      screen: "Categorias e regras",
      topics: [
        {
          title: "Categorias e subcategorias",
          body: "As categorias são fixas, para que os números signifiquem a mesma coisa em qualquer casa. Dentro de cada uma, sua casa pode criar as próprias subcategorias.",
        },
        {
          title: "Por que o tipo da subcategoria importa",
          body: "Toda subcategoria tem um tipo: Renda, Fixo, Variável ou Transferência. O Feudo calcula pelo tipo, nunca pelo nome. Os gastos fixos formam o custo fixo médio, e o custo fixo médio define a meta da reserva. Uma subcategoria marcada como Variável quando na verdade é uma despesa fixa diminui a meta. Mude o tipo na tela Categorias; a mudança vale para todos os meses.",
        },
        {
          title: "Regras e sugestões",
          body: "As regras da casa ficam listadas ali, e você pode remover qualquer uma. Uma escolha feita à mão vale mais que uma regra, a regra vale mais que o que o Feudo reconhece, e isso vale mais que a categoria do banco. Parece custo fixo sugere subcategorias que se repetiram com valor parecido em cada um dos últimos três meses.",
        },
      ],
    },
    overview: {
      title: "Visão geral",
      screen: "Visão geral",
      topics: [
        {
          title: "A frase do topo",
          body: "Diz quanto da renda a casa guardou no mês. No mês atual, os números são parciais.",
        },
        {
          title: "Os quadros",
          body: "Renda e Gastos somam as transações do mês, com os gastos divididos entre fixos e variáveis. A taxa de poupança é a parte da renda que não foi gasta. O custo fixo médio é a média dos últimos meses completos; com menos de três meses de histórico, é uma estimativa.",
        },
        {
          title: "Gráficos e contas",
          body: "Gastos por categoria mostra para onde foi o dinheiro no mês, e Últimos seis meses compara renda e gastos mês a mês. Transferências, transações sem categoria e contas em outras moedas ficam fora de todos os números. Logo abaixo vêm Contas e Suas conexões.",
        },
        {
          title: "Leitura do analista",
          body: "Abaixo dos gráficos, um analista de IA escreve uma leitura curta do último mês fechado, da reserva e da comparação de bancos, usando só os números que o Feudo já mostra, e lista os números que usou. Uma leitura nova chega no começo de cada mês; Gerar nova leitura pede uma na hora, até três por dia para a casa toda. Ele pesa os prós e contras e sempre traz o contra-argumento, mas não muda nenhum número e não é recomendação de investimento. A mesma leitura aparece na Reserva.",
        },
      ],
    },
    reserve: {
      title: "Reserva",
      screen: "Reserva",
      topics: [
        {
          title: "Meta",
          body: "A meta é o número de meses de reserva vezes o custo fixo médio, então categorizar bem é o que deixa esse número certo. O responsável pela casa ou um administrador muda os meses no alto da tela.",
        },
        {
          title: "O que faz parte da reserva",
          body: "Em Contas e investimentos, use Ajustar para dizer quais contas fazem parte da reserva. Quando o produto não deixa claro se dá para resgatar em até 1 dia útil, informe ali também, e escolha a instituição emissora quando o nome do banco não bastar. A cobertura mostra quanto da meta a reserva já tem, em reais, em porcentagem e em meses de custo fixo.",
        },
        {
          title: "Onde colocar os próximos reais",
          body: "Só entra no ranking o que resgata em até 1 dia útil e tem proteção do FGC, ou é Tesouro Selic, em ordem do que rende depois do IR e da inflação. O resto aparece em Também avaliados, com o motivo. Saldo em instituição de pagamento, como a conta do Nubank, do PicPay ou do Mercado Pago, não tem FGC.",
        },
      ],
    },
    banks: {
      title: "Bancos",
      screen: "Bancos",
      topics: [
        {
          title: "Candidatos e notas",
          body: "Bancos mostra os três bancos avaliados que mais combinam com os pesos da casa, entre os que vocês ainda não usam. Cada critério recebe uma nota de 0 a 100 com base em fontes citadas e revisadas pelo Feudo, e a nota do banco é a média ponderada pelos pesos da casa. Critério com evidência insuficiente fica fora da média e aparece indicado. A data da revisão aparece embaixo de cada banco.",
        },
        {
          title: "A favor e contra",
          body: "A favor e Contra comparam o candidato, critério por critério, com a melhor nota que os bancos que vocês já usam alcançam. O Feudo reconhece esses bancos pelo nome de cada conexão; se uma conexão ainda se chama MeuPluggy, quem a fez pode renomeá-la com o nome do banco.",
        },
        {
          title: "Pesos dos critérios",
          body: "O responsável e os administradores escolhem quanto cada critério conta, de Não conta a Muito alto, e podem voltar ao padrão do Feudo quando quiserem. Pelo menos um critério precisa contar.",
        },
      ],
    },
    privacy: {
      title: "Privacidade",
      topics: [
        {
          title: "O que o Feudo lê",
          body: "Só o que você conecta no Meu Pluggy: contas, cartões e investimentos, com saldos e transações. Ele não movimenta dinheiro e não vê a senha do seu banco. O CPF do titular é guardado só como um código irreversível, usado para distinguir suas contas das de quem divide a casa com você.",
        },
        {
          title: "Como parar",
          body: "Em Suas conexões, remover suas credenciais interrompe a sincronização e as destrói na hora, e excluir uma conexão remove as contas dela, com todas as transações. Revogar o acesso do Feudo no Meu Pluggy só interrompe as próximas sincronizações: o que o Feudo já leu continua aqui até você remover suas credenciais e excluir suas conexões. Depois de remover as credenciais, suas contas passam a mostrar “Última sincronização falhou”, e isso é esperado.",
        },
        {
          title: "O que o analista recebe",
          body: "Para escrever uma leitura, o Feudo envia à Anthropic, a empresa por trás do modelo de IA, só os números que ele já calculou para a sua casa, com os nomes deles: totais, taxas, a reserva, a comparação de bancos. Nunca transações, descrições, nomes de contas, documentos ou suas credenciais.",
        },
        {
          title: "Exportar e excluir",
          body: "Baixar seus dados e excluir sua conta estão a caminho; esta seção vai explicar os dois quando chegarem.",
        },
      ],
    },
    faq: {
      title: "Perguntas frequentes",
      topics: [
        {
          title: "Minha transação não apareceu",
          body: "O Meu Pluggy atualiza seus bancos uma vez por dia e o Feudo lê o Meu Pluggy uma vez por dia, então uma transação nova pode levar até dois dias. Sincronizar agora traz a transação assim que ela chegar ao Meu Pluggy. Confira também o mês, limpe os filtros e veja se a conta está nesta casa.",
        },
        {
          title: "A sincronização falhou",
          body: "Veja Quando a sincronização falha, em Sincronização. Na maioria das vezes, a sincronização do dia seguinte resolve sozinha.",
        },
        {
          title: "O convite expirou",
          body: "O convite vale por 24 horas. Peça ao responsável pela casa ou a um administrador que mande um novo, na tela Casa.",
        },
        {
          title: "Não vejo as contas de quem divide a casa comigo",
          body: "Cada pessoa conecta os próprios bancos. A outra pessoa precisa conectar os dela, na mesma casa em que você está.",
        },
      ],
    },
  },
} satisfies typeof en;

const guideStrings = { en, ptBR };

export const t = guideStrings.ptBR;
