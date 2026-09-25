const en = {
  consent: {
    overline: "Step 1 of 3",
    title: "Before connecting a bank",
    paragraphs: [
      "Feudo reads, through Meu Pluggy, the accounts you connect there: checking and savings accounts, credit cards and investment positions, with their balances and transactions. It does not move money, does not see your bank password and does not read anything you have not connected in Meu Pluggy.",
      "Your Meu Pluggy credentials (client id and client secret) are stored encrypted on the server and are never shown again. The account holder's CPF is stored only as an irreversible hash, used to tell your accounts from your partner's.",
      'Accounts you connect are assigned to your active household and labelled "individual account" until you mark them as a household account. Other members of the household see the accounts and balances of what you connect.',
      "You can stop at any time: removing your credentials stops synchronization and destroys them immediately; deleting a connection removes its accounts. Revoking Feudo's access in Meu Pluggy has the same effect.",
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
      updated: "Updated",
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
    accountInHousehold: "In {household}",
    accountUnassigned: "No household: nobody sees this account until you move it to one.",
    accountsCount: "{count} accounts",
    syncedAt: "Synced {date}",
    neverSynced: "Never synced",
    syncStopped: "Sync stopped: credentials removed.",
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
        "Its balance and transaction history go with it. Accounts this connection lists later go to the same household.",
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
      "As contas que você conecta entram na sua casa ativa com o rótulo “conta individual” até você marcá-las como conta da casa. Os outros membros da casa veem as contas e os saldos do que você conectar.",
      "Você pode parar quando quiser: remover suas credenciais interrompe a sincronização e as destrói na hora; excluir uma conexão remove as contas dela. Revogar o acesso do Feudo no Meu Pluggy tem o mesmo efeito.",
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
      updated: "Atualizada em",
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
    accountInHousehold: "Em {household}",
    accountUnassigned: "Sem casa: ninguém vê esta conta até você movê-la para uma casa.",
    accountsCount: "{count} contas",
    syncedAt: "Sincronizada em {date}",
    neverSynced: "Nunca sincronizada",
    syncStopped: "Sincronização interrompida: credenciais removidas.",
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
        "O saldo e o histórico de transações vão junto. As contas que essa conexão passar a listar depois também vão para essa casa.",
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
    connectFailed: "Não foi possível salvar essa conexão. Tente novamente.",
    misconfigured: "O servidor ainda não está configurado para conexões bancárias.",
  },
} satisfies typeof en;

const syncStrings = { en, ptBR };

export const t = syncStrings.ptBR;

export const MEU_PLUGGY_URL = "https://meu.pluggy.ai";
export const PLUGGY_DASHBOARD_URL = "https://dashboard.pluggy.ai";
