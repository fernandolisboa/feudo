import Link from "next/link";

import { Button } from "@/ui/button";
import { SectionHeader } from "@/ui/section-header";

import type { AnalystBanksNoteProps } from "../page-props";
import { t } from "../strings";

export function AnalystBanksNote({ paragraphs, source, href }: AnalystBanksNoteProps) {
  return (
    <section className="mb-8">
      <SectionHeader title={t.banksNote.title} />
      <div className="flex max-w-[68ch] flex-col gap-3">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="text-[15px] leading-relaxed whitespace-pre-line">
            {paragraph}
          </p>
        ))}
        <p className="text-muted-foreground text-[12px] tabular-nums">{source}</p>
        <div>
          <Button variant="outline" render={<Link href={href} />}>
            {t.banksNote.more}
          </Button>
        </div>
      </div>
    </section>
  );
}
