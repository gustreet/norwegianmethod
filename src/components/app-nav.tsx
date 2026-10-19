"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Track" },
  { href: "/sessions", label: "Sessions" },
  { href: "/method", label: "Method" },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 sm:gap-2" aria-label="Main">
      {links.map((l) => {
        const active =
          l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-white/15 text-white"
                : "text-white/85 hover:bg-white/10 hover:text-white"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
