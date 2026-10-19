"use client";

import type { SessionCoreMetrics } from "@/lib/types";

/** Normalized rep overlay: speed (inverted pace) vs HR vs rep 1. */
export function EffortSpeedChart({ core }: { core: SessionCoreMetrics }) {
  const reps = core.repMetrics;
  if (reps.length === 0) return null;

  const paces = reps.map((r) => r.paceMinKm);
  const hrs = reps.map((r) => r.avgHr);
  const minP = Math.min(...paces);
  const maxP = Math.max(...paces);
  const minH = Math.min(...hrs);
  const maxH = Math.max(...hrs);
  const pad = 8;
  const w = 640;
  const h = 160;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const normSpeed = (pace: number) => {
    if (maxP === minP) return 0.5;
    return 1 - (pace - minP) / (maxP - minP);
  };
  const normHr = (hr: number) => {
    if (maxH === minH) return 0.5;
    return (hr - minH) / (maxH - minH);
  };

  const barW = innerW / reps.length - 4;

  return (
    <section aria-labelledby="effort-speed-heading">
      <h3 id="effort-speed-heading" className="text-lg font-semibold text-[var(--ink)]">
        Effort vs speed overlay
      </h3>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Per rep: navy = relative speed (faster = taller), red = relative HR. Gap growing =
        decoupling.
      </p>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--line)] bg-white p-3">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="min-w-[320px] w-full max-w-3xl"
          role="img"
          aria-label="Per-rep speed and heart rate bars"
        >
          {reps.map((r, i) => {
            const x = pad + i * (innerW / reps.length) + 2;
            const sh = normSpeed(r.paceMinKm) * innerH * 0.45;
            const eh = normHr(r.avgHr) * innerH * 0.45;
            const miss = r.paceMiss;
            return (
              <g key={r.lapNumber}>
                <rect
                  x={x}
                  y={pad + innerH * 0.5 - sh}
                  width={barW / 2 - 1}
                  height={sh}
                  fill="#00205B"
                  opacity={0.85}
                  rx={2}
                />
                <rect
                  x={x + barW / 2}
                  y={pad + innerH * 0.5 - eh}
                  width={barW / 2 - 1}
                  height={eh}
                  fill="#BA0C2F"
                  opacity={0.75}
                  rx={2}
                />
                {miss ? (
                  <rect
                    x={x - 1}
                    y={pad}
                    width={barW + 2}
                    height={innerH}
                    fill="none"
                    stroke="#BA0C2F"
                    strokeWidth={1.5}
                    strokeDasharray="3 2"
                    rx={3}
                  />
                ) : null}
              </g>
            );
          })}
          <line
            x1={pad}
            y1={pad + innerH * 0.5}
            x2={w - pad}
            y2={pad + innerH * 0.5}
            stroke="var(--line)"
          />
        </svg>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-[var(--navy)]" />
            Speed (pace)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-[var(--red)]" />
            Effort (avg HR)
          </span>
          <span>Dashed = outside Bakken split band</span>
        </div>
      </div>
    </section>
  );
}
