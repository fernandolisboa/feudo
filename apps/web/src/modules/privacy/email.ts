import type { YearMonth } from "@feudo/core";

import { renderEmail, type EmailCopy } from "@/modules/auth";
import { interpolateAll } from "@/lib/interpolate";

import { describeMonths } from "./describe-months";
import { t } from "./strings";

export function buildAccountDeletionRequestedEmail(params: {
  purgeDate: string;
  cancelUrl: string;
}): EmailCopy {
  return renderEmail(t.requestedEmail, { date: params.purgeDate, url: params.cancelUrl });
}

export function buildMemberDepartureEmail(params: {
  name: string;
  householdName: string;
  purgeDate: string;
  accounts: number;
  months: readonly YearMonth[];
  successorName: string | null;
}): EmailCopy {
  const copy = t.memberEmail;
  const values = {
    name: params.name,
    household: params.householdName,
    date: params.purgeDate,
    months: describeMonths(params.months),
  };
  const loss =
    params.accounts === 0
      ? copy.losesNothing
      : params.months.length === 0
        ? copy.losesAccountsOnly
        : copy.losesMonths;
  const sentences = [interpolateAll(loss, values)];
  if (params.successorName) {
    sentences.push(interpolateAll(copy.successor, { successor: params.successorName }));
  }
  return renderEmail(copy, {
    name: params.name,
    household: params.householdName,
    summary: sentences.join(" "),
  });
}
