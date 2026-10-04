const en = {
  nav: {
    overview: "Overview",
    transactions: "Transactions",
    reserve: "Reserve",
    banks: "Banks",
    household: "Household",
    comingSoon: "Coming soon",
    collapseSidebar: "Collapse sidebar",
    expandSidebar: "Expand sidebar",
  },
  userMenu: {
    preferences: "Preferences",
    guide: "How to use",
    tour: "Tour this screen",
  },
  tour: {
    progress: "{step} of {total}",
    back: "Back",
    next: "Next",
    skip: "Skip tour",
    finish: "Done",
    neverShow: "Don't show tutorials",
    fullGuide: "Read the full guide",
    steps: {
      overview: {
        nav: {
          title: "Where everything lives",
          body: "Overview sums up the household's month. Transactions lists every entry, Reserve shows how much to keep for emergencies.",
        },
        household: {
          title: "Your household",
          body: "Household holds the members and the invites. If you belong to more than one household, change the active one in the household switcher.",
        },
        accounts: {
          title: "Your accounts",
          body: "These are the accounts your connections brought in and the household each one belongs to. Move takes an account to another household of yours. No connection yet? Start with Connect bank.",
        },
        help: {
          title: "Help whenever you need it",
          body: "Your menu has How to use, the full guide, and Tour this screen, to see this walkthrough again.",
        },
      },
      transactions: {
        month: {
          title: "Month",
          body: "Change the month here. The list always opens on the current month.",
        },
        account: {
          title: "One account or all",
          body: "See a single account, or every account in the household together. Search, kind and category narrow it further.",
        },
        category: {
          title: "Categorize",
          body: "Fix a transaction's category here. When you choose one, you can also turn it into a household rule for similar transactions.",
        },
        totals: {
          title: "Month totals",
          body: "Income and spending follow the active filters. Transfers between the household's own accounts don't count as spending.",
        },
      },
      categories: {
        rules: {
          title: "Household rules",
          body: "Each rule categorizes the transactions whose description contains its text. It applies to the whole household, and you can remove it at any time.",
        },
        kind: {
          title: "Fixed or variable",
          body: "A subcategory's kind decides what goes into the average fixed cost, which drives the reserve target.",
        },
        add: {
          title: "Your own subcategories",
          body: "Create subcategories for your household inside Feudo's categories.",
        },
      },
      household: {
        members: {
          title: "Who's in",
          body: "Everyone has a role. The person responsible and admins invite and remove people; every member sees the household's accounts and transactions.",
        },
        invite: {
          title: "Invite someone",
          body: "Send an invite by email with the person's role. The link is valid for 24 hours.",
        },
        invitations: {
          title: "Pending invites",
          body: "Invites waiting for an answer show up here. If one expires, send a new invite.",
        },
      },
    },
  },
  preferences: {
    title: "Tutorials",
    autoStartLabel: "Show tutorials automatically",
    autoStartDescription: "Each screen shows a short walkthrough the first time you open it.",
    autoStartOn: "Tutorials will show automatically.",
    autoStartOff: "Tutorials won't show automatically. You can still open one from your menu.",
    reset: "Replay all tutorials",
    resetDescription: "Every screen shows its walkthrough again on your next visit.",
    resetDone: "Done. Each screen will show its walkthrough again.",
    failed: "Could not save. Try again.",
    unauthenticated: "Sign in to change this.",
  },
  routeError: {
    overline: "Something went wrong",
    title: "Couldn't open this page",
    message: "Something failed on our side. Your data is safe. Try again in a moment.",
    offlineMessage:
      "You're offline, so nothing was changed. Try again when the connection is back.",
    retry: "Try again",
  },
  notFound: {
    title: "Page not found",
    body: "This address doesn't exist in Feudo. It may have been typed wrong or moved.",
    action: "Go to the overview",
  },
  offline: {
    unavailable: "You're offline. Nothing can be changed until the connection is back.",
    copy: "This screen is a copy kept on this device.",
    lastUpdated: "Last updated: {when}.",
    today: "today, {time}",
    yesterday: "yesterday, {time}",
    refresh: "Update",
    retry: "Try again",
    writeBlocked: "Nothing was saved: you're offline.",
    fallbackTitle: "No connection",
    fallbackBody:
      "Without internet, Feudo only shows the screens you opened on this device in the last 24 hours, and only until you sign out. This one isn't among them.",
    fallbackRetry: "Try again",
  },
};

