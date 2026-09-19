import Link from "next/link";
import { Landmark } from "lucide-react";

import { Button } from "@/ui/button";
import { SectionHeader } from "@/ui/section-header";

import type { AccountsSectionProps } from "../page-props";
import { AccountsTable } from "./accounts-table";
import { ConnectionsPanel } from "./connections-panel";
import { t } from "../strings";

export function AccountsSection({
  domesticAccounts,
  foreignAccounts,
  connections,
  hasCredentials,
  credentialsSavedAt,
  viewerUserId,
  timeZone,
}: AccountsSectionProps) {
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
        {domesticAccounts.length === 0 ? (
          <p className="font-heading text-sm">{t.accounts.empty}</p>
        ) : (
          <AccountsTable
            accounts={domesticAccounts}
            viewerUserId={viewerUserId}
            timeZone={timeZone}
          />
        )}
      </section>

      {foreignAccounts.length > 0 ? (
        <section className="mt-8">
          <SectionHeader title={t.accounts.foreignSectionTitle} />
          <p className="text-muted-foreground mb-3 text-sm">{t.accounts.foreignNote}</p>
          <AccountsTable
            accounts={foreignAccounts}
            viewerUserId={viewerUserId}
            timeZone={timeZone}
          />
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
