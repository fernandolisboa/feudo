export const STATIC_SECURITY_HEADERS: readonly { key: string; value: string }[] = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
];

export const CSP_HEADER = "Content-Security-Policy";

// Route handlers answer JSON, files and redirects, plus Better Auth's own
// error page: nothing there needs to run a script or be framed.
export const API_CONTENT_SECURITY_POLICY =
  "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

export function createNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64");
}

// Scripts are nonce-only ('strict-dynamic' lets Next's nonced loader pull its
// chunks). Styles keep 'unsafe-inline' and no nonce: React style attributes
// cannot carry one, and a nonce in style-src would switch 'unsafe-inline' off.
export function contentSecurityPolicy(nonce: string, isDevelopment: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}
