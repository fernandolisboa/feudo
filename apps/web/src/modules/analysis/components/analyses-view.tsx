import Link from "next/link";

import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";
import { PageHeader } from "@/ui/page-header";
import { SectionHeader } from "@/ui/section-header";

import { interpolate } from "@/lib/interpolate";
import { cn } from "@/lib/utils";

import type { AnalysesPageProps, AnalysisDetailView, AnalysisHistoryItem } from "../page-props";
import { ANALYSES_PATH } from "../paths";
import { t } from "../strings";
import { InputsUsed } from "./inputs-used";
import { RequestAnalysisControl } from "./request-analysis-control";

const SUBHEAD_CLASS = "text-muted-foreground mb-2 text-[11px] tracking-[0.08em] uppercase";

function Paragraphs({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="flex flex-col gap-3">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-[15px] leading-relaxed whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function Reading({ reading }: { reading: AnalysisDetailView }) {
  const hasBanks = reading.banks.length > 0;
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,68ch)_minmax(0,1fr)]">
      <article className="flex min-w-0 flex-col gap-8">
        <section>
          <SectionHeader
            title={hasBanks ? t.analyses.readingSection : t.analyses.readingOnlySection}
          />
          <Paragraphs paragraphs={reading.reading} />
        </section>

        {hasBanks ? (
          <section>
            <SectionHeader
              title={t.analyses.banksSection}
              actions={
                <Button variant="link" size="sm" render={<Link href="/bancos" />}>
                  {t.analyses.banksLink}
                </Button>
              }
            />
            <Paragraphs paragraphs={reading.banks} />
          </section>
        ) : null}

        <div className="flex flex-col gap-6">
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

        <div className="text-muted-foreground flex flex-col gap-1 text-[12px]">
          <p className="tabular-nums">{reading.meta.join(" · ")}</p>
          <p>{t.panel.disclaimer}</p>
        </div>
      </article>

      {reading.inputsUsed.length > 0 ? <InputsUsed inputs={reading.inputsUsed} /> : null}
    </div>
  );
}

function History({ items }: { items: AnalysisHistoryItem[] }) {
  return (
    <section className="mt-10">
      <SectionHeader title={t.analyses.history} />
      <ul className="divide-border border-border divide-y border-b">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={cn(
                "hover:bg-muted flex min-h-11 flex-col justify-center gap-0.5 px-1 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:min-h-[var(--density-row)]",
                item.current && "text-brand",
              )}
            >
              <span className="text-[14px]">
                {item.title}
                {item.current ? (
                  <span className="text-muted-foreground ml-2 text-[12px]">
                    {t.analyses.current}
                  </span>
                ) : null}
              </span>
              <span className="text-muted-foreground text-[12px] tabular-nums">{item.meta}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function headline(reading: AnalysisDetailView | null): { overline: string; title: string } {
  if (reading === null) {
    return { overline: t.analyses.overline, title: t.analyses.emptyTitle };
  }
  if (reading.summary === null) {
    return { overline: t.analyses.overline, title: reading.title };
  }
  return {
    overline: interpolate(t.analyses.overlineWith, "{reading}", reading.title),
    title: reading.summary,
  };
}

export function AnalysesView({
  reading,
  isLatest,
  history,
  limit,
  remaining,
  inProgress,
}: AnalysesPageProps) {
  const { overline, title } = headline(reading);
  return (
    <>
      <PageHeader overline={overline} title={title} />

      {isLatest ? null : (
        <Notice
          action={
            <Button size="sm" variant="outline" render={<Link href={ANALYSES_PATH} />}>
              {t.analyses.latest}
            </Button>
          }
        >
          {t.analyses.earlier}
        </Notice>
      )}

      {reading ? (
        <Reading reading={reading} />
      ) : (
        <p className="font-heading max-w-[60ch] text-[18px]">{t.panel.empty}</p>
      )}

      {isLatest ? (
        <div className="max-w-[68ch]">
          <RequestAnalysisControl remaining={remaining} limit={limit} inProgress={inProgress} />
        </div>
      ) : null}

      {history.length > 1 ? <History items={history} /> : null}
    </>
  );
}

export function AnalysesOff() {
  return (
    <>
      <PageHeader overline={t.analyses.overline} title={t.off.title} />
      <Notice
        action={
          <Button variant="outline" size="sm" render={<Link href="/casa?aba=analista" />}>
            {t.off.link}
          </Button>
        }
      >
        {t.off.explanation}
      </Notice>
    </>
  );
}
