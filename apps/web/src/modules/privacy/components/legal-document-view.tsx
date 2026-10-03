import Link from "next/link";

import { formatIsoDate } from "@/lib/format-date";
import { interpolateAll } from "@/lib/interpolate";
import { PRIVACY_POLICY_ROUTE, TERMS_ROUTE, TERMS_VERSION } from "@/modules/auth";

import { LEGAL_CONTACT_EMAIL, LEGAL_CONTROLLER, legal, type LegalBlock } from "../legal-documents";

export type LegalDocumentKind = "terms" | "privacy";

const linkClassName = "text-brand hover:text-brand-hover underline underline-offset-4";

function fill(text: string): string {
  return interpolateAll(text, { controller: LEGAL_CONTROLLER, contact: LEGAL_CONTACT_EMAIL });
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") {
    return <p>{fill(block)}</p>;
  }
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5">
      {block.map((item) => (
        <li key={item}>{fill(item)}</li>
      ))}
    </ul>
  );
}

export function LegalDocumentView({ kind }: { kind: LegalDocumentKind }) {
  const document = legal[kind];
  const otherRoute = kind === "terms" ? PRIVACY_POLICY_ROUTE : TERMS_ROUTE;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12">
      <header className="flex flex-col gap-2">
        <Link href="/" className="font-heading text-foreground text-lg">
          Feudo
        </Link>
        <h1 className="font-heading text-foreground text-[34px] leading-tight">{document.title}</h1>
        <p className="text-muted-foreground text-sm">
          {interpolateAll(legal.versionLine, {
            date: formatIsoDate(TERMS_VERSION),
            version: TERMS_VERSION,
          })}
        </p>
        <p className="text-foreground mt-2">{document.intro}</p>
      </header>
      <ol className="flex flex-col gap-8">
        {document.sections.map((section, index) => (
          <li key={section.title} className="border-border flex flex-col gap-3 border-t pt-6">
            <h2 className="font-heading text-foreground text-[22px]">
              {`${String(index + 1)}. ${section.title}`}
            </h2>
            <div className="text-foreground flex flex-col gap-3 leading-relaxed">
              {section.blocks.map((block, blockIndex) => (
                <Block key={blockIndex} block={block} />
              ))}
            </div>
          </li>
        ))}
      </ol>
      <footer className="border-border flex flex-wrap gap-x-6 gap-y-2 border-t pt-6 text-sm">
        <Link href={otherRoute} className={linkClassName}>
          {legal.otherDocument[kind]}
        </Link>
        <Link href="/" className={linkClassName}>
          {legal.back}
        </Link>
      </footer>
    </main>
  );
}
