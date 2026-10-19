import { describe, expect, it } from "vitest";
import { evaluateSession } from "../evaluate";
import { BAKKEN } from "../thresholds";
import { buildTrackSession, perfectBakken20 } from "./fixtures";

const LTHR = 172;

describe("Bakken — deterministic rules", () => {
  it("passes 20×400 even splits with 30 s rest", () => {
    const ev = evaluateSession(perfectBakken20(), LTHR);
    expect(ev.bakken.verdict).toBe("on-method");
    expect(ev.bakken.metrics.bakken_work_rep_count).toBe(20);
    expect(ev.bakken.metrics.bakken_rep_count_in_target).toBe(1);
    expect(ev.bakken.metrics.bakken_avg_recovery_sec).toBe(30);
    expect(ev.bakken.metrics.bakken_max_consecutive_pace_miss).toBe(0);
  });

  it("triggers stop rule after 2 consecutive pace misses", () => {
    const laps = buildTrackSession({
      workReps: 16,
      workSeconds: 108,
      recoverySeconds: 30,
      workAvgHr: 165,
      workMaxHr: 170,
      workSecondsDriftPerRep: 0,
    });
    // Manually blow up reps 14–16 pace (after lap builder, patch last 3 work laps)
    const workIndices = laps
      .map((l, i) => (l.meters >= 350 ? i : -1))
      .filter((i) => i >= 0);
    laps[workIndices[13]].seconds = 120;
    laps[workIndices[14]].seconds = 121;
    const ev = evaluateSession(laps, LTHR);
    expect(ev.bakken.metrics.bakken_max_consecutive_pace_miss).toBeGreaterThanOrEqual(
      BAKKEN.consecutiveMissStop,
    );
    expect(
      ev.bakken.rules.some((r) => r.code === "BAKKEN_CONSECUTIVE_MISS_FAIL"),
    ).toBe(true);
    expect(ev.bakken.verdict).toBe("too-hard");
  });

  it("warns when rep count outside 20–25 for track shape", () => {
    const ev = evaluateSession(
      buildTrackSession({
        workReps: 16,
        workSeconds: 108,
        recoverySeconds: 30,
        workAvgHr: 165,
        workMaxHr: 170,
      }),
      LTHR,
    );
    expect(ev.bakken.metrics.bakken_rep_count_in_target).toBe(0);
    expect(
      ev.bakken.rules.some((r) => r.code === "BAKKEN_REP_COUNT_WARN"),
    ).toBe(true);
  });

  it("fails heavy LTHR crossings on threshold 400s", () => {
    const laps = buildTrackSession({
      workReps: 20,
      workSeconds: 105,
      recoverySeconds: 30,
      workAvgHr: 171,
      workMaxHr: 178,
      recoveryAvgHr: 155,
    });
    const ev = evaluateSession(laps, LTHR);
    expect(ev.bakken.verdict).toBe("too-hard");
    expect(
      ev.bakken.rules.some((r) => r.code === "BAKKEN_LTHR_CROSS_FAIL"),
    ).toBe(true);
  });
});
