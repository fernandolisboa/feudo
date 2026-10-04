const en = {
  consent: {
    overline: "Step 1 of 3",
    title: "Before connecting a bank",
    paragraphs: [
      "Feudo reads, through Meu Pluggy, the accounts you connect there: checking and savings accounts, credit cards and investment positions, with their balances and transactions. It does not move money, does not see your bank password and does not read anything you have not connected in Meu Pluggy.",
      "Your Meu Pluggy credentials (client id and client secret) are stored encrypted on the server and are never shown again. The account holder's CPF is stored only as an irreversible hash, used to tell your accounts from your partner's.",
      'Accounts you connect are assigned to your active household and labelled "individual account" until you mark them as a household account. Every member of the household sees the accounts, balances and transactions of what you connect, whatever the label.',
      "For the analyst reading, Feudo sends Anthropic only figures it has already calculated for the household and the names of the institutions, never transactions, descriptions, account names or documents.",
      "You can stop at any time: removing your credentials stops synchronization and destroys them immediately; deleting a connection removes its accounts and their transactions. Revoking Feudo's access in Meu Pluggy only stops future syncs: what Feudo has already read stays here until you remove your credentials and delete your connections.",
    ],
    checkbox: "I have read and I authorize Feudo to read the data described above.",
    continue: "Continue",
    version: "Consent text version {version}",
  },
  guide: {
    overline: "Step 2 of 3",
    title: "Set up Meu Pluggy",
    intro:
      "Meu Pluggy is the free personal Open Finance service Feudo reads from. It takes two Pluggy sites: Meu Pluggy, where you connect your banks, and the Pluggy Dashboard, where you get the credentials Feudo asks for next. Both accounts are yours, and Feudo only receives what you connect there.",
    steps: [
      "At Meu Pluggy, create an account with your email and CPF and connect the banks and brokers you want to see in Feudo.",
      "At the Pluggy Dashboard, create a separate account, preferably with the same email. Ignore the 15-day trial notice: it does not apply to personal use.",
      "In the Dashboard, create an application. Its Application tab shows the client id and the client secret.",
      "Inside the application, create a connection with the MeuPluggy connector (not your bank's) and sign in with your Meu Pluggy account. Each bank becomes one connection, and its Item ID is in the connection details.",
    ],
    link: "Open Meu Pluggy",
    dashboardLink: "Open the Pluggy Dashboard",
    continue: "I have my credentials",
    back: "Back",
  },
  form: {
    overline: "Step 3 of 3",
    title: "Paste your credentials",
    intro:
      "Feudo validates the credentials against Meu Pluggy before saving them. They are stored encrypted and never shown again.",
    guideLink: "Not sure where to find these?",
    clientIdLabel: "Client id",
    clientSecretLabel: "Client secret",
    itemIdLabel: "Item ID of the connection",
    itemIdHelp:
      "The Item ID of one MeuPluggy connection in the Pluggy Dashboard, in the 8-4-4-4-12 format.",
    institutionNameLabel: "Bank name",
    institutionNameHelp:
      "How this connection shows in Feudo, for example Itaú. Left blank, Feudo uses the name Pluggy reports, which is MeuPluggy for every Meu Pluggy connection.",
    submit: "Connect and sync",
    submitting: "Connecting…",
    back: "Back",
  },
  wizard: {
    title: "Connect a bank",
    error: {
      message:
        "Couldn't open the bank connection steps right now. Check your connection and try again.",
      retry: "Try again",
    },
  },
  accounts: {
    sectionTitle: "Accounts",
    connectAction: "Connect bank",
    empty: "No account yet. Connect a bank to see balances here.",
    foreignSectionTitle: "Accounts in other currencies",
    foreignNote: "Shown apart and left out of every total.",
    table: {
      institution: "Institution",
      account: "Account",
      type: "Type",
      label: "Label",
      connectedBy: "Connected by",
      updated: "Last update",
      balance: "Balance",
      actions: "Actions",
    },
    types: {
      checking: "Checking",
      savings: "Savings",
      credit_card: "Credit card",
      investment: "Investment",
    },
    labels: {
      individual: "Individual account",
      shared: "Household account",
    },
    rowActions: {
      markShared: "Mark as household account",
      markIndividual: "Mark as individual account",
    },
    syncFailed: "Last sync failed",
    relabelled: "Label updated.",
  },
  freshness: {
    today: "today, {time}",
    yesterday: "yesterday, {time}",
  },
  manualSync: {
    action: "Sync now",
    retry: "Try again",
    pending: "Syncing…",
    remaining: "{remaining} of today's {limit} manual syncs left.",
    remainingOne: "1 of today's {limit} manual syncs left.",
    exhausted: "Your household used today's {limit} manual syncs. The daily sync runs before dawn.",
    done: "Accounts synced.",
    partial: "Some connections did not sync. When there is a reason, it shows in the notice above.",
    failed: "No connection synced. The reason for each shows in the notice above.",
    nothingToSync: "This household has no account to sync.",
    unexpected: "We could not sync now. Try again.",
  },
  syncNotices: {
    staleOne: "One account in this household has not been updated for more than 48 hours.",
    staleMany: "{count} accounts in this household have not been updated for more than 48 hours.",
    failed: "The last sync of {institution} ({person}) failed: {cause}",
    causes: {
      no_credentials:
        "the Meu Pluggy credentials were removed. Only the person who connected it can save them again, in Connect bank.",
      credentials_unreadable:
        "the saved credentials could not be read. The person who connected it needs to remove them and enter them again.",
      invalid_credentials:
        "Meu Pluggy refused the credentials. The person who connected it needs to remove them and enter them again.",
      provider_unavailable: "Meu Pluggy did not answer. Try again later.",
      listing_too_long: "Meu Pluggy returned too much data to read at once. Try again later.",
      timed_out: "the read did not fit in the time available. Try again.",
      too_slow: "Meu Pluggy took too long to answer. Try again later.",
      failed: "something went wrong while saving the data. Try again.",
    },
  },
  connections: {
    sectionTitle: "Your connections",
    intro: "Connections use your Meu Pluggy credentials. Only you see and manage them.",
    noCredentials: "You have no Meu Pluggy credentials saved.",
    credentialsSaved: "Meu Pluggy credentials saved on {date}.",
    addAction: "Add connection",
    removeCredentialsAction: "Remove credentials",
    deleteAction: "Delete connection",
    renameAction: "Rename",
    moveAction: "Move",
    moveActionFor: "Move {account}",
    accountInHousehold: "In {household}",
    accountUnassigned: "No household: nobody sees this account until you move it to one.",
    accountsCount: "{count} accounts",
    syncedAt: "Synced {date}",
    neverSynced: "Never synced",
    syncStopped: "Sync stopped: credentials removed.",
    syncFailedBecause: "Last sync failed: {cause}",
    empty: "No connection yet.",
    addDialog: {
      title: "Add a connection",
      description:
        "Paste the Item ID of another MeuPluggy connection from the Pluggy Dashboard. Your saved credentials are reused.",
      itemIdLabel: "Item ID of the connection",
      submit: "Add and sync",
      cancel: "Cancel",
      added: "Connection added.",
    },
    deleteDialog: {
      title: "Delete the {institution} connection?",
      description:
        "Its accounts disappear from the household right away. Nothing changes in Meu Pluggy.",
      confirm: "Delete",
      cancel: "Cancel",
      deleted: "Connection deleted.",
    },
    renameDialog: {
      title: "Rename the {institution} connection",
      description: "Only the name Feudo shows changes. Nothing changes in Meu Pluggy.",
      label: "Bank name",
      submit: "Save",
      cancel: "Cancel",
      renamed: "Connection renamed.",
    },
    moveDialog: {
      title: "Move {account} to another household",
      description:
        "Its balance and transaction history go with it, including internal-transfer marks and categories chosen by hand, except ones the source household created for itself. Categorization rules don't: the other household's own rules apply there. Accounts this connection lists later go to the same household.",
      label: "Household",
      submit: "Move",
      cancel: "Cancel",
      moved: "Account moved.",
    },
    removeCredentialsDialog: {
      title: "Remove your Meu Pluggy credentials?",
      description:
        "Synchronization stops and the credentials are destroyed immediately. Accounts stay as they are until you delete their connections.",
      confirm: "Remove",
      cancel: "Cancel",
      removed: "Credentials removed.",
    },
  },
  errors: {
    invalidInput: "Check the information and try again.",
    unauthenticated: "Sign in again to continue.",
    consentRequired: "Accept the consent step again before connecting.",
    invalidCredentials: "Meu Pluggy did not accept these credentials.",
    itemNotFound: "No connection with this Item ID was found in your Meu Pluggy account.",
    alreadyConnected: "This connection is already in Feudo.",
    providerUnavailable: "Meu Pluggy did not answer. Try again in a few minutes.",
    rateLimited:
      "Too many connection attempts. Wait 15 minutes before trying again: every attempt in the meantime restarts the wait.",
    noCredentials: "Save your Meu Pluggy credentials first.",
    credentialsUnreadable:
      "We could not read your saved credentials. Remove them and enter them again.",
    connectionNotFound: "This connection no longer exists.",
    accountNotFound: "This account no longer exists or is not yours to relabel.",
    accountNotMovable: "This account no longer exists or is not yours to move.",
    notAMember: "You are no longer a member of that household.",
    moveFailed: "We could not move this account. Try again.",
    connectFailed: "We could not save this connection. Try again.",
    misconfigured: "The server is not configured for bank connections yet.",
  },
};

