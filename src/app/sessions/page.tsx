"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate, formatPace } from "@/lib/format";
import { trackBySlug } from "@/lib/track-config";
import { NEON_CONNECT_DOCS, NEON_CONSOLE, NEON_HOME } from "@/lib/neon-links";

type Row = {
  id: number;
  trackSlug: string;
  startedAt: string | null;
  verdict: string;
  qualityMinutes: number;
  workRepCount: number;
  avgWorkPaceMinKm: number | null;
};

export default function SessionsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [db, setDb] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => {
        setRows(data.sessions ?? []);
        setDb(Boolean(data.db));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-[var(--navy)]">Track sessions</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Stored in{" "}
        <a
          href={NEON_CONSOLE}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--navy)] underline underline-offset-2"
        >
          Neon Postgres
        </a>{" "}
        when <code className="font-mono text-xs">DATABASE_URL</code> is set.
      </p>

      {!db && !loading ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p>
            Neon is not connected. Create a project on{" "}
            <a
              href={NEON_HOME}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--navy)] underline underline-offset-2"
            >
              neon.tech
            </a>
            , copy the <strong>pooled</strong> connection string into{" "}
            <code className="font-mono">.env.local</code> as{" "}
            <code className="font-mono">DATABASE_URL</code>, then run{" "}
            <code className="font-mono">npm run db:push</code>.
          </p>
          <p className="mt-3">
            <a
              href={NEON_CONNECT_DOCS}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--navy)] underline underline-offset-2"
            >
              Neon connection docs
            </a>
            {" · "}
            <a
              href={NEON_CONSOLE}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--navy)] underline underline-offset-2"
            >
              Open Neon console
            </a>
          </p>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-8 text-sm text-[var(--muted)]">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--muted)]">
          No sessions yet.{" "}
          <Link href="/" className="text-[var(--navy)] underline">Upload a TCX</Link> and tap Save to Neon.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {rows.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-3"
            >
              <div>
                <p className="font-medium text-[var(--ink)]">
                  {trackBySlug(s.trackSlug)?.name ?? s.trackSlug} · #{s.id} ·{" "}
                  {s.workRepCount} reps
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {formatDate(s.startedAt)} · {s.qualityMinutes.toFixed(0)} quality min
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-mono capitalize text-[var(--navy)]">{s.verdict}</p>
                {s.avgWorkPaceMinKm != null ? (
                  <p className="font-mono text-[var(--muted)]">
                    {formatPace(s.avgWorkPaceMinKm)}/km
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
