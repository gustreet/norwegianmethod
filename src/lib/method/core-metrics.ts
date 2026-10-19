import type { WorkRep } from "../types";
import { BAKKEN } from "./thresholds";

export type RepCoreMetrics = {
  index: number;
  lapNumber: number;
  paceMinKm: number;
  speedMps: number;
  avgHr: number;
  maxHr: number;
  /** Speed per heartbeat × 1000 (higher = more speed per bpm). */
  efficiency: number;
  /** Avg HR as % of LTHR (Copeland sub-threshold guardrail). */
  intensityPctLthr: number;
  paceVsRep1Pct: number;
  hrVsRep1Pct: number;
  /** Pace fade % minus HR rise % — positive = losing speed faster than effort explains. */
  decouplingRep: number;
  lthrHeadroomBpm: number;
  inEvenSplitBand: boolean;
  paceMiss: boolean;
};

export type SessionCoreMetrics = {
  paceDriftPct: number;
  hrDriftBpm: number;
  hrDriftPct: number;
  /** Session decoupling: pace drift % − HR drift % (aerobic drift proxy). */
  decouplingIndex: number;
  paceCvPct: number;
  efficiencyFirst: number;
  efficiencyLast: number;
  efficiencyDeltaPct: number;
  subThresholdRepShare: number;
  avgIntensityPctLthr: number;
  maxConsecutivePaceMiss: number;
  avgRecoverySec: number;
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
  const paces = workReps.map((r) => r.paceMinPerKm).filter((p) => p > 0);
  const hrs = workReps.map((r) => r.avgHr);
  const firstPace = paces[0] ?? 0;
  const lastPace = paces[paces.length - 1] ?? 0;
  const firstHr = hrs[0] ?? 0;
  const lastHr = hrs[hrs.length - 1] ?? 0;

  const paceDriftPct =
    firstPace > 0 ? ((lastPace - firstPace) / firstPace) * 100 : 0;
  const hrDriftBpm = lastHr - firstHr;
  const hrDriftPct = firstHr > 0 ? (hrDriftBpm / firstHr) * 100 : 0;
  const decouplingIndex = paceDriftPct - hrDriftPct;

  const paceMean = paces.reduce((a, b) => a + b, 0) / (paces.length || 1);
  const paceCvPct =
    paceMean > 0 ? (stdDev(paces) / paceMean) * 100 : 0;

  const repMetrics: RepCoreMetrics[] = workReps.map((r) => {
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
    const miss = paceMissVsRep1(r.paceMinPerKm, firstPace);
    const slowPct = firstPace > 0 ? paceVsRep1Pct : 0;
    const fastPct = firstPace > 0 ? -paceVsRep1Pct : 0;
    const inBand =
      !miss &&
      slowPct <= BAKKEN.paceMissSlowPct &&
      fastPct <= BAKKEN.paceMissFastPct;

    return {
      index: r.index,
      lapNumber: r.lapNumber,
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
  const effLast = repMetrics[repMetrics.length - 1]?.efficiency ?? 0;
  const efficiencyDeltaPct =
    effFirst > 0 ? ((effLast - effFirst) / effFirst) * 100 : 0;

  const subThreshold = workReps.filter((r) => r.maxHr < lthr).length;
  const recoveryTimes = workReps
    .map((r) => r.recoverySecondsBefore)
    .filter((s): s is number => s != null);
  const avgRecoverySec =
    recoveryTimes.length > 0
      ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
      : 0;

  return {
    paceDriftPct,
    hrDriftBpm,
    hrDriftPct,
    decouplingIndex,
    paceCvPct,
    efficiencyFirst: effFirst,
    efficiencyLast: effLast,
    efficiencyDeltaPct,
    subThresholdRepShare:
      workReps.length > 0 ? subThreshold / workReps.length : 0,
    avgIntensityPctLthr:
      lthr > 0
        ? (hrs.reduce((a, b) => a + b, 0) / (hrs.length || 1) / lthr) * 100
        : 0,
    maxConsecutivePaceMiss: maxConsecutiveMiss(
      repMetrics.map((m) => m.paceMiss),
    ),
    avgRecoverySec,
    repMetrics,
  };
}
