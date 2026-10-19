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
import { FitBar } from "./fit-bar";
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
  { accent: string; badge: string; label: string }
> = {
  "on-method": {
    accent: "border-navy/30 bg-navy/5",
    badge: "bg-navy/12 text-navy",
    label: "On method",
  },
  borderline: {
    accent: "border-amber-400/50 bg-amber-50",
    badge: "bg-amber-100 text-amber-950",
    label: "Borderline",
  },
  "too-hard": {
    accent: "border-red/35 bg-red/5",
    badge: "bg-red/12 text-red",
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

  const style = verdictStyles[analysis.verdict];
  const visibleFlags = flagsOpen ? analysis.flags : analysis.flags.slice(0, 3);

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-4 border-b border-line pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red">
              Your oval
            </p>
            <h1 className="text-2xl font-semibold text-balance text-ink sm:text-3xl">
              {activeTrack.name}
            </h1>
            <p className="mt-1 text-sm text-muted">{activeTrack.city}</p>
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
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  t.slug === activeSlug
                    ? "bg-navy text-white shadow-sm"
                    : "bg-surface text-navy ring-1 ring-line hover:bg-white"
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
          <label className="cursor-pointer rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95">
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <div className="flex flex-col gap-2">
          <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-line bg-surface shadow-sm sm:min-h-[380px]">
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

        <div className="flex flex-col gap-4">
          {!hasSession ? (
            <div className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted shadow-sm">
              Upload a TCX for <strong className="text-ink">{activeTrack.name}</strong> only.
              Sha Tin and Kai Tak stay in separate tabs.
            </div>
          ) : (
            <article
              className={`rounded-2xl border p-5 shadow-sm ${style.accent}`}
            >
              <p className="text-sm text-muted">{formatDate(analysis.startedAt)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${style.badge}`}>
                  {style.label}
                </span>
                <span className="font-mono text-xs text-muted">
                  {analysis.workReps.length} reps · {analysis.qualityMinutes.toFixed(0)} min work
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-ink">
                {analysis.verdictHeadline}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {analysis.verdictDetail}
              </p>
              <div className="mt-4 space-y-2">
                <FitBar label="Copeland" value={analysis.progress.copelandFit} tone="navy" />
                <FitBar label="Bakken" value={analysis.progress.bakkenFit} tone="red" />
              </div>
              {analysis.flags.length > 0 ? (
                <div className="mt-4">
                  <ul className="space-y-2 text-sm text-ink">
                    {visibleFlags.map((f) => (
                      <li
                        key={f}
                        className="rounded-lg border border-line bg-surface/90 px-3 py-2 leading-snug"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                  {analysis.flags.length > 3 ? (
                    <button
                      type="button"
                      className="mt-2 text-xs font-medium text-navy hover:underline"
                      onClick={() => setFlagsOpen((o) => !o)}
                    >
                      {flagsOpen
                        ? "Show fewer"
                        : `Show all ${analysis.flags.length} flags`}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          )}
        </div>
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
      <div className="border-b border-line px-4 py-3 sm:px-5">
        <h2 className="text-base font-semibold text-ink">Work reps</h2>
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
