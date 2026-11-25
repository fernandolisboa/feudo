import { describe, expect, it } from "vitest";
import { categorize, type CategorizableTransaction } from "./categorize";
import { PRODUCT_DEFAULT_RULES } from "./default-rules";
import { normalizeDescription, matchesPattern } from "./description";
import { isProductSubcategoryId, type ProductSubcategoryId } from "./taxonomy";

function debit(description: string): CategorizableTransaction {
  return {
    description,
    type: "debit",
    amountCentavos: -1000,
    currency: "BRL",
    providerCategory: null,
    manual: null,
  };
}

describe("PRODUCT_DEFAULT_RULES", () => {
  it("has an already-normalized pattern for every rule", () => {
    for (const rule of PRODUCT_DEFAULT_RULES) {
      expect(normalizeDescription(rule.pattern), rule.pattern).toBe(rule.pattern);
    }
  });

  it("targets a valid product subcategory for every rule", () => {
    for (const rule of PRODUCT_DEFAULT_RULES) {
      expect(isProductSubcategoryId(rule.subcategoryId), rule.subcategoryId).toBe(true);
    }
  });

  it("matches a realistic Brazilian statement description for UBER EATS before the plain UBER rule", () => {
    const description = normalizeDescription("UBER EATS PENDING");
    const matching = PRODUCT_DEFAULT_RULES.filter((rule) =>
      matchesPattern(description, rule.pattern),
    );
    expect(matching.map((rule) => rule.subcategoryId)).toEqual(
      expect.arrayContaining(["food.delivery", "transport.ride-hailing"]),
    );
    const mostSpecific = matching.reduce((longest, rule) =>
      rule.pattern.split(" ").length > longest.pattern.split(" ").length ? rule : longest,
    );
    expect(mostSpecific.subcategoryId).toBe("food.delivery");
  });

  it("matches PAGAMENTO FATURA CARTAO to the card-bill subcategory with debit direction", () => {
    const description = normalizeDescription("PAGAMENTO FATURA CARTAO");
    const rule = PRODUCT_DEFAULT_RULES.find((candidate) =>
      matchesPattern(description, candidate.pattern),
    );
    expect(rule?.subcategoryId).toBe("transfers.card-bill");
    expect(rule?.direction).toBe("debit");
  });
});

