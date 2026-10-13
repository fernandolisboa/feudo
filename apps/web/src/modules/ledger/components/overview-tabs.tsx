"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";

import { t } from "../strings";
import { DEFAULT_OVERVIEW_TAB, OVERVIEW_TABS, type OverviewTab } from "../validation";

function isOverviewTab(value: unknown): value is OverviewTab {
  return (OVERVIEW_TABS as readonly unknown[]).includes(value);
}

// replaceState keeps the open tab in the address (a reload lands on it)
// without a server round trip; Next.js syncs useSearchParams with it.
function rememberTab(tab: OverviewTab) {
  const url = new URL(window.location.href);
  if (tab === DEFAULT_OVERVIEW_TAB) {
    url.searchParams.delete("aba");
  } else {
    url.searchParams.set("aba", tab);
  }
  window.history.replaceState(null, "", url);
}

const TRIGGER_CLASS =
  "h-full flex-none px-2 text-[14px] group-data-horizontal/tabs:after:-bottom-px sm:px-4";

export function OverviewTabs({
  initialTab,
  summary,
  reading,
  accounts,
}: {
  initialTab: OverviewTab;
  summary: ReactNode;
  reading: ReactNode | null;
  accounts: ReactNode;
}) {
  const defaultValue =
    initialTab === "leitura" && reading === null ? DEFAULT_OVERVIEW_TAB : initialTab;

  return (
    <Tabs
      defaultValue={defaultValue}
      onValueChange={(value) => {
        if (isOverviewTab(value)) {
          rememberTab(value);
        }
      }}
      className="gap-6"
    >
      <TabsList
        variant="line"
        aria-label={t.overview.tabs.label}
        className="border-border w-full justify-start rounded-none border-b p-0"
      >
        <TabsTrigger value="resumo" className={TRIGGER_CLASS}>
          {t.overview.tabs.summary}
        </TabsTrigger>
        {reading === null ? null : (
          <TabsTrigger value="leitura" className={TRIGGER_CLASS}>
            {t.overview.tabs.reading}
          </TabsTrigger>
        )}
        <TabsTrigger value="contas" className={TRIGGER_CLASS} data-tour="overview.accounts">
          {t.overview.tabs.accounts}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="resumo">{summary}</TabsContent>
      {reading === null ? null : <TabsContent value="leitura">{reading}</TabsContent>}
      <TabsContent value="contas">{accounts}</TabsContent>
    </Tabs>
  );
}
