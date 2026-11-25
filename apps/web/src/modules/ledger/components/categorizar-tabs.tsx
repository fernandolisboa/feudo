"use client";

import type { ReactNode } from "react";

import { PageTabs, type PageTab } from "@/ui/page-tabs";
import { interpolate } from "@/lib/interpolate";

import { t } from "../strings";
import type { CategorizeTab } from "../validation";

export function CategorizarTabs({
  initialTab,
  pendingLinksCount,
  categorias,
  vinculos,
}: {
  initialTab: CategorizeTab;
  pendingLinksCount: number;
  categorias: ReactNode;
  vinculos: ReactNode;
}) {
  const tabs: PageTab[] = [
    { value: "categorias", label: t.categorizeTabs.categories, content: categorias },
    {
      value: "vinculos",
      label:
        pendingLinksCount > 0
          ? interpolate(t.categorizeTabs.linksWithCount, "{count}", String(pendingLinksCount))
          : t.categorizeTabs.links,
      content: vinculos,
    },
  ];

  return <PageTabs label={t.categorizeTabs.label} tabs={tabs} initialTab={initialTab} />;
}
