"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks, company } from "../../data/company";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-navy-950/95 backdrop-blur border-b border-white/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label="CLM home">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded bg-accent-500 font-bold text-navy-950"
          >
            CLM
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-wide text-white sm:text-base">
              CLM ELECTRONICS
            </span>
            <span className="block text-[11px] font-medium tracking-[0.18em] text-slate-300">
              ENGINEERING SERVICES
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="rounded p-2 text-white hover:bg-white/10"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-white/10 bg-navy-950 px-4 py-3 lg:hidden">
          <ul className="space-y-1">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === l.href ? "page" : undefined}
                  className={`block rounded px-3 py-2.5 text-sm font-medium ${
                    pathname === l.href ? "bg-white/10 text-white" : "text-slate-200 hover:bg-white/5"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-white/10 px-3 pt-3 text-xs text-slate-400">
            {company.phones.join(" / ")} · {company.email}
          </p>
        </nav>
      )}
    </header>
  );
}
