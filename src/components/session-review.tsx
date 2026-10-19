"use client";

import { useMemo, useState } from "react";
import { analyzeSession } from "@/lib/analyze";
import { formatDate, formatDuration, formatPace } from "@/lib/format";
import { sampleLaps, sampleStartedAt } from "@/lib/sample-laps";
import { parseTcx } from "@/lib/tcx";
import type { Lap, SessionAnalysis, SessionVerdict } from "@/lib/types";

const verdictStyles: Record<
  SessionVerdict,
  { ring: string; badge: string; label: string }
> = {
  "on-method": {
    ring: "oklch(0.72 0.14 155)",
    badge: "bg-emerald-500/15 text-emerald-900",
    label: "On method",
  },
  borderline: {
    ring: "oklch(0.78 0.12 85)",
    badge: "bg-amber-500/15 text-amber-950",
    label: "Borderline",
  },
  "too-hard": {
    ring: "oklch(0.62 0.18 25)",
    badge: "bg-rose-500/15 text-rose-950",
    label: "Too hard",
  },
};

type Props = {
  initialLaps: Lap[];
  initialStartedAt: string | null;
};

export function SessionReview({ initialLaps, initialStartedAt }: Props) {
  const [laps, setLaps] = useState(initialLaps);
  const [startedAt, setStartedAt] = useState(initialStartedAt);
  const [lthr, setLthr] = useState(172);
  const [error, setError] = useState<string | null>(null);

  const analysis: SessionAnalysis = useMemo(
    () => analyzeSession(laps, startedAt, lthr),
    [laps, startedAt, lthr],
  );

  const style = verdictStyles[analysis.verdict];

  async function onFile(file: File) {
    setError(null);
    try {
      const text = await file.text();
      const parsed = parseTcx(text);
      if (parsed.laps.length === 0) throw new Error("No laps in file.");
      setLaps(parsed.laps);
      setStartedAt(parsed.startedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read TCX.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[var(--muted)]">
            Norwegian Singles · session review
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            Sub-threshold, not Garmin&apos;s label
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
            Upload a Garmin TCX export. This scores your 400s against
            Copeland&apos;s rules—LTHR guardrail, rep drift, and hot recoveries—not
            VO2max badges or execution scores.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <label className="text-sm font-medium text-[var(--ink)]">
            LTHR (bpm)
            <input
              type="number"
              min={120}
              max={210}
              value={lthr}
              onChange={(e) => setLthr(Number(e.target.value) || 172)}
              className="mt-1 w-28 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 font-mono text-sm text-[var(--ink)]"
            />
          </label>
          <label className="cursor-pointer rounded-lg bg-[var(--primary)] px-4 py-2.5 text-center text-sm font-medium text-white hover:opacity-95">
            Upload TCX
            <input
              type="file"
              accept=".tcx,application/xml,text/xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </label>
          {error ? (
            <p className="text-sm text-rose-700" role="alert">{error}</p>
          ) : null}
        </div>
      </header>

      <section
        className="grid gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 lg:grid-cols-[1.1fr_0.9fr]"
        style={{ boxShadow: `inset 0 0 0 1px ${style.ring}33` }}
      >
        <div>
          <p className="text-sm text-[var(--muted)]">{formatDate(analysis.startedAt)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${style.badge}`}>
              {style.label}
            </span>
            <span className="font-mono text-sm text-[var(--muted)]">
              {analysis.workReps.length} work reps ·{" "}
              {analysis.qualityMinutes.toFixed(0)} quality min
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-[var(--ink)]">
            {analysis.verdictHeadline}
          </h2>
          <p className="mt-2 max-w-prose leading-relaxed text-[var(--muted)]">
            {analysis.verdictDetail}
          </p>
          <ul className="mt-6 space-y-2 text-sm leading-relaxed text-[var(--ink)]">
            {analysis.garminContrast.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-[var(--primary)]" aria-hidden>→</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <dl className="grid grid-cols-2 gap-3 font-mono text-sm">
          <Metric label="Avg work pace" value={formatPace(analysis.avgWorkPace)} />
          <Metric label="Rep 1 → last pace" value={`+${analysis.paceDriftPct.toFixed(1)}%`} />
          <Metric label="Avg work HR" value={`${Math.round(analysis.avgWorkHr)} bpm`} />
          <Metric label="Reps ≥ LTHR max" value={`${analysis.repsOverLthr}`} />
          <Metric label="First rep HR" value={`${analysis.firstWorkHr} bpm`} />
          <Metric label="Last rep HR" value={`${analysis.lastWorkHr} bpm`} />
        </dl>
      </section>

      {analysis.flags.length > 0 ? (
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-6">
          <h3 className="text-lg font-semibold text-[var(--ink)]">Coach notes</h3>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--muted)]">
            {analysis.flags.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className="text-lg font-semibold text-[var(--ink)]">Work reps</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Pace drift and heart rate vs your LTHR ({lthr} bpm). Orange rows touched threshold on max HR.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--line)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--surface)] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Pace</th>
                <th className="px-4 py-3 font-medium">Avg HR</th>
                <th className="px-4 py-3 font-medium">Max HR</th>
                <th className="px-4 py-3 font-medium">Power</th>
                <th className="px-4 py-3 font-medium">Rest before</th>
              </tr>
            </thead>
            <tbody>
              {analysis.workReps.map((rep) => {
                const hot = rep.maxHr >= lthr;
                return (
                  <tr
                    key={rep.lapNumber}
                    className={hot ? "bg-amber-500/10" : "border-t border-[var(--line)]"}
                  >
                    <td className="px-4 py-3 font-mono">{rep.index}</td>
                    <td className="px-4 py-3 font-mono">{formatDuration(rep.seconds)}</td>
                    <td className="px-4 py-3 font-mono">{formatPace(rep.paceMinPerKm)}</td>
                    <td className="px-4 py-3 font-mono">{rep.avgHr}</td>
                    <td className="px-4 py-3 font-mono">{rep.maxHr}</td>
                    <td className="px-4 py-3 font-mono">
                      {rep.watts != null ? `${rep.watts} W` : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--muted)]">
                      {rep.recoverySecondsBefore != null
                        ? `${rep.recoverySecondsBefore}s @ ${rep.recoveryAvgHrBefore ?? "—"}`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg)] p-4">
      <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</dt>
      <dd className="mt-2 text-lg text-[var(--ink)]">{value}</dd>
    </div>
  );
}

export function SessionReviewSample() {
  return <SessionReview initialLaps={sampleLaps} initialStartedAt={sampleStartedAt} />;
}
