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
  bakkenNote?: string;
};

export type HomeTrack = {
  slug: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  lapMeters: number;
};
