"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { analyzeSession } from "@/lib/analyze";
import { formatDate, formatDuration, formatPace } from "@/lib/format";
import { detectTrack, trackCentroid } from "@/lib/geo";
import { TRACKS, TRACK_SAMPLE_TCX, trackBySlug } from "@/lib/track-config";
import { parseTcx } from "@/lib/tcx";
import type {
  HomeTrack,
  Lap,
  SessionAnalysis,
  SessionVerdict,
  TrackPoint,
} from "@/lib/types";
import { CoreMetricsPanel } from "./core-metrics-panel";
import { EffortSpeedChart } from "./effort-speed-chart";
import { TrackMapLazy } from "./track-map-lazy";

type SlotState = {
  laps: Lap[];
  trackpoints: TrackPoint[];
  startedAt: string | null;
  loaded: boolean;
};

const emptySlot = (): SlotState => ({
  laps: [],
  trackpoints: [],
  startedAt: null,
  loaded: false,
});

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
  const [activeSlug, setActiveSlug] = useState(TRACKS[0].slug);
  const [slots, setSlots] = useState<Record<string, SlotState>>(() =>
    Object.fromEntries(TRACKS.map((t) => [t.slug, emptySlot()])),
  );
  const [lthr, setLthr] = useState(172);
  const [error, setError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [mapOverlay, setMapOverlay] = useState<"pace" | "hr">("pace");

  const activeTrack = trackBySlug(activeSlug) ?? TRACKS[0];
  const slot = slots[activeSlug] ?? emptySlot();

  const analysis: SessionAnalysis = useMemo(
    () => analyzeSession(slot.laps, slot.startedAt, lthr),
    [slot.laps, slot.startedAt, lthr],
  );

  const detected = useMemo(
    () => detectTrack(slot.trackpoints),
    [slot.trackpoints],
  );

  const mapCenter = useMemo(
    () => trackCentroid(slot.trackpoints) ?? activeTrack,
    [slot.trackpoints, activeTrack],
  );

  const style = verdictStyles[analysis.verdict];

  const setSlot = useCallback((slug: string, next: Partial<SlotState>) => {
    setSlots((prev) => ({
      ...prev,
      [slug]: { ...emptySlot(), ...prev[slug], ...next, loaded: true },
    }));
  }, []);

  useEffect(() => {
    for (const track of TRACKS) {
      const url = TRACK_SAMPLE_TCX[track.slug];
      if (!url) continue;
      fetch(url)
        .then((r) => (r.ok ? r.text() : Promise.reject()))
        .then((xml) => {
          const parsed = parseTcx(xml);
          setSlot(track.slug, {
            laps: parsed.laps,
            trackpoints: parsed.trackpoints,
            startedAt: parsed.startedAt,
          });
        })
        .catch(() => undefined);
    }
  }, [setSlot]);

  async function onFile(file: File, forTrack: HomeTrack) {
    setError(null);
    setSaveMsg(null);
    try {
      const text = await file.text();
      const parsed = parseTcx(text);
      if (parsed.laps.length === 0) throw new Error("No laps in file.");
      const match = detectTrack(parsed.trackpoints);
      if (match && match.slug !== forTrack.slug) {
        setError(
          `GPS matches ${match.name}, not ${forTrack.name}. Switch tabs or upload the right file.`,
        );
        return;
      }
      setSlot(forTrack.slug, {
        laps: parsed.laps,
        trackpoints: parsed.trackpoints,
        startedAt: parsed.startedAt,
      });
      setActiveSlug(forTrack.slug);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read TCX.");
    }
  }

  async function saveSession() {
    setSaveMsg(null);
    if (slot.laps.length === 0) return;
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackSlug: activeSlug,
        startedAt: analysis.startedAt,
        lthr,
        verdict: analysis.verdict,
        qualityMinutes: analysis.qualityMinutes,
        workRepCount: analysis.workReps.length,
        avgWorkPaceMinKm: analysis.avgWorkPace,
        paceDriftPct: analysis.paceDriftPct,
        avgWorkHr: analysis.avgWorkHr,
        laps: slot.laps,
        analysis,
        route: slot.trackpoints,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveMsg(data.error ?? "Could not save to Neon.");
      return;
    }
    setSaveMsg(`Saved ${activeTrack.name} session #${data.id} on Neon.`);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap gap-2 border-b border-[var(--line)] pb-4">
        {TRACKS.map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => setActiveSlug(t.slug)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              t.slug === activeSlug
                ? "bg-[var(--navy)] text-white"
                : "bg-white text-[var(--navy)] ring-1 ring-[var(--line)] hover:bg-[var(--surface)]"
            }`}
          >
            {t.name}
            {slots[t.slug]?.loaded && slots[t.slug].laps.length > 0 ? (
              <span className="ml-2 opacity-70">· loaded</span>
            ) : null}
          </button>
        ))}
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium text-[var(--red)]">Your oval</p>
            <h1 className="text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
              {activeTrack.name}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{activeTrack.city}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["pace", "hr"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMapOverlay(mode)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  mapOverlay === mode
                    ? "bg-[var(--navy)] text-white"
                    : "bg-white text-[var(--navy)] ring-1 ring-[var(--line)]"
                }`}
              >
                Map: {mode === "pace" ? "speed" : "effort (HR)"}
              </button>
            ))}
          </div>
          <div className="min-h-[360px] flex-1 overflow-hidden rounded-2xl border border-[var(--line)] shadow-sm">
            <TrackMapLazy
              points={slot.trackpoints}
              center={mapCenter}
              highlight={mapOverlay}
              lthr={lthr}
            />
          </div>
          <p className="text-xs text-[var(--muted)]">
            {slot.trackpoints.length === 0
              ? "No TCX for this tab yet."
              : detected?.slug === activeSlug
                ? "Map and reps are one TCX · GPS matches this tab."
                : detected
                  ? `This tab is ${activeTrack.name}, but GPS centroid is closer to ${detected.name}.`
                  : "Map and reps share one file · GPS not near a saved oval."}
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
                    if (f) onFile(f, activeTrack);
                  }}
                />
              </label>
              <button
                type="button"
                onClick={saveSession}
                disabled={slot.laps.length === 0}
                className="rounded-lg border border-[var(--navy)] px-4 py-2.5 text-sm font-medium text-[var(--navy)] hover:bg-[var(--navy)]/5 disabled:opacity-40"
              >
                Save to Neon
              </button>
            </div>
          </div>
          {error ? <p className="text-sm text-[var(--red)]" role="alert">{error}</p> : null}
          {saveMsg ? <p className="text-sm text-[var(--navy)]">{saveMsg}</p> : null}

          {slot.laps.length === 0 ? (
            <p className="rounded-xl border border-[var(--line)] bg-white p-6 text-sm text-[var(--muted)]">
              Upload a TCX for {activeTrack.name} only. Sha Tin and Kai Tak stay separate.
            </p>
          ) : (
            <article
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
              style={{ boxShadow: `inset 0 0 0 1px ${style.ring}22` }}
            >
              <p className="text-sm text-[var(--muted)]">{formatDate(analysis.startedAt)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${style.badge}`}>
                  {style.label}
                </span>
                <span className="rounded-full bg-[var(--navy)]/10 px-3 py-1 font-mono text-xs text-[var(--navy)]">
                  Copeland {analysis.progress.copelandFit}
                </span>
                <span className="rounded-full bg-[var(--red)]/10 px-3 py-1 font-mono text-xs text-[var(--red)]">
                  Bakken {analysis.progress.bakkenFit}
                </span>
                <span className="font-mono text-sm text-[var(--muted)]">
                  {analysis.workReps.length} reps · {analysis.qualityMinutes.toFixed(0)} quality min
                </span>
              </div>
              <h2 className="mt-3 text-xl font-semibold">{analysis.verdictHeadline}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {analysis.verdictDetail}
              </p>
              {analysis.flags.length > 0 ? (
                <ul className="mt-4 space-y-1.5 text-sm text-[var(--ink)]">
                  {analysis.flags.map((f) => (
                    <li key={f} className="rounded-lg bg-white/80 px-3 py-2 ring-1 ring-[var(--line)]">
                      {f}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          )}
        </div>
      </section>

      {slot.laps.length > 0 ? (
        <>
          <CoreMetricsPanel analysis={analysis} />
          <EffortSpeedChart core={analysis.core} />
          <RepTable analysis={analysis} lthr={lthr} />
        </>
      ) : null}
    </div>
  );
}

function RepTable({ analysis, lthr }: { analysis: SessionAnalysis; lthr: number }) {
  return (
    <section>
      <h3 className="text-lg font-semibold text-[var(--ink)]">Work reps</h3>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--line)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--navy)] text-white">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">400 m</th>
              <th className="px-4 py-3 font-medium">Pace</th>
              <th className="px-4 py-3 font-medium">Avg HR</th>
              <th className="px-4 py-3 font-medium">Max HR</th>
              <th className="px-4 py-3 font-medium">Decouple</th>
            </tr>
          </thead>
          <tbody>
            {analysis.workReps.map((rep) => {
              const hot = rep.maxHr >= lthr;
              const rm = analysis.core.repMetrics.find((m) => m.index === rep.index);
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
                  <td className="px-4 py-3 font-mono text-[var(--muted)]">
                    {rm ? `${rm.decouplingRep >= 0 ? "+" : ""}${rm.decouplingRep.toFixed(1)}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
