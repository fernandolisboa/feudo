# Feudo — Design

Canonical design reference. Visual truth for every screen; `CLAUDE.md` mirrors the token summary
so `/design` and `/design-sync` agree with this file. Mockups: the Feudo design canvas (page
"Telas": ledger dashboard desktop and mobile, reserve view with the collapsed menu, onboarding).

## Direction

A calm, trustworthy finance tool for a couple. Reads like a well-kept household ledger, not a
fintech landing page: paper-toned surfaces, a serif for headlines and money, hairlines instead of
shadows, one accent used sparingly, dense enough for a desktop that is open every day.

## Structure (one set of components; the shell layout is a per-user choice)

- **App shell**: a CSS grid with named areas (nav, header, content). The user's layout preference
  (independent of the theme, ADR-0010 amendment) places the nav: `sidebar` (collapsible, 224px
  open with labels, 64px collapsed with icons only, state remembered per browser via a cookie),
  `topnav` (a horizontal bar under the header) or `dock` (a slim header, a floating bar of
  icon-over-label links 20px above the bottom edge, content in a centered 1120px column). Under
  768px every layout uses a bottom tab bar; in `dock` it floats 12px off the edges. Five destinations: Visão geral, Transações,
  Reserva, Bancos, Casa. Análises sits in the sidebar and top bar only; on a phone it is reached
  from the analyst's note on Bancos and from the monthly reading's notification. Household switcher at the nav foot (sidebar), in the bar (topnav) or in
  the mobile header.
- **Page**: overline (section · period) + serif headline that states the month's fact in one
  sentence, actions on the right; then sections separated by hairlines with a serif section title
  and a right-aligned meta or action.
- **Data**: stat tiles in a 4-column hairline grid; bar lists for magnitudes; tables with an
  uppercase 11px header row and 40px rows; notices as bordered panels with an icon and one action.
  Tables never scroll sideways: cells wrap to the full width, and a table narrower than 48rem turns
  each row into a bordered card (title, amount on the right, labelled lines, actions). Lists that
  grow with use are paginated (transactions 50, accounts and reserve positions 10, rules 20).
- **Themes change tokens only** (color, type, radius, elevation, density, light or dark); the
  layout is a separate choice. Component anatomy is the same in every theme and layout: the
  accounts list is a table, the page headline is a sentence (ADR-0010).

## Tokens

Themes are CSS variable sets selected by `data-theme` on `<html>`, stored per user. Values are
sRGB hex; text tokens meet 4.5:1 on both `bg` and `surface`, chart fills meet 3:1 on `bg`.

### Caderno (default)

| token            | value                                                | use                                               |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `--bg`           | `#f4efe6`                                            | page background                                   |
| `--surface`      | `#fbf8f2`                                            | sidebar, panels, inputs                           |
| `--surface-2`    | `#ece5d8`                                            | selected nav, tags, skeletons                     |
| `--line`         | `#d9d0c2`                                            | section rules, borders                            |
| `--line-soft`    | `#e6dfd3`                                            | table row rules, chart grid                       |
| `--ink`          | `#2a2622`                                            | primary text, primary button                      |
| `--muted`        | `#6f675d`                                            | secondary text, axis labels                       |
| `--accent`       | `#4f6f52`                                            | links, actions                                    |
| `--accent-hover` | `#3a5440`                                            |                                                   |
| `--accent-soft`  | `#e2ebe0`                                            | "conta da casa" tag background                    |
| `--chart-1`      | `#3d8756`                                            | income, category bars, progress                   |
| `--chart-2`      | `#6a63c9`                                            | spending series                                   |
| `--warning`      | `#7a5f18`                                            | uncategorized notice, unassigned-account flag     |
| `--danger`       | `#a33a2e`                                            | destructive actions, errors                       |
| `--font-display` | `"Source Serif 4", Georgia, serif`                   | headlines, section titles, money                  |
| `--font-body`    | `"Source Sans 3", "Segoe UI", system-ui, sans-serif` | everything else                                   |
| `--font-mono`    | unset (falls back to `--font-body`)                  | numerals in themes that want a monospaced figure  |
| `--radius`       | `6px`                                                | controls, panels (tags 4px, avatars round)        |
| `--elevation`    | none                                                 | hairlines only                                    |
| `--density-body` | `14px`                                               | base body text size                               |
| `--density-row`  | `40px`                                               | table row height                                  |
| `scheme`         | `light`                                              | `light` or `dark` (dark adds `.dark` on `<html>`) |

