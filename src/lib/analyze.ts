import type { Lap, SessionAnalysis, SessionVerdict } from "./types";
import { evaluateSession } from "./method/evaluate";

const VERDICT_COPY: Record<
  SessionVerdict,
  { headline: string; detail: string }
> = {
  "on-method": {
    headline: "Controlled sub-threshold session",
    detail:
      "Rep heart rate and pace drift match Norwegian Singles / Bakken guardrails.",
  },
  borderline: {
    headline: "Completed, but creeping above sub-threshold",
    detail:
      "HR, fade, or split discipline suggests threshold—not a clean repeatable single.",
  },
  "too-hard": {
    headline: "Too hard for method intent",
    detail:
      "LTHR crossings, fade, or consecutive split misses — slow reps or stop earlier.",
  },
};

export function analyzeSession(
  laps: Lap[],
  startedAt: string | null,
  lthr: number,
): SessionAnalysis {
  const ev = evaluateSession(laps, lthr, startedAt);
  const { prepared, core, copeland, bakken, verdict, flags } = ev;
  const copy = VERDICT_COPY[verdict];

  const garminContrast = [
    "Garmin may label this VO2 Max — scores here use Copeland + Bakken rules only.",
    verdict === "on-method"
      ? "Method fit scores favor sub-threshold interpretation."
      : "Method fit scores align with hard interval / VO2-style stress.",
  ];

  return {
    title: "Track singles review",
    startedAt,
    workReps: prepared.workReps,
    recoveryLaps: prepared.recoveryLaps,
    qualityMinutes: prepared.qualityMinutes,
    avgWorkPace: prepared.avgWorkPace,
    firstWorkPace: prepared.firstWorkPace,
    lastWorkPace: prepared.lastWorkPace,
    paceDriftPct: prepared.paceDriftPct,
    avgWorkHr: prepared.avgWorkHr,
    firstWorkHr: prepared.firstWorkHr,
    lastWorkHr: prepared.lastWorkHr,
    repsOverLthr: prepared.repsOverLthr,
    repsInEarlyWindow: prepared.repsInEarlyWindow,
    verdict,
    verdictHeadline: copy.headline,
    verdictDetail: copy.detail,
    flags,
    garminContrast,
    core,
    copeland,
    bakken,
    progress: {
      copelandFit: copeland.metrics.copeland_method_fit_score ?? 0,
      bakkenFit: bakken.metrics.bakken_method_fit_score ?? 0,
      subThresholdShare: core.subThresholdRepShare,
      decouplingIndex: core.decouplingIndex,
      evenSplitShare: bakken.metrics.bakken_even_split_share ?? 0,
    },
  };
}
