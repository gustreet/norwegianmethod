import type { FinishRepAnalysis } from "./baseline";
import { controlledRepCount } from "./baseline";
import type { SessionCoreMetrics } from "./core-metrics";
import { methodFitScore, rule, verdictFromRules } from "./rules";
import { BASELINE, BAKKEN } from "./thresholds";
import type { MethodScorecard } from "./types";

type BakkenInput = {
  workRepCount: number;
  repsOverLthr: number;
  paceDriftPct: number;
  avgRecoverySec: number;
  core: SessionCoreMetrics;
  finish: FinishRepAnalysis;
};

export function scoreBakken(input: BakkenInput): MethodScorecard {
  const rules = [];
  const controlled = controlledRepCount(input.workRepCount);
  const controlledMetrics = input.core.repMetrics.filter(
    (m) => m.role === "controlled",
  );
  const evenInBand = controlledMetrics.filter((m) => m.inEvenSplitBand).length;

  const inTarget =
    input.workRepCount >= BAKKEN.targetRepCountMin &&
    input.workRepCount <= BAKKEN.targetRepCountMax
      ? 1
      : 0;

  const m: Record<string, number> = {
    bakken_work_rep_count: input.workRepCount,
    bakken_controlled_rep_count: controlled,
    bakken_rep_count_in_target: inTarget,
    bakken_reps_over_lthr: input.repsOverLthr,
    bakken_pace_drift_pct: input.paceDriftPct,
    bakken_pace_cv_pct: input.core.paceCvPct,
    bakken_avg_recovery_sec: input.avgRecoverySec,
    bakken_max_consecutive_pace_miss: input.core.maxConsecutivePaceMiss,
    bakken_decoupling_index: input.core.decouplingIndex,
    bakken_even_split_share:
      controlledMetrics.length > 0 ? evenInBand / controlledMetrics.length : 0,
    bakken_efficiency_delta_pct: input.core.efficiencyDeltaPct,
    bakken_finish_hr_pct_peak: input.finish.avgHrPctOfPeak,
    bakken_finish_in_band: input.finish.inAllOutBand ? 1 : 0,
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

  if (input.finish.present && trackShaped) {
    const low = BASELINE.finishRepAllOutHrLow * 100;
    const high = BASELINE.finishRepAllOutHrHigh * 100;
    if (input.finish.tooSoft) {
      rules.push(
        rule(
          "BAKKEN_FINISH_SOFT",
          "warn",
          "bakken_finish_hr_pct_peak",
          input.finish.avgHrPctOfPeak,
          low,
          "lt",
        ),
      );
    } else if (input.finish.tooHot) {
      rules.push(
        rule(
          "BAKKEN_FINISH_HOT",
          "fail",
          "bakken_finish_hr_pct_peak",
          input.finish.avgHrPctOfPeak,
          high,
          "gt",
        ),
      );
    }
  }

  m.bakken_method_fit_score = methodFitScore(rules);

  return {
    methodId: "bakken",
    verdict: verdictFromRules(rules),
    metrics: m,
    rules,
  };
}