### Painel

`--bg #f3f4f6` · `--surface #ffffff` · `--surface-2 #eef4fc` · `--line #dde0e6` · `--line-soft
#eceef2` · `--ink #16181d` · `--muted #5c6370` · `--accent #1f5fae` · `--accent-hover #174a8a` ·
`--accent-soft #eef4fc` · `--chart-1 #2a78d6` · `--chart-2 #c96a2a` · `--warning #7a5f18` ·
`--danger #b3261e` · display `"IBM Plex Sans"` · body `"IBM Plex Sans"` · `--font-mono "IBM Plex Mono"` for numerals
· radius 6px · elevation: 1px border cards · density: body 13px, row 36px · light.

### Sala

`--bg #f8f6f2` · `--surface #ffffff` · `--surface-2 #eeeae3` · `--line #e4dfd6` · `--line-soft
#eeeae3` · `--ink #26231f` · `--muted #6b665f` · `--accent #2a7268` · `--accent-hover #23615a` ·
`--accent-soft #e3f1ee` · `--chart-1 #12907e` · `--chart-2 #c96a2a` · `--warning #7a5f18` ·
`--danger #a33a2e` · display and body `"Figtree"` · radius 16px (pills 999px) · elevation: soft
shadow `0 1px 2px rgba(38,35,31,.06), 0 8px 24px -16px rgba(38,35,31,.18)` · density: body 15px,
row 44px · light.

### Varanda

Plants, tile blue and terracotta. `--bg #edf2ec` · `--surface #f8faf6` · `--surface-2 #e0e8de` ·
`--line #cbd7c8` · `--line-soft #dfe7dc` · `--ink #1f2a24` · `--muted #55635a` · `--accent
#1d6584` · `--accent-hover #164f68` · `--accent-soft #dcebf1` · `--chart-1 #2b74a6` · `--chart-2
#c25f30` · `--warning #6f5410` · `--danger #a3302a` · display `"Fraunces"` · body `"Nunito Sans"`
· radius 12px · elevation: soft shadow `0 1px 2px rgba(31,42,36,.05), 0 6px 20px -14px
rgba(31,42,36,.2)` · density: body 15px, row 44px · light.

### Nítido

High contrast and larger type. `--bg #ffffff` · `--surface #ffffff` · `--surface-2 #ebebeb` ·
`--line #767676` · `--line-soft #c4c4c4` · `--ink #000000` · `--muted #3b3b3b` · `--accent
#0047b3` · `--accent-hover #00327d` · `--accent-soft #e3ecfb` · `--chart-1 #00703c` · `--chart-2
#6a2fb0` · `--warning #614700` · `--danger #b00020` · display and body `"Lexend"` · radius 4px ·
elevation none · density: body 16px, row 48px · light.

### Lamparina

Caderno at night: the same type, warm dark paper, amber light. `--bg #1c1916` · `--surface
#24201b` · `--surface-2 #302a23` · `--line #3f372e` · `--line-soft #2e2923` · `--ink #eee6d8` ·
`--muted #b3a898` · `--accent #e6ac5c` · `--accent-hover #f0c283` · `--accent-soft #3a2e1f` ·
`--chart-1 #6dbb85` · `--chart-2 #a99bf0` · `--warning #d8c372` · `--danger #f2907f` · display
`"Source Serif 4"` · body `"Source Sans 3"` · radius 6px · elevation none · density: body 14px,
row 40px · dark.

### Cofre

