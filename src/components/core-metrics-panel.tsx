import type { SessionAnalysis } from "@/lib/types";
import { FitBar } from "./fit-bar";

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
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5 shadow-sm">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 font-mono text-base font-semibold text-ink">{value}</p>
      {hint ? (
        <p className="mt-1 text-[11px] leading-snug text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function CoreMetricsPanel({ analysis }: { analysis: SessionAnalysis }) {
  const { core, progress } = analysis;
  return (
    <section
      className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
      aria-labelledby="core-metrics-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="core-metrics-heading" className="text-base font-semibold text-ink">
            Core metrics
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Speed vs effort — drift, decoupling, and efficiency from your laps (rule-based, not Garmin).
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:max-w-xs">
          <FitBar label="Copeland fit" value={progress.copelandFit} tone="navy" />
          <FitBar label="Bakken fit" value={progress.bakkenFit} tone="red" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCell
          label="Decoupling"
          value={`${core.decouplingIndex.toFixed(1)}%`}
          hint="Pace drift − HR drift"
        />
        <MetricCell
          label="Sub-LTHR"
          value={`${(progress.subThresholdShare * 100).toFixed(0)}%`}
          hint="Reps under ceiling"
        />
        <MetricCell
          label="Even splits"
          value={`${(progress.evenSplitShare * 100).toFixed(0)}%`}
          hint="Bakken band"
        />
        <MetricCell label="Pace CV" value={`${core.paceCvPct.toFixed(2)}%`} />
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
    </section>
  );
}
