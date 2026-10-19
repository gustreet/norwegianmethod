import type { Lap } from "../../types";

type LapSpec = {
  meters: number;
  seconds: number;
  avgHr: number;
  maxHr: number;
};

function lap(n: number, spec: LapSpec): Lap {
  return {
    n,
    meters: spec.meters,
    seconds: spec.seconds,
    avgHr: spec.avgHr,
    maxHr: spec.maxHr,
    endHr: spec.avgHr,
    cadence: null,
    watts: null,
  };
}

/** Alternating 400 m work + short recovery. */
export function buildTrackSession(opts: {
  workReps: number;
  workSeconds: number;
  recoverySeconds: number;
  workAvgHr: number;
  workMaxHr: number;
  recoveryAvgHr?: number;
  /** Add seconds to each work rep vs rep 1 (linear drift). */
  workSecondsDriftPerRep?: number;
}): Lap[] {
  const laps: Lap[] = [];
  let n = 1;
  const drift = opts.workSecondsDriftPerRep ?? 0;
  for (let i = 0; i < opts.workReps; i++) {
    if (i > 0) {
      laps.push(
        lap(n++, {
          meters: 90,
          seconds: opts.recoverySeconds,
          avgHr: opts.recoveryAvgHr ?? 140,
          maxHr: (opts.recoveryAvgHr ?? 140) + 5,
        }),
      );
    }
    laps.push(
      lap(n++, {
        meters: 400,
        seconds: opts.workSeconds + drift * i,
        avgHr: opts.workAvgHr,
        maxHr: opts.workMaxHr,
      }),
    );
  }
  return laps;
}

/** Perfect Bakken-shaped 20 × 400 @ 30 s, sub-LTHR. */
export function perfectBakken20(): Lap[] {
  const laps = buildTrackSession({
    workReps: 20,
    workSeconds: 108,
    recoverySeconds: 30,
    workAvgHr: 165,
    workMaxHr: 171,
    recoveryAvgHr: 130,
  });
  const work = laps.filter((l) => l.meters >= 350);
  const last = work[work.length - 1];
  const peak = 171;
  last.avgHr = Math.round(peak * 0.92);
  last.maxHr = peak;
  return laps;
}

/** Copeland on-method: moderate drift, no LTHR crossings. */
export function copelandClean8(): Lap[] {
  return buildTrackSession({
    workReps: 8,
    workSeconds: 300,
    recoverySeconds: 90,
    workAvgHr: 158,
    workMaxHr: 168,
    recoveryAvgHr: 120,
    workSecondsDriftPerRep: 0.5,
  });
}
