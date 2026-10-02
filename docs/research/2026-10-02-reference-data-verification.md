# Reference data verification for #21 (institutions and bank profiles)

Checked 2026-10-02. This pass re-verifies the 2026-09-09 research (`2026-09-09-bank-profiles.md`)
against primary sources before the data lands in `packages/core/src/institutions/institutions-data.ts`
and `apps/web/src/modules/banking-intel/bank-profiles-data.ts`. Every fact in those files carries its
own citation; this note records the method and what changed.

## Why fgc.org.br was not read directly

`www.fgc.org.br` sits behind Imperva Incapsula. Any non-browser request, `robots.txt` included,
receives a JavaScript challenge ("Request unsuccessful. Incapsula incident ID ..."). Nothing found
in writing forbids automated reading, and `fgcoop.coop.br/robots.txt` allows every path. A headless
browser was not used: this environment's TLS policy blocked the certificate exception it would
need. The associated-institutions list (`/instituicoes-associadas-e-conglomerados`, search an
institution and expand "+") remains the place for a human spot check. The FGC's own regulation PDF
and the category list on that page were readable and are cited.

## Primary sources

| Fact                                    | Source                                                                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Conglomerate and its members            | Bacen IF.data, base June 2026, "Instituições Individuais" register (`cadastro202606_1006.json`), financial conglomerate code |
| ISPB and transfer code                  | Bacen STR participants CSV                                                                                                   |
| Open Finance identifier and brands      | Open Finance Brasil directory, `data.directory.openbankingbrasil.org.br/participants`                                        |
| FGC limit and conglomerate rule         | FGC regulation, Annex II to CMN Resolution 4,222, art. 2 §2–§4 (PDF published by FGC)                                        |
| Which institution types are FGC members | fgc.org.br associated-institutions page (category list)                                                                      |
| FGCoop limit per associated institution | CMN Resolution 4,933, Annex II, art. 3 (Bacen normative API)                                                                 |
| Tariffs                                 | Bacen tariff registry per institution, `bcb.gov.br/fis/tarifas/htms/<ISPB>.asp`, updated 01/10/2026                          |

## Findings that matter for FGC headroom

- The FGC sums credits per **financial conglomerate** (regulation art. 2 §2 and §4 II). IF.data
  publishes both a financial and a prudential conglomerate code; the dataset stores the financial one.
- FGC members are banks, Caixa, credit, financing and investment companies, real estate credit and
  mortgage companies and savings and loan associations. Brokers, securities distributors, leasing
  companies, direct-credit companies and **payment institutions are not members**. Each
  institution's `coveredMembers` lists the conglomerate members of a member type (Bacen type b1/b2,
  or a credit, financing and investment company). This is derived from type, not read off FGC's list.
- Nubank, PicPay and Mercado Pago hold the account in a payment institution. Their FGC members are
  Nu Financeira, PicPay Bank and Mercado Crédito respectively.
- BTG Pactual's conglomerate includes Banco Pan and Pan Financeira; Bradesco's includes Digio,
  Bradescard, Bradesco Financiamentos and Losango; Itaú's includes Itaucard and Luizacred;
  Santander's includes Bandepe, RCI and Hyundai Capital. Instruments from any of them share one
  R$ 250,000 limit per CPF.
- Sicoob is FGCoop: the limit applies per associated institution, so each cooperative counts alone.
- Joint accounts: the FGC regulation (art. 2 §4 V) divides the guaranteed amount by the number of
  holders. ADR-0009 treats joint accounts as a later refinement; this is the rule it will need.

## Score scale and conversion

Scores moved from 0–5 to integers 0–100 (owner's request, 2026-10-01). The 2026-09-09 proposals were
converted as `score × 20`. No intermediate value was invented: finer differences appear only when a
criterion is re-reviewed with new evidence. Every criterion reads "higher is better for the
household"; lock-in 100 means the easiest bank to leave.

A proposed score with no citable URL became **insufficient evidence** instead of a number: Banco do
Brasil security, Caixa card benefits, Santander card benefits and security, C6 app quality, BTG app
quality and security.

## Changes against the 2026-09-09 proposals

- Fees for Itaú, Bradesco, Banco do Brasil, Caixa, Santander, C6, BTG and XP re-checked in the Bacen
  tariff registry; scores unchanged, citations now primary.
- Inter fees 100 → 80: the registry lists TED up to R$ 15.00, packages R$ 20–45 and a basic card
  annuity up to R$ 80, so Inter no longer ties with the all-zero registries.
- PicPay fees: insufficient evidence → 100, from PicPay Bank's all-zero registry entry.
- Sicoob and Mercado Pago fees stay insufficient evidence: each Sicoob cooperative has its own table
  and Mercado Pago's payment institution reports none.

## Still secondary

Reclame Aqui answers HTTP 403 to automated reads and consumidor.gov.br renders no data without a
browser, so every public-review figure comes from search snippets of those pages and is cited as
`secondary`. App-store ratings are likewise secondary.
