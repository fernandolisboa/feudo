"use client";

import { Source_Sans_3, Source_Serif_4 } from "next/font/google";

import { RetryNotice } from "@/ui/retry-notice";

import "./globals.css";

// This file replaces the root layout when the layout itself fails, so it can
// lean on nothing the layout provides, and as a Client Component it cannot
// import a slice's index (that pulls server-only code into the browser).
// Its copy and the default theme's fonts therefore live here; the household's
// theme is not resolved, since that needs the session read that may have
// failed. The thrown error is never rendered.
const en = {
  title: "Feudo is unavailable",
  body: "Something failed on our side. Your data is safe. Try again in a moment.",
  retry: "Try again",
};

const ptBR = {
  title: "O Feudo não abriu",
  body: "Algo falhou do nosso lado. Seus dados estão seguros. Tente de novo daqui a pouco.",
  retry: "Tentar de novo",
} satisfies typeof en;

const globalErrorStrings = { en, ptBR };

const t = globalErrorStrings.ptBR;

const sourceSerif4 = Source_Serif_4({ variable: "--font-source-serif-4", subsets: ["latin"] });
const sourceSans3 = Source_Sans_3({ variable: "--font-source-sans-3", subsets: ["latin"] });

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html
      lang="pt-BR"
      className={`${sourceSerif4.variable} ${sourceSans3.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
          <span className="font-heading text-foreground text-lg">Feudo</span>
          <div className="border-border bg-card w-full max-w-sm rounded-lg border p-6">
            <h1 className="font-heading text-foreground mb-6 text-[34px]">{t.title}</h1>
            <RetryNotice message={t.body} retryLabel={t.retry} onRetry={retry} />
          </div>
        </main>
      </body>
    </html>
  );
}
