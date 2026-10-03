import type { Metadata } from "next";

import { legal, LegalDocumentView } from "@/modules/privacy";

export const metadata: Metadata = { title: `${legal.terms.title} · Feudo` };

export default function TermsPage() {
  return <LegalDocumentView kind="terms" />;
}
