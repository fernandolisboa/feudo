const en = {
  deleteAccount: {
    sectionTitle: "Delete your account",
    description:
      "Your account is hidden and you are signed out of every device right away, and your Meu Pluggy credentials are destroyed at once. For 7 days you can still cancel by signing in again; after that your account, your bank connections and their transactions are erased from every household you belong to.",
    action: "Delete my account",
    dialog: {
      title: "Delete your account?",
      description:
        "Until {date} you can cancel by signing in again. If you cancel, you will need to enter your Meu Pluggy credentials again.",
      households: "What changes in each household",
      noHouseholds: "You are not in any household, so no household loses data.",
      confirm: "Delete my account",
      cancel: "Keep my account",
    },
    household: {
      losesMonths: "{household} loses the transactions of {months}.",
      losesAccountsOnly:
        "{household} loses the accounts you connected, which have no transactions.",
      losesNothing: "{household} has no account of yours, so it loses no data.",
      successor: "{name} becomes the owner.",
      deleted: "You are the only member, so the household is erased too.",
      membersTold: "The other members get an email saying which months lose data.",
    },
  },
  pending: {
    title: "Account deletion scheduled",
    subtitle: "Your account will be erased on {date}.",
    signedOutSubtitle: "Your request was received.",
    signedOutBody:
      "Your account will be erased in 7 days. To cancel, sign in again before then. Your Meu Pluggy credentials were already destroyed.",
    body: "Until then you can cancel. Your account comes back as it was, except for the Meu Pluggy credentials, which were destroyed and must be entered again to resume syncing.",
    cancel: "Cancel deletion",
    signOut: "Sign out",
    signIn: "Sign in",
    cancelled: "Deletion cancelled.",
  },
  months: {
    range: "{from} to {to}",
    and: " and ",
  },
  requestedEmail: {
    subject: "Your Feudo account will be erased on {date}",
    text: "We received your request to delete your Feudo account. On {date} it is erased for good, together with the bank connections you made and their transactions. Your Meu Pluggy credentials were already destroyed and you were signed out of every device.\n\nChanged your mind? Sign in before {date} and cancel: {url}\n\nIf you didn't ask for this, sign in now and cancel.",
    html: '<p>We received your request to delete your Feudo account. On {date} it is erased for good, together with the bank connections you made and their transactions. Your Meu Pluggy credentials were already destroyed and you were signed out of every device.</p><p>Changed your mind? <a href="{url}">Sign in before {date} and cancel</a>.</p><p>If you didn\'t ask for this, sign in now and cancel.</p>',
  },
  memberEmail: {
    subject: "{name} is leaving the {household} household on Feudo",
    text: "{name} asked to delete their Feudo account. {summary}\n\nUntil then, {name} can still cancel the deletion.",
    html: "<p>{name} asked to delete their Feudo account. {summary}</p><p>Until then, {name} can still cancel the deletion.</p>",
    losesMonths:
      "On {date}, the bank accounts {name} connected leave {household}, and with them the transactions of {months}.",
    losesAccountsOnly:
      "On {date}, the bank accounts {name} connected leave {household}. They have no transactions, so no month loses data.",
    losesNothing:
      "{name} connected no bank account to {household}, so no month loses data when the account is erased on {date}.",
    successor: "{successor} becomes the owner of the household.",
  },
  errors: {
    unauthenticated: "Sign in again to continue.",
    requestFailed: "We couldn't schedule the deletion. Try again.",
    cancelFailed: "We couldn't cancel the deletion. Try again.",
    notPending: "This account is no longer scheduled for deletion.",
  },
};

