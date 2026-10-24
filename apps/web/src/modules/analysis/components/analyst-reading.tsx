import Link from "next/link";

import { Button } from "@/ui/button";
import { SectionHeader } from "@/ui/section-header";

import type { AnalystReadingProps, AnalystReadingView } from "../page-props";
import { t } from "../strings";
import { InputsUsed } from "./inputs-used";
import { RequestAnalysisControl } from "./request-analysis-control";

const SUBHEAD_CLASS = "text-muted-foreground mb-2 text-[11px] tracking-[0.08em] uppercase";

function Summary({ reading }: { reading: AnalystReadingView }) {
  return (
    <article className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-[13px]">{reading.title}</p>
        <p className="font-heading text-[18px] leading-snug whitespace-pre-line">
          {reading.summary}
        </p>
      </div>
      <div>
        <h3 className={SUBHEAD_CLASS}>{t.panel.counterArgument}</h3>
        <p className="text-[14px] leading-relaxed">{reading.counterArgument}</p>
      </div>
      <div>
        <Button variant="outline" render={<Link href={reading.href} />}>
          {t.panel.readFull}
        </Button>
      </div>
      <div className="text-muted-foreground flex flex-col gap-1 text-[12px]">
        <p className="tabular-nums">{reading.meta.join(" · ")}</p>
        <p>{t.panel.disclaimer}</p>
      </div>
    </article>
  );
}

export function AnalystReading({ reading, remaining, limit, inProgress }: AnalystReadingProps) {
  return (
    <section>
      <SectionHeader title={t.panel.title} />
      {reading ? (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,68ch)_minmax(0,1fr)]">
          <Summary reading={reading} />
          {reading.inputsUsed.length > 0 ? <InputsUsed inputs={reading.inputsUsed} /> : null}
        </div>
      ) : (
        <p className="font-heading max-w-[60ch] text-[18px]">{t.panel.empty}</p>
      )}
      <RequestAnalysisControl remaining={remaining} limit={limit} inProgress={inProgress} />
    </section>
  );
}
