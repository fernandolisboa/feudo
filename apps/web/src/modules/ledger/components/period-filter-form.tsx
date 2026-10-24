import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";

import { TRANSACTIONS_PATH, transactionsRouteParams, type TransactionsRouteBase } from "../href";
import { t } from "../strings";

// "mes" rides along as a hidden input even though "de" is required and
// should always win: if a crafted or stale submit somehow lands without a
// valid "de", the server falls back to this month rather than silently
// jumping to the current one. Every other active filter (account, category,
// kind, search) rides along the same way, the same contract the search form
// above it follows.
export function PeriodFilterForm({
  route,
  todayIso,
}: {
  route: TransactionsRouteBase;
  todayIso: string;
}) {
  const hiddenParams = transactionsRouteParams({ ...route, range: null, page: 1 }).filter(
    ([name]) => name !== "pagina",
  );

  return (
    <form
      action={TRANSACTIONS_PATH}
      method="get"
      data-offline-read
      aria-label={t.period.label}
      className="grid grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 md:flex md:flex-none"
    >
      {hiddenParams.map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Label htmlFor="transactions-period-from" className="text-muted-foreground font-normal">
        {t.period.from}
      </Label>
      <Input
        id="transactions-period-from"
        name="de"
        type="date"
        max={todayIso}
        required
        defaultValue={route.range?.from ?? ""}
        className="md:w-36"
      />
      <Label htmlFor="transactions-period-to" className="text-muted-foreground font-normal">
        {t.period.to}
      </Label>
      <Input
        id="transactions-period-to"
        name="ate"
        type="date"
        max={todayIso}
        defaultValue={route.range?.to ?? ""}
        className="md:w-36"
      />
      <Button type="submit" variant="outline" size="sm" className="col-span-full">
        {t.period.apply}
      </Button>
    </form>
  );
}
