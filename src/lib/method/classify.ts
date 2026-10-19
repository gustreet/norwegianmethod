import type { ClassifiedLap, Lap } from "../types";
import { LAP_CLASS } from "./thresholds";

export function computePaceMinPerKm(seconds: number, meters: number): number | null {
  if (meters < 50) return null;
  return (seconds / 60) / (meters / 1000);
}

export function classifyLap(lap: Lap): ClassifiedLap {
  const paceMinPerKm = computePaceMinPerKm(lap.seconds, lap.meters);
  let kind: ClassifiedLap["kind"] = "other";
  if (lap.meters >= LAP_CLASS.workMetersMin) kind = "work";
  else if (
    lap.meters >= LAP_CLASS.workMetersAltMin &&
    lap.seconds >= LAP_CLASS.workSecondsAltMin
  )
    kind = "work";
  else if (
    lap.meters < LAP_CLASS.recoveryMetersMax &&
    lap.seconds <= LAP_CLASS.recoverySecondsMax
  )
    kind = "recovery";
  return { ...lap, kind, paceMinPerKm };
}

export function classifyLaps(laps: Lap[]): ClassifiedLap[] {
  return laps.map(classifyLap);
}
