export type Lap = {
  n: number;
  seconds: number;
  meters: number;
  avgHr: number;
  maxHr: number;
  endHr: number | null;
  cadence: number | null;
  watts: number | null;
};

export type TrackPoint = {
  lat: number;
  lng: number;
  time: string;
  hr: number | null;
  speedMps: number | null;
};

export type RepKind = "work" | "recovery" | "other";

export type ClassifiedLap = Lap & {
  kind: RepKind;
  paceMinPerKm: number | null;
};

export type WorkRep = {
  index: number;
  lapNumber: number;
  seconds: number;
  paceMinPerKm: number;
  avgHr: number;
  maxHr: number;
  endHr: number | null;
  watts: number | null;
  cadence: number | null;
  recoverySecondsBefore: number | null;
  recoveryAvgHrBefore: number | null;
};

export type SessionVerdict = "on-method" | "borderline" | "too-hard";

export type RepCoreMetrics = {
  index: number;
  lapNumber: number;
  paceMinKm: number;
  speedMps: number;
  avgHr: number;
  maxHr: number;
  efficiency: number;
  intensityPctLthr: number;
  paceVsRep1Pct: number;
  hrVsRep1Pct: number;
  decouplingRep: number;
  lthrHeadroomBpm: number;
  inEvenSplitBand: boolean;
  paceMiss: boolean;
};

export type SessionCoreMetrics = {
  paceDriftPct: number;
  hrDriftBpm: number;
  hrDriftPct: number;
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

export type RuleResult = {
  code: string;
  severity: "pass" | "warn" | "fail";
  metricId: string;
  actual: number;
  limit: number;
  op: "gt" | "gte" | "lt" | "lte" | "eq";
};

export type MethodScorecard = {
  methodId: "copeland" | "bakken";
  verdict: SessionVerdict;
  metrics: Record<string, number>;
  rules: RuleResult[];
};

export type SessionProgress = {
  copelandFit: number;
  bakkenFit: number;
  subThresholdShare: number;
  decouplingIndex: number;
  evenSplitShare: number;
};

export type SessionAnalysis = {
  title: string;
  startedAt: string | null;
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
  verdict: SessionVerdict;
  verdictHeadline: string;
  verdictDetail: string;
  flags: string[];
  garminContrast: string[];
  core: SessionCoreMetrics;
  copeland: MethodScorecard;
  bakken: MethodScorecard;
  progress: SessionProgress;
};

export type HomeTrack = {
  slug: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  lapMeters: number;
};
