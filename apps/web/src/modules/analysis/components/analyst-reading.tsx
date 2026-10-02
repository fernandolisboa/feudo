import { SectionHeader } from "@/ui/section-header";

import type { AnalystReadingProps, AnalystReadingView } from "../page-props";
import { t } from "../strings";
import { RequestAnalysisControl } from "./request-analysis-control";

const SUBHEAD_CLASS = "text-muted-foreground mb-2 text-[11px] tracking-[0.08em] uppercase";

function Reading({ reading }: { reading: AnalystReadingView }) {
  return (
    <article className="flex flex-col gap-6">
      <div className="flex max-w-[68ch] flex-col gap-3">
        <p className="text-muted-foreground text-[13px]">{reading.title}</p>
        {reading.paragraphs.map((paragraph, index) => (
          <p key={index} className="text-[15px] leading-relaxed whitespace-pre-line">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className={SUBHEAD_CLASS}>{t.panel.tradeOffs}</h3>
          <ul className="flex flex-col gap-2 text-[14px] leading-relaxed">
            {reading.tradeOffs.map((tradeOff, index) => (
              <li key={index} className="border-border border-l-2 pl-3">
                {tradeOff}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className={SUBHEAD_CLASS}>{t.panel.counterArgument}</h3>
          <p className="text-[14px] leading-relaxed">{reading.counterArgument}</p>
        </div>
      </div>

      {reading.inputsUsed.length > 0 ? (
        <div>
          <h3 className={SUBHEAD_CLASS}>{t.panel.inputsUsed}</h3>
          <dl className="divide-border border-border divide-y border-y text-[13px]">
            {reading.inputsUsed.map((input) => (
              <div
                key={input.key}
                className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
              >
                <dt className="text-muted-foreground">{input.label}</dt>
                <dd className="tabular-nums sm:text-right">{input.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <div className="text-muted-foreground flex flex-col gap-1 text-[12px]">
        <p className="tabular-nums">{reading.meta.join(" · ")}</p>
        <p>{t.panel.disclaimer}</p>
      </div>
    </article>
  );
}

export function AnalystReading({ reading, remaining, limit, inProgress }: AnalystReadingProps) {
  return (
    <section className="mt-10">
      <SectionHeader title={t.panel.title} />
      {reading ? (
        <Reading reading={reading} />
      ) : (
        <p className="font-heading max-w-[60ch] text-[18px]">{t.panel.empty}</p>
      )}
      <RequestAnalysisControl remaining={remaining} limit={limit} inProgress={inProgress} />
    </section>
  );
}