const ptBR = {
  nav: {
    overview: "Visão geral",
    transactions: "Transações",
    reserve: "Reserva",
    banks: "Bancos",
    household: "Casa",
    comingSoon: "Em breve",
    collapseSidebar: "Recolher menu",
    expandSidebar: "Expandir menu",
  },
  userMenu: {
    preferences: "Preferências",
    guide: "Como usar",
    tour: "Ver tour desta tela",
  },
  tour: {
    progress: "{step} de {total}",
    back: "Voltar",
    next: "Próximo",
    skip: "Pular tour",
    finish: "Concluir",
    neverShow: "Não mostrar tutoriais",
    fullGuide: "Ver o guia completo",
    steps: {
      overview: {
        nav: {
          title: "Onde fica cada coisa",
          body: "A Visão geral resume o mês da casa. Em Transações está cada lançamento, e a Reserva mostra quanto guardar para emergências.",
        },
        household: {
          title: "Sua casa",
          body: "Em Casa ficam os membros e os convites. Se você participa de mais de uma casa, troque a casa ativa no seletor de casas.",
        },
        accounts: {
          title: "Suas contas",
          body: "Aqui estão as contas que suas conexões trouxeram e a casa de cada uma. Mover leva uma conta para outra casa sua. Ainda sem conexão? Comece por Conectar banco.",
        },
        help: {
          title: "Ajuda quando precisar",
          body: "No seu menu tem o Como usar, com o guia completo, e o Ver tour desta tela, para rever este passo a passo.",
        },
      },
      transactions: {
        month: {
          title: "Mês",
          body: "Troque o mês por aqui. A lista sempre abre no mês atual.",
        },
        account: {
          title: "Uma conta ou todas",
          body: "Veja uma conta só ou todas as da casa juntas. Busca, tipo e categoria afinam ainda mais.",
        },
        category: {
          title: "Categorizar",
          body: "Corrija a categoria de uma transação por aqui. Ao escolher, dá para transformar a escolha em regra da casa para as transações parecidas.",
        },
        totals: {
          title: "Totais do mês",
          body: "Entradas e saídas acompanham os filtros ativos. Transferências entre contas da própria casa não contam como gasto.",
        },
      },
      categories: {
        rules: {
          title: "Regras da casa",
          body: "Cada regra categoriza sozinha as transações cuja descrição contém o texto dela. Vale para a casa toda, e você pode remover quando quiser.",
        },
        kind: {
          title: "Fixo ou variável",
          body: "O tipo de cada subcategoria define o que entra no custo fixo médio, que é a base da meta da reserva.",
        },
        add: {
          title: "Subcategorias da casa",
          body: "Crie subcategorias próprias dentro das categorias do Feudo.",
        },
      },
      household: {
        members: {
          title: "Quem participa",
          body: "Cada pessoa tem um papel. Responsável e administradores convidam e removem pessoas, e todo membro vê as contas e transações da casa.",
        },
        invite: {
          title: "Convidar alguém",
          body: "Mande um convite por email já com o papel da pessoa. O link vale por 24 horas.",
        },
        invitations: {
          title: "Convites pendentes",
          body: "Os convites que ainda esperam resposta ficam aqui. Se um expirar, envie um convite novo.",
        },
      },
    },
  },
  preferences: {
    title: "Tutoriais",
    autoStartLabel: "Mostrar tutoriais automaticamente",
    autoStartDescription:
      "Cada tela mostra um passo a passo curto na primeira vez que você a abre.",
    autoStartOn: "Os tutoriais vão aparecer automaticamente.",
    autoStartOff:
      "Os tutoriais não vão mais aparecer sozinhos. Você ainda pode abrir pelo seu menu.",
    reset: "Rever todos os tutoriais",
    resetDescription: "Cada tela volta a mostrar o passo a passo na próxima visita.",
    resetDone: "Pronto. Cada tela vai mostrar o passo a passo de novo.",
    failed: "Não deu para salvar. Tente de novo.",
    unauthenticated: "Entre para alterar isso.",
  },
  routeError: {
    overline: "Algo deu errado",
    title: "Não deu para abrir esta página",
    message: "Algo falhou do nosso lado. Seus dados estão seguros. Tente de novo daqui a pouco.",
    offlineMessage:
      "Você está sem conexão: nada foi alterado. Tente de novo quando a internet voltar.",
    retry: "Tentar de novo",
  },
  notFound: {
    title: "Página não encontrada",
    body: "Este endereço não existe no Feudo. Ele pode ter sido digitado errado ou mudado de lugar.",
    action: "Ir para a visão geral",
  },
  offline: {
    unavailable: "Você está sem conexão. Nada pode ser alterado até a internet voltar.",
    copy: "Esta tela é uma cópia guardada neste aparelho.",
    lastUpdated: "Última atualização: {when}.",
    today: "hoje, {time}",
    yesterday: "ontem, {time}",
    refresh: "Atualizar",
    retry: "Tentar de novo",
    writeBlocked: "Nada foi salvo: você está sem conexão.",
    fallbackTitle: "Sem conexão",
    fallbackBody:
      "Sem internet, o Feudo só mostra as telas que você abriu neste aparelho nas últimas 24 horas, e só até você sair. Esta não está entre elas.",
    fallbackRetry: "Tentar de novo",
  },
} satisfies typeof en;

const appShellStrings = { en, ptBR };

export const t = appShellStrings.ptBR;
