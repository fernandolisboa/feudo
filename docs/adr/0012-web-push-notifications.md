---
status: accepted
date: 2026-10-04
---

# Web push notifications: opt-in per device, three events, no amounts

#29 asks for a member to opt in to notifications and receive them when the reserve target moves more than 10%, when a sync fails repeatedly, and when the monthly analysis is ready. ADR-0007 left web push for later; the offline service worker (#28) is now in place to receive it.

## Decision

- **Standard Web Push with VAPID**, sent with the `web-push` library from the jobs that already detect each event. No third-party notification service: the browser's own push service (Google for Chrome and Edge on Android, Microsoft for Edge on Windows, Apple for Safari, Mozilla for Firefox) delivers an end-to-end encrypted payload. Push is on only when `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are set; without them the Preferências section is hidden and every job sends nothing. The keys are generated once and live only in the Vercel environment.
- **Opt-in is per user and per device.** Preferências has a switch "Receber notificações neste aparelho". Turning it on asks the browser for permission and stores the device's subscription. Turning it off removes it from the browser and from Feudo. The browser remembers which person turned notifications on there (`feudo.push.owner`, kept apart from the offline-copy scope that the sign-in pages clear); Preferências shows the switch on, and quietly re-saves the subscription, only for that person, so opening Preferências never moves someone else's device. On iPhone, Safari only offers push to an app added to the Home Screen, so the section says so instead of showing a switch that cannot work.
- **`push_subscription` is user-scoped** (ADR-0001): `user_id`, the endpoint and its two public keys, `created_at`. Nothing about households or money. The endpoint is unique: a device has one subscription, and it belongs to whoever turned notifications on there last, so saving an endpoint another user held moves it. Each user keeps at most 10 devices; the oldest goes first. Endpoints are accepted only over HTTPS on the known push-service hosts, so Feudo never posts to an address a client made up.
- **Who receives what.** Reserve target moved and monthly analysis ready go to every member of the household with a subscription. Sync failing repeatedly goes only to the connection's owner, the one person who can fix it. A user whose account deletion is pending, or a household pending deletion, receives nothing. Recipients are read when the event happens, so someone who left the household is not notified.
- **"Repeatedly" is three failed attempts in a row.** `bank_connection.consecutive_sync_failures` counts failed attempts, daily or manual, and resets on the next success. The notification fires once, when the count reaches 3, not on every failure after it. A failure for missing credentials never notifies: removing them is the person's own choice, already explained on the connection.
- **Payload.** Each notification is a title, a short body, a tag and the in-app route it opens. It names the household or the bank and says what happened, never an amount, a balance or a transaction. Copy is built on the server in pt-BR; the service worker only shows it, with `renotify` so a new streak that reuses a tag still alerts. The service worker parses the payload by hand rather than with zod, to stay small, and accepts only a path that resolves to Feudo's own origin.
- **Delivery is best effort and never fails a job.** A send that the push service answers with 404 or 410 deletes that subscription; any other failure is logged without the endpoint and dropped. No retries and no queue.
- **Lifecycle.** Signing out unsubscribes the browser and then, while the session still exists to say whose it is, asks Feudo to delete that endpoint (`DELETE /api/push-subscription`, same-origin only, scoped to the session's user). A sign-out made offline, or a different person signing in after the first one's session expired, can only unsubscribe the browser: the first person's row goes the first time a send meets the dead endpoint. Asking to delete the account removes every subscription at once, in the same transaction that revokes the sessions; the hard delete cascades with the user row. The data export lists the push service and date of each subscription, never the endpoint.

## Consequences

- One new user-scoped table and one column on `bank_connection`, both additive (migration `0024`), each with an isolation test.
- The privacy policy names the push services as recipients and the subscription's retention, so `TERMS_VERSION` moves and everyone re-accepts once.
- A notification can only open the route it carries; if the person's active household is a different one, the screen shows that household until they switch.
- Browsers that rotate a subscription without telling the page stop receiving until the person opens Preferências again, which re-saves the current subscription. No `pushsubscriptionchange` handling until that shows up in practice.
- Rotating the VAPID keys strands every existing subscription (the push services refuse it, and Feudo counts that as a failure, not as gone). Turning notifications on again replaces a subscription made with an earlier key.
