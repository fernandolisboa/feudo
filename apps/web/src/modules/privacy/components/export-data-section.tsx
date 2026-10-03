import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";

import { t } from "../strings";

export type ExportDataSectionProps = {
  limitReached: boolean;
};

// A plain POST form, no client JS (works on iPhone Safari without a service
// worker in the loop): /api/export does the read, the rate-limit check and
// the audit write, and streams the file straight back as the response.
export function ExportDataSection({ limitReached }: ExportDataSectionProps) {
  const copy = t.exportData;

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted-foreground max-w-prose text-sm">
        {copy.description} {copy.scope}{" "}
        <a href="/privacidade" className="underline underline-offset-3">
          {copy.privacyLink}
        </a>
      </p>

      {limitReached ? (
        <Alert variant="destructive">
          <AlertDescription>{copy.limitReached}</AlertDescription>
        </Alert>
      ) : null}

      <form method="post" action="/api/export">
        <Button type="submit" variant="outline">
          {copy.action}
        </Button>
      </form>
    </div>
  );
}