const ptBR = {
  consent: {
    overline: "Passo 1 de 3",
    title: "Antes de conectar um banco",
    paragraphs: [
      "O Feudo lê, pelo Meu Pluggy, as contas que você conecta lá: contas correntes e poupanças, cartões de crédito e posições de investimento, com saldos e transações. Ele não movimenta dinheiro, não vê a senha do seu banco e não lê nada que você não tenha conectado no Meu Pluggy.",
      "Suas credenciais do Meu Pluggy (client id e client secret) ficam guardadas criptografadas no servidor e nunca são exibidas de novo. O CPF do titular é guardado só como um hash irreversível, usado para distinguir suas contas das do seu parceiro ou parceira.",
      "As contas que você conecta entram na sua casa ativa com o rótulo “conta individual” até você marcá-las como conta da casa. Todos os membros da casa veem as contas, os saldos e as transações do que você conectar, qualquer que seja o rótulo.",
      "Para a leitura do analista, o Feudo envia à Anthropic só os números que ele mesmo calculou para a casa e os nomes das instituições, nunca transações, descrições, nomes de contas ou documentos.",
      "Você pode parar quando quiser: remover suas credenciais interrompe a sincronização e as destrói na hora; excluir uma conexão remove as contas dela, com as transações. Revogar o acesso do Feudo no Meu Pluggy só interrompe as próximas sincronizações: o que o Feudo já leu continua aqui até você remover suas credenciais e excluir suas conexões.",
    ],
    checkbox: "Li e autorizo o Feudo a ler os dados descritos acima.",
    continue: "Continuar",
    version: "Versão do texto de consentimento: {version}",
  },
  guide: {
    overline: "Passo 2 de 3",
    title: "Configure o Meu Pluggy",
    intro:
      "O Meu Pluggy é o serviço gratuito de Open Finance pessoal de onde o Feudo lê seus dados. São dois sites da Pluggy: o Meu Pluggy, onde você conecta seus bancos, e o Pluggy Dashboard, onde você pega as credenciais que o Feudo pede no próximo passo. As duas contas são suas, e o Feudo só recebe o que você conectar lá.",
    steps: [
      "No Meu Pluggy, crie uma conta com seu e-mail e CPF e conecte os bancos e corretoras que você quer ver no Feudo.",
      "No Pluggy Dashboard, crie outra conta, de preferência com o mesmo e-mail. Pode ignorar o aviso de teste de 15 dias: ele não vale para uso pessoal.",
      "No Dashboard, crie uma aplicação. O client id e o client secret ficam na aba Aplicação.",
      "Dentro da aplicação, crie uma conexão com o conector MeuPluggy (não com o do seu banco) e entre com sua conta do Meu Pluggy. Cada banco vira uma conexão, e o Item ID aparece nos detalhes dela.",
    ],
    link: "Abrir o Meu Pluggy",
    dashboardLink: "Abrir o Pluggy Dashboard",
    continue: "Já tenho minhas credenciais",
    back: "Voltar",
  },
  form: {
    overline: "Passo 3 de 3",
    title: "Cole suas credenciais",
    intro:
      "O Feudo valida as credenciais no Meu Pluggy antes de salvar. Elas ficam criptografadas e nunca são exibidas de novo.",
    guideLink: "Não sabe onde achar isso?",
    clientIdLabel: "Client id",
    clientSecretLabel: "Client secret",
    itemIdLabel: "Item ID da conexão",
    itemIdHelp: "O Item ID de uma conexão MeuPluggy no Pluggy Dashboard, no formato 8-4-4-4-12.",
    institutionNameLabel: "Nome do banco",
    institutionNameHelp:
      "Como a conexão aparece no Feudo, por exemplo Itaú. Se ficar em branco, o Feudo usa o nome que a Pluggy informa, que é MeuPluggy em todas as conexões do Meu Pluggy.",
    submit: "Conectar e sincronizar",
    submitting: "Conectando…",
    back: "Voltar",
  },
  wizard: {
    title: "Conectar banco",
    error: {
      message:
        "Não deu para abrir os passos de conexão agora. Confira sua conexão e tente de novo.",
      retry: "Tentar de novo",
    },
  },
  accounts: {
    sectionTitle: "Contas",
    connectAction: "Conectar banco",
    empty: "Nenhuma conta ainda. Conecte um banco para ver os saldos aqui.",
    foreignSectionTitle: "Contas em outras moedas",
    foreignNote: "Mostradas à parte e fora de qualquer total.",
    table: {
      institution: "Instituição",
      account: "Conta",
      type: "Tipo",
      label: "Rótulo",
      connectedBy: "Conectada por",
      updated: "Atualização",
      balance: "Saldo",
      actions: "Ações",
    },
    types: {
      checking: "Conta corrente",
      savings: "Poupança",
      credit_card: "Cartão de crédito",
      investment: "Investimento",
    },
    labels: {
      individual: "Conta individual",
      shared: "Conta da casa",
    },
    rowActions: {
      markShared: "Marcar como conta da casa",
      markIndividual: "Marcar como conta individual",
    },
    syncFailed: "Última sincronização falhou",
    relabelled: "Rótulo atualizado.",
  },
  freshness: {
    today: "hoje, {time}",
    yesterday: "ontem, {time}",
  },
  manualSync: {
    action: "Sincronizar agora",
    retry: "Tentar de novo",
    pending: "Sincronizando…",
    remaining: "Restam {remaining} das {limit} sincronizações manuais de hoje.",
    remainingOne: "Resta 1 das {limit} sincronizações manuais de hoje.",
    exhausted:
      "Sua casa já usou as {limit} sincronizações manuais de hoje. A sincronização diária roda de madrugada.",
    done: "Contas sincronizadas.",
    partial: "Algumas conexões não sincronizaram. Quando há um motivo, ele aparece no aviso acima.",
    failed: "Nenhuma conexão sincronizou. O motivo de cada uma aparece no aviso acima.",
    nothingToSync: "Esta casa não tem contas para sincronizar.",
    unexpected: "Não foi possível sincronizar agora. Tente de novo.",
  },
  syncNotices: {
    staleOne: "Uma conta desta casa está sem atualização há mais de 48 horas.",
    staleMany: "{count} contas desta casa estão sem atualização há mais de 48 horas.",
    failed: "A última sincronização de {institution} ({person}) falhou: {cause}",
    causes: {
      no_credentials:
        "as credenciais do Meu Pluggy foram removidas. Só quem conectou pode salvá-las de novo, em Conectar banco.",
      credentials_unreadable:
        "não foi possível ler as credenciais salvas. Quem conectou precisa removê-las e informá-las de novo.",
      invalid_credentials:
        "o Meu Pluggy recusou as credenciais. Quem conectou precisa removê-las e informá-las de novo.",
      provider_unavailable: "o Meu Pluggy não respondeu. Tente de novo mais tarde.",
      listing_too_long:
        "o Meu Pluggy devolveu dados demais para ler de uma vez. Tente de novo mais tarde.",
      timed_out: "a leitura não coube no tempo disponível. Tente de novo.",
      too_slow: "o Meu Pluggy demorou demais para responder. Tente de novo mais tarde.",
      failed: "algo deu errado ao salvar os dados. Tente de novo.",
    },
  },
  connections: {
    sectionTitle: "Suas conexões",
    intro: "As conexões usam suas credenciais do Meu Pluggy. Só você as vê e administra.",
    noCredentials: "Você não tem credenciais do Meu Pluggy salvas.",
    credentialsSaved: "Credenciais do Meu Pluggy salvas em {date}.",
    addAction: "Adicionar conexão",
    removeCredentialsAction: "Remover credenciais",
    deleteAction: "Excluir conexão",
    renameAction: "Renomear",
    moveAction: "Mover",
    moveActionFor: "Mover {account}",
    accountInHousehold: "Em {household}",
    accountUnassigned: "Sem casa: ninguém vê esta conta até você movê-la para uma casa.",
    accountsCount: "{count} contas",
    syncedAt: "Sincronizada em {date}",
    neverSynced: "Nunca sincronizada",
    syncStopped: "Sincronização interrompida: credenciais removidas.",
    syncFailedBecause: "Última sincronização falhou: {cause}",
    empty: "Nenhuma conexão ainda.",
    addDialog: {
      title: "Adicionar conexão",
      description:
        "Cole o Item ID de outra conexão MeuPluggy do Pluggy Dashboard. Suas credenciais salvas são reaproveitadas.",
      itemIdLabel: "Item ID da conexão",
      submit: "Adicionar e sincronizar",
      cancel: "Cancelar",
      added: "Conexão adicionada.",
    },
    deleteDialog: {
      title: "Excluir a conexão com {institution}?",
      description: "As contas dela somem da casa na hora. Nada muda no Meu Pluggy.",
      confirm: "Excluir",
      cancel: "Cancelar",
      deleted: "Conexão excluída.",
    },
    renameDialog: {
      title: "Renomear a conexão {institution}",
      description: "Muda só o nome que o Feudo mostra. Nada muda no Meu Pluggy.",
      label: "Nome do banco",
      submit: "Salvar",
      cancel: "Cancelar",
      renamed: "Conexão renomeada.",
    },
    moveDialog: {
      title: "Mover {account} para outra casa",
      description:
        "O saldo e o histórico de transações vão junto, inclusive as marcações de transferência interna e as categorias escolhidas à mão, menos as que a casa de origem criou para si. As regras de categorização não vão: lá valem as regras da outra casa. As contas que essa conexão passar a listar depois também vão para essa casa.",
      label: "Casa",
      submit: "Mover",
      cancel: "Cancelar",
      moved: "Conta movida.",
    },
    removeCredentialsDialog: {
      title: "Remover suas credenciais do Meu Pluggy?",
      description:
        "A sincronização para e as credenciais são destruídas na hora. As contas continuam como estão até você excluir as conexões.",
      confirm: "Remover",
      cancel: "Cancelar",
      removed: "Credenciais removidas.",
    },
  },
  errors: {
    invalidInput: "Confira os dados informados e tente novamente.",
    unauthenticated: "Entre novamente para continuar.",
    consentRequired: "Aceite o passo de consentimento de novo antes de conectar.",
    invalidCredentials: "O Meu Pluggy não aceitou essas credenciais.",
    itemNotFound: "Nenhuma conexão com esse Item ID foi encontrada na sua conta do Meu Pluggy.",
    alreadyConnected: "Essa conexão já está no Feudo.",
    providerUnavailable: "O Meu Pluggy não respondeu. Tente de novo em alguns minutos.",
    rateLimited:
      "Muitas tentativas de conexão. Espere 15 minutos antes de tentar de novo: cada tentativa nesse meio-tempo recomeça a espera.",
    noCredentials: "Salve suas credenciais do Meu Pluggy primeiro.",
    credentialsUnreadable:
      "Não foi possível ler as credenciais salvas. Remova as credenciais e informe-as de novo.",
    connectionNotFound: "Essa conexão não existe mais.",
    accountNotFound: "Essa conta não existe mais ou não é sua para rotular.",
    accountNotMovable: "Essa conta não existe mais ou não é sua para mover.",
    notAMember: "Você não faz mais parte dessa casa.",
    moveFailed: "Não foi possível mover essa conta. Tente novamente.",
    connectFailed: "Não foi possível salvar essa conexão. Tente novamente.",
    misconfigured: "O servidor ainda não está configurado para conexões bancárias.",
  },
} satisfies typeof en;

const syncStrings = { en, ptBR };

export const t = syncStrings.ptBR;

export const MEU_PLUGGY_URL = "https://meu.pluggy.ai";
export const PLUGGY_DASHBOARD_URL = "https://dashboard.pluggy.ai";
