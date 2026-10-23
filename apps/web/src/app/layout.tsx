import type { Metadata } from "next";
import {
  Figtree,
  Fraunces,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Lexend,
  Manrope,
  Nunito_Sans,
  Source_Sans_3,
  Source_Serif_4,
} from "next/font/google";
import type { ReactNode } from "react";

import { TooltipProvider } from "@/ui/tooltip";
import { cn } from "@/lib/utils";
import { getCurrentSession } from "@/modules/auth";
import { colorSchemeFor, resolveTheme } from "@/modules/theme";

import "./globals.css";

const sourceSerif4 = Source_Serif_4({ variable: "--font-source-serif-4", subsets: ["latin"] });
const sourceSans3 = Source_Sans_3({ variable: "--font-source-sans-3", subsets: ["latin"] });
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
// Not preloaded: only the themes that use these fonts download them.
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], preload: false });
const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  preload: false,
});
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], preload: false });
const lexend = Lexend({ variable: "--font-lexend", subsets: ["latin"], preload: false });

const fontVariables = [
  sourceSerif4.variable,
  sourceSans3.variable,
  ibmPlexSans.variable,
  ibmPlexMono.variable,
  figtree.variable,
  fraunces.variable,
  nunitoSans.variable,
  manrope.variable,
  lexend.variable,
].join(" ");

export const metadata: Metadata = {
  title: "Feudo",
  description: "Finanças e inteligência bancária para o lar.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  const theme = resolveTheme(session?.theme);
  const isDark = colorSchemeFor(theme) === "dark";

  return (
    <html
      lang="pt-BR"
      data-theme={theme}
      className={cn(fontVariables, isDark && "dark", "h-full antialiased")}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
