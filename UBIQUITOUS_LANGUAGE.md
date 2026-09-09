# Ubiquitous language: en ↔ pt-BR

`CONTEXT.md` defines each term. This table fixes how the same term appears in code (English) and in the interface (pt-BR). Use exactly these strings; never invent a synonym in either language.

| Code (en)                                   | Interface (pt-BR)                              | Notes                                                                        |
| ------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| Household                                   | casa                                           | "sua casa", "membros da casa". Never "família" or "casal".                   |
| User                                        | usuário                                        |                                                                              |
| Sign up                                     | criar cadastro                                 | the login identity is "cadastro", never "conta" (reserved for bank accounts) |
| Sign in                                     | entrar                                         |                                                                              |
| Magic link                                  | link por e-mail                                | route slug `link-magico` (`/entrar/link-magico`)                             |
| Password reset                              | redefinir senha                                | request step: "esqueci minha senha" (`/esqueci-a-senha`)                     |
| Verify email                                | confirmar e-mail                               |                                                                              |
| Terms acceptance                            | aceite dos termos                              |                                                                              |
| Membership                                  | participação                                   | rarely shown; prefer "membro da casa"                                        |
| Owner                                       | responsável                                    | one per household                                                            |
| Admin                                       | administrador                                  |                                                                              |
| Member                                      | membro                                         |                                                                              |
| Active household                            | casa atual                                     |                                                                              |
| Invite                                      | convite                                        |                                                                              |
| Bank connection                             | conexão bancária                               | "conectar banco"                                                             |
| Data provider                               | provedor de dados                              | "Meu Pluggy" when naming it                                                  |
| Provider credentials                        | credenciais do provedor                        |                                                                              |
| Account                                     | conta                                          | bank account only                                                            |
| Shared account                              | conta da casa                                  |                                                                              |
| Individual account                          | conta individual                               |                                                                              |
| Institution                                 | instituição                                    | "banco" is acceptable in copy                                                |
| Transaction                                 | transação                                      | never "lançamento"                                                           |
| Internal transfer                           | transferência interna                          |                                                                              |
| Income                                      | renda                                          |                                                                              |
| Spending                                    | gastos                                         |                                                                              |
| Category                                    | categoria                                      |                                                                              |
| Subcategory                                 | subcategoria                                   |                                                                              |
| Kind (income / fixed / variable / transfer) | tipo (renda / fixo / variável / transferência) |                                                                              |
| Categorization rule                         | regra de categorização                         |                                                                              |
| Fixed cost                                  | custo fixo                                     |                                                                              |
| Savings rate                                | taxa de poupança                               |                                                                              |
| Reserve target                              | meta da reserva                                |                                                                              |
| Reserve multiple                            | meses de reserva                               | "6 meses de custo fixo"                                                      |
| Reserve position                            | posição da reserva                             | "faz parte da reserva"                                                       |
| Average fixed cost                          | custo fixo médio                               |                                                                              |
| Bank profile                                | perfil do banco                                |                                                                              |
| Bank comparison                             | comparação de bancos                           |                                                                              |
| Criteria weights                            | pesos dos critérios                            |                                                                              |
| Net real yield                              | rendimento real líquido                        | "depois do imposto e da inflação"                                            |
| FGC headroom                                | folga do FGC                                   | "quanto ainda cabe protegido pelo FGC"                                       |
| Lock-in                                     | aprisionamento                                 | "quanto o banco te prende"                                                   |
