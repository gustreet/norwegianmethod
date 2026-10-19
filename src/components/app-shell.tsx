import Link from "next/link";
import { AppNav } from "./app-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-[var(--line)] bg-[var(--navy)] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--red)] text-sm font-bold"
              aria-hidden
            >
              N
            </span>
            <div>
              <p className="text-sm font-semibold tracking-wide">Singles Track</p>
              <p className="text-xs text-white/70">Sha Tin & Kai Tak · separate sessions</p>
            </div>
          </Link>
          <AppNav />
        </div>
        <div className="h-1 bg-gradient-to-r from-[var(--red)] via-white to-[var(--navy)]" />
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[var(--line)] py-6 text-center text-xs text-[var(--muted)]">
        Map data © OpenStreetMap contributors · TCX stays yours · Neon stores session summaries
      </footer>
    </div>
  );
}
