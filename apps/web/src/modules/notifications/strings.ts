const en = {
  messages: {
    reserveTargetMoved: {
      title: "Reserve target changed",
      body: "{household}: the reserve target moved more than 10% at month close. See it in Reserve.",
    },
    syncFailing: {
      title: "Bank sync is failing",
      body: "{bank} failed to sync three times in a row. See what to do in Your connections, on the Overview.",
    },
    monthlyAnalysisReady: {
      title: "Monthly reading is ready",
      body: "{household}: the analyst reading for {month} is ready.",
    },
    test: {
      title: "Test notification",
      body: "If you can see this, Feudo's notifications reach this device.",
    },
  },
  preferences: {
    sectionTitle: "Notifications",
    switchLabel: "Get notifications on this device",
    description:
      "We let you know when the reserve target moves more than 10%, when one of your bank connections fails three times in a row and when the monthly reading is ready. Notifications never show amounts.",
    enabled: "Notifications are on for this device.",
    disabled: "Notifications are off for this device.",
    denied:
      "This browser is blocking notifications from Feudo. Allow them in the site settings and try again.",
    dismissed: "Notifications only turn on once you allow them when the browser asks. Try again.",
    unsupported: "This browser can't receive notifications.",
    needsHomeScreen:
      "On iPhone, add Feudo to the Home Screen (Share › Add to Home Screen) and open it from there to turn notifications on.",
    failed: "Couldn't turn notifications on. Try again.",
    disableFailed: "Couldn't turn notifications off. Try again.",
    unauthenticated: "Sign in to change your notifications.",
    sendTest: "Send a test notification",
    testSent: "Test notification sent. It should show up in a few seconds.",
    testTooSoon: "Wait a minute before sending another one.",
    testLost: "This device no longer receives notifications. Turn them on again.",
    testFailed: "Couldn't send the test notification. Try again in a minute.",
  },
};

const ptBR = {
  messages: {
    reserveTargetMoved: {
      title: "A meta da reserva mudou",
      body: "{household}: a meta da reserva mudou mais de 10% no fechamento do mês. Veja na Reserva.",
    },
    syncFailing: {
      title: "A sincronização está falhando",
      body: "{bank} não sincronizou nas últimas três tentativas. Veja o que fazer em Suas conexões, na Visão geral.",
    },
    monthlyAnalysisReady: {
      title: "A leitura do mês está pronta",
      body: "{household}: a leitura do analista de {month} está pronta.",
    },
    test: {
      title: "Notificação de teste",
      body: "Se você está vendo isto, as notificações do Feudo chegam neste aparelho.",
    },
  },
  preferences: {
    sectionTitle: "Notificações",
    switchLabel: "Receber notificações neste aparelho",
    description:
      "Avisamos quando a meta da reserva muda mais de 10%, quando uma conexão sua falha três vezes seguidas e quando a leitura do mês fica pronta. As notificações nunca mostram valores.",
    enabled: "Notificações ativadas neste aparelho.",
    disabled: "Notificações desativadas neste aparelho.",
    denied:
      "Este navegador está bloqueando as notificações do Feudo. Libere nas configurações do site e tente de novo.",
    dismissed:
      "As notificações só são ativadas depois que você permite quando o navegador pergunta. Tente de novo.",
    unsupported: "Este navegador não recebe notificações.",
    needsHomeScreen:
      "No iPhone, adicione o Feudo à Tela de Início (Compartilhar › Adicionar à Tela de Início) e abra por lá para ativar as notificações.",
    failed: "Não foi possível ativar as notificações. Tente de novo.",
    disableFailed: "Não foi possível desativar as notificações. Tente de novo.",
    unauthenticated: "Entre para mudar suas notificações.",
    sendTest: "Enviar notificação de teste",
    testSent: "Notificação de teste enviada. Ela deve aparecer em alguns segundos.",
    testTooSoon: "Espere um minuto para enviar outra.",
    testLost: "Este aparelho não recebe mais notificações. Ative-as de novo.",
    testFailed: "Não foi possível enviar a notificação de teste. Tente de novo daqui a um minuto.",
  },
} satisfies typeof en;

const notificationsStrings = { en, ptBR };

export const t = notificationsStrings.ptBR;
