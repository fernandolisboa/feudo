import { requireHouseholdSession } from "@/modules/households";
import {
  getTransactionsPageProps,
  TransactionsView,
  type TransactionsSearchParams,
} from "@/modules/ledger";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<TransactionsSearchParams>;
}) {
  const session = await requireHouseholdSession();
  const props = await getTransactionsPageProps(session, await searchParams);

  return <TransactionsView {...props} />;
}
