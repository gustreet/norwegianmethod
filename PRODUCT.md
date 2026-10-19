# Product

## Register

product

## Users

Track runners in Hong Kong who train Norwegian Singles–style (Copeland) and lactate-guided threshold 400s (Bakken). They export Garmin TCX, run at more than one oval (e.g. Sha Tin and Kai Tak), and want one place to see the loop on a map, rep-by-rep verdicts, and optional session history—not Garmin’s VO2max labels.

## Product Purpose

For each track and each upload: show the **same** TCX on OpenStreetMap and in the rep table, score sub-threshold discipline (LTHR, pace drift, recoveries), and surface Bakken vs Copeland framing. Success is answering “was this a good single at **this** venue?” without mixing activities.

## Brand Personality

Direct, coach-like, data-first. Norwegian identity through color (navy/red), not hype. Calm tool UI; the track map is the hero on the Track tab.

## Anti-references

- Garmin execution score and “Primary benefit: VO2 Max” when the session was meant to stay sub-threshold.
- Merged or mismatched GPS and lap data from different days or venues.
- Generic SaaS dashboard cards and hero metrics.
- Cream/warm editorial marketing chrome; this is a training tool.

## Design Principles

1. **One file, one truth** — map, date, and reps always from a single TCX; two tracks stay in separate tabs.
2. **Judge the method** — score Copeland/Bakken fit, not the watch’s auto labels.
3. **Show every rep** — no hiding fade or hot laps behind averages.
4. **Venue-aware** — detect GPS against known ovals; warn on wrong-tab uploads.
5. **Optional cloud** — Neon stores summaries; parsing can stay client-side until the user saves.

## Accessibility & Inclusion

WCAG AA contrast on text and controls; keyboard-reachable tabs and upload; map alternatives via rep table and coach copy; respect `prefers-reduced-motion` for any future motion.
