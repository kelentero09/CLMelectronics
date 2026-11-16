"use client";

import { Check, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toaster";
import { compareHref, COMPARE_MAX, readCompareIds, useCompareIds, writeCompareIds } from "@/lib/compare-store";
import { cn } from "@/lib/utils";

export function CompareCheckbox({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const isComparing = useCompareIds().includes(productId);

  const toggleCompare = () => {
    const ids = readCompareIds();
    if (ids.includes(productId)) {
      writeCompareIds(ids.filter((id) => id !== productId));
      toast(`${productName} removed from comparison`);
      return;
    }
    if (ids.length >= COMPARE_MAX) {
      toast.error(`You can compare up to ${COMPARE_MAX} products at a time`, {
        action: { label: "Open compare", onClick: () => router.push(compareHref(ids)) },
      });
      return;
    }
    const next = [...ids, productId];
    writeCompareIds(next);
    toast.success(`Added to compare (${next.length} of ${COMPARE_MAX})`, {
      description: productName,
      action: { label: "Compare", onClick: () => router.push(compareHref(next)) },
    });
  };

  const label = isComparing ? `Remove ${productName} from comparison` : `Add ${productName} to comparison`;

  return (
    <button
      type="button"
      onClick={toggleCompare}
      aria-pressed={isComparing}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border-2 shadow-sm transition-[background-color,border-color,transform] duration-150 active:scale-90 motion-reduce:active:scale-100 sm:h-8 sm:w-8",
        isComparing
          ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
          : "border-white/60 bg-white/95 text-slate-800 hover:border-slate-300 hover:bg-white"
      )}
      title={label}
      aria-label={label}
    >
      {isComparing ? <Check className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
    </button>
  );
}
