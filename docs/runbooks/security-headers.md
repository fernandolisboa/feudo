# Security headers and CSP

Issue #122. Two layers, both on by default in every environment:

- **Static headers** (`apps/web/next.config.ts`, values in `platform/security-headers.ts`) on
  every response, pages and `/api` alike: `X-Frame-Options: DENY`, `X-Content-Type-Options:
nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` that turns
  off camera, microphone, geolocation, payment, USB and topics. `X-Powered-By` is off.
- **Content-Security-Policy** (`apps/web/src/proxy.ts`) on every page: a fresh nonce per
  request, `script-src 'self' 'nonce-…' 'strict-dynamic'`, `frame-ancestors 'none'`,
  `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, everything else `'self'`. The
  proxy puts the policy on the request too, which is how Next finds the nonce and stamps it on
  its own scripts. A nonce needs per-request rendering; every page already is (the root layout
  reads the session). The matcher skips `/api/`, `_next/static`, `_next/image`, any path with a
  dot (`sw.js`, the manifest, icons) and router prefetches: none of them renders a document.
  Route handlers get a fixed `default-src 'none'` policy from `next.config.ts` instead.

Deliberate exceptions:

- `style-src 'self' 'unsafe-inline'`, no nonce: React writes `style` attributes, which cannot
  carry a nonce, and a nonce in `style-src` would switch `'unsafe-inline'` off.
- `'unsafe-eval'` only under `next dev`.
- Zod runs `jitless` in the browser (`src/instrumentation-client.ts`): its JIT probes
  `new Function`, which the CSP refuses and reports on every page.

Adding something the policy blocks (an inline `<script>` without the nonce, a third-party
script, font, image host or `fetch` origin, an iframe) fails silently in the browser with a
"Refused to …" console error. Extend `contentSecurityPolicy` in `platform/security-headers.ts`
in the same change and keep `e2e/security-headers.spec.ts` green: it fails on any CSP violation
on the sign-in page. Vercel's preview toolbar (`vercel.live`) is blocked on previews by design
and ignored by that test; production never loads it.
