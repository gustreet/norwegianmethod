import type { SessionCoreMetrics } from "./core-metrics";
import { methodFitScore, rule, verdictFromRules } from "./rules";
import { BAKKEN } from "./thresholds";
import type { MethodScorecard } from "./types";

type BakkenInput = {
  workRepCount: number;
  repsOverLthr: number;
  paceDriftPct: number;
  avgRecoverySec: number;
  core: SessionCoreMetrics;
};

export function scoreBakken(input: BakkenInput): MethodScorecard {
  const rules = [];
  const inTarget =
    input.workRepCount >= BAKKEN.targetRepCountMin &&
    input.workRepCount <= BAKKEN.targetRepCountMax
      ? 1
      : 0;

  const m: Record<string, number> = {
    bakken_work_rep_count: input.workRepCount,
    bakken_rep_count_in_target: inTarget,
    bakken_reps_over_lthr: input.repsOverLthr,
    bakken_pace_drift_pct: input.paceDriftPct,
    bakken_pace_cv_pct: input.core.paceCvPct,
    bakken_avg_recovery_sec: input.avgRecoverySec,
    bakken_max_consecutive_pace_miss: input.core.maxConsecutivePaceMiss,
    bakken_decoupling_index: input.core.decouplingIndex,
    bakken_even_split_share:
      input.core.repMetrics.filter((r) => r.inEvenSplitBand).length /
      (input.workRepCount || 1),
    bakken_efficiency_delta_pct: input.core.efficiencyDeltaPct,
  };

  const trackShaped =
    input.workRepCount >= BAKKEN.trackRepCountMin &&
    input.workRepCount <= BAKKEN.trackRepCountMax;

  if (trackShaped && !inTarget) {
    rules.push(
      rule(
        "BAKKEN_REP_COUNT_WARN",
        "warn",
        "bakken_rep_count_in_target",
        inTarget,
        1,
        "lt",
      ),
    );
  }

  if (input.repsOverLthr >= BAKKEN.lthrCrossFailCount) {
    rules.push(
      rule(
        "BAKKEN_LTHR_CROSS_FAIL",
        "fail",
        "bakken_reps_over_lthr",
        input.repsOverLthr,
        BAKKEN.lthrCrossFailCount,
        "gte",
      ),
    );
  } else if (input.repsOverLthr >= BAKKEN.lthrCrossBorderlineCount) {
    rules.push(
      rule(
        "BAKKEN_LTHR_CROSS_BORDERLINE",
        "warn",
        "bakken_reps_over_lthr",
        input.repsOverLthr,
        BAKKEN.lthrCrossBorderlineCount,
        "gte",
      ),
    );
  }

  if (input.paceDriftPct > BAKKEN.paceDriftFailPct) {
    rules.push(
      rule(
        "BAKKEN_PACE_DRIFT_FAIL",
        "fail",
        "bakken_pace_drift_pct",
        input.paceDriftPct,
        BAKKEN.paceDriftFailPct,
        "gt",
      ),
    );
  } else if (input.paceDriftPct > BAKKEN.paceDriftBorderlinePct) {
    rules.push(
      rule(
        "BAKKEN_PACE_DRIFT_WARN",
        "warn",
        "bakken_pace_drift_pct",
        input.paceDriftPct,
        BAKKEN.paceDriftBorderlinePct,
        "gt",
      ),
    );
  }

  if (input.core.paceCvPct > BAKKEN.paceCvBorderlinePct && trackShaped) {
    rules.push(
      rule(
        "BAKKEN_PACE_CV_WARN",
        "warn",
        "bakken_pace_cv_pct",
        input.core.paceCvPct,
        BAKKEN.paceCvBorderlinePct,
        "gt",
      ),
    );
  }

  if (input.core.maxConsecutivePaceMiss >= BAKKEN.consecutiveMissStop) {
    rules.push(
      rule(
        "BAKKEN_CONSECUTIVE_MISS_FAIL",
        "fail",
        "bakken_max_consecutive_pace_miss",
        input.core.maxConsecutivePaceMiss,
        BAKKEN.consecutiveMissStop,
        "gte",
      ),
    );
  }

  if (input.core.decouplingIndex > 6 && trackShaped) {
    rules.push(
      rule(
        "BAKKEN_DECOUPLING_WARN",
        "warn",
        "bakken_decoupling_index",
        input.core.decouplingIndex,
        6,
        "gt",
      ),
    );
  }

  m.bakken_method_fit_score = methodFitScore(rules);

  return {
    methodId: "bakken",
    verdict: verdictFromRules(rules),
    metrics: m,
    rules,
  };
}
