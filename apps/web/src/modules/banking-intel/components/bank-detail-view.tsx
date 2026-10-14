import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/ui/badge";
import { Notice } from "@/ui/notice";
import { PageHeader } from "@/ui/page-header";
import { SectionHeader } from "@/ui/section-header";
import { StatTile } from "@/ui/stat-tile";
import { interpolate } from "@/lib/interpolate";

import type { BankDetailPageProps, CriterionDetailView } from "../bank-detail-props";
import { t } from "../strings";
import { CriterionOverrideDialog } from "./criterion-override-dialog";
import { OverrideActions } from "./override-actions";

const LINK_CLASS = "text-brand hover:text-brand-hover underline underline-offset-4";

function CriterionBlock({
  item,
  institutionId,
  bankName,
  canManage,
}: {
  item: CriterionDetailView;
  institutionId: string;
  bankName: string;
  canManage: boolean;
}) {
  const { override } = item;
  return (
    <li className="flex flex-col gap-3 py-5" aria-label={item.label}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="font-heading text-[18px]">{item.label}</h3>
          <p className="text-muted-foreground text-[12px]">{item.help}</p>
          <p className="text-muted-foreground text-[12px] tabular-nums">{item.weightLabel}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-heading text-[26px] leading-none tabular-nums">
            {item.scoreLabel}
          </span>
          {override ? <Badge variant="secondary">{t.detail.householdScore}</Badge> : null}
        </div>
      </div>

      {override ? (
        <div className="border-border flex max-w-[68ch] flex-col gap-2 border-l-2 pl-3">
          <p className="text-[14px]">{override.summary}</p>
          {override.sourceUrl ? (
            <a
              href={override.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`${LINK_CLASS} self-start text-[13px]`}
            >
              {t.detail.householdSource}
            </a>
          ) : null}
          {override.outdatedHint ? <Notice>{override.outdatedHint}</Notice> : null}
          {canManage ? (
            <OverrideActions
              institutionId={institutionId}
              criterion={item.criterion}
              outdated={override.outdatedHint !== null}
            />
          ) : null}
        </div>
      ) : null}

      <p
        className={
          override ? "text-muted-foreground max-w-[68ch] text-[13px]" : "max-w-[68ch] text-[14px]"
        }
      >
        {override
          ? `${interpolate(t.detail.referenceScore, "{score}", item.referenceScoreLabel)}. `
          : null}
        {item.summary}
      </p>

      {item.sources.length > 0 ? (
        <div className="flex flex-col gap-1">
          <h4 className="text-muted-foreground text-[11px] tracking-wide uppercase">
            {t.detail.sources}
          </h4>
          <ul className="flex flex-col gap-1 text-[13px]">
            {item.sources.map((source) => (
              <li key={source.url} className="flex flex-wrap items-baseline gap-x-2">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${LINK_CLASS} break-all`}
                >
                  {source.host}
                </a>
                <span className="text-muted-foreground text-[12px] tabular-nums">
                  {source.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-muted-foreground flex flex-wrap items-center gap-2 text-[12px] tabular-nums">
          {item.review.label}
          {item.review.stale ? <Badge variant="outline">{t.candidates.stale}</Badge> : null}
        </span>
        {canManage ? (
          <CriterionOverrideDialog
            institutionId={institutionId}
            bankName={bankName}
            criterion={item.criterion}
            criterionLabel={item.label}
            triggerLabel={override ? t.detail.editOwn : t.detail.correct}
            defaults={item.formDefaults}
          />
        ) : null}
      </div>
    </li>
  );
}

export function BankDetailView(props: BankDetailPageProps) {
  const { institutionId, name, tag, unmetLabel, stats, paymentInstitutionNotice, canManage } =
    props;
  return (
    <>
      <Link
        href="/bancos"
        className="text-muted-foreground hover:text-foreground mb-2 inline-flex min-h-11 items-center gap-1 text-[13px] md:min-h-9"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {t.detail.back}
      </Link>
      <PageHeader
        overline={t.overline}
        title={name}
        actions={
          tag || unmetLabel ? (
            <>
              {tag ? <Badge variant="secondary">{tag}</Badge> : null}
              {unmetLabel ? <Badge variant="outline">{unmetLabel}</Badge> : null}
            </>
          ) : undefined
        }
      />

      <div className="bg-border mb-6 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-3">
        {stats.map((stat) => (
          <StatTile key={stat.label} {...stat} />
        ))}
      </div>

      {paymentInstitutionNotice ? <Notice>{paymentInstitutionNotice}</Notice> : null}

      <section className="mb-8">
        <SectionHeader
          title={t.detail.criteriaTitle}
          actions={
            <span className="text-muted-foreground text-[12px]">{t.detail.criteriaMeta}</span>
          }
        />
        <ul className="divide-border flex flex-col divide-y border-y">
          {props.criteria.map((item) => (
            <CriterionBlock
              key={item.criterion}
              item={item}
              institutionId={institutionId}
              bankName={name}
              canManage={canManage}
            />
          ))}
        </ul>
        {canManage ? null : (
          <p className="text-muted-foreground mt-3 text-[13px]">{t.detail.readOnly}</p>
        )}
      </section>

      <p className="text-muted-foreground max-w-[68ch] text-[12px]">{t.method}</p>
    </>
  );
}
