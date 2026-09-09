# Feudo — Design

Canonical design reference. Visual truth for every screen; `CLAUDE.md` mirrors the token summary
so `/design` and `/design-sync` agree with this file. Mockups: the Feudo design canvas (page
"Telas": ledger dashboard desktop and mobile, reserve view with the collapsed menu, onboarding).

## Direction

A calm, trustworthy finance tool for a couple. Reads like a well-kept household ledger, not a
fintech landing page: paper-toned surfaces, a serif for headlines and money, hairlines instead of
shadows, one accent used sparingly, dense enough for a desktop that is open every day.

## Structure (one, not themeable)

- **App shell**: collapsible sidebar on desktop (224px open with labels, 64px collapsed with
  icons only, state remembered per user); bottom tab bar on viewports under 768px. Five
  destinations: Visão geral, Transações, Reserva, Bancos, Casa. Household switcher at the sidebar
  foot (or in the mobile header).
- **Page**: overline (section · period) + serif headline that states the month's fact in one
  sentence, actions on the right; then sections separated by hairlines with a serif section title
  and a right-aligned meta or action.
- **Data**: stat tiles in a 4-column hairline grid; bar lists for magnitudes; tables with an
  uppercase 11px header row and 40px rows; notices as bordered panels with an icon and one action.
- **Themes change tokens only** (color, type, radius, elevation, density). Layout, hierarchy and
  components are the same in every theme (ADR-0010).

## Tokens

Themes are CSS variable sets selected by `data-theme` on `<html>`, stored per user. Values are
sRGB hex; text tokens meet 4.5:1 on both `bg` and `surface`, chart fills meet 3:1 on `bg`.

### Caderno (default)

| token            | value                                                | use                                              |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------ |
| `--bg`           | `#f4efe6`                                            | page background                                  |
| `--surface`      | `#fbf8f2`                                            | sidebar, panels, inputs                          |
| `--surface-2`    | `#ece5d8`                                            | selected nav, tags, skeletons                    |
| `--line`         | `#d9d0c2`                                            | section rules, borders                           |
| `--line-soft`    | `#e6dfd3`                                            | table row rules, chart grid                      |
| `--ink`          | `#2a2622`                                            | primary text, primary button                     |
| `--muted`        | `#6f675d`                                            | secondary text, axis labels                      |
| `--accent`       | `#4f6f52`                                            | links, actions                                   |
| `--accent-hover` | `#3a5440`                                            |                                                  |
| `--accent-soft`  | `#e2ebe0`                                            | "conta da casa" tag background                   |
| `--chart-1`      | `#3d8756`                                            | income, category bars, progress                  |
| `--chart-2`      | `#6a63c9`                                            | spending series                                  |
| `--warning`      | `#7a5f18`                                            | uncategorized notice icon/text                   |
| `--danger`       | `#a33a2e`                                            | destructive actions, errors                      |
| `--font-display` | `"Source Serif 4", Georgia, serif`                   | headlines, section titles, money                 |
| `--font-body`    | `"Source Sans 3", "Segoe UI", system-ui, sans-serif` | everything else                                  |
| `--font-mono`    | unset (falls back to `--font-body`)                  | numerals in themes that want a monospaced figure |
| `--radius`       | `6px`                                                | controls, panels (tags 4px, avatars round)       |
| `--elevation`    | none                                                 | hairlines only                                   |
| `--density`      | body 14px, row 40px                                  |                                                  |

### Painel

`--bg #f3f4f6` · `--surface #ffffff` · `--surface-2 #eef4fc` · `--line #dde0e6` · `--line-soft
#eceef2` · `--ink #16181d` · `--muted #5c6370` · `--accent #1f5fae` · `--accent-hover #174a8a` ·
`--accent-soft #eef4fc` · `--chart-1 #2a78d6` · `--chart-2 #c96a2a` · `--warning #7a5f18` ·
`--danger #b3261e` · display `"IBM Plex Sans"` · body `"IBM Plex Sans"` · `--font-mono "IBM Plex Mono"` for numerals
· radius 6px · elevation: 1px border cards · density: body 13px, row 36px.

### Sala

`--bg #f8f6f2` · `--surface #ffffff` · `--surface-2 #eeeae3` · `--line #e4dfd6` · `--line-soft
#eeeae3` · `--ink #26231f` · `--muted #6b665f` · `--accent #2a7268` · `--accent-hover #23615a` ·
`--accent-soft #e3f1ee` · `--chart-1 #12907e` · `--chart-2 #c96a2a` · `--warning #7a5f18` ·
`--danger #a33a2e` · display and body `"Figtree"` · radius 16px (pills 999px) · elevation: soft
shadow `0 1px 2px rgba(38,35,31,.06), 0 8px 24px -16px rgba(38,35,31,.18)` · density: body 15px,
row 44px.

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

shadcn/ui primitives (mandatory, restyled by tokens): Button, Input, Label, Select, Tabs
(segmented control), Dialog, DropdownMenu (household switcher, row actions), Popover, Tooltip,
Toast, Sheet (mobile menu), Table, Badge (tags), Progress, Skeleton, Form controls.

Domain components (custom): AppShell, PageHeader, StatTile, SectionHeader, BarList,
MonthlyBars (two-series SVG, legend + last-month labels), AccountsTable, Notice, MonthSwitcher,
StepRail (onboarding), ReserveCoverage (target, current, progress), PlacementRanking (ranked rows
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
