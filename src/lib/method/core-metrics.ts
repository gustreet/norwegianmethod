import type { WorkRep } from "../types";
import {
  analyzeFinishRep,
  driftFromFirstToLastControlled,
  repRole,
  splitWorkReps,
} from "./baseline";
import type { FinishRepAnalysis } from "./baseline";
import { BAKKEN } from "./thresholds";

export type RepCoreMetrics = {
  index: number;
  lapNumber: number;
  role: "controlled" | "finish";
  paceMinKm: number;
  speedMps: number;
  avgHr: number;
  maxHr: number;
  efficiency: number;
  intensityPctLthr: number;
  paceVsRep1Pct: number;
  hrVsRep1Pct: number;
  decouplingRep: number;
  lthrHeadroomBpm: number;
  inEvenSplitBand: boolean;
  paceMiss: boolean;
};

export type SessionCoreMetrics = {
  paceDriftPct: number;
  hrDriftBpm: number;
  hrDriftPct: number;
  decouplingIndex: number;
  paceCvPct: number;
  efficiencyFirst: number;
  efficiencyLast: number;
  efficiencyDeltaPct: number;
  subThresholdRepShare: number;
  avgIntensityPctLthr: number;
  maxConsecutivePaceMiss: number;
  avgRecoverySec: number;
  finishRepIndex: number | null;
  finish: FinishRepAnalysis;
  repMetrics: RepCoreMetrics[];
};

function speedMps(seconds: number, meters: number): number {
  return seconds > 0 ? meters / seconds : 0;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const v =
    values.reduce((s, x) => s + (x - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(v);
}

function paceMissVsRep1(paceMinKm: number, rep1Pace: number): boolean {
  if (rep1Pace <= 0) return false;
  const slowPct = ((paceMinKm - rep1Pace) / rep1Pace) * 100;
  const fastPct = ((rep1Pace - paceMinKm) / rep1Pace) * 100;
  return (
    slowPct > BAKKEN.paceMissSlowPct || fastPct > BAKKEN.paceMissFastPct
  );
}

function maxConsecutiveMiss(misses: boolean[]): number {
  let best = 0;
  let cur = 0;
  for (const m of misses) {
    if (m) {
      cur += 1;
      best = Math.max(best, cur);
    } else cur = 0;
  }
  return best;
}

export function computeCoreMetrics(
  workReps: WorkRep[],
  lthr: number,
): SessionCoreMetrics {
  const { controlled, finish } = splitWorkReps(workReps);
  const drift = driftFromFirstToLastControlled(workReps);
  const { paceDriftPct, hrDriftBpm, hrDriftPct } = drift;
  const decouplingIndex = paceDriftPct - hrDriftPct;

  const controlledPaces = controlled
    .map((r) => r.paceMinPerKm)
    .filter((p) => p > 0);
  const paceMean =
    controlledPaces.reduce((a, b) => a + b, 0) / (controlledPaces.length || 1);
  const paceCvPct =
    paceMean > 0 ? (stdDev(controlledPaces) / paceMean) * 100 : 0;

  const firstPace = drift.firstWorkPace;
  const firstHr = drift.firstWorkHr;
  const n = workReps.length;

  const repMetrics: RepCoreMetrics[] = workReps.map((r) => {
    const role = repRole(r.index, n);
    const meters =
      r.paceMinPerKm > 0
        ? ((r.seconds / 60) / r.paceMinPerKm) * 1000
        : 400;
    const speed = speedMps(r.seconds, meters);
    const eff = r.avgHr > 0 ? (speed / r.avgHr) * 1000 : 0;
    const paceVsRep1Pct =
      firstPace > 0 ? ((r.paceMinPerKm - firstPace) / firstPace) * 100 : 0;
    const hrVsRep1Pct =
      firstHr > 0 ? ((r.avgHr - firstHr) / firstHr) * 100 : 0;
    const miss =
      role === "finish" ? false : paceMissVsRep1(r.paceMinPerKm, firstPace);
    const inBand = role === "finish" ? true : !miss;

    return {
      index: r.index,
      lapNumber: r.lapNumber,
      role,
      paceMinKm: r.paceMinPerKm,
      speedMps: speed,
      avgHr: r.avgHr,
      maxHr: r.maxHr,
      efficiency: eff,
      intensityPctLthr: lthr > 0 ? (r.avgHr / lthr) * 100 : 0,
      paceVsRep1Pct,
      hrVsRep1Pct,
      decouplingRep: paceVsRep1Pct - hrVsRep1Pct,
      lthrHeadroomBpm: lthr - r.maxHr,
      inEvenSplitBand: inBand,
      paceMiss: miss,
    };
  });

  const effFirst = repMetrics[0]?.efficiency ?? 0;
  const lastControlledMetric =
    repMetrics.find((m) => m.role === "controlled" && m.index === n - 1) ??
    repMetrics[repMetrics.length - 1];
  const effLastControlled = lastControlledMetric?.efficiency ?? effFirst;
  const efficiencyDeltaPct =
    effFirst > 0 ? ((effLastControlled - effFirst) / effFirst) * 100 : 0;

  const subThreshold = controlled.filter((r) => r.maxHr < lthr).length;
  const controlledHrs = controlled.map((r) => r.avgHr);
  const recoveryTimes = workReps
    .map((r) => r.recoverySecondsBefore)
    .filter((s): s is number => s != null);
  const avgRecoverySec =
    recoveryTimes.length > 0
      ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
      : 0;

  const controlledMisses = repMetrics
    .filter((m) => m.role === "controlled")
    .map((m) => m.paceMiss);

  const finishAnalysis = analyzeFinishRep(workReps, lthr);

  return {
    paceDriftPct,
    hrDriftBpm,
    hrDriftPct,
    decouplingIndex,
    paceCvPct,
    efficiencyFirst: effFirst,
    efficiencyLast: effLastControlled,
    efficiencyDeltaPct,
    subThresholdRepShare:
      controlled.length > 0 ? subThreshold / controlled.length : 0,
    avgIntensityPctLthr:
      lthr > 0 && controlledHrs.length > 0
        ? (controlledHrs.reduce((a, b) => a + b, 0) / controlledHrs.length / lthr) *
          100
        : 0,
    maxConsecutivePaceMiss: maxConsecutiveMiss(controlledMisses),
    avgRecoverySec,
    finishRepIndex: finish?.index ?? null,
    finish: finishAnalysis,
    repMetrics,
  };
}
