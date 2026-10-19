import type { SessionAnalysis } from "@/lib/types";

function FitRing({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const v = Math.round(value);
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden>
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth="8"
        />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
        />
        <text
          x="44"
          y="48"
          textAnchor="middle"
          className="fill-[var(--ink)] text-lg font-semibold"
          style={{ fontSize: "18px" }}
        >
          {v}
        </text>
      </svg>
      <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
    </div>
  );
}

function MetricCell({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="font-mono text-base font-medium text-[var(--ink)]">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] leading-snug text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

export function CoreMetricsPanel({ analysis }: { analysis: SessionAnalysis }) {
  const { core, progress } = analysis;
  return (
    <section className="flex flex-col gap-4" aria-labelledby="core-metrics-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 id="core-metrics-heading" className="text-lg font-semibold text-[var(--ink)]">
          Core metrics
        </h3>
        <p className="max-w-md text-xs text-[var(--muted)]">
          Speed vs effort: pace drift, HR drift, decoupling (pace fade − HR rise), and
          efficiency (speed per bpm). Copeland: sub-LTHR; Bakken: even 400s.
        </p>
      </div>

      <div className="flex flex-wrap gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
        <FitRing label="Copeland fit" value={progress.copelandFit} color="#00205B" />
        <FitRing label="Bakken fit" value={progress.bakkenFit} color="#BA0C2F" />
        <div className="grid min-w-[200px] flex-1 grid-cols-2 gap-2 sm:grid-cols-3">
          <MetricCell
            label="Decoupling"
            value={`${core.decouplingIndex.toFixed(1)}%`}
            hint="Pace drift − HR drift"
          />
          <MetricCell
            label="Sub-LTHR reps"
            value={`${(progress.subThresholdShare * 100).toFixed(0)}%`}
          />
          <MetricCell
            label="Even splits"
            value={`${(progress.evenSplitShare * 100).toFixed(0)}%`}
            hint="Bakken band"
          />
          <MetricCell
            label="Pace CV"
            value={`${core.paceCvPct.toFixed(2)}%`}
          />
          <MetricCell
            label="HR drift"
            value={`${core.hrDriftBpm >= 0 ? "+" : ""}${core.hrDriftBpm.toFixed(0)} bpm`}
          />
          <MetricCell
            label="Efficiency Δ"
            value={`${core.efficiencyDeltaPct >= 0 ? "+" : ""}${core.efficiencyDeltaPct.toFixed(1)}%`}
            hint="Rep 1 → last"
          />
        </div>
      </div>
    </section>
  );
}
