"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { analyzeSession } from "@/lib/analyze";
import { formatDuration, formatPace } from "@/lib/format";
import { detectTrack, trackCentroid } from "@/lib/geo";
import { TRACKS, TRACK_SAMPLE_TCX, trackBySlug } from "@/lib/track-config";
import { parseTcx } from "@/lib/tcx";
import type {
  HomeTrack,
  Lap,
  SessionAnalysis,
  TrackPoint,
} from "@/lib/types";
import { CoreMetricsPanel } from "./core-metrics-panel";
import { EffortSpeedChart } from "./effort-speed-chart";
import { TrackMapLazy } from "./track-map-lazy";
import { VerdictBand } from "./verdict-band";

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

export function TrackWorkspace() {
  const [activeSlug, setActiveSlug] = useState(TRACKS[0].slug);
  const [slots, setSlots] = useState<Record<string, SlotState>>(() =>
    Object.fromEntries(TRACKS.map((t) => [t.slug, emptySlot()])),
  );
  const [lthr, setLthr] = useState(172);
  const [error, setError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [mapOverlay, setMapOverlay] = useState<"pace" | "hr">("pace");
  const [flagsOpen, setFlagsOpen] = useState(false);

  const activeTrack = trackBySlug(activeSlug) ?? TRACKS[0];
  const slot = slots[activeSlug] ?? emptySlot();
  const hasSession = slot.laps.length > 0;

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
    if (!hasSession) return;
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-5 border-b border-line pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance text-ink sm:text-4xl">
              {activeTrack.name}
            </h1>
            <p className="mt-1 text-base text-muted">{activeTrack.city}</p>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Track venue">
            {TRACKS.map((t) => (
              <button
                key={t.slug}
                type="button"
                role="tab"
                aria-selected={t.slug === activeSlug}
                onClick={() => {
                  setActiveSlug(t.slug);
                  setFlagsOpen(false);
                }}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  t.slug === activeSlug
                    ? "bg-navy text-white shadow-md"
                    : "bg-surface text-navy ring-2 ring-line hover:ring-navy/25"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium text-ink">
            LTHR (bpm)
            <input
              type="number"
              min={120}
              max={210}
              value={lthr}
              onChange={(e) => setLthr(Number(e.target.value) || 172)}
              className="mt-1 block w-24 rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm shadow-sm"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(["pace", "hr"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMapOverlay(mode)}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${
                  mapOverlay === mode
                    ? "bg-navy text-white"
                    : "bg-surface text-navy ring-1 ring-line"
                }`}
              >
                Map · {mode === "pace" ? "speed" : "HR"}
              </button>
            ))}
          </div>
          <label className="cursor-pointer rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-95">
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
            disabled={!hasSession}
            className="rounded-lg border border-navy bg-surface px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5 disabled:opacity-40"
          >
            Save to Neon
          </button>
        </div>
        {error ? (
          <p className="text-sm text-red" role="alert">{error}</p>
        ) : null}
        {saveMsg ? <p className="text-sm text-navy">{saveMsg}</p> : null}
      </header>

      {hasSession ? (
        <VerdictBand
          analysis={analysis}
          flagsOpen={flagsOpen}
          onToggleFlags={() => setFlagsOpen((o) => !o)}
        />
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:items-start">
        <div className="flex flex-col gap-3">
          <div className="relative -mx-4 min-h-[340px] overflow-hidden rounded-none border-y-2 border-navy/20 bg-navy sm:mx-0 sm:min-h-[420px] sm:rounded-2xl sm:border-2 sm:ring-4 sm:ring-navy/10">
            <TrackMapLazy
              points={slot.trackpoints}
              center={mapCenter}
              highlight={mapOverlay}
              lthr={lthr}
            />
          </div>
          <p className="text-xs leading-relaxed text-muted">
            {slot.trackpoints.length === 0
              ? "No TCX for this tab yet."
              : detected?.slug === activeSlug
                ? "One TCX per tab · GPS matches this oval."
                : detected
                  ? `GPS centroid is closer to ${detected.name} than ${activeTrack.name}.`
                  : "GPS loaded · not matched to a saved oval."}
          </p>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          {!hasSession ? (
            <div className="rounded-2xl border-2 border-dashed border-navy/25 bg-surface p-8 text-center text-sm text-muted">
              <p className="text-base font-semibold text-ink">No session yet</p>
              <p className="mt-2 text-pretty">
                Upload a TCX for <strong>{activeTrack.name}</strong>. Sha Tin and Kai Tak stay
                separate.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <h2 className="text-sm font-bold text-ink">Session</h2>
              <dl className="mt-4 space-y-3 font-mono text-sm">
                <div className="flex justify-between gap-4 border-b border-line pb-3">
                  <dt className="text-muted">Decoupling</dt>
                  <dd className="font-bold tabular-nums text-ink">
                    {analysis.core.decouplingIndex.toFixed(1)}%
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-line pb-3">
                  <dt className="text-muted">Pace drift</dt>
                  <dd className="font-bold tabular-nums text-ink">
                    {analysis.paceDriftPct >= 0 ? "+" : ""}
                    {analysis.paceDriftPct.toFixed(1)}%
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-line pb-3">
                  <dt className="text-muted">Sub-LTHR reps</dt>
                  <dd className="font-bold tabular-nums text-ink">
                    {(analysis.progress.subThresholdShare * 100).toFixed(0)}%
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">LTHR ceiling</dt>
                  <dd className="font-bold tabular-nums text-red">{lthr} bpm</dd>
                </div>
              </dl>
            </div>
          )}
        </aside>
      </div>

      {hasSession ? (
        <div className="flex flex-col gap-6">
          <CoreMetricsPanel analysis={analysis} />
          <EffortSpeedChart core={analysis.core} />
          <RepTable analysis={analysis} lthr={lthr} />
        </div>
      ) : null}
    </div>
  );
}

function RepTable({ analysis, lthr }: { analysis: SessionAnalysis; lthr: number }) {
  return (
    <section className="rounded-2xl border border-line bg-surface shadow-sm">
      <div className="border-b border-line bg-slate-50 px-4 py-4 sm:px-5">
        <h2 className="text-lg font-bold text-ink">Work reps</h2>
        <p className="text-xs text-muted">Max HR ≥ LTHR highlighted</p>
      </div>
      <div className="max-h-[min(70vh,520px)] overflow-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-navy text-white shadow-sm">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Rep</th>
              <th scope="col" className="px-4 py-3 font-medium">Time</th>
              <th scope="col" className="px-4 py-3 font-medium">Pace /km</th>
              <th scope="col" className="px-4 py-3 font-medium">Avg HR</th>
              <th scope="col" className="px-4 py-3 font-medium">Max HR</th>
              <th scope="col" className="px-4 py-3 font-medium">Decouple</th>
            </tr>
          </thead>
          <tbody>
            {analysis.workReps.map((rep, row) => {
              const hot = rep.maxHr >= lthr;
              const rm = analysis.core.repMetrics.find((m) => m.index === rep.index);
              return (
                <tr
                  key={rep.lapNumber}
                  className={`border-t border-line ${
                    hot ? "bg-red/8" : row % 2 === 0 ? "bg-white" : "bg-slate-50/80"
                  }`}
                >
                  <td className="px-4 py-2.5 font-mono text-ink">{rep.index}</td>
                  <td className="px-4 py-2.5 font-mono">{formatDuration(rep.seconds)}</td>
                  <td className="px-4 py-2.5 font-mono">{formatPace(rep.paceMinPerKm)}</td>
                  <td className="px-4 py-2.5 font-mono">{rep.avgHr}</td>
                  <td className={`px-4 py-2.5 font-mono ${hot ? "font-semibold text-red" : ""}`}>
                    {rep.maxHr}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-muted">
                    {rm
                      ? `${rm.decouplingRep >= 0 ? "+" : ""}${rm.decouplingRep.toFixed(1)}%`
                      : "—"}
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