describe("PRODUCT_DEFAULT_RULES, additions", () => {
  const CASES: [description: string, subcategoryId: ProductSubcategoryId][] = [
    ["AMAZON PRIME MEMBERSHIP", "bills.subscriptions"],
    ["AMAZONPRIMEBR SAO PAULO", "bills.subscriptions"],
    ["MELIMAIS ASSINATURA", "bills.subscriptions"],
    ["APPLE COM BILL ITUNES", "bills.subscriptions"],
    ["OPENAI CHATGPT PLUS", "bills.subscriptions"],
    ["ANTHROPIC CLAUDE PRO", "bills.subscriptions"],
    ["CLAUDE AI SUBSCRIPTION", "bills.subscriptions"],
    ["GOOGLE ONE STORAGE", "bills.subscriptions"],
    ["DISNEY PLUS STREAMING", "bills.subscriptions"],
    ["HBO MAX STREAMING", "bills.subscriptions"],
    ["GLOBOPLAY ASSINATURA", "bills.subscriptions"],
    ["PARAMOUNTPLUS STREAMING", "bills.subscriptions"],
    ["YOUTUBE PREMIUM ASSINATURA", "bills.subscriptions"],

    ["DROGASIL FILIAL 123", "health.pharmacy"],
    ["DROGARIA SAO PAULO", "health.pharmacy"],
    ["DROGARIAS PACHECO", "health.pharmacy"],
    ["DROGA RAIA FARMACIA", "health.pharmacy"],
    ["RAIADROGASILSA COMPRA", "health.pharmacy"],
    ["PAGUE MENOS FARMACIA", "health.pharmacy"],
    ["FARMACIA SAO JOAO", "health.pharmacy"],

    ["IFD SOME RESTAURANT", "food.delivery"],
    ["99FOOD PEDIDO", "food.delivery"],
    ["RAPPI PEDIDO", "food.delivery"],
    ["ZE DELIVERY BEBIDAS", "food.delivery"],

    ["AMAZON COMPRA ONLINE", "shopping.online"],
    ["AMAZONMKTPLC SOMESELLER", "shopping.online"],
    ["MERCADOLIVRE COMPRA", "shopping.online"],
    ["MERCADO LIVRE COMPRA", "shopping.online"],
    ["SHOPEE COMPRA", "shopping.online"],
    ["SHEIN COMPRA", "shopping.online"],
    ["ALIEXPRESS COMPRA", "shopping.online"],

    ["SEPHORA LOJA", "health.personal-care"],
    ["EPOCA COSMETICOS COMPRA", "health.personal-care"],
    ["OBOTICARIO LOJA", "health.personal-care"],
    ["O BOTICARIO LOJA", "health.personal-care"],

    ["PRIVALIA COMPRA", "shopping.clothing"],
    ["LOJAS RENNER COMPRA", "shopping.clothing"],
    ["RIACHUELO COMPRA", "shopping.clothing"],
    ["ZARA LOJA", "shopping.clothing"],

    ["AIRBNB RESERVA", "leisure.travel"],
    ["SMILES RESGATE", "leisure.travel"],
    ["POUSADA DO VALE", "leisure.travel"],
    ["HOTEL CENTRAL", "leisure.travel"],
    ["LATAM PASSAGEM", "leisure.travel"],
    ["BOOKING COM RESERVA", "leisure.travel"],
    ["DECOLAR COM PASSAGEM", "leisure.travel"],

    ["STEAM GAMES PURCHASE", "leisure.gaming"],
    ["STEAMGAMES COM COMPRA", "leisure.gaming"],
    ["NINTENDO LOJA", "leisure.gaming"],
    ["NINTENDOESHOP COMPRA", "leisure.gaming"],
    ["NINTENDOESHOPBR COMPRA", "leisure.gaming"],
    ["NUUVEM COMPRA", "leisure.gaming"],
    ["PLAYSTATION STORE", "leisure.gaming"],
    ["XBOX LIVE GOLD", "leisure.gaming"],

    ["PAGAMENTO EFETUADO DETRAN DF", "transport.vehicle-taxes"],

    ["POSTO IPIRANGA", "transport.fuel"],
    ["AUTO POSTO BRASIL", "transport.fuel"],

    ["SEM PARAR MENSALIDADE", "transport.parking-tolls"],
    ["CONECTCAR MENSALIDADE", "transport.parking-tolls"],
    ["VELOE MENSALIDADE", "transport.parking-tolls"],
    ["ESTAPAR ESTACIONAMENTO", "transport.parking-tolls"],

    ["NEOENERGIA DISTRIBUIDORA", "housing.utilities"],
    ["CAESB CONTA DE AGUA", "housing.utilities"],
    ["ENEL DISTRIBUICAO", "housing.utilities"],
    ["SABESP CONTA", "housing.utilities"],
    ["CEMIG DISTRIBUICAO", "housing.utilities"],
    ["COPEL DISTRIBUICAO", "housing.utilities"],
    ["CPFL ENERGIA", "housing.utilities"],
    ["COMGAS CONTA", "housing.utilities"],
    ["ULTRAGAZ ENTREGA", "housing.utilities"],
    ["SUPERGASBRAS ENTREGA", "housing.utilities"],
    ["COPAGAZ ENTREGA", "housing.utilities"],
    ["LIQUIGAS ENTREGA", "housing.utilities"],

    ["AMIL PLANO DE SAUDE", "health.insurance"],
    ["UNIMED MENSALIDADE", "health.insurance"],
    ["HAPVIDA MENSALIDADE", "health.insurance"],
    ["BRADESCO SAUDE MENSALIDADE", "health.insurance"],
    ["SULAMERICA SAUDE MENSALIDADE", "health.insurance"],

    ["SUPERMERCADO BOM PRECO", "food.groceries"],
    ["SUPERMERCADOS UNIDOS", "food.groceries"],
    ["ATACADAO COMPRA", "food.groceries"],
    ["ASSAI ATACADISTA", "food.groceries"],
    ["CARREFOUR COMPRA", "food.groceries"],
    ["PAO DE ACUCAR COMPRA", "food.groceries"],
    ["HORTIFRUTI DA ESQUINA", "food.groceries"],
    ["SACOLAO DO BAIRRO", "food.groceries"],
  ];

  it.each(CASES)("categorizes %s as %s", (description, subcategoryId) => {
    const result = categorize(debit(description), []);
    expect(result?.subcategory).toEqual({ type: "product", id: subcategoryId });
  });

  it("keeps IOF winning over a merchant name in 'IOF DE <merchant>'", () => {
    const result = categorize(debit("IOF DE ANTHROPIC"), []);
    expect(result?.subcategory).toEqual({ type: "product", id: "financial.taxes" });
  });

  it("keeps the PAGAMENTO FATURA family winning over a merchant name on the same statement line", () => {
    const result = categorize(debit("PAGAMENTO FATURA CARTAO ANTHROPIC"), []);
    expect(result?.subcategory).toEqual({ type: "product", id: "transfers.card-bill" });
  });

  it("keeps UBER EATS winning over the plain UBER rule", () => {
    const result = categorize(debit("UBER EATS PENDING"), []);
    expect(result?.subcategory).toEqual({ type: "product", id: "food.delivery" });
  });

  it("keeps pharmacy rules winning over a delivery rule on the same statement line", () => {
    const result = categorize(debit("RAPPI FARMACIA SP"), []);
    expect(result?.subcategory).toEqual({ type: "product", id: "health.pharmacy" });
  });

  it("does not match AMAZONAS ENERGIA as Amazon", () => {
    const result = categorize(debit("AMAZONAS ENERGIA"), []);
    expect(result).toBeNull();
  });

  it("never matches a new debit-only default rule on a credit transaction", () => {
    const result = categorize(
      { ...debit("AMAZON COMPRA ONLINE"), type: "credit", amountCentavos: 1000 },
      [],
    );
    expect(result).toBeNull();
  });
});
