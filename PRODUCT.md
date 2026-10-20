# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary user:** you — a Hong Kong track runner reviewing **your own** Garmin TCX after intervals, often on a phone right after the session (or shortly after, commuting home).

You train Norwegian Singles–style work (Copeland) and lactate-guided threshold 400s (Bakken). You need rep-level feedback tied to **method rules**, not Garmin’s default training labels.

## Product Purpose

Per venue tab and per TCX file: render the 400 m loop on OpenStreetMap, compute **deterministic** Copeland and Bakken scorecards (rule codes, 0–100 fit, core effort-vs-speed metrics), and **persist sessions on Neon** so history is part of the normal workflow.

**Success (one session):** a clear **on-method / borderline / too-hard** verdict, with **every rep visible** and rule flags you can trust—map, summary, and table all from the same file.

## Positioning

**Not a Garmin-first dashboard.** VO2max, execution score, and generic “training load” are not the product story.

Scoring comes from an explicit, testable rules engine in `src/lib/method/` (thresholds + Vitest fixtures). The product’s job is **method fidelity on a known oval**, not general fitness analytics.

## Operating Context

- **Venues (first-class):** **Sha Tin** and **Kai Tak** only — separate tabs, separate TCX files; no mixing venues in one analysis.
- **When:** immediately post-session, mobile-friendly review.
- **Routes:** Track (`/`) upload + map + summary + table + save; Sessions (`/sessions`) Neon history; Method (`/method`) reference copy.
- **Shipped name:** **Singles Track** (package/repo: `norwegianmethod`).
- **Dev:** Next.js app; local `npm run dev` (project uses port **4317** in `.cursor/start.sh`).

## Capabilities and Constraints

| Capability | Notes |
|------------|--------|
| TCX ingest | Client-side; one activity per analysis |
| Map | Leaflet + OSM; pace / HR modes |
| Method engines | Copeland + Bakken; user-supplied LTHR |
| Venue guard | GPS check; warn on wrong tab |
| **Neon** | **Core** — save and browse sessions is part of the main workflow |
| Tests | Vitest fixtures under `src/lib/method/__tests__/` |

**Constraints:** one file, one truth per tab; deterministic rules only; TCX on device until explicit save.

## Brand Commitments

- **Voice:** **lab notebook** — technical labels tied to **rule codes**; short, factual copy (headlines, flags, Method page). Not hype, not motivational fluff.
- **Identity:** Singles Track; Norwegian navy/red remain functional sport colors (see `DESIGN.md`).
- **Anti-pattern (confirmed):** **do not fabricate** testimonials, benchmarks, customer quotes, or social proof in product copy or marketing.

## Evidence on Hand

- Sample TCX: `public/samples/sha-tin.tcx`, `public/samples/kai-tak.tcx`, `public/demo.tcx`.
- Rule implementation: `src/lib/method/`, UI reference `src/app/method/page.tsx`.
- **Do not invent** evidence beyond these assets and what the app actually computes.

## Product Principles

1. **Verdict first** — on-method / borderline / too-hard must be obvious before scrolling.
2. **Every rep on the record** — table + overlays; no hiding laps behind summaries.
3. **One file, one truth** — one TCX per oval tab; map and metrics stay aligned.
4. **Rules, not vibes** — flags map to coded thresholds; behavior pinned by tests.
5. **History matters** — Neon sessions are part of the core loop, not an afterthought.

## Accessibility & Inclusion

**WCAG 2.1 AA** target for text contrast and keyboard use on main flows (tabs, upload, navigation). Map information remains available via table and metrics; support `prefers-reduced-motion` for UI animation.
