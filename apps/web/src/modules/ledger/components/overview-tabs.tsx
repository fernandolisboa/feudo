"use client";

import type { ReactNode } from "react";

import { PageTabs, type PageTab } from "@/ui/page-tabs";

import { t } from "../strings";
import type { OverviewTab } from "../validation";

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
  const tabs: PageTab[] = [
    { value: "resumo", label: t.overview.tabs.summary, content: summary },
    ...(reading === null
      ? []
      : [{ value: "leitura", label: t.overview.tabs.reading, content: reading }]),
    {
      value: "contas",
      label: t.overview.tabs.accounts,
      content: accounts,
      tourTarget: "overview.accounts",
    },
  ];

  return <PageTabs label={t.overview.tabs.label} tabs={tabs} initialTab={initialTab} />;
}
