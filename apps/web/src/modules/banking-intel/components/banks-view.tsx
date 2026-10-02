import Link from "next/link";

import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Notice } from "@/ui/notice";
import { PageHeader } from "@/ui/page-header";
import { SectionHeader } from "@/ui/section-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

import type { BanksPageProps, CandidateView, ReviewView } from "../page-props";
import { t } from "../strings";
import { CriteriaWeightsEditor } from "./criteria-weights-editor";

const HEAD_CLASS = "text-muted-foreground text-[11px] tracking-wide uppercase";

const CANDIDATE_GRID_COLS: Record<number, string> = {
  1: "",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
};

function Review({ review }: { review: ReviewView }) {
  return (
    <span className="text-muted-foreground flex flex-wrap items-center gap-2 text-[12px] tabular-nums">
      {review.label}
      {review.stale ? <Badge variant="outline">{t.candidates.stale}</Badge> : null}
    </span>
  );
}

function ComparisonList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-muted-foreground text-[11px] tracking-wide uppercase">{title}</h4>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-[13px]">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-1 text-[13px] tabular-nums">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: CandidateView }) {
  return (
    <article className="bg-card flex flex-col gap-4 p-4" aria-label={candidate.name}>
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-[11px] tracking-wide uppercase">
          {candidate.rankLabel}
        </p>
        <h3 className="font-heading text-[18px]">{candidate.name}</h3>
        <p className="flex items-baseline gap-1">
          <span className="font-heading text-[26px] tabular-nums">{candidate.scoreLabel}</span>
          <span className="text-muted-foreground text-[13px]">{t.candidates.scoreOf}</span>
        </p>
        <Review review={candidate.review} />
      </div>
      <ComparisonList
        title={t.candidates.pros}
        items={candidate.pros}
        empty={candidate.emptyPros}
      />
      <ComparisonList
        title={t.candidates.cons}
        items={candidate.cons}
        empty={candidate.emptyCons}
      />
      {candidate.missingEvidence ? (
        <p className="text-muted-foreground text-[12px]">{candidate.missingEvidence}</p>
      ) : null}
    </article>
  );
}

export function BanksView(props: BanksPageProps) {
  const {
    headline,
    canManage,
    weightsAreCustom,
    weights,
    hasAccounts,
    currentRows,
    baselineNotice,
    unrecognizedNotice,
    candidates,
  } = props;

  return (
    <>
      <PageHeader overline={t.overline} title={headline} />

      {baselineNotice ? (
        <Notice
          action={
            hasAccounts ? undefined : (
              <Button size="sm" render={<Link href="/conectar-banco" />}>
                {t.current.connectAction}
              </Button>
            )
          }
        >
          {baselineNotice}
        </Notice>
      ) : null}
      {unrecognizedNotice ? <Notice>{unrecognizedNotice}</Notice> : null}

      <section className="mb-8">
        <SectionHeader
          title={t.candidates.title}
          actions={<span className="text-muted-foreground text-[12px]">{t.candidates.meta}</span>}
        />
        <div
          className={`bg-border grid gap-px overflow-hidden rounded-lg border ${
            CANDIDATE_GRID_COLS[candidates.length] ?? "md:grid-cols-3"
          }`}
        >
          {candidates.map((candidate) => (
            <CandidateCard key={candidate.institutionId} candidate={candidate} />
          ))}
        </div>
      </section>

      {currentRows.length > 0 ? (
        <section className="mb-8">
          <SectionHeader title={t.current.title} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={HEAD_CLASS}>{t.current.bank}</TableHead>
                <TableHead className={`${HEAD_CLASS} text-right`}>{t.current.score}</TableHead>
                <TableHead className={HEAD_CLASS}>{t.current.reviewedAt}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRows.map((row) => (
                <TableRow key={row.institutionId} className="h-[var(--density-row)]">
                  <TableCell>{row.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.scoreLabel}</TableCell>
                  <TableCell>
                    <Review review={row.review} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ) : null}

      <section className="mb-8">
        <SectionHeader
          title={t.weights.title}
          actions={
            <span className="text-muted-foreground text-[12px]">
              {weightsAreCustom ? t.weights.custom : t.weights.defaults}
            </span>
          }
        />
        {canManage ? (
          <CriteriaWeightsEditor weights={weights} weightsAreCustom={weightsAreCustom} />
        ) : (
          <>
            <ul className="divide-border flex flex-col divide-y border-y">
              {weights.map((entry) => (
                <li
                  key={entry.criterion}
                  className="grid min-h-[var(--density-row)] grid-cols-[1fr_auto] items-center gap-3 py-2"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="text-[14px]">{entry.label}</span>
                    <span className="text-muted-foreground text-[12px]">{entry.help}</span>
                  </div>
                  <span className="text-[14px]">{entry.levelLabel}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-3 text-[13px]">{t.weights.readOnly}</p>
          </>
        )}
      </section>

      <p className="text-muted-foreground max-w-[68ch] text-[12px]">{t.method}</p>
    </>
  );
}
