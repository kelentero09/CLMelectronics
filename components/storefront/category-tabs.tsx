"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryTabLink = {
  key: string;
  label: string;
  href: string;
  active: boolean;
  count?: number;
};

export function CategoryTabs({ links }: { links: CategoryTabLink[] }) {
  const scrollerRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [stuck, setStuck] = useState(false);

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, links.length]);

  function scrollBy(dx: number) {
    scrollerRef.current?.scrollBy({ left: dx, behavior: "smooth" });
  }

  // Extra padding only while the bar is stuck below the header (mobile only, header is 64px tall)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023.98px)");
    function checkStuck() {
      const el = barRef.current;
      if (!el || !mq.matches) {
        setStuck(false);
        return;
      }
      setStuck(el.getBoundingClientRect().top <= 65);
    }
    checkStuck();
    window.addEventListener("scroll", checkStuck, { passive: true });
    window.addEventListener("resize", checkStuck);
    return () => {
      window.removeEventListener("scroll", checkStuck);
      window.removeEventListener("resize", checkStuck);
    };
  }, []);

  return (
    <div
      ref={barRef}
      className={cn(
        "mt-4 flex items-center gap-1 border-b border-slate-200 bg-white transition-[padding] duration-150 max-lg:sticky max-lg:top-16 max-lg:z-40",
        stuck && "py-3 shadow-[0_6px_16px_-8px_rgba(10,22,40,0.35)]"
      )}
    >
      <button
        type="button"
        onClick={() => scrollBy(-240)}
        disabled={!canLeft}
        aria-label="Scroll categories left"
        className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-900 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-400"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <nav
        ref={scrollerRef}
        aria-label="Categories"
        className="flex min-w-0 flex-1 flex-nowrap gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {links.map((l) => (
          <Link
            key={l.key}
            href={l.href}
            aria-current={l.active ? "page" : undefined}
            className={cn(
              "relative shrink-0 whitespace-nowrap pb-2.5 pt-1 text-[13px] font-semibold text-slate-500 hover:text-navy-900",
              l.active && "text-navy-900 after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-navy-900"
            )}
          >
            {l.label}{" "}
            {typeof l.count === "number" && (
              <span className="font-normal text-slate-400">({l.count})</span>
            )}
          </Link>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => scrollBy(240)}
        disabled={!canRight}
        aria-label="Scroll categories right"
        className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-900 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-400"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
