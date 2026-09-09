---
status: accepted
date: 2026-09-09
---

# Themes are per-user token sets over one canonical structure

The owner wants users to pick a look, and the three direction sketches from Phase 2 (Caderno, Painel, Sala) differed in colour, type, radius and density but also in structure (top nav vs sidebar, cards vs hairlines). Shipping three structures would triple every UI ticket and its design gate. We therefore fix one structure for every screen (collapsible sidebar, hairline sections, tables) and ship the three directions as **themes**: CSS variable sets selected by `data-theme`, stored as a user preference (not a household one), with Caderno as the default.

## Consequences

- Adding a theme is a new token file plus a row in the contrast test; no component changes.
- The Impeccable gate runs on the default theme; an automated contrast test covers every theme's text-on-surface and chart-on-background pairs, so no theme can ship below WCAG AA.
- Layout differences between the sketches are not preserved; a future theme cannot move navigation or change component anatomy. That would be a new structure decision, not a theme.