const ptBR = {
  deleteAccount: {
    sectionTitle: "Excluir seu cadastro",
    description:
      "Seu cadastro fica oculto e você sai de todos os aparelhos na hora, e suas credenciais do Meu Pluggy são destruídas imediatamente. Durante 7 dias, você ainda pode cancelar entrando de novo; depois disso, seu cadastro, suas conexões bancárias e as transações delas são apagadas de todas as casas de que você participa.",
    action: "Excluir meu cadastro",
    dialog: {
      title: "Excluir seu cadastro?",
      description:
        "Até {date}, você pode cancelar entrando de novo. Se cancelar, vai precisar informar outra vez suas credenciais do Meu Pluggy.",
      households: "O que muda em cada casa",
      noHouseholds: "Você não está em nenhuma casa, então nenhuma casa perde dados.",
      confirm: "Excluir meu cadastro",
      cancel: "Manter meu cadastro",
    },
    household: {
      losesMonths: "{household} perde as transações de {months}.",
      losesAccountsOnly: "{household} perde as contas que você conectou, que não têm transações.",
      losesNothing: "{household} não tem contas suas, então não perde dados.",
      successor: "{name} passa a ser o responsável.",
      deleted: "Você é o único membro, então a casa também é apagada.",
      membersTold: "Os outros membros recebem um e-mail dizendo quais meses perdem dados.",
    },
  },
  pending: {
    title: "Exclusão do cadastro agendada",
    subtitle: "Seu cadastro será apagado em {date}.",
    signedOutSubtitle: "Recebemos seu pedido.",
    signedOutBody:
      "Seu cadastro será apagado em 7 dias. Para cancelar, entre de novo antes disso. Suas credenciais do Meu Pluggy já foram destruídas.",
    body: "Até lá, você pode cancelar. Seu cadastro volta como estava, menos as credenciais do Meu Pluggy, que foram destruídas e precisam ser informadas de novo para voltar a sincronizar.",
    cancel: "Cancelar exclusão",
    signOut: "Sair",
    signIn: "Entrar",
    cancelled: "Exclusão cancelada.",
  },
  months: {
    range: "{from} a {to}",
    and: " e ",
  },
  requestedEmail: {
    subject: "Seu cadastro no Feudo será apagado em {date}",
    text: "Recebemos seu pedido para excluir seu cadastro no Feudo. Em {date}, ele é apagado de vez, junto com as conexões bancárias que você fez e as transações delas. Suas credenciais do Meu Pluggy já foram destruídas e você saiu de todos os aparelhos.\n\nMudou de ideia? Entre antes de {date} e cancele: {url}\n\nSe não foi você que pediu, entre agora e cancele.",
    html: '<p>Recebemos seu pedido para excluir seu cadastro no Feudo. Em {date}, ele é apagado de vez, junto com as conexões bancárias que você fez e as transações delas. Suas credenciais do Meu Pluggy já foram destruídas e você saiu de todos os aparelhos.</p><p>Mudou de ideia? <a href="{url}">Entre antes de {date} e cancele</a>.</p><p>Se não foi você que pediu, entre agora e cancele.</p>',
  },
  memberEmail: {
    subject: "{name} vai sair da casa {household} no Feudo",
    text: "{name} pediu para excluir o cadastro no Feudo. {summary}\n\nAté lá, {name} ainda pode cancelar a exclusão.",
    html: "<p>{name} pediu para excluir o cadastro no Feudo. {summary}</p><p>Até lá, {name} ainda pode cancelar a exclusão.</p>",
    losesMonths:
      "Em {date}, as contas bancárias que {name} conectou saem da casa {household}, e com elas as transações de {months}.",
    losesAccountsOnly:
      "Em {date}, as contas bancárias que {name} conectou saem da casa {household}. Elas não têm transações, então nenhum mês perde dados.",
    losesNothing:
      "{name} não conectou contas bancárias à casa {household}, então nenhum mês perde dados quando o cadastro for apagado, em {date}.",
    successor: "{successor} passa a ser o responsável pela casa.",
  },
  errors: {
    unauthenticated: "Entre novamente para continuar.",
    requestFailed: "Não foi possível agendar a exclusão. Tente novamente.",
    cancelFailed: "Não foi possível cancelar a exclusão. Tente novamente.",
    notPending: "Este cadastro não está mais agendado para exclusão.",
  },
} satisfies typeof en;

const privacyStrings = { en, ptBR };

export const t = privacyStrings.ptBR;
