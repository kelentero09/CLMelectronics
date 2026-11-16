"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { COMPARE_EVENT, readCompareIds, writeCompareIds } from "@/lib/compare-store";
import { cn } from "@/lib/utils";

export function ComparisonBar() {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setCompareIds(readCompareIds());
    sync();
    window.addEventListener(COMPARE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const count = compareIds.length;
  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label="Product comparison"
      className="fixed bottom-[calc(1rem+var(--sticky-cta-h,0px))] left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-slide-up-in"
    >
      <div className="flex items-center gap-2 rounded-full bg-navy-900 px-3 py-2 shadow-lg ring-1 ring-white/10 sm:gap-3 sm:px-6 sm:py-3">
        <Badge className="border-transparent bg-emerald-600 text-[10px] text-white sm:text-xs" aria-live="polite">
          {count} {count === 1 ? "product" : "products"}
        </Badge>
        <span className="hidden text-sm font-medium text-white sm:inline">selected for comparison</span>
        <Link
          href={`/compare?ids=${compareIds.join(",")}`}
          className={cn(buttonVariants({ size: "sm" }), "ml-auto h-8 gap-1 bg-white px-3 text-xs text-navy-900 hover:bg-slate-100")}
        >
          Compare<span className="hidden sm:inline"> Now</span>
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={() => writeCompareIds([])}
          className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Clear comparison"
          title="Clear comparison"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
