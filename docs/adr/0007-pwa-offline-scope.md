---
status: accepted
date: 2026-09-02
---

# Offline means read-only: cached shell and last-known data, writes require network

Feudo is an installable PWA (web manifest plus a Serwist service worker) used mostly on desktop with occasional phone use, and every write it accepts (categorization, reserve marks, settings, sync triggers) must be authorized against the session's household on the server. Offline support is therefore read-only: the app shell and the last data each screen loaded are cached and shown with a clear "last updated" indicator, while any write is refused with a message until the network is back. No offline queue, no conflict resolution, no background sync; web push is a later ticket.

## Consequences

- Cached data is scoped to the signed-in user's browser and cleared on sign-out and on household switch, so a shared computer never shows another household's last-known data.
- Nothing financial is precomputed for offline beyond what the screen already rendered; the deterministic layer stays server-side and there is no second copy of the rules in the browser.
