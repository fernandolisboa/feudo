"use client";

import { Button } from "@/ui/button";

import { t } from "../strings";

// Served by the service worker in place of any page it has no copy of while
// offline, so it carries no data: reloading retries the address the person
// actually asked for.
export function OfflineFallbackView() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">{t.offline.fallbackBody}</p>
      <Button
        onClick={() => {
          window.location.reload();
        }}
      >
        {t.offline.fallbackRetry}
      </Button>
    </div>
  );
}
