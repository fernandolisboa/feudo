import Link from "next/link";
import { Landmark } from "lucide-react";

import { Button } from "@/ui/button";
import { SectionHeader } from "@/ui/section-header";

import type { AccountsSectionProps } from "../page-props";
import { AccountsTable } from "./accounts-table";
import { ConnectionsPanel } from "./connections-panel";
import { t } from "../strings";

const HOUSEHOLD_CURRENCY = "BRL";

export function AccountsSection({
  accounts,
  connections,
  hasCredentials,
  credentialsSavedAt,
  viewerUserId,
  timeZone,
}: AccountsSectionProps) {
  const domestic = accounts.filter((account) => account.currency === HOUSEHOLD_CURRENCY);
  const foreign = accounts.filter((account) => account.currency !== HOUSEHOLD_CURRENCY);

  return (
    <>
      <section>
        <SectionHeader
          title={t.accounts.sectionTitle}
          actions={
            hasCredentials ? undefined : (
              <Button render={<Link href="/conectar-banco" />}>
                <Landmark className="size-4" />
                {t.accounts.connectAction}
              </Button>
            )
          }
        />
        {domestic.length === 0 ? (
          <p className="font-heading text-sm">{t.accounts.empty}</p>
        ) : (
          <AccountsTable accounts={domestic} viewerUserId={viewerUserId} timeZone={timeZone} />
        )}
      </section>

      {foreign.length > 0 ? (
        <section className="mt-8">
          <SectionHeader title={t.accounts.foreignSectionTitle} />
          <p className="text-muted-foreground mb-3 text-sm">{t.accounts.foreignNote}</p>
          <AccountsTable accounts={foreign} viewerUserId={viewerUserId} timeZone={timeZone} />
        </section>
      ) : null}

      <section className="mt-8">
        <SectionHeader title={t.connections.sectionTitle} />
        <ConnectionsPanel
          connections={connections}
          hasCredentials={hasCredentials}
          credentialsSavedAt={credentialsSavedAt}
          timeZone={timeZone}
        />
      </section>
    </>
  );
}
