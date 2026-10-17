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
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      {hiddenParams.map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="transactions-period-from">{t.period.from}</Label>
          <Input
            id="transactions-period-from"
            name="de"
            type="date"
            max={todayIso}
            required
            defaultValue={route.range?.from ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="transactions-period-to">{t.period.to}</Label>
          <Input
            id="transactions-period-to"
            name="ate"
            type="date"
            max={todayIso}
            defaultValue={route.range?.to ?? ""}
          />
        </div>
      </div>
      <Button type="submit" variant="outline" size="sm">
        {t.period.apply}
      </Button>
    </form>
  );
}
