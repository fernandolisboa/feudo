import type { InstitutionsDatasetInput } from "./institution";

export const INSTITUTIONS_DATASET = {
  version: 1,
  institutions: [
    {
      id: "nubank",
      name: "Nubank",
      reviewedAt: "2026-10-02",
      accountHolder: {
        legalName: "NU PAGAMENTOS S.A. - INSTITUIÇÃO DE PAGAMENTO",
        cnpjBase: "18236120",
        ispb: "18236120",
        compe: "260",
        kind: "payment-institution",
      },
      openFinance: {
        organisationId: "926e3037-a685-553c-afa3-f7cb46ff8084",
        organisationName: "NU PAGAMENTOS S.A. - INSTITUICAO DE PAGAMENTO",
        brands: ["Nubank"],
      },
      depositGuarantee: {
        fund: "FGC",
        conglomerate: {
          code: "C0052058",
          name: "NUBANK",
        },
        coveredMembers: [
          {
            legalName: "NU FINANCEIRA S.A. - SOCIEDADE DE CRÉDITO, FINANCIAMENTO E INVESTIMENTO",
            cnpjBase: "30680829",
          },
        ],
      },
      notes: [
        "The account is held by Nu Pagamentos S.A., a payment institution. Payment institutions are not FGC members, so the account balance itself is not an FGC-covered deposit.",
        "The FGC member in the Nubank financial conglomerate is Nu Financeira S.A. (credit, financing and investment company); instruments it issues share one R$ 250,000 limit per CPF.",
      ],
      citations: [
        {
          url: "https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "STR participant NU PAGAMENTOS S.A. - INSTITUIÇÃO DE PAGAMENTO: ISPB 18236120, code 260.",
        },
        {
          url: "https://data.directory.openbankingbrasil.org.br/participants",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Open Finance participant NU PAGAMENTOS S.A. - INSTITUICAO DE PAGAMENTO (18236120000158), status Active.",
        },
        {
          url: "https://www3.bcb.gov.br/ifdata/rest/arquivos?nomeArquivo=ifdata_2025_2030//202606/cadastro202606_1006.json",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Bacen IF.data, June 2026: financial conglomerate C0052058 (NUBANK) has 2 members, 1 of them banks or credit, financing and investment companies.",
        },
        {
          url: "https://fgc.org.br/documents/d/asset-library-52554/regulamento-fgc",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC regulation (Annex II to CMN Resolution 4,222), art. 2 §2: credits of each person against all associated institutions of the same financial conglomerate are guaranteed up to R$ 250,000.",
        },
        {
          url: "https://www.fgc.org.br/instituicoes-associadas-e-conglomerados",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC associates are multiple, commercial, investment and development banks, Caixa, credit, financing and investment companies, real estate credit companies, mortgage companies and savings and loan associations. The per-institution list is behind a bot challenge and was not read.",
        },
      ],
    },
    {
      id: "inter",
      name: "Inter",
      reviewedAt: "2026-10-02",
      accountHolder: {
        legalName: "BANCO INTER S.A.",
        cnpjBase: "00416968",
        ispb: "00416968",
        compe: "077",
        kind: "bank",
      },
      openFinance: {
        organisationId: "31ee4f72-8769-5136-83e4-03f2dd4c935e",
        organisationName: "BANCO INTER",
        brands: ["Banco Inter PF", "Banco Inter PJ"],
      },
      depositGuarantee: {
        fund: "FGC",
        conglomerate: {
          code: "C0051884",
          name: "INTER",
        },
        coveredMembers: [
          {
            legalName: "BANCO INTER S.A.",
            cnpjBase: "00416968",
          },
        ],
      },
      notes: [],
      citations: [
        {
          url: "https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "STR participant Banco Inter S.A.: ISPB 00416968, code 077.",
        },
        {
          url: "https://data.directory.openbankingbrasil.org.br/participants",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "Open Finance participant BANCO INTER (00416968000101), status Active.",
        },
        {
          url: "https://www3.bcb.gov.br/ifdata/rest/arquivos?nomeArquivo=ifdata_2025_2030//202606/cadastro202606_1006.json",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Bacen IF.data, June 2026: financial conglomerate C0051884 (INTER) has 2 members, 1 of them banks or credit, financing and investment companies.",
        },
        {
          url: "https://fgc.org.br/documents/d/asset-library-52554/regulamento-fgc",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC regulation (Annex II to CMN Resolution 4,222), art. 2 §2: credits of each person against all associated institutions of the same financial conglomerate are guaranteed up to R$ 250,000.",
        },
        {
          url: "https://www.fgc.org.br/instituicoes-associadas-e-conglomerados",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC associates are multiple, commercial, investment and development banks, Caixa, credit, financing and investment companies, real estate credit companies, mortgage companies and savings and loan associations. The per-institution list is behind a bot challenge and was not read.",
        },
      ],
    },
    {
      id: "itau",
      name: "Itaú",
      reviewedAt: "2026-10-02",
      accountHolder: {
        legalName: "ITAÚ UNIBANCO S.A.",
        cnpjBase: "60701190",
        ispb: "60701190",
        compe: "341",
        kind: "bank",
      },
      openFinance: {
        organisationId: "9c721898-9ce0-50f1-bf85-05075557850b",
        organisationName: "ITAU UNIBANCO S.A.",
        brands: [
          "Itaú",
          "Itaucard",
          "Itaú Empresas",
          "Íon",
          "Itaú Emps",
          "Porto Bank",
          "Hipercard",
          "Credicard",
          "Iti",
          "Cartão Luiza",
          "Rede",
          "Porto Bank PJ",
        ],
      },
      depositGuarantee: {
        fund: "FGC",
        conglomerate: {
          code: "C0010069",
          name: "ITAU",
        },
        coveredMembers: [
          {
            legalName: "LUIZACRED S.A. SOCIEDADE DE CRÉDITO, FINANCIAMENTO E INVESTIMENTO",
            cnpjBase: "02206577",
          },
          {
            legalName: "FINANCEIRA ITAÚ CBD S.A. CRÉDITO, FINANCIAMENTO E INVESTIMENTO",
            cnpjBase: "06881898",
          },
          {
            legalName: "BANCO ITAUCARD S.A.",
            cnpjBase: "17192451",
          },
          {
            legalName: "BANCO ITAUBANK S.A.",
            cnpjBase: "60394079",
          },
          {
            legalName: "ITAÚ UNIBANCO S.A.",
            cnpjBase: "60701190",
          },
          {
            legalName: "ITAÚ UNIBANCO HOLDING S.A.",
            cnpjBase: "60872504",
          },
          {
            legalName: "BANCO INVESTCRED UNIBANCO S.A.",
            cnpjBase: "61182408",
          },
          {
            legalName: "BANCO ITAÚ VEÍCULOS S.A.",
            cnpjBase: "61190658",
          },
          {
            legalName: "AVENUE SECURITIES BANCO DE INVESTIMENTO S.A.",
            cnpjBase: "61384004",
          },
        ],
      },
      notes: [
        "Banco Itaucard, Luizacred, Financeira Itaú CBD and the other covered members listed here share the Itaú R$ 250,000 limit per CPF.",
      ],
      citations: [
        {
          url: "https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "STR participant ITAÚ UNIBANCO S.A.: ISPB 60701190, code 341.",
        },
        {
          url: "https://data.directory.openbankingbrasil.org.br/participants",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "Open Finance participant ITAU UNIBANCO S.A. (60701190000104), status Active.",
        },
        {
          url: "https://www3.bcb.gov.br/ifdata/rest/arquivos?nomeArquivo=ifdata_2025_2030//202606/cadastro202606_1006.json",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Bacen IF.data, June 2026: financial conglomerate C0010069 (ITAU) has 15 members, 9 of them banks or credit, financing and investment companies.",
        },
        {
          url: "https://fgc.org.br/documents/d/asset-library-52554/regulamento-fgc",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC regulation (Annex II to CMN Resolution 4,222), art. 2 §2: credits of each person against all associated institutions of the same financial conglomerate are guaranteed up to R$ 250,000.",
        },
        {
          url: "https://www.fgc.org.br/instituicoes-associadas-e-conglomerados",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC associates are multiple, commercial, investment and development banks, Caixa, credit, financing and investment companies, real estate credit companies, mortgage companies and savings and loan associations. The per-institution list is behind a bot challenge and was not read.",
        },
      ],
    },
    {
      id: "bradesco",
      name: "Bradesco",
      reviewedAt: "2026-10-02",
      accountHolder: {
        legalName: "BANCO BRADESCO S.A.",
        cnpjBase: "60746948",
        ispb: "60746948",
        compe: "237",
        kind: "bank",
      },
      openFinance: {
        organisationId: "a72a6d4f-79be-5362-afb6-f8d9c9c39cf5",
        organisationName: "BANCO BRADESCO SA",
        brands: [
          "Bradesco Pessoa Jurídica",
          "next",
          "Bradesco Pessoa Física",
          "Bradesco Cartões PJ",
          "Bradesco Empresas e Negócios",
        ],
      },
      depositGuarantee: {
        fund: "FGC",
        conglomerate: {
          code: "C0010045",
          name: "BRADESCO",
        },
        coveredMembers: [
          {
            legalName: "KIRTON BANK S.A. - BANCO MÚLTIPLO",
            cnpjBase: "01701201",
          },
          {
            legalName: "BANCO BRADESCARD S.A.",
            cnpjBase: "04184779",
          },
          {
            legalName: "BANCO BRADESCO BBI S.A.",
            cnpjBase: "06271464",
          },
          {
            legalName: "BANCO BRADESCO FINANCIAMENTOS S.A.",
            cnpjBase: "07207996",
          },
          {
            legalName: "BANCO DIGIO S.A.",
            cnpjBase: "27098060",
          },
          {
            legalName: "BANCO BRADESCO BERJ S.A.",
            cnpjBase: "33147315",
          },
          {
            legalName: "BANCO LOSANGO S.A. - BANCO MÚLTIPLO",
            cnpjBase: "33254319",
          },
          {
            legalName: "BANCO BRADESCO S.A.",
            cnpjBase: "60746948",
          },
          {
            legalName: "BANCO JOHN DEERE S.A.",
            cnpjBase: "91884981",
          },
        ],
      },
      notes: [
        "Banco Digio, Banco Bradescard, Banco Bradesco Financiamentos and Banco Losango are in the Bradesco financial conglomerate and share its R$ 250,000 limit per CPF.",
      ],
      citations: [
        {
          url: "https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "STR participant Banco Bradesco S.A.: ISPB 60746948, code 237.",
        },
        {
          url: "https://data.directory.openbankingbrasil.org.br/participants",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "Open Finance participant BANCO BRADESCO SA (60746948000112), status Active.",
        },
        {
          url: "https://www3.bcb.gov.br/ifdata/rest/arquivos?nomeArquivo=ifdata_2025_2030//202606/cadastro202606_1006.json",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Bacen IF.data, June 2026: financial conglomerate C0010045 (BRADESCO) has 16 members, 9 of them banks or credit, financing and investment companies.",
        },
        {
          url: "https://fgc.org.br/documents/d/asset-library-52554/regulamento-fgc",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC regulation (Annex II to CMN Resolution 4,222), art. 2 §2: credits of each person against all associated institutions of the same financial conglomerate are guaranteed up to R$ 250,000.",
        },
        {
          url: "https://www.fgc.org.br/instituicoes-associadas-e-conglomerados",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC associates are multiple, commercial, investment and development banks, Caixa, credit, financing and investment companies, real estate credit companies, mortgage companies and savings and loan associations. The per-institution list is behind a bot challenge and was not read.",
        },
      ],
    },
    {
      id: "banco-do-brasil",
      name: "Banco do Brasil",
      reviewedAt: "2026-10-02",
      accountHolder: {
        legalName: "BANCO DO BRASIL S.A.",
        cnpjBase: "00000000",
        ispb: "00000000",
        compe: "001",
        kind: "bank",
      },
      openFinance: {
        organisationId: "9415f224-9f58-56b5-af4c-085b4438e4eb",
        organisationName: "BANCO DO BRASIL S.A.",
        brands: ["Banco do Brasil", "Ourocard", "Investimentos BB"],
      },
      depositGuarantee: {
        fund: "FGC",
        conglomerate: {
          code: "C0049906",
          name: "BB",
        },
        coveredMembers: [
          {
            legalName: "BANCO DO BRASIL S.A.",
            cnpjBase: "00000000",
          },
          {
            legalName: "BB-BANCO DE INVESTIMENTO S/A",
            cnpjBase: "24933830",
          },
        ],
      },
      notes: [],
      citations: [
        {
          url: "https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "STR participant Banco do Brasil S.A.: ISPB 00000000, code 001.",
        },
        {
          url: "https://data.directory.openbankingbrasil.org.br/participants",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "Open Finance participant BANCO DO BRASIL S.A. (00000000000191), status Active.",
        },
        {
          url: "https://www3.bcb.gov.br/ifdata/rest/arquivos?nomeArquivo=ifdata_2025_2030//202606/cadastro202606_1006.json",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Bacen IF.data, June 2026: financial conglomerate C0049906 (BB) has 4 members, 2 of them banks or credit, financing and investment companies.",
        },
        {
          url: "https://fgc.org.br/documents/d/asset-library-52554/regulamento-fgc",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC regulation (Annex II to CMN Resolution 4,222), art. 2 §2: credits of each person against all associated institutions of the same financial conglomerate are guaranteed up to R$ 250,000.",
        },
        {
          url: "https://www.fgc.org.br/instituicoes-associadas-e-conglomerados",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC associates are multiple, commercial, investment and development banks, Caixa, credit, financing and investment companies, real estate credit companies, mortgage companies and savings and loan associations. The per-institution list is behind a bot challenge and was not read.",
        },
      ],
    },
    {
      id: "caixa",
      name: "Caixa",
      reviewedAt: "2026-10-02",
      accountHolder: {
        legalName: "CAIXA ECONOMICA FEDERAL",
        cnpjBase: "00360305",
        ispb: "00360305",
        compe: "104",
        kind: "bank",
      },
      openFinance: {
        organisationId: "c160a6f5-e5df-5067-9e97-ec6fba62fd87",
        organisationName: "CAIXA ECONOMICA FEDERAL",
        brands: ["CAIXA", "CAIXA Tem", "CAIXA - clientes sem conta"],
      },
      depositGuarantee: {
        fund: "FGC",
        conglomerate: {
          code: "C0051626",
          name: "CAIXA ECONÔMICA FEDERAL",
        },
        coveredMembers: [
          {
            legalName: "CAIXA ECONOMICA FEDERAL",
            cnpjBase: "00360305",
          },
        ],
      },
      notes: [],
      citations: [
        {
          url: "https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "STR participant CAIXA ECONOMICA FEDERAL: ISPB 00360305, code 104.",
        },
        {
          url: "https://data.directory.openbankingbrasil.org.br/participants",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Open Finance participant CAIXA ECONOMICA FEDERAL (00360305000104), status Active.",
        },
        {
          url: "https://www3.bcb.gov.br/ifdata/rest/arquivos?nomeArquivo=ifdata_2025_2030//202606/cadastro202606_1006.json",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Bacen IF.data, June 2026: financial conglomerate C0051626 (CAIXA ECONÔMICA FEDERAL) has 2 members, 1 of them banks or credit, financing and investment companies.",
        },
        {
          url: "https://fgc.org.br/documents/d/asset-library-52554/regulamento-fgc",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC regulation (Annex II to CMN Resolution 4,222), art. 2 §2: credits of each person against all associated institutions of the same financial conglomerate are guaranteed up to R$ 250,000.",
        },
        {
          url: "https://www.fgc.org.br/instituicoes-associadas-e-conglomerados",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC associates are multiple, commercial, investment and development banks, Caixa, credit, financing and investment companies, real estate credit companies, mortgage companies and savings and loan associations. The per-institution list is behind a bot challenge and was not read.",
        },
      ],
    },
    {
      id: "santander",
      name: "Santander",
      reviewedAt: "2026-10-02",
      accountHolder: {
        legalName: "BANCO SANTANDER (BRASIL) S.A.",
        cnpjBase: "90400888",
        ispb: "90400888",
        compe: "033",
        kind: "bank",
      },
      openFinance: {
        organisationId: "b8d20b1b-e8a7-5099-8174-05ea48bcb566",
        organisationName: "BCO SANTANDER (BRASIL) S.A.",
        brands: [
          "Banco Santander Pessoa Física",
          "Banco Santander Pessoa Jurídica",
          "Santander Cartões Pessoa Física",
          "Santander Crédito Imobiliário Pessoas",
          "Santander Crédito Imobiliário Empresas",
          "Olé Consignado",
          "Santander Cartões Pessoa Jurídica",
        ],
      },
      depositGuarantee: {
        fund: "FGC",
        conglomerate: {
          code: "C0030379",
          name: "SANTANDER",
        },
        coveredMembers: [
          {
            legalName: "SANTANDER SOCIEDADE DE CRÉDITO, FINANCIAMENTO E INVESTIMENTO S.A.",
            cnpjBase: "07707650",
          },
          {
            legalName: "BANCO BANDEPE S.A.",
            cnpjBase: "10866788",
          },
          {
            legalName: "BANCO HYUNDAI CAPITAL BRASIL S.A.",
            cnpjBase: "30172491",
          },
          {
            legalName: "BANCO RCI BRASIL S.A.",
            cnpjBase: "62307848",
          },
          {
            legalName: "BANCO SANTANDER (BRASIL) S.A.",
            cnpjBase: "90400888",
          },
        ],
      },
      notes: [
        "Banco Bandepe, Banco RCI Brasil, Banco Hyundai Capital Brasil and Santander Sociedade de Crédito, Financiamento e Investimento are in the Santander financial conglomerate and share its R$ 250,000 limit per CPF.",
      ],
      citations: [
        {
          url: "https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "STR participant BANCO SANTANDER (BRASIL) S.A.: ISPB 90400888, code 033.",
        },
        {
          url: "https://data.directory.openbankingbrasil.org.br/participants",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Open Finance participant BCO SANTANDER (BRASIL) S.A. (90400888000142), status Active.",
        },
        {
          url: "https://www3.bcb.gov.br/ifdata/rest/arquivos?nomeArquivo=ifdata_2025_2030//202606/cadastro202606_1006.json",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Bacen IF.data, June 2026: financial conglomerate C0030379 (SANTANDER) has 10 members, 5 of them banks or credit, financing and investment companies.",
        },
        {
          url: "https://fgc.org.br/documents/d/asset-library-52554/regulamento-fgc",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC regulation (Annex II to CMN Resolution 4,222), art. 2 §2: credits of each person against all associated institutions of the same financial conglomerate are guaranteed up to R$ 250,000.",
        },
        {
          url: "https://www.fgc.org.br/instituicoes-associadas-e-conglomerados",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC associates are multiple, commercial, investment and development banks, Caixa, credit, financing and investment companies, real estate credit companies, mortgage companies and savings and loan associations. The per-institution list is behind a bot challenge and was not read.",
        },
      ],
    },
    {
      id: "c6",
      name: "C6 Bank",
      reviewedAt: "2026-10-02",
      accountHolder: {
        legalName: "BANCO C6 S.A.",
        cnpjBase: "31872495",
        ispb: "31872495",
        compe: "336",
        kind: "bank",
      },
      openFinance: {
        organisationId: "b024cf43-9ce6-52c4-8820-9b5d0bccb74c",
        organisationName: "BCO C6 S.A.",
        brands: ["C6 Bank"],
      },
      depositGuarantee: {
        fund: "FGC",
        conglomerate: {
          code: "C0052072",
          name: "C6 BANK",
        },
        coveredMembers: [
          {
            legalName: "BANCO C6 S.A.",
            cnpjBase: "31872495",
          },
          {
            legalName: "BANCO C6 CONSIGNADO S.A.",
            cnpjBase: "61348538",
          },
        ],
      },
      notes: [],
      citations: [
        {
          url: "https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "STR participant Banco C6 S.A.: ISPB 31872495, code 336.",
        },
        {
          url: "https://data.directory.openbankingbrasil.org.br/participants",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "Open Finance participant BCO C6 S.A. (31872495000172), status Active.",
        },
        {
          url: "https://www3.bcb.gov.br/ifdata/rest/arquivos?nomeArquivo=ifdata_2025_2030//202606/cadastro202606_1006.json",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Bacen IF.data, June 2026: financial conglomerate C0052072 (C6 BANK) has 3 members, 2 of them banks or credit, financing and investment companies.",
        },
        {
          url: "https://fgc.org.br/documents/d/asset-library-52554/regulamento-fgc",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC regulation (Annex II to CMN Resolution 4,222), art. 2 §2: credits of each person against all associated institutions of the same financial conglomerate are guaranteed up to R$ 250,000.",
        },
        {
          url: "https://www.fgc.org.br/instituicoes-associadas-e-conglomerados",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC associates are multiple, commercial, investment and development banks, Caixa, credit, financing and investment companies, real estate credit companies, mortgage companies and savings and loan associations. The per-institution list is behind a bot challenge and was not read.",
        },
      ],
    },
    {
      id: "btg",
      name: "BTG Pactual",
      reviewedAt: "2026-10-02",
      accountHolder: {
        legalName: "BANCO BTG PACTUAL S.A.",
        cnpjBase: "30306294",
        ispb: "30306294",
        compe: "208",
        kind: "bank",
      },
      openFinance: {
        organisationId: "0bd0b05e-ce18-5105-bbe9-ddf16a79eff9",
        organisationName: "BANCO BTG PACTUAL S.A.",
        brands: ["BTG Empresas", "BTG Banking", "BTG Investimentos", "Necton", "EQI", "KINVO"],
      },
      depositGuarantee: {
        fund: "FGC",
        conglomerate: {
          code: "C0049944",
          name: "BTG PACTUAL",
        },
        coveredMembers: [
          {
            legalName: "PAN FINANCEIRA S.A. - SOCIEDADE DE CRÉDITO, FINANCIAMENTO E INVESTIMENTOS",
            cnpjBase: "02682287",
          },
          {
            legalName: "BANCO BESA S.A.",
            cnpjBase: "15124464",
          },
          {
            legalName: "BANCO NACIONAL S.A.",
            cnpjBase: "17157777",
          },
          {
            legalName: "BANCO BTG PACTUAL S.A.",
            cnpjBase: "30306294",
          },
          {
            legalName: "BANCO NACIONAL DE INVESTIMENTOS S.A.",
            cnpjBase: "33222241",
          },
          {
            legalName: "BANCO PAN S.A.",
            cnpjBase: "59285411",
          },
          {
            legalName: "BANCO SISTEMA S.A.",
            cnpjBase: "76543115",
          },
        ],
      },
      notes: [
        "Banco Pan and Pan Financeira are in the BTG Pactual financial conglomerate: a CDB from Banco Pan shares the BTG R$ 250,000 limit per CPF.",
      ],
      citations: [
        {
          url: "https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "STR participant Banco BTG Pactual S.A.: ISPB 30306294, code 208.",
        },
        {
          url: "https://data.directory.openbankingbrasil.org.br/participants",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Open Finance participant BANCO BTG PACTUAL S.A. (30306294000145), status Active.",
        },
        {
          url: "https://www3.bcb.gov.br/ifdata/rest/arquivos?nomeArquivo=ifdata_2025_2030//202606/cadastro202606_1006.json",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Bacen IF.data, June 2026: financial conglomerate C0049944 (BTG PACTUAL) has 12 members, 7 of them banks or credit, financing and investment companies.",
        },
        {
          url: "https://fgc.org.br/documents/d/asset-library-52554/regulamento-fgc",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC regulation (Annex II to CMN Resolution 4,222), art. 2 §2: credits of each person against all associated institutions of the same financial conglomerate are guaranteed up to R$ 250,000.",
        },
        {
          url: "https://www.fgc.org.br/instituicoes-associadas-e-conglomerados",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC associates are multiple, commercial, investment and development banks, Caixa, credit, financing and investment companies, real estate credit companies, mortgage companies and savings and loan associations. The per-institution list is behind a bot challenge and was not read.",
        },
      ],
    },
    {
      id: "xp",
      name: "XP",
      reviewedAt: "2026-10-02",
      accountHolder: {
        legalName: "BANCO XP S.A.",
        cnpjBase: "33264668",
        ispb: "33264668",
        compe: "348",
        kind: "bank",
      },
      openFinance: {
        organisationId: "79717d71-0cf4-58f6-b2d0-370d5404d383",
        organisationName: "BANCO XP S.A.",
        brands: [
          "Banco XP S.A.",
          "Banco XP S.A. (Rico)",
          "Banco XP S.A. (XP Empresas)",
          "Azimut Brasil",
          "Clear Corretora",
          "modalmais Trader",
          "Monte Bravo",
          "WHG",
        ],
      },
      depositGuarantee: {
        fund: "FGC",
        conglomerate: {
          code: "C0052120",
          name: "XP",
        },
        coveredMembers: [
          {
            legalName: "BANCO XP S.A.",
            cnpjBase: "33264668",
          },
        ],
      },
      notes: [
        "The digital account and XP-issued CDBs are at Banco XP S.A.; the brokerage, XP Investimentos CCTVM, is not an FGC member.",
      ],
      citations: [
        {
          url: "https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "STR participant Banco XP S.A.: ISPB 33264668, code 348.",
        },
        {
          url: "https://data.directory.openbankingbrasil.org.br/participants",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "Open Finance participant BANCO XP S.A. (33264668000103), status Active.",
        },
        {
          url: "https://www3.bcb.gov.br/ifdata/rest/arquivos?nomeArquivo=ifdata_2025_2030//202606/cadastro202606_1006.json",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Bacen IF.data, June 2026: financial conglomerate C0052120 (XP) has 4 members, 1 of them banks or credit, financing and investment companies.",
        },
        {
          url: "https://fgc.org.br/documents/d/asset-library-52554/regulamento-fgc",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC regulation (Annex II to CMN Resolution 4,222), art. 2 §2: credits of each person against all associated institutions of the same financial conglomerate are guaranteed up to R$ 250,000.",
        },
        {
          url: "https://www.fgc.org.br/instituicoes-associadas-e-conglomerados",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC associates are multiple, commercial, investment and development banks, Caixa, credit, financing and investment companies, real estate credit companies, mortgage companies and savings and loan associations. The per-institution list is behind a bot challenge and was not read.",
        },
      ],
    },
    {
      id: "sicoob",
      name: "Sicoob",
      reviewedAt: "2026-10-02",
      accountHolder: {
        legalName: "BANCO COOPERATIVO SICOOB S.A. - BANCO SICOOB",
        cnpjBase: "02038232",
        ispb: "02038232",
        compe: "756",
        kind: "cooperative-system",
      },
      openFinance: {
        organisationId: "777b3ece-75ea-5fa7-a464-dd29b141e99e",
        organisationName: "Confederacao Nacional das Cooperativas do Sicoob",
        brands: ["Sicoob"],
      },
      depositGuarantee: {
        fund: "FGCoop",
        scope: "per-associated-institution",
      },
      notes: [
        "A Sicoob member holds the account at one credit cooperative, a separate legal entity; Banco Sicoob is the system's cooperative bank and the code used for transfers.",
        "Coverage is FGCoop, not FGC: the R$ 250,000 limit applies per associated institution, so each cooperative counts separately.",
      ],
      citations: [
        {
          url: "https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "STR participant BANCO COOPERATIVO SICOOB S.A. - BANCO SICOOB: ISPB 02038232, code 756.",
        },
        {
          url: "https://data.directory.openbankingbrasil.org.br/participants",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Open Finance participant Confederacao Nacional das Cooperativas do Sicoob (04891850000188), status Active.",
        },
        {
          url: "https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20CMN&numero=4933",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "CMN Resolution 4,933, Annex II, art. 3: credits of each beneficiary against the same FGCoop-associated institution are guaranteed up to R$ 250,000; credit cooperatives and cooperative banks must join FGCoop.",
        },
        {
          url: "https://www3.bcb.gov.br/ifdata/rest/arquivos?nomeArquivo=ifdata_2025_2030//202606/cadastro202606_1006.json",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Bacen IF.data, June 2026: Banco Cooperativo Sicoob S.A. (02038232) is a cooperative bank; each Sicoob cooperative is listed as its own institution.",
        },
      ],
    },
    {
      id: "picpay",
      name: "PicPay",
      reviewedAt: "2026-10-02",
      accountHolder: {
        legalName: "PICPAY INSTITUIÇÃO DE PAGAMENTO S.A.",
        cnpjBase: "22896431",
        ispb: "22896431",
        compe: "380",
        kind: "payment-institution",
      },
      openFinance: {
        organisationId: "c0f47d95-78e7-5f20-b0ea-ff8a75a44a76",
        organisationName: "PICPAY",
        brands: ["PicPay", "PicPay Negócios"],
      },
      depositGuarantee: {
        fund: "FGC",
        conglomerate: {
          code: "C0052632",
          name: "PICPAY - FINANCEIRO",
        },
        coveredMembers: [
          {
            legalName: "PICPAY BANK - BANCO MÚLTIPLO S.A",
            cnpjBase: "09516419",
          },
        ],
      },
      notes: [
        "The account is held by PicPay Instituição de Pagamento S.A., a payment institution, which is not an FGC member.",
        "The FGC member in the PicPay financial conglomerate is PicPay Bank - Banco Múltiplo S.A.",
      ],
      citations: [
        {
          url: "https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "STR participant PICPAY INSTITUIçãO DE PAGAMENTO S.A.: ISPB 22896431, code 380.",
        },
        {
          url: "https://data.directory.openbankingbrasil.org.br/participants",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding: "Open Finance participant PICPAY (22896431000110), status Active.",
        },
        {
          url: "https://www3.bcb.gov.br/ifdata/rest/arquivos?nomeArquivo=ifdata_2025_2030//202606/cadastro202606_1006.json",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Bacen IF.data, June 2026: financial conglomerate C0052632 (PICPAY - FINANCEIRO) has 3 members, 1 of them banks or credit, financing and investment companies.",
        },
        {
          url: "https://fgc.org.br/documents/d/asset-library-52554/regulamento-fgc",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC regulation (Annex II to CMN Resolution 4,222), art. 2 §2: credits of each person against all associated institutions of the same financial conglomerate are guaranteed up to R$ 250,000.",
        },
        {
          url: "https://www.fgc.org.br/instituicoes-associadas-e-conglomerados",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC associates are multiple, commercial, investment and development banks, Caixa, credit, financing and investment companies, real estate credit companies, mortgage companies and savings and loan associations. The per-institution list is behind a bot challenge and was not read.",
        },
      ],
    },
    {
      id: "mercado-pago",
      name: "Mercado Pago",
      reviewedAt: "2026-10-02",
      accountHolder: {
        legalName: "MERCADO PAGO INSTITUIÇÃO DE PAGAMENTO LTDA.",
        cnpjBase: "10573521",
        ispb: "10573521",
        compe: "323",
        kind: "payment-institution",
      },
      openFinance: {
        organisationId: "e5a1c7ad-11d4-560d-914c-611003a39219",
        organisationName: "MERCADO PAGO INSTITUICAO DE PAGAMENTO LTDA",
        brands: ["Mercado Pago"],
      },
      depositGuarantee: {
        fund: "FGC",
        conglomerate: {
          code: "C0084820",
          name: "MERCADO PAGO IP - FINANCEIRO",
        },
        coveredMembers: [
          {
            legalName: "MERCADO CRÉDITO SOCIEDADE DE CRÉDITO, FINANCIAMENTO E INVESTIMENTO S.A.",
            cnpjBase: "37679449",
          },
        ],
      },
      notes: [
        "The account is held by Mercado Pago Instituição de Pagamento Ltda., a payment institution, which is not an FGC member: the account balance is not FGC-covered.",
        "The only FGC member in the Mercado Pago financial conglomerate is Mercado Crédito S.A. (credit, financing and investment company). Which entity issues the Cofrinho is not confirmed from a primary source.",
      ],
      citations: [
        {
          url: "https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "STR participant MERCADO PAGO INSTITUIÇÃO DE PAGAMENTO LTDA.: ISPB 10573521, code 323.",
        },
        {
          url: "https://data.directory.openbankingbrasil.org.br/participants",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Open Finance participant MERCADO PAGO INSTITUICAO DE PAGAMENTO LTDA (10573521000191), status Active.",
        },
        {
          url: "https://www3.bcb.gov.br/ifdata/rest/arquivos?nomeArquivo=ifdata_2025_2030//202606/cadastro202606_1006.json",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "Bacen IF.data, June 2026: financial conglomerate C0084820 (MERCADO PAGO IP - FINANCEIRO) has 2 members, 1 of them banks or credit, financing and investment companies.",
        },
        {
          url: "https://fgc.org.br/documents/d/asset-library-52554/regulamento-fgc",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC regulation (Annex II to CMN Resolution 4,222), art. 2 §2: credits of each person against all associated institutions of the same financial conglomerate are guaranteed up to R$ 250,000.",
        },
        {
          url: "https://www.fgc.org.br/instituicoes-associadas-e-conglomerados",
          kind: "primary",
          checkedAt: "2026-10-02",
          finding:
            "FGC associates are multiple, commercial, investment and development banks, Caixa, credit, financing and investment companies, real estate credit companies, mortgage companies and savings and loan associations. The per-institution list is behind a bot challenge and was not read.",
        },
      ],
    },
  ],
} satisfies InstitutionsDatasetInput;
