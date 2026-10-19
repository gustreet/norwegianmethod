import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseTcx } from "../../tcx";
import { evaluateSession } from "../evaluate";

const LTHR = 172;

/** Golden metrics at LTHR=172 — update only when thresholds or parser change intentionally. */
const GOLDEN: Record<
  string,
  {
    workReps: number;
    repsOverLthr: number;
    paceDriftPct: number;
    decouplingIndex: number;
    copeland: "on-method" | "borderline" | "too-hard";
    bakken: "on-method" | "borderline" | "too-hard";
    copelandFit: number;
    bakkenFit: number;
  }
> = {
  "sha-tin.tcx": {
    workReps: 20,
    repsOverLthr: 6,
    paceDriftPct: 16.15,
    decouplingIndex: -5.59,
    copeland: "too-hard",
    bakken: "too-hard",
    copelandFit: 30,
    bakkenFit: 15,
  },
  "kai-tak.tcx": {
    workReps: 16,
    repsOverLthr: 13,
    paceDriftPct: -11.65,
    decouplingIndex: -42.47,
    copeland: "too-hard",
    bakken: "too-hard",
    copelandFit: 45,
    bakkenFit: 30,
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
      expect(ev.copeland.verdict).toBe(expected.copeland);
      expect(ev.bakken.verdict).toBe(expected.bakken);
      expect(ev.copeland.metrics.copeland_method_fit_score).toBe(
        expected.copelandFit,
      );
      expect(ev.bakken.metrics.bakken_method_fit_score).toBe(expected.bakkenFit);
    });
  }
});
