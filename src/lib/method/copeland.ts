import type { FinishRepAnalysis } from "./baseline";
import { controlledRepCount } from "./baseline";
import type { SessionCoreMetrics } from "./core-metrics";
import { methodFitScore, rule, verdictFromRules } from "./rules";
import { BASELINE, COPELAND } from "./thresholds";
import type { MethodScorecard } from "./types";

type CopelandInput = {
  workRepCount: number;
  repsOverLthr: number;
  paceDriftPct: number;
  avgRecoverySec: number;
  recoveryHotShare: number;
  firstWorkHr: number;
  lthr: number;
  core: SessionCoreMetrics;
  finish: FinishRepAnalysis;
};

export function scoreCopeland(input: CopelandInput): MethodScorecard {
  const rules = [];
  const controlled = controlledRepCount(input.workRepCount);

  const m: Record<string, number> = {
    copeland_work_rep_count: input.workRepCount,
    copeland_controlled_rep_count: controlled,
    copeland_reps_over_lthr: input.repsOverLthr,
    copeland_pace_drift_pct: input.paceDriftPct,
    copeland_hr_drift_bpm: input.core.hrDriftBpm,
    copeland_decoupling_index: input.core.decouplingIndex,
    copeland_sub_threshold_share: input.core.subThresholdRepShare,
    copeland_avg_recovery_sec: input.avgRecoverySec,
    copeland_efficiency_delta_pct: input.core.efficiencyDeltaPct,
    copeland_avg_intensity_pct_lthr: input.core.avgIntensityPctLthr,
    copeland_finish_hr_pct_peak: input.finish.avgHrPctOfPeak,
    copeland_finish_in_band: input.finish.inAllOutBand ? 1 : 0,
  };

  if (input.repsOverLthr >= COPELAND.lthrCrossFailCount) {
    rules.push(
      rule(
        "COPE_LTHR_CROSS_FAIL",
        "fail",
        "copeland_reps_over_lthr",
        input.repsOverLthr,
        COPELAND.lthrCrossFailCount,
        "gte",
      ),
    );
  } else if (
    controlled > 0 &&
    input.repsOverLthr / controlled >= COPELAND.lthrCrossWarnShare
  ) {
    rules.push(
      rule(
        "COPE_LTHR_CROSS_WARN",
        "warn",
        "copeland_reps_over_lthr",
        input.repsOverLthr,
        Math.ceil(controlled * COPELAND.lthrCrossWarnShare),
        "gte",
      ),
    );
  } else if (input.repsOverLthr >= COPELAND.lthrCrossBorderlineCount) {
    rules.push(
      rule(
        "COPE_LTHR_CROSS_BORDERLINE",
        "warn",
        "copeland_reps_over_lthr",
        input.repsOverLthr,
        COPELAND.lthrCrossBorderlineCount,
        "gte",
      ),
    );
  }

  if (input.paceDriftPct > COPELAND.paceDriftFailPct) {
    rules.push(
      rule(
        "COPE_PACE_DRIFT_FAIL",
        "fail",
        "copeland_pace_drift_pct",
        input.paceDriftPct,
        COPELAND.paceDriftFailPct,
        "gt",
      ),
    );
  } else if (input.paceDriftPct > COPELAND.paceDriftBorderlinePct) {
    rules.push(
      rule(
        "COPE_PACE_DRIFT_WARN",
        "warn",
        "copeland_pace_drift_pct",
        input.paceDriftPct,
        COPELAND.paceDriftBorderlinePct,
        "gt",
      ),
    );
  } else if (
    controlled >= COPELAND.paceDriftFlagMinReps &&
    input.paceDriftPct > COPELAND.paceDriftFlagPct
  ) {
    rules.push(
      rule(
        "COPE_PACE_DRIFT_FLAG",
        "warn",
        "copeland_pace_drift_pct",
        input.paceDriftPct,
        COPELAND.paceDriftFlagPct,
        "gt",
      ),
    );
  }

  if (
    input.avgRecoverySec > 0 &&
    input.avgRecoverySec <= COPELAND.recoveryShortSec
  ) {
    rules.push(
      rule(
        "COPE_RECOVERY_SHORT",
        "warn",
        "copeland_avg_recovery_sec",
        input.avgRecoverySec,
        COPELAND.recoveryShortSec,
        "lte",
      ),
    );
  }

  if (input.recoveryHotShare >= COPELAND.recoveryHotShare) {
    rules.push(
      rule(
        "COPE_RECOVERY_HOT",
        "warn",
        "copeland_recovery_hot_share",
        input.recoveryHotShare,
        COPELAND.recoveryHotShare,
        "gte",
      ),
    );
  }

  if (
    input.firstWorkHr > 0 &&
    input.firstWorkHr < input.lthr - COPELAND.earlyConservativeBelowLthr &&
    input.workRepCount >= COPELAND.earlyConservativeMinReps
  ) {
    rules.push(
      rule(
        "COPE_EARLY_CONSERVATIVE",
        "warn",
        "copeland_first_work_hr",
        input.firstWorkHr,
        input.lthr - COPELAND.earlyConservativeBelowLthr,
        "lt",
      ),
    );
  }

  if (input.core.decouplingIndex > 5) {
    rules.push(
      rule(
        "COPE_DECOUPLING_WARN",
        "warn",
        "copeland_decoupling_index",
        input.core.decouplingIndex,
        5,
        "gt",
      ),
    );
  }

  if (input.finish.present && input.workRepCount >= 4) {
    const low = BASELINE.finishRepAllOutHrLow * 100;
    const high = BASELINE.finishRepAllOutHrHigh * 100;
    if (input.finish.tooSoft) {
      rules.push(
        rule(
          "COPE_FINISH_SOFT",
          "warn",
          "copeland_finish_hr_pct_peak",
          input.finish.avgHrPctOfPeak,
          low,
          "lt",
        ),
      );
    } else if (input.finish.tooHot) {
      rules.push(
        rule(
          "COPE_FINISH_HOT",
          "warn",
          "copeland_finish_hr_pct_peak",
          input.finish.avgHrPctOfPeak,
          high,
          "gt",
        ),
      );
    }
  }

  m.copeland_method_fit_score = methodFitScore(rules);

  return {
    methodId: "copeland",
    verdict: verdictFromRules(rules),
    metrics: m,
    rules,
  };
}
