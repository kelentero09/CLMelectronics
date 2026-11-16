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
        "flex items-center gap-1 bg-white transition-[padding] duration-150 max-lg:sticky max-lg:top-16 max-lg:z-40 max-lg:-mx-4 max-lg:px-4",
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
        className="flex min-w-0 flex-1 flex-nowrap gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {links.map((l) => (
          <Link
            key={l.key}
            href={l.href}
            aria-current={l.active ? "page" : undefined}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors duration-150",
              l.active
                ? "border-navy-900 bg-navy-900 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-navy-900"
            )}
          >
            {l.label}{" "}
            {typeof l.count === "number" && (
              <span className={cn("ml-0.5 font-normal tabular-nums", l.active ? "text-slate-300" : "text-slate-400")}>{l.count}</span>
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
