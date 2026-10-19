# Product

## Register

product

## Users

Track runners in Hong Kong who train Norwegian Singles–style (Copeland) and lactate-guided threshold 400s (Bakken). They export Garmin TCX, run at more than one oval (Sha Tin and Kai Tak), and want map + rep-level feedback tied to **method rules**—not Garmin VO2max labels or LLM summaries.

## Product Purpose

Per venue tab and per TCX file: render the loop on OpenStreetMap, compute **deterministic** Copeland and Bakken scorecards (rule codes, 0–100 fit, core effort-vs-speed metrics), and optionally persist sessions on Neon. Success = “was this on-method at **this** oval?” with every rep visible and no mixed files.

## Brand Personality

Direct, coach-like, data-first. Norwegian navy/red as functional color (verdict, map, HR overlay)—not decoration. Feels like a trackside logbook on a phone after intervals, not a fitness marketing site.

## Anti-references

- Garmin execution score / VO2max primary benefit for sub-threshold intent.
- Merged GPS and lap data across venues or dates.
- LLM-generated coaching copy or opaque “AI scores.”
- Hero metrics, identical icon-card grids, cream editorial backgrounds.

## Design Principles

1. **One file, one truth** — map, metrics, and table share one TCX; Sha Tin and Kai Tak stay in separate tabs.
2. **Rules, not vibes** — verdicts and flags come from `src/lib/method/` thresholds; Vitest golden files pin behavior.
3. **Show every rep** — table + effort/speed overlay; LTHR crossings and decoupling per lap.
4. **Speed vs effort legible** — decoupling, efficiency, drift, and map pace/HR modes answer “am I paying more HR for less speed?”
5. **Venue-aware** — GPS detect + wrong-tab upload warning.
6. **Optional cloud** — client-side parse first; Neon for history.

## Accessibility & Inclusion

WCAG AA contrast (ink/muted on surface); keyboard tabs and file upload; map backed by table and metrics; `prefers-reduced-motion` when motion is added.
