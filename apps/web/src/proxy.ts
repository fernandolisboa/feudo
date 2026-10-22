import { NextResponse, type NextRequest, type ProxyConfig } from "next/server";

import { contentSecurityPolicy, createNonce, CSP_HEADER } from "@/platform/security-headers";

// Next reads the nonce from the request's CSP header while rendering and
// stamps it on its own scripts, so the same policy goes on the request and
// on the response. Every page is already rendered per request (the root
// layout reads the session), which a nonce requires.
export function proxy(request: NextRequest): NextResponse {
  const policy = contentSecurityPolicy(createNonce(), process.env.NODE_ENV === "development");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CSP_HEADER, policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(CSP_HEADER, policy);
  return response;
}

export const config: ProxyConfig = {
  matcher: [
    {
      source: "/((?!api/|_next/static|_next/image|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
