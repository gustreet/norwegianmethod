"use client";

import { useEffect, useMemo, useState } from "react";
import { analyzeSession } from "@/lib/analyze";
import { formatDate, formatDuration, formatPace } from "@/lib/format";
import { nearTrack } from "@/lib/geo";
import { sampleLaps, sampleStartedAt } from "@/lib/sample-laps";
import { HOME_TRACK } from "@/lib/track-config";
import { parseTcx } from "@/lib/tcx";
import type { Lap, SessionAnalysis, SessionVerdict, TrackPoint } from "@/lib/types";
import { TrackMapLazy } from "./track-map-lazy";

const verdictStyles: Record<
  SessionVerdict,
  { ring: string; badge: string; label: string }
> = {
  "on-method": {
    ring: "#00205B",
    badge: "bg-[var(--navy)]/10 text-[var(--navy)]",
    label: "On method",
  },
  borderline: {
    ring: "#c9a227",
    badge: "bg-amber-500/15 text-amber-950",
    label: "Borderline",
  },
  "too-hard": {
    ring: "#BA0C2F",
    badge: "bg-[var(--red)]/15 text-[var(--red)]",
    label: "Too hard",
  },
};

export function TrackWorkspace() {
  const [laps, setLaps] = useState<Lap[]>(sampleLaps);
  const [trackpoints, setTrackpoints] = useState<TrackPoint[]>([]);
  const [startedAt, setStartedAt] = useState<string | null>(sampleStartedAt);
  const [lthr, setLthr] = useState(172);
  const [error, setError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const analysis: SessionAnalysis = useMemo(
    () => analyzeSession(laps, startedAt, lthr),
    [laps, startedAt, lthr],
  );

  const onHomeTrack = useMemo(
    () => nearTrack(trackpoints, HOME_TRACK),
    [trackpoints],
  );

  const style = verdictStyles[analysis.verdict];

  useEffect(() => {
    if (trackpoints.length > 0) return;
    fetch("/demo.tcx")
      .then((r) => (r.ok ? r.text() : null))
      .then((xml) => {
        if (!xml) return;
        const parsed = parseTcx(xml);
        setTrackpoints(parsed.trackpoints);
      })
      .catch(() => undefined);
  }, [trackpoints.length]);

  async function onFile(file: File) {
    setError(null);
    setSaveMsg(null);
    try {
      const text = await file.text();
      const parsed = parseTcx(text);
      if (parsed.laps.length === 0) throw new Error("No laps in file.");
      setLaps(parsed.laps);
      setTrackpoints(parsed.trackpoints);
      setStartedAt(parsed.startedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read TCX.");
    }
  }

  async function saveSession() {
    setSaveMsg(null);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackSlug: HOME_TRACK.slug,
        startedAt: analysis.startedAt,
        lthr,
        verdict: analysis.verdict,
        qualityMinutes: analysis.qualityMinutes,
        workRepCount: analysis.workReps.length,
        avgWorkPaceMinKm: analysis.avgWorkPace,
        paceDriftPct: analysis.paceDriftPct,
        avgWorkHr: analysis.avgWorkHr,
        laps,
        analysis,
        route: trackpoints,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveMsg(data.error ?? "Could not save to Neon.");
      return;
    }
    setSaveMsg(`Saved session #${data.id} on Neon.`);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--red)]">Your oval</p>
            <h1 className="text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
              {HOME_TRACK.name}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{HOME_TRACK.city}</p>
          </div>
          <div className="min-h-[360px] flex-1 overflow-hidden rounded-2xl border border-[var(--line)] shadow-sm">
            <TrackMapLazy points={trackpoints} />
          </div>
          <p className="text-xs text-[var(--muted)]">
            {trackpoints.length > 0
              ? onHomeTrack
                ? "GPS centroid matches your home track — good file for this app."
                : "GPS looks off-home; map still shows the route from TCX."
              : "OpenStreetMap centered on your track. Upload TCX for the lap trace."}
            {" "}
            <span className="text-[var(--navy)]">Blue</span> = controlled pace ·{" "}
            <span className="text-[var(--red)]">Red</span> = hot splits.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="text-sm font-medium text-[var(--ink)]">
              LTHR (bpm)
              <input
                type="number"
                min={120}
                max={210}
                value={lthr}
                onChange={(e) => setLthr(Number(e.target.value) || 172)}
                className="mt-1 w-28 rounded-lg border border-[var(--line)] bg-white px-3 py-2 font-mono text-sm"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-lg bg-[var(--navy)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-95">
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
              <button
                type="button"
                onClick={saveSession}
                className="rounded-lg border border-[var(--navy)] px-4 py-2.5 text-sm font-medium text-[var(--navy)] hover:bg-[var(--navy)]/5"
              >
                Save to Neon
              </button>
            </div>
          </div>
          {error ? <p className="text-sm text-[var(--red)]" role="alert">{error}</p> : null}
          {saveMsg ? <p className="text-sm text-[var(--navy)]">{saveMsg}</p> : null}

          <article
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
            style={{ boxShadow: `inset 0 0 0 1px ${style.ring}22` }}
          >
            <p className="text-sm text-[var(--muted)]">{formatDate(analysis.startedAt)}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${style.badge}`}>
                {style.label}
              </span>
              <span className="font-mono text-sm text-[var(--muted)]">
                {analysis.workReps.length} reps · {analysis.qualityMinutes.toFixed(0)} quality min
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold">{analysis.verdictHeadline}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              {analysis.verdictDetail}
            </p>
            {analysis.bakkenNote ? (
              <p className="mt-4 rounded-lg border-l-4 border-[var(--red)] bg-white/80 py-2 pl-3 text-sm text-[var(--ink)]">
                {analysis.bakkenNote}
              </p>
            ) : null}
          </article>
        </div>
      </section>

      <RepTable analysis={analysis} lthr={lthr} />
    </div>
  );
}

function RepTable({ analysis, lthr }: { analysis: SessionAnalysis; lthr: number }) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-[var(--ink)]">Work reps on your track</h3>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--line)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--navy)] text-white">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">400 m</th>
              <th className="px-4 py-3 font-medium">Pace</th>
              <th className="px-4 py-3 font-medium">Avg HR</th>
              <th className="px-4 py-3 font-medium">Max HR</th>
            </tr>
          </thead>
          <tbody>
            {analysis.workReps.map((rep) => {
              const hot = rep.maxHr >= lthr;
              return (
                <tr
                  key={rep.lapNumber}
                  className={hot ? "bg-[var(--red)]/8" : "border-t border-[var(--line)]"}
                >
                  <td className="px-4 py-3 font-mono">{rep.index}</td>
                  <td className="px-4 py-3 font-mono">{formatDuration(rep.seconds)}</td>
                  <td className="px-4 py-3 font-mono">{formatPace(rep.paceMinPerKm)}</td>
                  <td className="px-4 py-3 font-mono">{rep.avgHr}</td>
                  <td className="px-4 py-3 font-mono">{rep.maxHr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
