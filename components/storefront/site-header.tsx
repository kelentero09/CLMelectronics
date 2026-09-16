"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Equipment", href: "/equipment" },
  { label: "Board Repair", href: "/board-repair" },
  { label: "Products", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "Contact", href: "/contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label="CLM home">
          <Image
            src="/logo3.jpg"
            alt="CLM Electronics logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded bg-white object-contain"
            priority
          />
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-wide text-white sm:text-base">
              CLM ELECTRONICS
            </span>
            <span className="block text-[11px] font-medium tracking-[0.18em] text-slate-300">
              ENGINEERING SERVICES
            </span>
          </span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="ml-2 rounded bg-steel-500 px-4 py-2 text-sm font-semibold text-white hover:bg-steel-600"
          >
            Contact CLM
          </Link>
        </nav>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="rounded p-2 text-slate-200 hover:bg-white/10 hover:text-white md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-white/10 px-4 pb-4 pt-2 md:hidden">
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5 hover:text-white"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="block rounded bg-steel-500 px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-steel-600"
              >
                Contact CLM
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
