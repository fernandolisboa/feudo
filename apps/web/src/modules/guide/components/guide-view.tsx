import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/ui/button";
import { PageHeader } from "@/ui/page-header";
import { SectionHeader } from "@/ui/section-header";

import { GUIDE_SECTIONS } from "../sections";
import { t } from "../strings";

export function GuideView() {
  return (
    <>
      <PageHeader overline={t.overline} title={t.title} />
      <p className="text-muted-foreground mb-6 max-w-prose text-sm leading-relaxed">{t.intro}</p>

      <nav aria-label={t.tocLabel} className="mb-10">
        <p className="page-header-overline mb-2">{t.tocLabel}</p>
        <ol className="grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
          {GUIDE_SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-brand hover:text-brand-hover underline-offset-4 hover:underline"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {GUIDE_SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="mb-10 scroll-mt-6">
          <SectionHeader
            title={section.title}
            actions={
              section.link ? (
                <Button variant="ghost" size="sm" render={<Link href={section.link.href} />}>
                  {section.link.label}
                  <ArrowRight className="size-4" />
                </Button>
              ) : undefined
            }
          />
          <div className="flex max-w-prose flex-col gap-5">
            {section.topics.map((topic) => (
              <div key={topic.title}>
                <h3 className="text-foreground text-[15px] font-semibold">{topic.title}</h3>
                <p className="mt-1 text-sm leading-relaxed">{topic.body}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
