import type { SessionAnalysis, SessionVerdict } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { FitBar } from "./fit-bar";

const verdictUi: Record<
  SessionVerdict,
  { badge: string; label: string }
> = {
  "on-method": {
    badge: "bg-navy/10 text-navy",
    label: "On method",
  },
  borderline: {
    badge: "bg-amber-100 text-amber-950",
    label: "Borderline",
  },
  "too-hard": {
    badge: "bg-red/10 text-red",
    label: "Too hard",
  },
};

type Props = {
  analysis: SessionAnalysis;
  lthr: number;
};

export function SessionSummary({ analysis, lthr }: Props) {
  const v = analysis.verdict;
  const ui = verdictUi[v];
  const { core, progress } = analysis;

  return (
    <section
      className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 sm:p-6"
      aria-labelledby="session-summary-title"
    >
      <header>
        <p className="text-sm text-muted">{formatDate(analysis.startedAt)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${ui.badge}`}>
            {ui.label}
          </span>
          <span className="font-mono text-xs text-muted">
            {analysis.workReps.length} reps · {analysis.qualityMinutes.toFixed(0)} min
          </span>
        </div>
        <h2
          id="session-summary-title"
          className="mt-3 text-lg font-semibold text-balance text-ink sm:text-xl"
        >
          {analysis.verdictHeadline}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-pretty text-muted">
          {analysis.verdictDetail}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <FitBar label="Copeland fit" value={progress.copelandFit} tone="navy" />
        <FitBar label="Bakken fit" value={progress.bakkenFit} tone="red" />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-sm sm:grid-cols-3">
        <Metric label="Decoupling" value={`${core.decouplingIndex.toFixed(1)}%`} />
        <Metric label="Pace drift" value={`${analysis.paceDriftPct >= 0 ? "+" : ""}${analysis.paceDriftPct.toFixed(1)}%`} />
        <Metric label="Sub-LTHR" value={`${(progress.subThresholdShare * 100).toFixed(0)}%`} />
        <Metric label="Pace CV" value={`${core.paceCvPct.toFixed(2)}%`} />
        <Metric label="HR drift" value={`${core.hrDriftBpm >= 0 ? "+" : ""}${core.hrDriftBpm.toFixed(0)} bpm`} />
        <Metric
          label="Finish"
          value={
            core.finish.present
              ? `${core.finish.avgHrPctOfPeak.toFixed(0)}% peak`
              : "—"
          }
          hint={core.finish.present ? "target 90–95" : undefined}
        />
      </dl>

      <p className="text-xs text-muted">
        LTHR ceiling <span className="font-mono font-medium text-ink">{lthr}</span> bpm ·
        controlled reps scored for method; last rep is finish only.
      </p>

      {analysis.flags.length > 0 ? (
        <details className="rounded-xl border border-line">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink">
            Rule flags
            <span className="ml-2 font-mono text-xs font-normal text-muted">
              ({analysis.flags.length})
            </span>
          </summary>
          <ul className="divide-y divide-line border-t border-line px-4 text-sm leading-snug text-ink">
            {analysis.flags.map((f) => (
              <li key={f} className="py-2.5">
                {f}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-mono text-base font-semibold tabular-nums text-ink">
        {value}
      </dd>
      {hint ? <p className="text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}
