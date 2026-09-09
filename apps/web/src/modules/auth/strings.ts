const en = {
  signUp: {
    title: "Create your sign-up",
    subtitle: "Sign up to start managing your household's finances.",
    nameLabel: "Name",
    emailLabel: "Email",
    passwordLabel: "Password",
    termsLabel: "I accept the terms of use and the privacy policy",
    submit: "Sign up",
    alreadyHaveAccount: "Already signed up?",
    signInLink: "Sign in",
  },
  signIn: {
    title: "Sign in",
    subtitle: "Enter your email and password to access your household.",
    emailLabel: "Email",
    passwordLabel: "Password",
    submit: "Sign in",
    noAccount: "Not signed up yet?",
    signUpLink: "Sign up",
  },
  verifyEmail: {
    title: "Confirm your sign-up",
    body: "We sent a confirmation link to {email}. Click the link to confirm your sign-up.",
    bodyMissingEmail:
      "We couldn't find the email for this sign-up attempt. Go back to sign up or try signing in.",
    resend: "Resend email",
    resent: "We sent the email again.",
    backToSignIn: "Back to sign in",
  },
  overview: {
    title: "Overview",
    greeting: "Hello, {name}.",
    signOut: "Sign out",
  },
  verificationEmail: {
    subject: "Confirm your email at Feudo",
    text: "Hello, {name}. Confirm your email to start using Feudo: {url}",
    html: '<p>Hello, {name}.</p><p>Confirm your email to start using Feudo:</p><p><a href="{url}">{url}</a></p>',
  },
  errors: {
    invalidInput: "Check the information you entered and try again.",
    termsRequired: "You must accept the terms of use and the privacy policy.",
    registrationClosed: "Registration is closed at the moment.",
    inviteRequired: "Registration is invite-only at the moment.",
    signUpFailed: "We couldn't complete your sign-up. Try again.",
    invalidCredentials: "Incorrect email or password.",
    emailNotVerified: "Confirm your email before signing in.",
    resendFailed: "We couldn't resend the email. Try again.",
    rateLimited: "Too many attempts. Try again shortly.",
  },
};

const ptBR = {
  signUp: {
    title: "Crie seu cadastro",
    subtitle: "Cadastre-se para começar a organizar as finanças da sua casa.",
    nameLabel: "Nome",
    emailLabel: "E-mail",
    passwordLabel: "Senha",
    termsLabel: "Aceito os termos de uso e a política de privacidade",
    submit: "Criar cadastro",
    alreadyHaveAccount: "Já tem cadastro?",
    signInLink: "Entrar",
  },
  signIn: {
    title: "Entrar",
    subtitle: "Informe seu e-mail e sua senha para acessar sua casa.",
    emailLabel: "E-mail",
    passwordLabel: "Senha",
    submit: "Entrar",
    noAccount: "Ainda não tem cadastro?",
    signUpLink: "Criar cadastro",
  },
  verifyEmail: {
    title: "Confirme seu cadastro",
    body: "Enviamos um link de confirmação para {email}. Clique no link para confirmar seu cadastro.",
    bodyMissingEmail:
      "Não encontramos o e-mail para este cadastro. Comece novamente ou tente entrar.",
    resend: "Reenviar e-mail",
    resent: "Enviamos o e-mail novamente.",
    backToSignIn: "Voltar para entrar",
  },
  overview: {
    title: "Visão geral",
    greeting: "Olá, {name}.",
    signOut: "Sair",
  },
  verificationEmail: {
    subject: "Confirme seu e-mail no Feudo",
    text: "Olá, {name}. Confirme seu e-mail para começar a usar o Feudo: {url}",
    html: '<p>Olá, {name}.</p><p>Confirme seu e-mail para começar a usar o Feudo:</p><p><a href="{url}">{url}</a></p>',
  },
  errors: {
    invalidInput: "Confira os dados informados e tente novamente.",
    termsRequired: "Você precisa aceitar os termos de uso e a política de privacidade.",
    registrationClosed: "O cadastro está fechado no momento.",
    inviteRequired: "O cadastro é somente por convite no momento.",
    signUpFailed: "Não foi possível concluir seu cadastro. Tente novamente.",
    invalidCredentials: "E-mail ou senha incorretos. Tente novamente.",
    emailNotVerified: "Confirme seu e-mail antes de entrar.",
    resendFailed: "Não foi possível reenviar o e-mail. Tente novamente.",
    rateLimited: "Muitas tentativas. Tente novamente em instantes.",
  },
} satisfies typeof en;

const authStrings = { en, ptBR };

export const t = authStrings.ptBR;
