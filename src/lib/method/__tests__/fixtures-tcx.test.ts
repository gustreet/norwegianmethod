import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseTcx } from "../../tcx";
import { evaluateSession } from "../evaluate";

const LTHR = 172;

/** Golden metrics at LTHR=172 — controlled reps + finish 90–95% rules. */
const GOLDEN: Record<
  string,
  {
    workReps: number;
    repsOverLthr: number;
    paceDriftPct: number;
    decouplingIndex: number;
    finishPctPeak: number;
    copeland: "on-method" | "borderline" | "too-hard";
    bakken: "on-method" | "borderline" | "too-hard";
    copelandFit: number;
    bakkenFit: number;
  }
> = {
  "sha-tin.tcx": {
    workReps: 20,
    repsOverLthr: 5,
    paceDriftPct: 21.52,
    decouplingIndex: -0.22,
    finishPctPeak: 96,
    copeland: "too-hard",
    bakken: "too-hard",
    copelandFit: 20,
    bakkenFit: 0,
  },
  "kai-tak.tcx": {
    workReps: 16,
    repsOverLthr: 12,
    paceDriftPct: 3.33,
    decouplingIndex: -21.33,
    finishPctPeak: 97,
    copeland: "too-hard",
    bakken: "too-hard",
    copelandFit: 35,
    bakkenFit: 15,
  },
};

describe("Sample TCX golden metrics", () => {
  for (const [file, expected] of Object.entries(GOLDEN)) {
    it(file, () => {
      const xml = readFileSync(
        join(process.cwd(), "public/samples", file),
        "utf8",
      );
      const { laps } = parseTcx(xml);
      const ev = evaluateSession(laps, LTHR);
      expect(ev.prepared.workReps.length).toBe(expected.workReps);
      expect(ev.prepared.repsOverLthr).toBe(expected.repsOverLthr);
      expect(ev.prepared.paceDriftPct).toBeCloseTo(expected.paceDriftPct, 1);
      expect(ev.core.decouplingIndex).toBeCloseTo(expected.decouplingIndex, 1);
      expect(ev.core.finish.avgHrPctOfPeak).toBeCloseTo(
        expected.finishPctPeak,
        0,
      );
      expect(ev.copeland.verdict).toBe(expected.copeland);
      expect(ev.bakken.verdict).toBe(expected.bakken);
      expect(ev.copeland.metrics.copeland_method_fit_score).toBe(
        expected.copelandFit,
      );
      expect(ev.bakken.metrics.bakken_method_fit_score).toBe(expected.bakkenFit);
    });
  }
});
