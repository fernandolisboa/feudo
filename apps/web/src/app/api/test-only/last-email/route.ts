import { NextResponse } from "next/server";
import { fakeEmailSender } from "@/modules/auth/email/fake-sender";
import { readEmailProvider } from "@/modules/auth/env";

export function GET(request: Request): NextResponse {
  if (readEmailProvider() !== "fake") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const to = new URL(request.url).searchParams.get("to");
  const message = to ? fakeEmailSender.lastTo(to) : fakeEmailSender.last();

  if (!message) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(message);
}
