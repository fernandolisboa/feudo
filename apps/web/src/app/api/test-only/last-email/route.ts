import { NextResponse } from "next/server";
import { getDb } from "@/platform/db/client";
import { tokensMatch } from "@/platform/timing-safe-token";
import { findLastFakeSentEmail, isFakeEmailProvider } from "@/modules/auth";

function isEligibleEnvironment(): boolean {
  return process.env.VERCEL_ENV !== "production" && isFakeEmailProvider();
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
    return notFound();
  }

  if (!isAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const to = new URL(request.url).searchParams.get("to");
  if (!to) {
    return notFound();
  }

  const message = await findLastFakeSentEmail(getDb(), to);
  if (!message) {
    return notFound();
  }

  return NextResponse.json(message);
}
