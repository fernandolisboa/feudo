---
status: accepted
date: 2026-09-09
---

# Themes are per-user token sets plus a shell layout, over one canonical structure

> Amended 2026-10-23: the shell layout is no longer part of a theme. It is a separate per-user
> preference; where the text below ties `shell` to a theme, the amendment at the end wins.

The owner wants users to pick a look, and the three direction sketches from Phase 2 (Caderno, Painel, Sala) differed in colour, type, radius and density but also in structure (top nav vs sidebar, cards vs hairlines). Shipping three structures would triple every UI ticket and its design gate. We therefore fix one set of components for every screen (page header, hairline sections, stat tiles, bar lists, tables) and ship the three directions as **themes**: CSS variable sets selected by `data-theme`, plus one layout field for the app shell, `shell: sidebar | topnav`, resolved by `grid-template-areas` in the single AppShell component (Caderno and Painel use `sidebar`, Sala uses `topnav`). The preference is stored per user (not per household), with Caderno as the default. The preference is a column on the existing user record, not a new domain table; it does not extend the user-scoped table list in ADR-0001.

## Consequences

- Adding a theme is a `[data-theme]` block in `globals.css`, a `THEME_NAMES` entry, a `themeRegistry` entry choosing the shell, a `strings.themeNames` entry and an enum migration for the `theme` column; no component changes.
- The Impeccable gate runs on the default theme; an automated contrast test covers every theme's text-on-surface and chart-on-background pairs, so no theme can ship below WCAG AA.
- A theme may move the navigation (sidebar or top bar) and restyle any component through tokens (`--elevation`, `--radius`, density), but it cannot change component anatomy: the accounts list is one table component in every theme, the page headline is one component. Swapping a table for a card grid would be a new component decision, not a theme.
- The AppShell is tested in both layouts plus the mobile bottom-tab variant.
- `theme` writes `user.theme` directly (a scoped update by the session's own user id), a documented exception to ADR-0001's "only the `auth` and `households` modules touch Better Auth"; the column is a UI preference, not identity or tenancy, and carries no isolation risk.

## Amendment 2026-10-23: the layout is its own preference

The owner asked for more themes and more layouts, chosen independently. The shell layout is no
longer a field of the theme: it is a second per-user column, `user.layout` (`sidebar | topnav |
dock`, default `sidebar`), picked on Preferências next to the theme. The migration that added it
set `topnav` for users already on Sala, so nobody's screen changed on deploy. A theme now carries
`scheme: light | dark` instead of `shell`; dark themes also put `.dark` on `<html>` and declare
`color-scheme: dark`, so shadcn's `dark:` variants and native controls follow the tokens.

- Themes: Caderno, Painel, Sala, Varanda, Nítido (high contrast, larger type), Lamparina (dark) and
  Cofre (dark). Adding a theme is still a `[data-theme]` block, a `THEME_NAMES` entry, a
  `themeRegistry` scheme, `strings.themeNames`/`themeHints` and an enum migration.
- Layouts: `sidebar` and `topnav` as before; `dock` is a slim header plus a floating navigation bar
  at the bottom with the content in a centered 1120px column, and on phones it floats the bottom
  tab bar. Under 768px every layout still uses the bottom tab bar.
- Adding a layout is an AppShell branch, a `[data-shell]` block in `globals.css`, a
  `SHELL_LAYOUTS` entry and an enum migration; the contrast test checks every layout has CSS.
- The `theme` slice is the appearance slice: it owns `SHELL_LAYOUTS` and writes `user.layout`
  under the same documented exception to ADR-0001 as `user.theme`. This replaces the theme's
  `shell` field and the consequence above that a theme may move the navigation.
- The theme picker previews each theme with a swatch rendered under that theme's own
  `data-theme`, so the preview reads the real tokens instead of a copy of them.
