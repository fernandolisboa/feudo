import { requireHouseholdSession } from "@/modules/households";
import { CategoriesView, getCategoriesPageProps } from "@/modules/ledger";

export default async function CategoriesPage() {
  const session = await requireHouseholdSession();
  const props = await getCategoriesPageProps(session);

  return <CategoriesView {...props} />;
}
