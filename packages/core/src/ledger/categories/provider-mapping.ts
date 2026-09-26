import type { ProductSubcategoryId } from "./taxonomy";

export const PLUGGY_CATEGORY_MAP: Readonly<Record<string, ProductSubcategoryId | null>> = {
  Income: "income.other",
  Salary: "income.salary",
  Retirement: "income.benefits",
  "Government aid": "income.benefits",
  "Entrepreneurial activities": "income.self-employed",
  "Non-recurring income": "income.other",
  "Proceeds interests and dividends": "income.yields",
  Cashback: "income.other",

  "Loans and financing": "financial.loans",
  Loans: "financial.loans",
  Financing: "financial.loans",
  "Real estate financing": "housing.mortgage",
  "Vehicle financing": "transport.vehicle-financing",
  "Student loan": "financial.loans",
  "Interests charged": "financial.interest",
  "Late payment and overdraft costs": "financial.interest",

  Investments: "investments.movements",
  "Automatic investment": "investments.movements",
  "Fixed income": "investments.movements",
  "Mutual funds": "investments.movements",
  "Variable income": "investments.movements",
  Margin: "investments.movements",
  Pension: "investments.movements",

  "Same person transfer": "transfers.own-accounts",
  "Same person transfer - Cash": "transfers.own-accounts",
  "Same person transfer - PIX": "transfers.own-accounts",
  "Same person transfer - TED": "transfers.own-accounts",
  "Credit card payment": "transfers.card-bill",

  Transfers: null,
  "Transfer - Bank slip": null,
  "Transfer - Cash": null,
  "Transfer - Check": null,
  "Transfer - DOC": null,
  "Transfer - Foreign exchange": null,
  "Transfer - Internal": null,
  "Transfer - PIX": null,
  "Transfer - TED": null,
  "Third party transfers": null,
  "Third party transfer - PIX": null,
  "Third party transfer - TED": null,
  "Third party transfer - DOC": null,
  "Debt card": null,

  "Legal obligations": null,
  "Blocked balances": null,
  Alimony: "other.alimony",

  Services: null,
  Telecommunications: "bills.telecom",
  Internet: "bills.telecom",
  Mobile: "bills.telecom",
  TV: "bills.telecom",

  Education: "education.tuition",
  University: "education.tuition",
  School: "education.tuition",
  Kindergarten: "education.tuition",
  "Online courses": "education.courses",

  "Wellness and fitness": "health.fitness",
  "Gyms and fitness centers": "health.fitness",
  "Sports practice": "health.fitness",
  Wellness: "health.personal-care",

  Tickets: "leisure.outings",
  "Stadiums and arenas": "leisure.outings",
  "Landmarks and museums": "leisure.outings",
  "Cinema, theater and concerts": "leisure.outings",

  Shopping: "shopping.other",
  "Online shopping": "shopping.online",
  Electronics: "shopping.electronics",
  "Pet supplies and vet": "shopping.pets",
  Clothing: "shopping.clothing",
  "Kids and toys": "shopping.other",
  Bookstore: "education.books",
  "Sports goods": "shopping.other",
  "Office supplies": "shopping.other",

  "Digital services": "bills.subscriptions",
  "Video streaming": "bills.subscriptions",
  "Music streaming": "bills.subscriptions",
  Gaming: "leisure.gaming",

  Groceries: "food.groceries",
  "Food and drinks": "food.restaurants",
  "Eating out": "food.restaurants",
  "Food delivery": "food.delivery",

  Travel: "leisure.travel",
  "Airport and airlines": "leisure.travel",
  Accommodation: "leisure.travel",
  "Mileage programs": "leisure.travel",
  "Bus tickets": "leisure.travel",

  Donations: "other.donations",
  Gambling: "leisure.gaming",
  Lottery: "leisure.gaming",
  "Online bet": "leisure.gaming",

  Taxes: "financial.taxes",
  "Income taxes": "financial.taxes",
  "Taxes on investments": "financial.taxes",
  "Tax on financial operations": "financial.taxes",

  "Bank fees": "financial.bank-fees",
  "Account fees": "financial.bank-fees",
  "Wire transfer fees and ATM fees": "financial.bank-fees",
  "Credit card fees": "financial.bank-fees",

  Housing: null,
  Rent: "housing.rent",
  Utilities: "housing.utilities",
  Water: "housing.utilities",
  Electricity: "housing.utilities",
  Gas: "housing.utilities",
  Houseware: "shopping.home",
  "Urban land and building tax": "housing.property-tax",

  Healthcare: "health.doctors",
  "Hospital clinics and labs": "health.doctors",
  Optometry: "health.doctors",
  Dentist: "health.dentist",
  Pharmacy: "health.pharmacy",

  Transportation: null,
  "Taxi and ride-hailing": "transport.ride-hailing",
  "Public transportation": "transport.public",
  Bicycle: "transport.public",
  "Car rental": "leisure.travel",
  Automotive: "transport.vehicle-maintenance",
  "Vehicle maintenance": "transport.vehicle-maintenance",
  "Gas stations": "transport.fuel",
  Parking: "transport.parking-tolls",
  "Tolls and in vehicle payment": "transport.parking-tolls",
  "Vehicle ownership taxes and fees": "transport.vehicle-taxes",
  "Traffic tickets": "financial.interest",

  Insurance: "bills.insurance",
  "Life insurance": "bills.insurance",
  "Home insurance": "bills.insurance",
  "Vehicle insurance": "bills.insurance",
  "Health insurance": "health.insurance",

  Leisure: "leisure.outings",
  Other: null,
};

const LOWERCASE_CATEGORY_INDEX: ReadonlyMap<string, ProductSubcategoryId | null> = new Map(
  Object.entries(PLUGGY_CATEGORY_MAP).map(([category, subcategoryId]) => [
    category.toLowerCase(),
    subcategoryId,
  ]),
);

export function mapProviderCategory(providerCategory: string | null): ProductSubcategoryId | null {
  if (providerCategory === null) {
    return null;
  }
  return LOWERCASE_CATEGORY_INDEX.get(providerCategory.trim().toLowerCase()) ?? null;
}
