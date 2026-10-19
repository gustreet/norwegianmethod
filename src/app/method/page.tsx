import { HOME_TRACK } from "@/lib/track-config";

export default function MethodPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 prose prose-slate">
      <h1 className="text-3xl font-semibold text-[var(--navy)] not-prose">
        Norwegian Singles + Bakken on {HOME_TRACK.name}
      </h1>
      <p className="text-[var(--muted)] not-prose leading-relaxed">
        This app is built around one place: your 400 m oval. OpenStreetMap shows where you ran;
        TCX reps are scored against two complementary ideas.
      </p>

      <h2 className="text-xl font-semibold text-[var(--navy)] mt-10">Copeland · Norwegian Singles</h2>
      <ul className="text-sm leading-relaxed text-[var(--ink)]">
        <li>Three sub-threshold days per week (short / medium / long reps), most running easy.</li>
        <li>Quality minutes ≈ 20–25% of weekly time; recoveries are not a progression lever.</li>
        <li>LTHR is a ceiling—reps should stay repeatable, not VO₂-max races.</li>
      </ul>

      <h2 className="text-xl font-semibold text-[var(--navy)] mt-10">Bakken · threshold 400s</h2>
      <ul className="text-sm leading-relaxed text-[var(--ink)]">
        <li>20–25 × 400 m with ~30 s rest is classic evening threshold work when pace is controlled.</li>
        <li>Even splits matter more than rep count; stop or slow if lactate/HR runs away.</li>
        <li>Your track sessions are judged on drift and LTHR crossings, not Garmin&apos;s VO₂ label.</li>
      </ul>

      <h2 className="text-xl font-semibold text-[var(--navy)] mt-10">Core metrics (deterministic)</h2>
      <p className="text-sm text-[var(--muted)] not-prose">
        All scores are rule-based in <code className="text-xs">src/lib/method/</code> — no LLM. Vitest golden tests pin your sample TCX files.
      </p>
      <ul className="text-sm leading-relaxed text-[var(--ink)]">
        <li><strong>Speed:</strong> pace drift rep 1→last, pace CV, per-rep speed vs rep 1.</li>
        <li><strong>Effort:</strong> avg/max HR, HR drift, intensity as % of LTHR.</li>
        <li><strong>Decoupling:</strong> pace drift % minus HR drift % — speed fading faster than effort explains.</li>
        <li><strong>Efficiency:</strong> speed per bpm (rep 1 vs last Δ).</li>
        <li><strong>Progress rings:</strong> Copeland fit and Bakken fit (0–100) from pass/warn/fail rules.</li>
      </ul>

      <h2 className="text-xl font-semibold text-[var(--navy)] mt-10">Your track</h2>
      <p className="text-sm text-[var(--muted)]">
        Map center: {HOME_TRACK.lat.toFixed(4)}, {HOME_TRACK.lng.toFixed(4)} — derived from your
        Garmin TCX. Lane 4 on the watch is longer than lane 1; compare lap times, not just km pace.
      </p>
    </div>
  );
}
