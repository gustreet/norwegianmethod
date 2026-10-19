import type { WorkRep } from "../types";
import { BASELINE } from "./thresholds";

export type RepRole = "controlled" | "finish";

/** Final work rep is modeled as ~90–95% HR all-out, not sub-threshold baseline. */
export function splitWorkReps(workReps: WorkRep[]): {
  controlled: WorkRep[];
  finish: WorkRep | null;
} {
  if (workReps.length <= 1) {
    return { controlled: workReps, finish: null };
  }
  return {
    controlled: workReps.slice(0, -1),
    finish: workReps[workReps.length - 1],
  };
}

export function repRole(index: number, workRepCount: number): RepRole {
  if (workRepCount >= 2 && index === workRepCount) return "finish";
  return "controlled";
}

/** Expected avg HR band for the finish rep as share of session max HR (or LTHR fallback). */
export function finishRepExpectedHrBand(
  workReps: WorkRep[],
  lthr: number,
): { low: number; high: number } {
  const maxHr = Math.max(
    ...workReps.map((r) => r.maxHr),
    lthr * BASELINE.finishRepHrReferenceLthrFactor,
  );
  return {
    low: maxHr * BASELINE.finishRepAllOutHrLow,
    high: maxHr * BASELINE.finishRepAllOutHrHigh,
  };
}

export type FinishRepAnalysis = {
  present: boolean;
  avgHr: number;
  maxHr: number;
  sessionPeakMaxHr: number;
  /** Finish avg HR as % of session peak max HR; target 90–95. */
  avgHrPctOfPeak: number;
  inAllOutBand: boolean;
  tooSoft: boolean;
  tooHot: boolean;
};

export function analyzeFinishRep(
  workReps: WorkRep[],
  lthr: number,
): FinishRepAnalysis {
  const empty: FinishRepAnalysis = {
    present: false,
    avgHr: 0,
    maxHr: 0,
    sessionPeakMaxHr: 0,
    avgHrPctOfPeak: 0,
    inAllOutBand: false,
    tooSoft: false,
    tooHot: false,
  };
  const { finish } = splitWorkReps(workReps);
  if (!finish) return empty;

  const sessionPeakMaxHr = Math.max(
    ...workReps.map((r) => r.maxHr),
    lthr,
  );
  const avgHrPctOfPeak =
    sessionPeakMaxHr > 0 ? (finish.avgHr / sessionPeakMaxHr) * 100 : 0;
  const lowPct = BASELINE.finishRepAllOutHrLow * 100;
  const highPct = BASELINE.finishRepAllOutHrHigh * 100;

  return {
    present: true,
    avgHr: finish.avgHr,
    maxHr: finish.maxHr,
    sessionPeakMaxHr,
    avgHrPctOfPeak,
    inAllOutBand: avgHrPctOfPeak >= lowPct && avgHrPctOfPeak <= highPct,
    tooSoft: avgHrPctOfPeak < lowPct,
    tooHot: avgHrPctOfPeak > highPct,
  };
}

export function controlledRepCount(workRepCount: number): number {
  return workRepCount >= 2 ? workRepCount - 1 : workRepCount;
}

export function repsOverLthrControlled(
  workReps: WorkRep[],
  lthr: number,
): number {
  const { controlled } = splitWorkReps(workReps);
  return controlled.filter((r) => r.maxHr >= lthr).length;
}

export function driftFromFirstToLastControlled(workReps: WorkRep[]): {
  paceDriftPct: number;
  hrDriftBpm: number;
  hrDriftPct: number;
  firstWorkPace: number;
  lastWorkPace: number;
  firstWorkHr: number;
  lastWorkHr: number;
} {
  const { controlled } = splitWorkReps(workReps);
  const paces = controlled.map((r) => r.paceMinPerKm).filter((p) => p > 0);
  const hrs = controlled.map((r) => r.avgHr);
  const firstWorkPace = paces[0] ?? 0;
  const lastWorkPace = paces[paces.length - 1] ?? firstWorkPace;
  const firstWorkHr = hrs[0] ?? 0;
  const lastWorkHr = hrs[hrs.length - 1] ?? firstWorkHr;
  const paceDriftPct =
    firstWorkPace > 0
      ? ((lastWorkPace - firstWorkPace) / firstWorkPace) * 100
      : 0;
  const hrDriftBpm = lastWorkHr - firstWorkHr;
  const hrDriftPct = firstWorkHr > 0 ? (hrDriftBpm / firstWorkHr) * 100 : 0;
  return {
    paceDriftPct,
    hrDriftBpm,
    hrDriftPct,
    firstWorkPace,
    lastWorkPace,
    firstWorkHr,
    lastWorkHr,
  };
}
