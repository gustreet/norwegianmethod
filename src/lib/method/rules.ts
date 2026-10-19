import type { RuleOp, RuleResult, RuleSeverity } from "./types";

export function rule(
  code: string,
  severity: RuleSeverity,
  metricId: string,
  actual: number,
  limit: number,
  op: RuleOp,
): RuleResult {
  return { code, severity, metricId, actual, limit, op };
}

export function verdictFromRules(
  rules: RuleResult[],
): "on-method" | "borderline" | "too-hard" {
  if (rules.some((r) => r.severity === "fail")) return "too-hard";
  if (rules.some((r) => r.severity === "warn")) return "borderline";
  return "on-method";
}

export function methodFitScore(rules: RuleResult[]): number {
  let score = 100;
  for (const r of rules) {
    if (r.severity === "warn") score -= 10;
    if (r.severity === "fail") score -= 25;
  }
  return Math.max(0, Math.min(100, score));
}
