import { t } from "./strings";

export const TOUR_IDS = ["overview", "transactions", "categories", "household"] as const;

export type TourId = (typeof TOUR_IDS)[number];

export type TourStep = {
  target: string;
  title: string;
  body: string;
};

export type TourDefinition = {
  id: TourId;
  version: number;
  path: string;
  readyTarget: string;
  steps: TourStep[];
};

const steps = t.tour.steps;

export const TOURS: Record<TourId, TourDefinition> = {
  overview: {
    id: "overview",
    version: 1,
    path: "/",
    readyTarget: "overview.accounts",
    steps: [
      { target: "overview.nav", ...steps.overview.nav },
      { target: "overview.household", ...steps.overview.household },
      { target: "overview.accounts", ...steps.overview.accounts },
      { target: "overview.help", ...steps.overview.help },
    ],
  },
  transactions: {
    id: "transactions",
    version: 1,
    path: "/transacoes",
    readyTarget: "transactions.category",
    steps: [
      { target: "transactions.month", ...steps.transactions.month },
      { target: "transactions.account", ...steps.transactions.account },
      { target: "transactions.category", ...steps.transactions.category },
      { target: "transactions.totals", ...steps.transactions.totals },
    ],
  },
  categories: {
    id: "categories",
    version: 1,
    path: "/categorias",
    readyTarget: "categories.add",
    steps: [
      { target: "categories.rules", ...steps.categories.rules },
      { target: "categories.kind", ...steps.categories.kind },
      { target: "categories.add", ...steps.categories.add },
    ],
  },
  household: {
    id: "household",
    version: 1,
    path: "/casa",
    readyTarget: "household.members",
    steps: [
      { target: "household.members", ...steps.household.members },
      { target: "household.invite", ...steps.household.invite },
      { target: "household.invitations", ...steps.household.invitations },
    ],
  },
};

export function tourForPath(pathname: string): TourDefinition | null {
  return Object.values(TOURS).find((tour) => tour.path === pathname) ?? null;
}

export function isTourId(value: string): value is TourId {
  return (TOUR_IDS as readonly string[]).includes(value);
}
