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
    magicLinkLink: "Sign in with an email link",
    forgotPasswordLink: "Forgot your password?",
  },
  magicLink: {
    title: "Sign in with an email link",
    subtitle: "We'll send a single-use link to your email.",
    emailLabel: "Email",
    submit: "Send link",
    sent: "If this email has a sign-up, we sent a link to sign in.",
    invalidOrExpired: "This link is invalid or has expired. Request a new one.",
    backToSignIn: "Back to sign in",
  },
  forgotPassword: {
    title: "Reset your password",
    subtitle: "We'll send a link to reset your password.",
    emailLabel: "Email",
    submit: "Send link",
    sent: "If this email has a sign-up, we sent a link to reset the password.",
    backToSignIn: "Back to sign in",
  },
  resetPassword: {
    title: "Choose a new password",
    subtitle: "Enter a new password for your sign-up.",
    passwordLabel: "New password",
    submit: "Save new password",
    invalidOrExpired: "This link is invalid or has expired. Request a new one.",
    linkRemoved:
      "The link left your address bar for safety. Request a new one to keep resetting your password.",
    requestNewLink: "Request a new link",
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
  },
  userMenu: {
    signOut: "Sign out",
  },
  verificationEmail: {
    subject: "Confirm your email at Feudo",
    text: "Confirm your email to start using Feudo: {url}",
    html: '<p>Confirm your email to start using Feudo:</p><p><a href="{url}">{url}</a></p>',
  },
  magicLinkEmail: {
    subject: "Your sign-in link for Feudo",
    text: "Use this link to sign in to Feudo: {url}\n\nThe link expires in {expiresIn} and works once.",
    html: '<p>Use this link to sign in to Feudo:</p><p><a href="{url}">{url}</a></p><p>The link expires in {expiresIn} and works once.</p>',
  },
  resetPasswordEmail: {
    subject: "Reset your password at Feudo",
    text: "Use this link to set a new password: {url}\n\nThe link expires in {expiresIn} and works once. If you didn't request this, ignore this email.",
    html: '<p>Use this link to set a new password:</p><p><a href="{url}">{url}</a></p><p>The link expires in {expiresIn} and works once. If you didn\'t request this, ignore this email.</p>',
  },
  invitationEmail: {
    subject: "{inviterName} invited you to the {householdName} household on Feudo",
    text: "{inviterName} invited you to join {householdName} on Feudo as {role}.\n\nAccept the invite: {url}\n\nThe invite expires in {expiresIn}.",
    html: '<p>{inviterName} invited you to join <strong>{householdName}</strong> on Feudo as {role}.</p><p><a href="{url}">Accept the invite</a></p><p>The invite expires in {expiresIn}.</p>',
  },
  // Only admin and member ever reach an invitation email — options.ts's
  // beforeCreateInvitation hook rejects "owner" before either the invitation
  // or this email can be built for it (households never invites an owner,
  // ADR-0001), so this has no "owner" entry to keep in sync.
  roleLabels: {
    admin: "admin",
    member: "member",
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
    magicLinkFailed: "We couldn't send the sign-in link. Try again.",
    resetRequestFailed: "We couldn't send the reset link. Try again.",
    resetFailed: "We couldn't reset your password. Try again.",
    signOutFailed: "We couldn't sign you out. Try again.",
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
    magicLinkLink: "Entrar com link por e-mail",
    forgotPasswordLink: "Esqueci minha senha",
  },
  magicLink: {
    title: "Entrar com link por e-mail",
    subtitle: "Enviaremos um link de uso único para o seu e-mail.",
    emailLabel: "E-mail",
    submit: "Enviar link",
    sent: "Se este e-mail tiver cadastro, enviamos um link para entrar.",
    invalidOrExpired: "Este link é inválido ou expirou. Peça um novo link.",
    backToSignIn: "Voltar para entrar",
  },
  forgotPassword: {
    title: "Redefinir sua senha",
    subtitle: "Enviaremos um link para redefinir sua senha.",
    emailLabel: "E-mail",
    submit: "Enviar link",
    sent: "Se este e-mail tiver cadastro, enviamos um link para redefinir a senha.",
    backToSignIn: "Voltar para entrar",
  },
  resetPassword: {
    title: "Defina uma nova senha",
    subtitle: "Informe uma nova senha para o seu cadastro.",
    passwordLabel: "Nova senha",
    submit: "Salvar nova senha",
    invalidOrExpired: "Este link é inválido ou expirou. Peça um novo link.",
    linkRemoved:
      "Por segurança, o link saiu da barra de endereços. Peça um novo link para continuar redefinindo sua senha.",
    requestNewLink: "Pedir novo link",
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
  },
  userMenu: {
    signOut: "Sair",
  },
  verificationEmail: {
    subject: "Confirme seu e-mail no Feudo",
    text: "Confirme seu e-mail para começar a usar o Feudo: {url}",
    html: '<p>Confirme seu e-mail para começar a usar o Feudo:</p><p><a href="{url}">{url}</a></p>',
  },
  magicLinkEmail: {
    subject: "Seu link para entrar no Feudo",
    text: "Use este link para entrar no Feudo: {url}\n\nO link expira em {expiresIn} e funciona uma única vez.",
    html: '<p>Use este link para entrar no Feudo:</p><p><a href="{url}">{url}</a></p><p>O link expira em {expiresIn} e funciona uma única vez.</p>',
  },
  resetPasswordEmail: {
    subject: "Redefina sua senha no Feudo",
    text: "Use este link para definir uma nova senha: {url}\n\nO link expira em {expiresIn} e funciona uma única vez. Se você não pediu isso, ignore este e-mail.",
    html: '<p>Use este link para definir uma nova senha:</p><p><a href="{url}">{url}</a></p><p>O link expira em {expiresIn} e funciona uma única vez. Se você não pediu isso, ignore este e-mail.</p>',
  },
  invitationEmail: {
    subject: "{inviterName} convidou você para a casa {householdName} no Feudo",
    text: "{inviterName} convidou você para entrar na casa {householdName} no Feudo como {role}.\n\nAceite o convite: {url}\n\nO convite expira em {expiresIn}.",
    html: '<p>{inviterName} convidou você para entrar na casa <strong>{householdName}</strong> no Feudo como {role}.</p><p><a href="{url}">Aceitar convite</a></p><p>O convite expira em {expiresIn}.</p>',
  },
  roleLabels: {
    admin: "administrador",
    member: "membro",
  },
  errors: {
    invalidInput: "Confira os dados informados e tente novamente.",
    termsRequired: "Você precisa aceitar os termos de uso e a política de privacidade.",
    registrationClosed: "O cadastro está fechado no momento.",
    inviteRequired: "O cadastro é somente por convite no momento.",
    signUpFailed: "Não foi possível concluir seu cadastro. Tente novamente.",
    invalidCredentials: "E-mail ou senha incorretos.",
    emailNotVerified: "Confirme seu e-mail antes de entrar.",
    resendFailed: "Não foi possível reenviar o e-mail. Tente novamente.",
    rateLimited: "Muitas tentativas. Tente novamente em instantes.",
    magicLinkFailed: "Não foi possível enviar o link para entrar. Tente novamente.",
    resetRequestFailed: "Não foi possível enviar o link de redefinição. Tente novamente.",
    resetFailed: "Não foi possível redefinir sua senha. Tente novamente.",
    signOutFailed: "Não foi possível sair. Tente novamente.",
  },
} satisfies typeof en;

const authStrings = { en, ptBR };

export const t = authStrings.ptBR;