Cool, precise dark. `--bg #10151b` · `--surface #161c24` · `--surface-2 #1f2731` · `--line
#2b3542` · `--line-soft #202833` · `--ink #e4e9ef` · `--muted #98a4b1` · `--accent #4cc490` ·
`--accent-hover #74d6aa` · `--accent-soft #15302a` · `--chart-1 #5aa8f0` · `--chart-2 #d6a85a` ·
`--warning #e3c25e` · `--danger #ff8d82` · display and body `"Manrope"` · `--font-mono "IBM Plex
Mono"` for numerals · radius 8px · elevation: 1px border cards · density: body 13px, row 36px ·
dark.

### Type scale (all themes, px)

11 overline (uppercase, 0.08em tracking) · 12 meta · 13 secondary · body (per theme) · 15 inputs ·
18 section title (display) · 22 mobile headline (display) · 26 stat value (display) · 30 page
headline (display) · 34 onboarding headline (display). Numbers always `font-variant-numeric:
tabular-nums`.

### Spacing and layout

4px base: 4, 6, 8, 10, 12, 16, 24, 32, 40. Page padding 24px 32px (mobile 20px). Section gap 24px.
Desktop content grid: 4 stat columns; two-column 1fr / 1.25fr for chart pairs. Hit targets ≥ 36px
desktop, ≥ 44px mobile.

### Motion

150ms ease-out on hover and focus; 200ms ease-in-out on sidebar collapse and panel open; bars
grow once on first paint (300ms). Respect `prefers-reduced-motion` (no growth animation).

## Component inventory

shadcn/ui primitives (mandatory, restyled by tokens): Button, Input, Label, Select (household
switcher, reserve multiple, time zone), Tabs (segmented control), Dialog, DropdownMenu (row
actions), Popover, Tooltip, Toast, Sheet (mobile menu), Table, Badge (tags), Progress, Skeleton,
Form controls.

Domain components (custom): AppShell, PageHeader, StatTile, SectionHeader, BarList,
MonthlyBars (two-series SVG, legend + last-month labels), AccountsTable, Notice, MonthSwitcher,
StepRail (onboarding; deferred until onboarding is more than the one-step household-creation form
in #10 — today's `/comecar` is a single Card, not a rail), ReserveCoverage (target, current,
progress), PlacementRanking (ranked rows
with reasons, plus "também avaliados"), AnalystReading (analysis text, counter-argument, inputs
used, model and prompt version).

## States

- **Loading**: skeleton bars in `--surface-2` matching the final layout; never spinners over data.
- **Empty**: one serif sentence saying what will appear and one action ("Conecte um banco para ver
  seus gastos"). No illustrations.
- **Error**: Notice with `--danger` icon, plain-language cause, one retry action; numbers already on
  screen stay visible.
- **Stale**: "Atualizado hoje, 06:10" in `--muted`; older than 48h turns into a Notice.
- **Uncategorized**: Notice with count and amount, always linking to categorization.
- **Unknown data**: labelled, never hidden ("data de aplicação desconhecida", "liquidez: confirme").

## Charts

Follow the dataviz method: one hue for magnitude (bar lists, progress), two validated hues for
income vs spending (`--chart-1`, `--chart-2`, validated for colour-vision deficiency in every
theme), legend for two series, direct labels only on the last period, recessive grid, 4px rounded
bar ends, values in text tokens never in series colour. Never dual axes, never pie charts for
categories.

## Formatting (pt-BR)

- Currency: `R$ 1.234,56`; negative `-R$ 1.234,56`; abbreviations only in chart labels
  (`18,4 mil`).
- Percentages: comma decimal, at most one decimal (`35%`, `4,6%`); rates as `13,9% a.a.`.
- Dates: `02/09/2026` in tables; `1 de setembro` in prose; `hoje, 06:10` and `ontem, 06:12` for
  freshness; months `mar`, `ago` in axes and `agosto de 2026` in headers.
- Time zone: the household's, default `America/Sao_Paulo`.
- Vocabulary: `UBIQUITOUS_LANGUAGE.md` is binding for every label.

## Design gate

Every UI ticket ships with: `npx impeccable detect` clean, `/impeccable critique` by `ui-critic`
with no blocking findings in the default theme, and the token contrast test green for all
themes. `/impeccable audit` belongs to the owner.
