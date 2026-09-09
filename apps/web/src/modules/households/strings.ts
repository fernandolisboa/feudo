const en = {
  onboarding: {
    overline: "Step 2 of 2",
    title: "Create your household",
    subtitle: "The household is where you and the people you share money with keep the ledger.",
    nameLabel: "Household name",
    namePlaceholder: "Our household",
    timeZoneLabel: "Time zone",
    reserveMultipleLabel: "Reserve multiple",
    reserveMultipleHelp: "How many months of fixed cost the emergency reserve should cover.",
    submit: "Create household",
  },
  switcher: {
    label: "Household",
  },
  errors: {
    invalidInput: "Check the information you entered and try again.",
    unauthenticated: "Sign in again to continue.",
    createFailed: "We couldn't create your household. Try again.",
    alreadyHasHousehold: "You already have an active household.",
    switchFailed: "We couldn't switch households. Try again.",
    notAMember: "You are not a member of that household.",
  },
};

const ptBR = {
  onboarding: {
    overline: "Passo 2 de 2",
    title: "Crie sua casa",
    subtitle: "A casa é onde você e as pessoas com quem divide as finanças mantêm o livro-razão.",
    nameLabel: "Nome da casa",
    namePlaceholder: "Nossa casa",
    timeZoneLabel: "Fuso horário",
    reserveMultipleLabel: "Meses de reserva",
    reserveMultipleHelp: "Quantos meses de custo fixo a reserva de emergência deve cobrir.",
    submit: "Criar casa",
  },
  switcher: {
    label: "Casa",
  },
  errors: {
    invalidInput: "Confira os dados informados e tente novamente.",
    unauthenticated: "Entre novamente para continuar.",
    createFailed: "Não foi possível criar sua casa. Tente novamente.",
    alreadyHasHousehold: "Você já tem uma casa ativa.",
    switchFailed: "Não foi possível trocar de casa. Tente novamente.",
    notAMember: "Você não é membro dessa casa.",
  },
} satisfies typeof en;

const householdStrings = { en, ptBR };

export const t = householdStrings.ptBR;
