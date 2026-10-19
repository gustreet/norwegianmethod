import { describe, expect, it } from "vitest";
import { evaluateSession } from "../evaluate";
import { COPELAND } from "../thresholds";
import { buildTrackSession, copelandClean8 } from "./fixtures";

const LTHR = 172;

describe("Copeland — deterministic rules", () => {
  it("passes clean sub-threshold long reps", () => {
    const ev = evaluateSession(copelandClean8(), LTHR);
    expect(ev.copeland.verdict).toBe("on-method");
    expect(ev.prepared.repsOverLthr).toBe(0);
    expect(ev.copeland.metrics.copeland_pace_drift_pct).toBeLessThan(
      COPELAND.paceDriftBorderlinePct,
    );
    const fail = ev.copeland.rules.filter((r) => r.severity === "fail");
    expect(fail).toHaveLength(0);
  });

  it("fails when ≥3 reps cross LTHR max", () => {
    const laps = buildTrackSession({
      workReps: 10,
      workSeconds: 108,
      recoverySeconds: 60,
      workAvgHr: 170,
      workMaxHr: 175,
      recoveryAvgHr: 150,
    });
    const ev = evaluateSession(laps, LTHR);
    expect(ev.prepared.repsOverLthr).toBeGreaterThanOrEqual(
      COPELAND.lthrCrossFailCount,
    );
    expect(ev.copeland.verdict).toBe("too-hard");
    expect(
      ev.copeland.rules.some((r) => r.code === "COPE_LTHR_CROSS_FAIL"),
    ).toBe(true);
  });

  it("borderline on single LTHR crossing", () => {
    const laps = buildTrackSession({
      workReps: 6,
      workSeconds: 200,
      recoverySeconds: 75,
      workAvgHr: 168,
      workMaxHr: 170,
      recoveryAvgHr: 130,
    });
    const work = laps.filter((l) => l.meters >= 350);
    work[2].maxHr = 173;
    const ev = evaluateSession(laps, LTHR);
    expect(ev.prepared.repsOverLthr).toBe(1);
    expect(ev.copeland.verdict).toBe("borderline");
  });

  it("flags short recoveries ≤35 s average", () => {
    const laps = buildTrackSession({
      workReps: 12,
      workSeconds: 108,
      recoverySeconds: 30,
      workAvgHr: 165,
      workMaxHr: 170,
      recoveryAvgHr: 125,
    });
    const ev = evaluateSession(laps, LTHR);
    expect(ev.prepared.avgRecoverySec).toBeLessThanOrEqual(
      COPELAND.recoveryShortSec,
    );
    expect(
      ev.copeland.rules.some((r) => r.code === "COPE_RECOVERY_SHORT"),
    ).toBe(true);
  });

  it("pace drift fail above 12%", () => {
    const laps = buildTrackSession({
      workReps: 12,
      workSeconds: 100,
      recoverySeconds: 60,
      workAvgHr: 160,
      workMaxHr: 168,
      workSecondsDriftPerRep: 1.35,
    });
    const ev = evaluateSession(laps, LTHR);
    expect(ev.copeland.metrics.copeland_pace_drift_pct).toBeGreaterThan(
      COPELAND.paceDriftFailPct,
    );
    expect(ev.copeland.verdict).toBe("too-hard");
    expect(
      ev.copeland.rules.some((r) => r.code === "COPE_PACE_DRIFT_FAIL"),
    ).toBe(true);
  });
});
