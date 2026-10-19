import { describe, expect, it } from "vitest";
import { evaluateSession } from "../evaluate";
import { buildTrackSession } from "./fixtures";

const LTHR = 172;

describe("Finish rep baseline (90–95% all-out HR)", () => {
  it("excludes last rep from LTHR crossing count when only finish is hot", () => {
    const laps = buildTrackSession({
      workReps: 8,
      workSeconds: 108,
      recoverySeconds: 30,
      workAvgHr: 165,
      workMaxHr: 168,
      recoveryAvgHr: 130,
    });
    const work = laps.filter((l) => l.meters >= 350);
    work[work.length - 1].maxHr = 178;
    work[work.length - 1].avgHr = 175;
    const ev = evaluateSession(laps, LTHR);
    expect(ev.prepared.repsOverLthr).toBe(0);
  });

  it("drift uses penultimate rep, not finish kick pace", () => {
    const laps = buildTrackSession({
      workReps: 10,
      workSeconds: 108,
      recoverySeconds: 30,
      workAvgHr: 165,
      workMaxHr: 168,
      workSecondsDriftPerRep: 0.3,
    });
    const work = laps.filter((l) => l.meters >= 350);
    work[work.length - 1].seconds = 95;
    const ev = evaluateSession(laps, LTHR);
    expect(ev.core.finishRepIndex).toBe(10);
    expect(ev.core.paceDriftPct).toBeGreaterThan(0);
    expect(ev.core.paceDriftPct).toBeLessThan(5);
  });

  it("warns when finish is softer than 90% peak HR", () => {
    const laps = buildTrackSession({
      workReps: 8,
      workSeconds: 108,
      recoverySeconds: 30,
      workAvgHr: 165,
      workMaxHr: 180,
      recoveryAvgHr: 130,
    });
    const work = laps.filter((l) => l.meters >= 350);
    work[work.length - 1].avgHr = 140;
    work[work.length - 1].maxHr = 175;
    const ev = evaluateSession(laps, LTHR);
    expect(
      ev.bakken.rules.some((r) => r.code === "BAKKEN_FINISH_SOFT"),
    ).toBe(true);
  });

  it("does not trigger consecutive miss on finish rep alone", () => {
    const laps = buildTrackSession({
      workReps: 6,
      workSeconds: 108,
      recoverySeconds: 30,
      workAvgHr: 165,
      workMaxHr: 168,
    });
    const work = laps.filter((l) => l.meters >= 350);
    work[work.length - 1].seconds = 125;
    const ev = evaluateSession(laps, LTHR);
    expect(
      ev.bakken.rules.some((r) => r.code === "BAKKEN_CONSECUTIVE_MISS_FAIL"),
    ).toBe(false);
  });
});
