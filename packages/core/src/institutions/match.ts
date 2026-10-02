import type { Institution } from "./institution";
import { INSTITUTIONS } from "./institutions";

// Words that name a kind of business or customer segment rather than an
// institution: "Investimentos" alone must not resolve to "Investimentos BB",
// nor "Banco" to every bank.
const GENERIC_WORDS = new Set([
  "a",
  "bank",
  "banking",
  "banco",
  "cartao",
  "cartoes",
  "clientes",
  "conta",
  "corretora",
  "credito",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
  "empresas",
  "emps",
  "financeiro",
  "fisica",
  "imobiliario",
  "investimentos",
  "juridica",
  "negocios",
  "pessoa",
  "pessoas",
  "pf",
  "pj",
  "s",
  "sa",
  "sem",
  "trader",
]);

function significantWords(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word !== "" && !GENERIC_WORDS.has(word));
}

function containsAll(haystack: ReadonlySet<string>, needles: readonly string[]): boolean {
  return needles.length > 0 && needles.every((word) => haystack.has(word));
}

function namesOf(institution: Institution): string[][] {
  return [institution.name, ...institution.openFinance.brands].map(significantWords);
}

function namedIn(label: ReadonlySet<string>, institution: Institution): boolean {
  return namesOf(institution).some((name) => containsAll(label, name));
}

function partOfName(labelWords: readonly string[], institution: Institution): boolean {
  return namesOf(institution).some((name) => containsAll(new Set(name), labelWords));
}

function onlyOne(found: readonly Institution[]): Institution["id"] | null {
  return found.length === 1 && found[0] ? found[0].id : null;
}

// A bank connection's institution name is a label its owner typed (CONTEXT.md,
// "Bank connection"), not a reference: this resolves it to an Institution only
// when exactly one institution's name or Open Finance brand agrees with it
// word for word, ignoring case, accents and generic words. A label that
// contains a whole name ("Itaú Personnalité" contains "Itaú") wins over one
// that is only part of a name ("BTG" is part of "BTG Pactual"), so "Banco do
// Brasil" is BB even though XP also has a brand "Azimut Brasil".
// Anything else, including "MeuPluggy" and labels two institutions share,
// stays unresolved for the household to pick.
export function matchInstitutionByLabel(
  label: string,
  institutions: readonly Institution[] = INSTITUTIONS,
): Institution["id"] | null {
  const labelWords = significantWords(label);
  if (labelWords.length === 0) {
    return null;
  }
  const labelSet = new Set(labelWords);
  const named = institutions.filter((institution) => namedIn(labelSet, institution));
  if (named.length > 0) {
    return onlyOne(named);
  }
  return onlyOne(institutions.filter((institution) => partOfName(labelWords, institution)));
}
