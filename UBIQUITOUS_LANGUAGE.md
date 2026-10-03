# Ubiquitous language: en ↔ pt-BR

`CONTEXT.md` defines each term. This table fixes how the same term appears in code (English) and in the interface (pt-BR). Use exactly these strings; never invent a synonym in either language.

| Code (en)                                   | Interface (pt-BR)                              | Notes                                                                        |
| ------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| Household                                   | casa                                           | "sua casa", "membros da casa". Never "família" or "casal".                   |
| User                                        | usuário                                        |                                                                              |
| Sign up                                     | criar cadastro                                 | the login identity is "cadastro", never "conta" (reserved for bank accounts) |
| Sign in                                     | entrar                                         |                                                                              |
| Sign out                                    | sair                                           |                                                                              |
| Magic link                                  | link por e-mail                                | route slug `link-magico` (`/entrar/link-magico`)                             |
| Password reset                              | redefinir senha                                | request step: "esqueci minha senha" (`/esqueci-a-senha`)                     |
| Verify email                                | confirmar e-mail                               |                                                                              |
| Terms acceptance                            | aceite dos termos                              |                                                                              |
| Terms of use                                | termos de uso                                  | route `/termos`                                                              |
| Privacy policy                              | política de privacidade                        | route `/privacidade`                                                         |
| Terms re-acceptance                         | termos atualizados                             | route `/aceitar-termos`                                                      |
| Data export                                 | baixar meus dados                              | section "Seus dados" in Preferências                                         |
| Membership                                  | participação                                   | rarely shown; prefer "membro da casa"                                        |
| Owner                                       | responsável                                    | one per household                                                            |
| Admin                                       | administrador                                  |                                                                              |
| Member                                      | membro                                         |                                                                              |
| Active household                            | casa ativa                                     |                                                                              |
| Role                                        | papel                                          |                                                                              |
| Transfer ownership                          | transferir a responsabilidade                  | "Transferir responsabilidade" — never "posse"                                |
| Invite                                      | convite                                        |                                                                              |
| User deletion (code: account deletion)      | excluir cadastro                               | 7-day grace; "Exclusão do cadastro agendada" while it runs                   |
| Household deletion                          | excluir a casa                                 | 7-day grace; only the owner sees and restores it                             |
| Bank connection                             | conexão bancária                               | "conectar banco"                                                             |
| Data provider                               | provedor de dados                              | "Meu Pluggy" when naming it                                                  |
| Provider credentials                        | credenciais do provedor                        |                                                                              |
| Item ID                                     | Item ID                                        | Meu Pluggy's identifier of one connected bank; kept in English in copy       |
| Bank-connection consent                     | consentimento                                  | the recorded acceptance that precedes every connection                       |
| Sync                                        | sincronização                                  | "sincronizar" as the verb; never "importar"                                  |
| Manual sync                                 | sincronização manual                           | the button reads "Sincronizar agora"; three per household per day            |
| Freshness                                   | atualização                                    | column "Atualização", cell "hoje, 06:10"; stale past 48h                     |
| Account                                     | conta                                          | bank account only                                                            |
| Unassigned account                          | sem casa                                       | shown to the owner only, e.g. "Sem casa"                                     |
| Shared account                              | conta da casa                                  |                                                                              |
| Individual account                          | conta individual                               |                                                                              |
| Institution                                 | instituição                                    | "banco" is acceptable in copy                                                |
| Transaction                                 | transação                                      | never "lançamento"                                                           |
| Internal transfer                           | transferência interna                          |                                                                              |
| Internal-transfer mark                      | marcação de transferência interna              | actions: "É transferência interna" / "Não é transferência interna"           |
| Income                                      | renda                                          |                                                                              |
| Spending                                    | gastos                                         |                                                                              |
| Category                                    | categoria                                      |                                                                              |
| Subcategory                                 | subcategoria                                   |                                                                              |
| Kind (income / fixed / variable / transfer) | tipo (renda / fixo / variável / transferência) |                                                                              |
| Categorization rule                         | regra de categorização                         |                                                                              |
| Uncategorized                               | sem categoria                                  |                                                                              |
| Fixed cost                                  | custo fixo                                     |                                                                              |
| Savings rate                                | taxa de poupança                               |                                                                              |
| Reserve target                              | meta da reserva                                |                                                                              |
| Reserve multiple                            | meses de reserva                               | "6 meses de custo fixo"                                                      |
| Reserve target notice                       | aviso da meta                                  | "A meta da reserva mudou de R$ X para R$ Y..."; action "Entendi"             |
| Reserve position                            | posição da reserva                             | "faz parte da reserva"                                                       |
| Reserve mark                                | ajuste da reserva                              | action "Ajustar"; "Instituição emissora", "Resgate"                          |
| Placement ranking                           | onde colocar os próximos reais                 | the rest under "Também avaliados"; places "1º", "2º"                         |
| Liquidity (redeemable within D+1)           | liquidez                                       | "até D+1", "acima de D+1", unknown "confirme"                                |
| Average fixed cost                          | custo fixo médio                               |                                                                              |
| Bank profile                                | perfil do banco                                | scores "nota de 0 a 100"                                                     |
| Insufficient evidence                       | evidência insuficiente                         | a criterion with no citable source; shown without a score                    |
| Bank comparison                             | comparação de bancos                           |                                                                              |
| Criteria weights                            | pesos dos critérios                            |                                                                              |
| Net real yield                              | rendimento real líquido                        | "depois do imposto e da inflação"                                            |
| FGC headroom                                | folga do FGC                                   | "quanto ainda cabe protegido pelo FGC"                                       |
| Lock-in                                     | aprisionamento                                 | "quanto o banco te prende"; 100 = mais fácil de sair                         |
| Guided tour                                 | tour                                           | the per-screen walkthrough; "tutoriais" in settings, "Pular tour" to skip    |
| Analyst reading                             | leitura do analista                            | "Gerar nova leitura"; "Leitura mensal de {mês}"; "Números usados"            |
| Financial-data access (audit log)           | acesso a dados financeiros                     | Casa page: "Seus acessos recentes"                                           |
