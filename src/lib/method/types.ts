import type { ClassifiedLap, SessionVerdict, WorkRep } from "../types";
import type { SessionCoreMetrics } from "./core-metrics";

export type RuleSeverity = "pass" | "warn" | "fail";

export type RuleOp = "gt" | "gte" | "lt" | "lte" | "eq";

export type RuleResult = {
  code: string;
  severity: RuleSeverity;
  metricId: string;
  actual: number;
  limit: number;
  op: RuleOp;
};

export type MethodId = "copeland" | "bakken";

export type MethodScorecard = {
  methodId: MethodId;
  verdict: SessionVerdict;
  metrics: Record<string, number>;
  rules: RuleResult[];
};

export type PreparedSession = {
  workReps: WorkRep[];
  recoveryLaps: ClassifiedLap[];
  qualityMinutes: number;
  avgWorkPace: number;
  firstWorkPace: number;
  lastWorkPace: number;
  paceDriftPct: number;
  avgWorkHr: number;
  firstWorkHr: number;
  lastWorkHr: number;
  repsOverLthr: number;
  repsInEarlyWindow: number;
  avgRecoverySec: number;
  recoveryHotCount: number;
  recoveryHotShare: number;
};

export type SessionEvaluation = {
  prepared: PreparedSession;
  core: SessionCoreMetrics;
  copeland: MethodScorecard;
  bakken: MethodScorecard;
  verdict: SessionVerdict;
  flags: string[];
};
