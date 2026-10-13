"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";
import { interpolateAll } from "@/lib/interpolate";

import type { CategorizationNudgeProps } from "../guided-categorization";
import { GUIDED_CATEGORIZATION_PATH } from "../href";
import {
  CATEGORIZATION_NUDGE_HIDDEN_COOKIE,
  CATEGORIZATION_NUDGE_HIDDEN_MAX_AGE_SECONDS,
} from "../nudge-cookie";
import { t } from "../strings";

// Transações carries its own month notice that leads here, and the wizard
// itself is where this notice would lead.
const SCREENS_WITH_THEIR_OWN_NOTICE: ReadonlySet<string> = new Set([
  GUIDED_CATEGORIZATION_PATH,
  "/transacoes",
]);

export function CategorizationNudgeNotice({
  count,
  amountLabel,
  sinceLabel,
}: CategorizationNudgeProps) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  if (hidden || SCREENS_WITH_THEIR_OWN_NOTICE.has(pathname)) {
    return null;
  }

  return (
    <div data-categorization-nudge>
      <Notice
        action={
          <div className="flex items-center gap-1">
            <Button size="sm" render={<Link href={GUIDED_CATEGORIZATION_PATH} />}>
              {t.nudge.action}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t.nudge.dismiss}
              title={t.nudge.dismiss}
              onClick={() => {
                document.cookie = `${CATEGORIZATION_NUDGE_HIDDEN_COOKIE}=1; path=/; max-age=${CATEGORIZATION_NUDGE_HIDDEN_MAX_AGE_SECONDS.toString()}; samesite=lax`;
                setHidden(true);
              }}
            >
              <X />
            </Button>
          </div>
        }
      >
        {interpolateAll(count === 1 ? t.nudge.one : t.nudge.many, {
          count: String(count),
          amount: amountLabel,
          month: sinceLabel,
        })}
      </Notice>
    </div>
  );
}
