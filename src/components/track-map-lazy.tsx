"use client";

import dynamic from "next/dynamic";

export const TrackMapLazy = dynamic(
  () => import("./track-map").then((m) => m.TrackMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--muted)]">
        Loading map…
      </div>
    ),
  },
);
