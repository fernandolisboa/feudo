import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { tokensMatch } from "@/lib/timing-safe-token";
import { findLastFakeSentEmail } from "@/modules/auth/email/fake-email-repository";
import { readEmailProvider } from "@/modules/auth/env";

function isEligibleEnvironment(): boolean {
  return process.env.VERCEL_ENV !== "production" && readEmailProvider() === "fake";
}

function isAuthorized(authorizationHeader: string | null): boolean {
  const token = process.env.TEST_ONLY_TOKEN;
  if (!token || !authorizationHeader) {
    return false;
  }
  return tokensMatch(`Bearer ${token}`, authorizationHeader);
}

const notFound = (): NextResponse => NextResponse.json({ error: "not_found" }, { status: 404 });

export async function GET(request: Request): Promise<NextResponse> {
  if (!isEligibleEnvironment()) {
    console.error("DEBUG-TEMP last-email: not eligible", {
      vercelEnv: process.env.VERCEL_ENV,
      emailProvider: readEmailProvider(),
    });
    return notFound();
  }

  if (!isAuthorized(request.headers.get("authorization"))) {
    console.error("DEBUG-TEMP last-email: unauthorized", {
      hasToken: Boolean(process.env.TEST_ONLY_TOKEN),
      hasHeader: Boolean(request.headers.get("authorization")),
    });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const to = new URL(request.url).searchParams.get("to");
  if (!to) {
    console.error("DEBUG-TEMP last-email: missing to param");
    return notFound();
  }

  const message = await findLastFakeSentEmail(getDb(), to);
  if (!message) {
    console.error("DEBUG-TEMP last-email: no message found", { to });
    return notFound();
  }

  return NextResponse.json(message);
}
