"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
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

export function SiteHeader() {
  const pathname = usePathname();
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

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/10 bg-navy-950/95 backdrop-blur"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3" aria-label="CLM home">
          <Image
            src="/logo3.jpg"
            alt=""
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
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded px-3 py-2 text-sm font-medium transition-colors duration-150",
                  "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-accent-400 after:transition-transform after:duration-200",
                  active
                    ? "text-white after:scale-x-100"
                    : "text-slate-300 after:scale-x-0 hover:bg-white/5 hover:text-white"
                )}
              >
                {l.label}
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
          className="rounded p-2.5 text-slate-200 transition-colors hover:bg-white/10 hover:text-white md:hidden"
        >
          {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
        </button>
      </div>
      {open && (
        <nav
          ref={menuRef}
          id="mobile-menu"
          aria-label="Mobile"
          className="max-h-[calc(100dvh-4rem)] animate-slide-down overflow-y-auto border-t border-white/10 px-4 pb-4 pt-2 md:hidden"
        >
          <ul className="space-y-1">
            {links.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded px-3 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-white/10 text-white"
                        : "text-slate-200 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
            <li className="pt-2">
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="block rounded bg-steel-500 px-3 py-3 text-center text-sm font-semibold text-white hover:bg-steel-600"
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
