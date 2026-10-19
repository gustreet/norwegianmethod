import type { Lap, SessionVerdict } from "../types";
import { scoreBakken } from "./bakken";
import { computeCoreMetrics } from "./core-metrics";
import { scoreCopeland } from "./copeland";
import { flagsFromRules } from "./messages";
import { prepareFromLaps } from "./prepare";
import type { PreparedSession, SessionEvaluation } from "./types";

function combineVerdict(
  a: SessionVerdict,
  b: SessionVerdict,
): SessionVerdict {
  const rank: Record<SessionVerdict, number> = {
    "on-method": 0,
    borderline: 1,
    "too-hard": 2,
  };
  return rank[a] >= rank[b] ? a : b;
}

export function evaluateSession(
  laps: Lap[],
  lthr: number,
  _startedAt?: string | null,
): SessionEvaluation {
  const prep = prepareFromLaps(laps, lthr);
  const core = computeCoreMetrics(prep.workReps, lthr);

  const prepared: PreparedSession = {
    workReps: prep.workReps,
    recoveryLaps: prep.recoveryLaps,
    qualityMinutes: prep.qualityMinutes,
    avgWorkPace: prep.avgWorkPace,
    firstWorkPace: prep.firstWorkPace,
    lastWorkPace: prep.lastWorkPace,
    paceDriftPct: prep.paceDriftPct,
    avgWorkHr: prep.avgWorkHr,
    firstWorkHr: prep.firstWorkHr,
    lastWorkHr: prep.lastWorkHr,
    repsOverLthr: prep.repsOverLthr,
    repsInEarlyWindow: prep.repsInEarlyWindow,
    avgRecoverySec: prep.avgRecoverySec,
    recoveryHotCount: prep.recoveryHotCount,
    recoveryHotShare: prep.recoveryHotShare,
  };

  const copeland = scoreCopeland({
    workRepCount: prep.workReps.length,
    repsOverLthr: prep.repsOverLthr,
    paceDriftPct: prep.paceDriftPct,
    avgRecoverySec: prep.avgRecoverySec,
    recoveryHotShare: prep.recoveryHotShare,
    firstWorkHr: prep.firstWorkHr,
    lthr,
    core,
    finish: core.finish,
  });

  const bakken = scoreBakken({
    workRepCount: prep.workReps.length,
    repsOverLthr: prep.repsOverLthr,
    paceDriftPct: prep.paceDriftPct,
    avgRecoverySec: prep.avgRecoverySec,
    core,
    finish: core.finish,
  });

  const verdict = combineVerdict(copeland.verdict, bakken.verdict);
  const flagCodes = [
    ...copeland.rules.filter((r) => r.severity !== "pass").map((r) => r.code),
    ...bakken.rules.filter((r) => r.severity !== "pass").map((r) => r.code),
  ];
  const flags = flagsFromRules([...new Set(flagCodes)]);

  return {
    prepared,
    core,
    copeland,
    bakken,
    verdict,
    flags,
  };
}
