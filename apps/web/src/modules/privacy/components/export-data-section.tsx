import { PRIVACY_POLICY_ROUTE } from "@/modules/auth";

import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";

import type { ExportReturnRoute } from "../export-request";
import { t } from "../strings";

export type ExportDataSectionProps = {
  limitReached: boolean;
  from: ExportReturnRoute;
};

// A plain POST form, no client JS (works on iPhone Safari without a service
// worker in the loop): /api/export checks the per-user export quota, reads
// everything and writes the audit row inside one transaction, then streams
// the resulting document back as the response body. `from` tells a 303 on
// the rate limit which page to bounce back to — this section also renders
// on /aceitar-termos, not just here.
export function ExportDataSection({ limitReached, from }: ExportDataSectionProps) {
  const copy = t.exportData;

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted-foreground max-w-prose text-sm">
        {copy.description} {copy.scope}{" "}
        <a href={PRIVACY_POLICY_ROUTE} className="underline underline-offset-3">
          {copy.privacyLink}
        </a>
      </p>

      {limitReached ? (
        <Alert variant="destructive">
          <AlertDescription>{copy.limitReached}</AlertDescription>
        </Alert>
      ) : null}

      <form method="post" action="/api/export">
        <input type="hidden" name="from" value={from} />
        <Button type="submit" variant="outline">
          {copy.action}
        </Button>
      </form>
    </div>
  );
}
