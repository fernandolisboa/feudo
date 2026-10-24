"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";

export const TAB_PARAM = "aba";

export type PageTab = {
  value: string;
  label: string;
  content: ReactNode;
  tourTarget?: string;
};

// replaceState keeps the open tab in the address (a reload lands on it)
// without a server round trip; Next.js syncs useSearchParams with it.
function rememberTab(tab: string, defaultTab: string) {
  const url = new URL(window.location.href);
  if (tab === defaultTab) {
    url.searchParams.delete(TAB_PARAM);
  } else {
    url.searchParams.set(TAB_PARAM, tab);
  }
  window.history.replaceState(null, "", url);
}

const TRIGGER_CLASS =
  "h-full flex-none px-1.5 text-[13px] group-data-horizontal/tabs:after:-bottom-px sm:px-4 sm:text-[14px]";

export function PageTabs({
  label,
  tabs,
  initialTab,
}: {
  label: string;
  tabs: readonly PageTab[];
  initialTab: string | undefined;
}) {
  const defaultTab = tabs[0]?.value ?? "";
  const isTab = (value: unknown): value is string => tabs.some((tab) => tab.value === value);
  const openTab = isTab(initialTab) ? initialTab : defaultTab;

  return (
    <Tabs
      defaultValue={openTab}
      onValueChange={(value) => {
        if (isTab(value)) {
          rememberTab(value, defaultTab);
        }
      }}
      className="gap-6"
    >
      <TabsList
        variant="line"
        aria-label={label}
        className="border-border w-full justify-start gap-0 rounded-none border-b p-0 sm:gap-1"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={TRIGGER_CLASS}
            data-tour={tab.tourTarget}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {/* Hidden panels stay mounted so a pending action, an open draft or a
          result keeps its state when the person looks at another tab. */}
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} keepMounted>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
