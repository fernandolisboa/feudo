---
status: accepted
date: 2026-09-09
---

# Themes are per-user token sets plus a shell layout, over one canonical structure

The owner wants users to pick a look, and the three direction sketches from Phase 2 (Caderno, Painel, Sala) differed in colour, type, radius and density but also in structure (top nav vs sidebar, cards vs hairlines). Shipping three structures would triple every UI ticket and its design gate. We therefore fix one set of components for every screen (page header, hairline sections, stat tiles, bar lists, tables) and ship the three directions as **themes**: CSS variable sets selected by `data-theme`, plus one layout field for the app shell, `shell: sidebar | topnav`, resolved by `grid-template-areas` in the single AppShell component (Caderno and Painel use `sidebar`, Sala uses `topnav`). The preference is stored per user (not per household), with Caderno as the default. The preference is a column on the existing user record, not a new domain table; it does not extend the user-scoped table list in ADR-0001.

## Consequences

- Adding a theme is a new token file plus a row in the contrast test; no component changes.
- The Impeccable gate runs on the default theme; an automated contrast test covers every theme's text-on-surface and chart-on-background pairs, so no theme can ship below WCAG AA.
- A theme may move the navigation (sidebar or top bar) and restyle any component through tokens (`--elevation`, `--radius`, density), but it cannot change component anatomy: the accounts list is one table component in every theme, the page headline is one component. Swapping a table for a card grid would be a new component decision, not a theme.
- The AppShell is tested in both layouts plus the mobile bottom-tab variant.
- `theme` writes `user.theme` directly (a scoped update by the session's own user id), a documented exception to ADR-0001's "only the `auth` and `households` modules touch Better Auth"; the column is a UI preference, not identity or tenancy, and carries no isolation risk.
