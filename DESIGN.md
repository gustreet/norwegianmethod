---
name: Singles Track
description: Norwegian-method track tool — OSM map, dual-oval sessions, rep verdicts
colors:
  primary: "#00205B"
  accent: "#BA0C2F"
  neutral-bg: "#F8FAFC"
  neutral-surface: "#FFFFFF"
  neutral-ink: "#0F172A"
  neutral-muted: "#475569"
  neutral-line: "#E2E8F0"
typography:
  display:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  tab-active:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
---

## Overview

Product-register UI for **Singles Track**: top app shell (navy header, Norwegian stripe), **track tabs** for separate venues, split layout with **Leaflet + OpenStreetMap** map and analysis panel, dense rep table with mono numerics. Cool slate background (`#F8FAFC`), white surfaces, navy primary actions, flag red for accents and “too hard” states. Geist Sans + Geist Mono via Next.js font loader.

## Colors

| Role | Token | Use |
|------|--------|-----|
| Primary | `#00205B` (navy) | Header, active tab, table header, primary buttons |
| Accent | `#BA0C2F` (red) | Labels, hot reps, borderline “too hard”, map fast pace |
| Background | `#F8FAFC` | Page canvas (cool, not cream) |
| Surface | `#FFFFFF` | Cards, map frame |
| Ink | `#0F172A` | Body text |
| Muted | `#475569` | Secondary copy (≥4.5:1 on white) |
| Line | `#E2E8F0` | Borders, dividers |

Map pace gradient: navy = controlled, red = hot splits, slate = idle.

Semantic verdict badges: navy tint (on-method), amber (borderline), red tint (too hard).

## Typography

- **UI sans**: Geist Sans — headings, body, buttons.
- **Data**: Geist Mono — lap times, pace, HR, metrics.
- Page title ~1.875–2.25rem semibold; body 1rem; table 0.875rem mono.
- No fluid display type; product density over marketing scale.

## Elevation

Mostly flat: 1px borders (`--line`) and light inset rings on verdict cards. Map container: subtle border only, no heavy shadow. Avoid card-grid elevation stacks.

## Components

- **App shell**: Full-width navy header, white nav links, gradient stripe (red → white → navy).
- **Track tabs**: Pill buttons; active = navy fill; inactive = white + border.
- **Map panel**: Rounded 16px, min-height 360px; OSM attribution in footer.
- **Verdict card**: Surface + optional inset ring colored by verdict.
- **Rep table**: Navy thead, row highlight `red/8` when max HR ≥ LTHR.
- **Buttons**: Primary navy; secondary outline navy on white.

## Do's and Don'ts

**Do**

- Keep Sha Tin and Kai Tak data in separate tab state.
- Use mono for all workout numbers.
- Center map on activity centroid or known oval.
- Maintain AA contrast on muted text.

**Don't**

- Mix TCX from two activities on one screen.
- Use left accent stripes on cards (banned pattern).
- Add hero metrics or identical icon-card grids.
- Use warm cream page backgrounds or gradient text.
