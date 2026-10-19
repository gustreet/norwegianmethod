import type {
  ClassifiedLap,
  Lap,
  SessionAnalysis,
  SessionVerdict,
  WorkRep,
} from "./types";

function computePaceMinPerKm(seconds: number, meters: number): number | null {
  if (meters < 50) return null;
  return (seconds / 60) / (meters / 1000);
}

function classifyLap(lap: Lap): ClassifiedLap {
  const paceMinPerKm = computePaceMinPerKm(lap.seconds, lap.meters);
  let kind: ClassifiedLap["kind"] = "other";
  if (lap.meters >= 300 && lap.seconds >= 60) kind = "work";
  else if (lap.meters < 120 && lap.seconds <= 45) kind = "recovery";
  return { ...lap, kind, paceMinPerKm };
}

export function analyzeSession(
  laps: Lap[],
  startedAt: string | null,
  lthr: number,
): SessionAnalysis {
  const classified = laps.map(classifyLap);
  const workLaps = classified.filter((l) => l.kind === "work");
  const recoveryLaps = classified.filter((l) => l.kind === "recovery");

  const workReps: WorkRep[] = workLaps.map((lap, index) => {
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

  const paces = workReps.map((r) => r.paceMinPerKm).filter((p) => p > 0);
  const hrs = workReps.map((r) => r.avgHr);
  const qualityMinutes = workReps.reduce((s, r) => s + r.seconds, 0) / 60;
  const avgWorkPace = paces.reduce((a, b) => a + b, 0) / (paces.length || 1);
  const firstWorkPace = paces[0] ?? 0;
  const lastWorkPace = paces[paces.length - 1] ?? 0;
  const paceDriftPct =
    firstWorkPace > 0 ? ((lastWorkPace - firstWorkPace) / firstWorkPace) * 100 : 0;
  const avgWorkHr = hrs.reduce((a, b) => a + b, 0) / (hrs.length || 1);
  const firstWorkHr = hrs[0] ?? 0;
  const lastWorkHr = hrs[hrs.length - 1] ?? 0;

  const repsOverLthr = workReps.filter((r) => r.maxHr >= lthr).length;
  const earlyReps = workReps.slice(0, Math.min(3, workReps.length));
  const repsInEarlyWindow = earlyReps.filter(
    (r) => r.avgHr <= lthr - 8,
  ).length;

  const flags: string[] = [];
  if (workReps.length >= 10 && paceDriftPct > 8) {
    flags.push(
      `Pace faded ${paceDriftPct.toFixed(0)}% from rep 1 to rep ${workReps.length}. Norwegian Singles rewards holding sub-threshold, not grinding late reps.`,
    );
  }
  if (repsOverLthr >= Math.ceil(workReps.length * 0.4)) {
    flags.push(
      `${repsOverLthr} of ${workReps.length} reps touched or crossed your LTHR (${lthr} bpm). Copeland uses LTHR as a guardrail—repeated crossings mean the session was above sub-threshold.`,
    );
  }
  if (firstWorkHr > 0 && firstWorkHr < lthr - 20 && workReps.length > 5) {
    flags.push(
      `Early reps were very conservative (rep 1 avg ${firstWorkHr} bpm). That can be fine for the first session of a block, but check you are not under-shooting the sub-threshold state.`,
    );
  }

  const recoveryTimes = workReps
    .map((r) => r.recoverySecondsBefore)
    .filter((s): s is number => s != null);
  const avgRecovery =
    recoveryTimes.reduce((a, b) => a + b, 0) / (recoveryTimes.length || 1);
  if (recoveryTimes.length > 0 && avgRecovery <= 35) {
    flags.push(
      `Recoveries averaged ${avgRecovery.toFixed(0)}s. Short rests keep lactate elevated—good for the community 400m variant, but Copeland warns that shortening recovery is not a progression target.`,
    );
  }

  const highRecoveryHr = recoveryLaps.filter((r) => r.avgHr >= lthr - 5).length;
  if (highRecoveryHr >= Math.ceil(recoveryLaps.length * 0.5)) {
    flags.push(
      `Recoveries stayed hot (many above ${lthr - 5} bpm avg). Sub-threshold work should leave enough room to repeat tomorrow.`,
    );
  }

  let verdict: SessionVerdict = "on-method";
  if (repsOverLthr >= 3 || paceDriftPct > 12) verdict = "too-hard";
  else if (repsOverLthr >= 1 || paceDriftPct > 6) verdict = "borderline";

  let verdictHeadline = "Controlled sub-threshold session";
  let verdictDetail =
    "Rep heart rate and pace drift look compatible with Norwegian Singles: work stayed mostly below threshold with manageable fade.";
  if (verdict === "borderline") {
    verdictHeadline = "Completed, but creeping above sub-threshold";
    verdictDetail =
      "You got the volume in, but HR or late-rep pace suggests this was closer to threshold/VO2 work than a repeatable single.";
  }
  if (verdict === "too-hard") {
    verdictHeadline = "Too hard for a Norwegian Single";
    verdictDetail =
      "Garmin may label this VO2max work—and your data supports that. For Copeland’s method, slow the rep pace or cut reps so LTHR stays a ceiling, not a target.";
  }

  const garminContrast = [
    'Garmin showed “Primary benefit: VO2 Max” and 100% execution score for this file.',
    verdict === "on-method"
      ? "Your rep data mostly disagrees with the VO2 label—this app scores method fit, not watch marketing."
      : "Your rep HR and fade align with Garmin’s VO2 label more than with a sub-threshold single.",
  ];

  return {
    title: "Track singles review",
    startedAt,
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
    verdict,
    verdictHeadline,
    verdictDetail,
    flags,
    garminContrast,
  };
}
