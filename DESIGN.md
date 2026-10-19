---
name: Singles Track
description: Deterministic Norwegian-method track analysis — OSM, dual ovals, effort vs speed
colors:
  primary: "#00205B"
  accent: "#BA0C2F"
  neutral-bg: "#F1F5F9"
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
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  tab-active:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  fit-bar-track:
    backgroundColor: "{colors.neutral-line}"
    rounded: "{rounded.sm}"
    height: "8px"
  fit-bar-fill-navy:
    backgroundColor: "{colors.primary}"
  fit-bar-fill-red:
    backgroundColor: "{colors.accent}"
---

## Overview

Product UI for post-track review: **navy app shell** (red hairline under header), venue tabs, toolbar (LTHR, map mode, TCX upload). Main grid = **OSM map** (pace or HR polyline) + **SessionSummary** (verdict badge, headline, dual **FitBar**, six core metrics, collapsible rule flags). Below: effort-vs-speed chart, **sticky rep table** (slate thead). Tailwind v4 `@theme` tokens (`navy`, `red`, `ink`, `muted`, `line`, `surface`). Geist Sans + Mono. Cool slate page bg `#F1F5F9` (not warm cream). Surfaces use border + spacing; avoid stacked shadows and nested cards.

## Colors

| Role | Token / class | Use |
|------|----------------|-----|
| Primary | `#00205B` · `navy` | Header, active tab, table header, primary buttons, speed bars |
| Accent | `#BA0C2F` · `red` | Venue kicker, hot reps, Bakken fit, HR map/bars |
| Background | `#F1F5F9` · `bg` | Page canvas |
| Surface | `#FFFFFF` · `surface` | Cards, map frame, inputs |
| Ink | `#0F172A` · `ink` | Body, headings |
| Muted | `#475569` · `muted` | Secondary copy (AA on white) |
| Line | `#E2E8F0` · `line` | Borders, fit-bar track |

Verdict surfaces: tinted full border + light fill (navy / amber / red)—no side-stripe accents.

Map: pace = navy→red by speed; HR = blue→amber→red vs LTHR.

## Typography

- **Geist Sans**: titles, body, controls; `text-balance` on page h1.
- **Geist Mono**: lap times, pace, HR, decoupling, fit scores.
- Section titles `text-base font-semibold`; avoid fluid display type.

## Elevation

Light `shadow-sm` on map and panels only; flat data table inside bordered shell. No nested cards inside verdict panel (flags are simple bordered rows).

## Components

- **AppShell + AppNav**: navy header, stripe gradient, active nav pill.
- **Track workspace**: venue tabs (`role="tablist"`, active = navy fill); map overlay toggle; **SessionSummary** beside map on large screens.
- **SessionSummary**: verdict pill + headline; Copeland/Bakken **FitBar**; 6-metric `dl`; `<details>` for rule flags (flat divided list).
- **EffortSpeedChart**: dual bar overlay per rep, rep index labels ≤24 reps.
- **Rep table**: `sticky` slate thead, finish row tint, red row when max HR ≥ LTHR on controlled reps.
- **FitBar**: 8px track, navy or red fill, `role="progressbar"`.

## Do's and Don'ts

**Do**

- Use theme classes (`text-ink`, `border-line`, `bg-navy`) over raw `var()` in utilities.
- Keep metrics copy tied to rule names users see in flags.
- Preserve separate tab state per oval.

**Don't**

- Mix activities or reintroduce freeform “coach” LLM text.
- Left border accent stripes, gradient text, hero metric templates.
- Uppercase eyebrows on every section.
