import type { SessionAnalysis, SessionVerdict } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { FitBar } from "./fit-bar";

const bandAccent: Record<SessionVerdict, string> = {
  "on-method": "border-t-navy",
  borderline: "border-t-amber-400",
  "too-hard": "border-t-red",
};

const badge: Record<SessionVerdict, string> = {
  "on-method": "bg-white/15 text-white",
  borderline: "bg-amber-400/25 text-white",
  "too-hard": "bg-red/30 text-white",
};

const labels: Record<SessionVerdict, string> = {
  "on-method": "On method",
  borderline: "Borderline",
  "too-hard": "Too hard",
};

type Props = {
  analysis: SessionAnalysis;
  flagsOpen: boolean;
  onToggleFlags: () => void;
};

export function VerdictBand({ analysis, flagsOpen, onToggleFlags }: Props) {
  const v = analysis.verdict;
  const visible = flagsOpen ? analysis.flags : analysis.flags.slice(0, 3);

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border-t-4 bg-navy text-white shadow-md ${bandAccent[v]}`}
      aria-labelledby="verdict-headline"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        aria-hidden
        style={{
          backgroundImage:
            "repeating-linear-gradient(-14deg, transparent, transparent 10px, #fff 10px, #fff 11px)",
        }}
      />
      <div className="relative px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-sm text-white/70">{formatDate(analysis.startedAt)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${badge[v]}`}>
                {labels[v]}
              </span>
              <span className="font-mono text-xs text-white/70">
                {analysis.workReps.length} reps · {analysis.qualityMinutes.toFixed(0)} min work
              </span>
            </div>
            <h2
              id="verdict-headline"
              className="mt-3 text-2xl font-bold text-balance sm:text-3xl"
            >
              {analysis.verdictHeadline}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-pretty text-white/80">
              {analysis.verdictDetail}
            </p>
          </div>

          <div className="flex shrink-0 gap-10 sm:gap-12">
            <div>
              <p className="text-xs font-semibold text-white/65">Copeland fit</p>
              <p className="font-mono text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
                {Math.round(analysis.progress.copelandFit)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/65">Bakken fit</p>
              <p className="font-mono text-4xl font-bold tabular-nums tracking-tight text-red sm:text-5xl">
                {Math.round(analysis.progress.bakkenFit)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <FitBar
            label="Copeland"
            value={analysis.progress.copelandFit}
            tone="navy"
            variant="on-dark"
            size="lg"
          />
          <FitBar
            label="Bakken"
            value={analysis.progress.bakkenFit}
            tone="red"
            variant="on-dark"
            size="lg"
          />
        </div>

        {analysis.flags.length > 0 ? (
          <div className="mt-6 border-t border-white/15 pt-5">
            <ul className="space-y-2 text-sm leading-snug text-white/95">
              {visible.map((f) => (
                <li
                  key={f}
                  className="rounded-lg bg-white/10 px-3 py-2.5 ring-1 ring-white/10"
                >
                  {f}
                </li>
              ))}
            </ul>
            {analysis.flags.length > 3 ? (
              <button
                type="button"
                className="mt-3 text-xs font-semibold text-white/90 underline-offset-2 hover:underline"
                onClick={onToggleFlags}
              >
                {flagsOpen
                  ? "Show fewer flags"
                  : `Show all ${analysis.flags.length} rule flags`}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
