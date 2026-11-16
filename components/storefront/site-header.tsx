"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, GitCompareArrows, Menu, X } from "lucide-react";
import { compareHref, COMPARE_MAX, useCompareIds } from "@/lib/compare-store";
import { cn } from "@/lib/utils";

const links = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Equipment", href: "/equipment" },
  { label: "Board Repair", href: "/board-repair" },
  { label: "Products", href: "/products" },
  { label: "Categories", href: "/categories" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-steel-500 px-1.5 text-[11px] font-bold tabular-nums leading-none text-white",
        className
      )}
    >
      {count}
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const compareIds = useCompareIds();
  const compareCount = compareIds.length;
  const compareLink = compareHref(compareIds);
  const compareActive = isActive(pathname, "/compare");

  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  // Close the mobile menu whenever the route changes.
  if (open && openedAt !== pathname) setOpen(false);

  useEffect(() => {
    if (!open) return;
    // Lock page scroll, focus the first link, close on Escape and return focus to the toggle.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const compareLabel =
    compareCount > 0 ? `Compare products (${compareCount} of ${COMPARE_MAX} selected)` : "Compare products";

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/10 bg-navy-950/95 backdrop-blur"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label="CLM home">
          <Image
            src="/logo3.jpg"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 rounded bg-white object-contain sm:h-10 sm:w-10"
            priority
          />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-bold tracking-wide text-white sm:text-base">CLM ELECTRONICS</span>
            <span className="block truncate text-[10px] font-medium tracking-[0.16em] text-slate-300 sm:text-[11px] sm:tracking-[0.18em]">
              ENGINEERING SERVICES
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Primary" className="hidden items-center gap-0.5 xl:flex">
          {[...links, { label: "Compare", href: compareLink }].map((l) => {
            const isCompare = l.label === "Compare";
            const active = isCompare ? compareActive : isActive(pathname, l.href);
            return (
              <Link
                key={l.label}
                href={l.href}
                aria-current={active ? "page" : undefined}
                aria-label={isCompare ? compareLabel : undefined}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded px-3 py-2 text-sm font-medium transition-colors duration-150",
                  "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-accent-400 after:transition-transform after:duration-200",
                  active ? "text-white after:scale-x-100" : "text-slate-300 after:scale-x-0 hover:bg-white/5 hover:text-white"
                )}
              >
                {isCompare && <GitCompareArrows className="h-4 w-4" aria-hidden />}
                {l.label}
                {isCompare && <CountBadge count={compareCount} />}
              </Link>
            );
          })}
          <Link
            href="/contact"
            aria-current={isActive(pathname, "/contact") ? "page" : undefined}
            className="ml-2 rounded bg-steel-500 px-4 py-2 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-steel-600 active:scale-[0.98]"
          >
            Contact CLM
          </Link>
        </nav>

        {/* Mobile / tablet actions */}
        <div className="flex shrink-0 items-center gap-1 xl:hidden">
          <Link
            href={compareLink}
            aria-label={compareLabel}
            aria-current={compareActive ? "page" : undefined}
            className={cn(
              "relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors",
              compareActive ? "bg-white/10 text-white" : "text-slate-200 hover:bg-white/10 hover:text-white"
            )}
          >
            <GitCompareArrows className="h-5 w-5" aria-hidden />
            <CountBadge count={compareCount} className="absolute right-0.5 top-0.5 ring-2 ring-navy-950" />
          </Link>
          <button
            ref={toggleRef}
            type="button"
            onClick={() => {
              setOpenedAt(pathname);
              setOpen((v) => !v);
            }}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          ref={menuRef}
          id="mobile-menu"
          aria-label="Mobile"
          className="h-[calc(100dvh-4rem)] animate-slide-down overflow-y-auto overscroll-contain border-t border-white/10 bg-navy-950 xl:hidden"
        >
          <div className="mx-auto flex min-h-full max-w-7xl flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
            <ul className="divide-y divide-white/5">
              {links.map((l) => {
                const active = isActive(pathname, l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-3.5 text-base font-medium transition-colors",
                        active ? "bg-white/10 text-white" : "text-slate-200 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-accent-400" : "bg-white/15")}
                        />
                        {l.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-500" aria-hidden />
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href={compareLink}
                  onClick={() => setOpen(false)}
                  aria-current={compareActive ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-3.5 text-base font-medium transition-colors",
                    compareActive ? "bg-white/10 text-white" : "text-slate-200 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <GitCompareArrows className="h-4 w-4 text-accent-400" aria-hidden />
                    Compare
                    <CountBadge count={compareCount} />
                  </span>
                  <span className="text-xs text-slate-500">
                    {compareCount > 0 ? `${compareCount} of ${COMPARE_MAX}` : "None selected"}
                  </span>
                </Link>
              </li>
            </ul>
            <div className="mt-auto pt-6">
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="flex h-12 items-center justify-center rounded-lg bg-steel-500 text-base font-semibold text-white transition-colors hover:bg-steel-600"
              >
                Contact CLM
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
