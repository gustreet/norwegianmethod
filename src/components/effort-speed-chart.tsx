"use client";

import type { SessionCoreMetrics } from "@/lib/types";

export function EffortSpeedChart({ core }: { core: SessionCoreMetrics }) {
  const reps = core.repMetrics;
  if (reps.length === 0) return null;

  const paces = reps.map((r) => r.paceMinKm);
  const hrs = reps.map((r) => r.avgHr);
  const minP = Math.min(...paces);
  const maxP = Math.max(...paces);
  const minH = Math.min(...hrs);
  const maxH = Math.max(...hrs);
  const padX = 12;
  const padY = 20;
  const labelH = 22;
  const w = Math.max(320, reps.length * 28 + padX * 2);
  const h = 196;
  const innerW = w - padX * 2;
  const innerH = h - padY - labelH;

  const normSpeed = (pace: number) => {
    if (maxP === minP) return 0.5;
    return 1 - (pace - minP) / (maxP - minP);
  };
  const normHr = (hr: number) => {
    if (maxH === minH) return 0.5;
    return (hr - minH) / (maxH - minH);
  };

  const slotW = innerW / reps.length;
  const baseline = padY + innerH * 0.55;

  return (
    <section
      className="rounded-xl border border-line bg-surface p-4 sm:p-5"
      aria-labelledby="effort-speed-heading"
    >
      <h2 id="effort-speed-heading" className="font-semibold text-ink">
        Effort vs speed
      </h2>
      <p className="mt-2 text-sm leading-snug text-ink/80">
        <span className="inline-block size-2.5 rounded-sm bg-navy align-middle" aria-hidden />{" "}
        Speed ·{" "}
        <span className="inline-block size-2.5 rounded-sm bg-red align-middle" aria-hidden />{" "}
        HR · dashed outline = outside Bakken split band
      </p>
      <div className="mt-4 overflow-x-auto pb-1">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full min-w-[min(100%,320px)]"
          style={{ minWidth: `${Math.min(w, 640)}px` }}
          role="img"
          aria-label="Per-rep speed and heart rate"
        >
          <line
            x1={padX}
            y1={baseline}
            x2={w - padX}
            y2={baseline}
            stroke="#e2e8f0"
            strokeWidth={1}
          />
          {reps.map((r, i) => {
            const x = padX + i * slotW + slotW * 0.12;
            const barW = slotW * 0.76;
            const sh = normSpeed(r.paceMinKm) * innerH * 0.42;
            const eh = normHr(r.avgHr) * innerH * 0.42;
            const showLabel =
              reps.length <= 24 && i % (reps.length > 16 ? 2 : 1) === 0;
            return (
              <g key={r.lapNumber}>
                <rect
                  x={x}
                  y={baseline - sh}
                  width={barW / 2 - 1}
                  height={Math.max(2, sh)}
                  fill="#00205b"
                  opacity={0.88}
                  rx={2}
                />
                <rect
                  x={x + barW / 2}
                  y={baseline - eh}
                  width={barW / 2 - 1}
                  height={Math.max(2, eh)}
                  fill="#ba0c2f"
                  opacity={0.78}
                  rx={2}
                />
                {r.paceMiss ? (
                  <rect
                    x={x - 2}
                    y={padY}
                    width={barW + 4}
                    height={innerH * 0.55}
                    fill="none"
                    stroke="#ba0c2f"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    rx={3}
                  />
                ) : null}
                {showLabel ? (
                  <text
                    x={x + barW / 2}
                    y={h - 4}
                    textAnchor="middle"
                    fill="#475569"
                    fontSize={10}
                    fontFamily="var(--font-geist-mono), monospace"
                  >
                    {r.index}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
