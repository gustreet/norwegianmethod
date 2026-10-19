import type { ClassifiedLap, Lap, WorkRep } from "../types";
import { COPELAND } from "./thresholds";
import { classifyLaps } from "./classify";

export function buildWorkReps(classified: ClassifiedLap[]): WorkRep[] {
  const workLaps = classified.filter((l) => l.kind === "work");
  return workLaps.map((lap, index) => {
    const prev = classified[lap.n - 2];
    const recoveryBefore =
      prev?.kind === "recovery"
        ? { seconds: prev.seconds, avgHr: prev.avgHr }
        : null;
    const pace = lap.paceMinPerKm ?? 0;
    return {
      index: index + 1,
      lapNumber: lap.n,
      seconds: lap.seconds,
      paceMinPerKm: pace,
      avgHr: lap.avgHr,
      maxHr: lap.maxHr,
      endHr: lap.endHr,
      watts: lap.watts,
      cadence: lap.cadence,
      recoverySecondsBefore: recoveryBefore?.seconds ?? null,
      recoveryAvgHrBefore: recoveryBefore?.avgHr ?? null,
    };
  });
}

export function prepareFromLaps(laps: Lap[], lthr: number) {
  const classified = classifyLaps(laps);
  const workReps = buildWorkReps(classified);
  const recoveryLaps = classified.filter((l) => l.kind === "recovery");

  const paces = workReps.map((r) => r.paceMinPerKm).filter((p) => p > 0);
  const hrs = workReps.map((r) => r.avgHr);
  const qualityMinutes = workReps.reduce((s, r) => s + r.seconds, 0) / 60;
  const avgWorkPace = paces.reduce((a, b) => a + b, 0) / (paces.length || 1);
  const firstWorkPace = paces[0] ?? 0;
  const lastWorkPace = paces[paces.length - 1] ?? 0;
  const paceDriftPct =
    firstWorkPace > 0
      ? ((lastWorkPace - firstWorkPace) / firstWorkPace) * 100
      : 0;
  const avgWorkHr = hrs.reduce((a, b) => a + b, 0) / (hrs.length || 1);
  const firstWorkHr = hrs[0] ?? 0;
  const lastWorkHr = hrs[hrs.length - 1] ?? 0;

  const repsOverLthr = workReps.filter((r) => r.maxHr >= lthr).length;
  const earlyReps = workReps.slice(0, COPELAND.earlySubThresholdWindowReps);
  const repsInEarlyWindow = earlyReps.filter(
    (r) => r.avgHr <= lthr - COPELAND.earlySubThresholdBelowLthr,
  ).length;

  const recoveryTimes = workReps
    .map((r) => r.recoverySecondsBefore)
    .filter((s): s is number => s != null);
  const avgRecoverySec =
    recoveryTimes.length > 0
      ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
      : 0;

  const highRecoveryHr = recoveryLaps.filter(
    (r) => r.avgHr >= lthr - COPELAND.recoveryHotHrBelowLthr,
  ).length;
  const recoveryHotShare =
    recoveryLaps.length > 0 ? highRecoveryHr / recoveryLaps.length : 0;

  return {
    classified,
    workReps,
    recoveryLaps,
    qualityMinutes,
    avgWorkPace,
    firstWorkPace,
    lastWorkPace,
    paceDriftPct,
    avgWorkHr,
    firstWorkHr,
    lastWorkHr,
    repsOverLthr,
    repsInEarlyWindow,
    avgRecoverySec,
    recoveryHotCount: highRecoveryHr,
    recoveryHotShare,
  };
}
