---
name: Singles Track
description: Rule-coded Norwegian method review on Sha Tin and Kai Tak ovals
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

# Design System: Singles Track

## Overview

**Creative North Star: "Method Lab Notebook"**

A post-session lab sheet: verdict and rule flags up front, mono numerics for every rep, navy/red only where they encode method state—not decoration. Copy reads like labeled fields in a notebook (rule codes visible), not a fitness brand campaign.

**Key characteristics:** cool slate canvas (`#F1F5F9`); flat bordered panels; Geist Sans labels + Geist Mono data; Sha Tin / Kai Tak as parallel tabs; WCAG AA contrast on ink/muted.

## Colors

### Primary

- **Norwegian Navy** (`#00205B`): header, active venue tab, Copeland fit bar, primary buttons, table header, speed map baseline.

### Secondary

- **Track Red** (`#BA0C2F`): header mark, header rule, Bakken fit bar, HR emphasis, hot rep rows.

### Neutral

- **Cool Slate Canvas** (`#F1F5F9`): page background.
- **Surface** (`#FFFFFF`): panels, map frame, inputs.
- **Ink** (`#0F172A`): headings and body.
- **Muted** (`#475569`): secondary labels (AA on white).
- **Line** (`#E2E8F0`): borders, fit-bar track.

**The No-Cream Rule.** Warm paper/beige page backgrounds are out; cool slate only.

Verdict chips: full soft tint (navy / amber / red)—no side-stripe accents.

## Typography

**UI:** Geist Sans — titles, controls, verdict headlines (`text-balance` on page h1).

**Data:** Geist Mono — lap times, pace, HR, decoupling, fit scores (`tabular-nums`).

**The Code-Visible Rule.** Flag and Method copy should surface rule identifiers users can cross-check in `src/lib/method/`.

Fixed rem scale; no fluid display headings.

## Layout

- **App shell:** `max-w-7xl` centered content; navy header + footer attribution.
- **Track workspace:** venue `tablist`; large screens — map + SessionSummary side-by-side; below — effort/speed chart + wide rep table.
- **Density:** data-forward; tables may run wide; Method prose capped ~75ch.
- **Z-index:** `--z-sticky: 10` for sticky table header; map panes stay low.

## Elevation & Depth

Flat-by-default. Separation via `border-line` and white `surface` on slate `bg`. `shadow-sm` only on map frame and primary panels.

**No nested cards** inside SessionSummary—flags are divided rows, not stacked cards.

## Shapes

- **Radius:** 8px controls (`rounded-lg`); 12px summary panel (`rounded-xl`); pills `rounded-full` for verdict chips and fit-bar caps.
- **Header rule:** 2px red bar under navy header (not a gradient).

## Components

- **AppShell / AppNav:** navy header; nav pills `bg-white/15` when active.
- **Venue tabs:** active = navy fill; inactive = bordered on surface.
- **SessionSummary:** verdict pill + headline; dual FitBar; metric `dl`; `<details>` for rule flags.
- **FitBar:** 8px track, navy or red fill; `role="progressbar"`; width transition respects reduced motion.
- **Rep table:** sticky thead; mono numerics; row tint when HR exceeds LTHR on controlled reps.
- **Map:** bordered Leaflet frame; pace navy→red; HR blue→amber→red vs LTHR.

## Do's and Don'ts

### Do

- **Do** use theme classes (`text-ink`, `border-line`, `bg-navy`, `bg-red`).
- **Do** label UI with rule-backed terminology.
- **Do** keep Sha Tin and Kai Tak sessions isolated per tab.

### Don't

- **Don't** fabricate testimonials, benchmarks, or social proof in UI or marketing.
- **Don't** present Garmin VO2max / execution score as the primary story.
- **Don't** use hero-metric templates, gradient text, or uppercase section eyebrows.
- **Don't** use left-border accent stripes on callouts.
