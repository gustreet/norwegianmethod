"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NEON_CONSOLE } from "@/lib/neon-links";
import { analyzeSession } from "@/lib/analyze";
import { formatDuration, formatPace } from "@/lib/format";
import { detectTrack, trackCentroid } from "@/lib/geo";
import { TRACKS, TRACK_SAMPLE_TCX, trackBySlug } from "@/lib/track-config";
import { parseTcx } from "@/lib/tcx";
import type { HomeTrack, Lap, SessionAnalysis, TrackPoint } from "@/lib/types";
import { EffortSpeedChart } from "./effort-speed-chart";
import { SessionSummary } from "./session-summary";
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
      const err = data.error ?? "Could not save to Neon.";
      setSaveMsg(
        err.includes("DATABASE_URL")
          ? `${err} Set up Neon on the Sessions page or console.`
          : err,
      );
      return;
    }
    setSaveMsg(`saved:${data.id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {activeTrack.name}
            </h1>
            <p className="text-sm text-muted">{activeTrack.city}</p>
          </div>
          <div
            className="inline-flex rounded-lg border border-line bg-surface p-1"
            role="tablist"
            aria-label="Track venue"
          >
            {TRACKS.map((t) => (
              <button
                key={t.slug}
                type="button"
                role="tab"
                aria-selected={t.slug === activeSlug}
                onClick={() => setActiveSlug(t.slug)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  t.slug === activeSlug
                    ? "bg-navy text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            LTHR
            <input
              type="number"
              min={120}
              max={210}
              value={lthr}
              onChange={(e) => setLthr(Number(e.target.value) || 172)}
              className="w-20 rounded-lg border border-line bg-surface px-2.5 py-1.5 font-mono text-sm text-ink"
            />
          </label>
          <span className="hidden h-6 w-px bg-line sm:block" aria-hidden />
          <div className="flex gap-1">
            {(["pace", "hr"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMapOverlay(mode)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  mapOverlay === mode
                    ? "bg-navy text-white"
                    : "text-navy hover:bg-slate-50"
                }`}
              >
                {mode === "pace" ? "Speed map" : "HR map"}
              </button>
            ))}
          </div>
          <span className="hidden h-6 w-px bg-line sm:block" aria-hidden />
          <label className="cursor-pointer rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:opacity-95">
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
            className="rounded-lg px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50 disabled:opacity-40"
          >
            Save
          </button>
        </div>

        {error ? (
          <p className="text-sm text-red" role="alert">{error}</p>
        ) : null}
        {saveMsg ? (
          <p className="text-sm text-navy">
            {saveMsg.startsWith("saved:") ? (
              <>
                Saved {activeTrack.name} session #{saveMsg.slice(6)} on{" "}
                <a
                  href={NEON_CONSOLE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  Neon
                </a>
                .{" "}
                <Link href="/sessions" className="underline underline-offset-2">
                  View sessions
                </Link>
              </>
            ) : (
              <>
                {saveMsg}{" "}
                {saveMsg.includes("DATABASE_URL") || saveMsg.includes("Neon") ? (
                  <>
                    <Link href="/sessions" className="underline underline-offset-2">
                      Sessions setup
                    </Link>
                    {" · "}
                    <a
                      href={NEON_CONSOLE}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                    >
                      Neon console
                    </a>
                  </>
                ) : null}
              </>
            )}
          </p>
        ) : null}
      </header>

      {!hasSession ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <p className="text-lg font-medium text-ink">Upload a TCX for this oval</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-pretty text-muted">
            Sha Tin and Kai Tak stay separate — one file per tab, map and reps always
            matched.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div className="flex min-h-[300px] flex-col gap-2 sm:min-h-[360px]">
              <div className="flex-1 overflow-hidden rounded-xl border border-line bg-surface">
                <TrackMapLazy
                  points={slot.trackpoints}
                  center={mapCenter}
                  highlight={mapOverlay}
                  lthr={lthr}
                />
              </div>
              <p className="text-xs text-muted">
                {detected?.slug === activeSlug
                  ? "GPS matches this oval."
                  : detected
                    ? `GPS closer to ${detected.name}.`
                    : "GPS loaded."}
              </p>
            </div>
            <SessionSummary analysis={analysis} lthr={lthr} />
          </div>

          <EffortSpeedChart core={analysis.core} />
          <RepTable analysis={analysis} lthr={lthr} />
        </>
      )}
    </div>
  );
}

function RepTable({ analysis, lthr }: { analysis: SessionAnalysis; lthr: number }) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-3 sm:px-5">
        <h2 className="font-semibold text-ink">Work reps</h2>
        <p className="text-xs text-muted">
          Red rows = max HR ≥ LTHR on controlled reps. Finish rep excluded from LTHR rules.
        </p>
      </div>
      <div className="max-h-[min(65vh,480px)] overflow-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-[var(--z-sticky,10)] border-b border-line bg-slate-100 text-ink">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">Rep</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Time</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Pace</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Avg HR</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Max HR</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Decouple</th>
            </tr>
          </thead>
          <tbody>
            {analysis.workReps.map((rep) => {
              const rm = analysis.core.repMetrics.find((m) => m.index === rep.index);
              const isFinish = rm?.role === "finish";
              const hot = !isFinish && rep.maxHr >= lthr;
              return (
                <tr
                  key={rep.lapNumber}
                  className={`border-t border-line ${
                    hot ? "bg-red/5" : isFinish ? "bg-slate-50" : ""
                  }`}
                >
                  <td className="px-4 py-2 font-mono text-ink">
                    {rep.index}
                    {isFinish ? (
                      <span className="ml-1.5 text-[10px] font-sans font-medium text-muted">
                        finish
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 font-mono">{formatDuration(rep.seconds)}</td>
                  <td className="px-4 py-2 font-mono">{formatPace(rep.paceMinPerKm)}</td>
                  <td className="px-4 py-2 font-mono">{rep.avgHr}</td>
                  <td className={`px-4 py-2 font-mono ${hot ? "font-semibold text-red" : ""}`}>
                    {rep.maxHr}
                  </td>
                  <td className="px-4 py-2 font-mono text-muted">
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
