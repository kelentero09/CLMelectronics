"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";

const COMPARE_STORAGE_KEY = "clm_compare_products";

export function ComparisonBar() {
  const [compareCount, setCompareCount] = useState(0);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initial load from localStorage
    updateCount();

    // Listen for updates from compare checkboxes
    const handleUpdate = () => updateCount();
    window.addEventListener("compare-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("compare-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const updateCount = () => {
    const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
    const ids = stored ? JSON.parse(stored) as string[] : [];
    setCompareIds(ids);
    setCompareCount(ids.length);
    setIsVisible(ids.length > 0);
  };

  const clearComparison = () => {
    localStorage.removeItem(COMPARE_STORAGE_KEY);
    setCompareCount(0);
    setCompareIds([]);
    setIsVisible(false);
    window.dispatchEvent(new CustomEvent("compare-updated"));
  };

  if (!isVisible) return null;

  const compareUrl = `/compare?ids=${compareIds.join(",")}`;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md">
      <div className="flex items-center gap-2 sm:gap-3 rounded-full bg-navy-900 px-3 sm:px-6 py-2 sm:py-3 shadow-lg">
        <Badge className="bg-emerald-600 text-white border-transparent text-[10px] sm:text-xs">
          {compareCount} {compareCount === 1 ? "product" : "products"}
        </Badge>
        <span className="text-xs sm:text-sm font-medium text-white hidden sm:inline">selected for comparison</span>
        
        <Link href={compareUrl} className="ml-auto">
          <Button size="sm" className="gap-1 bg-white text-navy-900 hover:bg-slate-100 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3">
            <span className="hidden sm:inline">Compare Now</span>
            <span className="sm:hidden">Compare</span>
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </Link>
        
        <button
          onClick={clearComparison}
          className="rounded-full p-1 text-slate-400 hover:text-white transition-colors"
          title="Clear comparison"
        >
          <X className="h-3 w-3 sm:h-4 sm:w-4" />
        </button>
      </div>
    </div>
  );
}