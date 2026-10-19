/** Deterministic copy keyed by rule code — no generative text. */

export const RULE_MESSAGES: Record<string, string> = {
  COPE_LTHR_CROSS_FAIL:
    "Max HR crossed LTHR on 3+ reps — above Copeland sub-threshold.",
  COPE_LTHR_CROSS_WARN:
    "Too many reps touched LTHR — guardrail, not target.",
  COPE_LTHR_CROSS_BORDERLINE: "At least one rep touched LTHR ceiling.",
  COPE_PACE_DRIFT_FAIL: "Pace fade >12% rep 1→last — not a repeatable single.",
  COPE_PACE_DRIFT_WARN: "Pace fade >6% — creeping off sub-threshold pace.",
  COPE_PACE_DRIFT_FLAG:
    "Pace fade >8% with high volume — hold effort, not grind.",
  COPE_RECOVERY_SHORT:
    "Avg recovery ≤35s — Copeland: don’t shorten rest to progress.",
  COPE_RECOVERY_HOT:
    "Recoveries stayed hot — sub-threshold should repeat tomorrow.",
  COPE_EARLY_CONSERVATIVE:
    "Rep 1 HR very low vs LTHR — check you’re not under-shooting.",
  COPE_DECOUPLING_WARN:
    "Speed faded faster than HR rise explains — intra-session aerobic decoupling.",
  BAKKEN_LTHR_CROSS_FAIL:
    "3+ reps at/above LTHR — above Bakken ~3 mmol/L threshold intent.",
  BAKKEN_LTHR_CROSS_BORDERLINE: "Rep touched LTHR on threshold 400s.",
  BAKKEN_PACE_DRIFT_FAIL: "Late fade >12% — lactate likely ran high.",
  BAKKEN_PACE_DRIFT_WARN: "Fade >6% — tighten even splits.",
  BAKKEN_PACE_CV_WARN: "Pace CV >4% — Bakken wants even 400s.",
  BAKKEN_CONSECUTIVE_MISS_FAIL:
    "Two consecutive reps outside split band — stop rule.",
  BAKKEN_REP_COUNT_WARN: "Rep count outside 20–25 classic Bakken block.",
  BAKKEN_DECOUPLING_WARN:
    "Speed faded faster than HR explains — aerobic decoupling.",
};

export function flagsFromRules(codes: string[]): string[] {
  return codes
    .map((c) => RULE_MESSAGES[c])
    .filter((m): m is string => Boolean(m));
}
