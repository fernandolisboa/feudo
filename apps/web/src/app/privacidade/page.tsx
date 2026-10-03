import type { Metadata } from "next";

import { legal, LegalDocumentView } from "@/modules/privacy";

export const metadata: Metadata = { title: `${legal.privacy.title} · Feudo` };

export default function PrivacyPolicyPage() {
  return <LegalDocumentView kind="privacy" />;
}
