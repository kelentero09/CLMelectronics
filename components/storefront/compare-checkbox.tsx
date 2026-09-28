"use client";

import { Check, Plus } from "lucide-react";
import { useState, useEffect } from "react";

const COMPARE_STORAGE_KEY = "clm_compare_products";

export function CompareCheckbox({ productId, productName }: { productId: string; productName: string }) {
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    // Check if this product is already in comparison
    const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (stored) {
      const compareIds = JSON.parse(stored) as string[];
      setIsComparing(compareIds.includes(productId));
    }
  }, [productId]);

  const toggleCompare = () => {
    const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
    let compareIds: string[] = stored ? JSON.parse(stored) : [];

    if (isComparing) {
      compareIds = compareIds.filter((id) => id !== productId);
    } else {
      if (compareIds.length >= 4) {
        alert("You can compare up to 4 products at a time");
        return;
      }
      compareIds.push(productId);
      // Show notification
      alert(`${productName} added to comparison`);
    }

    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareIds));
    setIsComparing(!isComparing);

    // Dispatch custom event to update comparison bar
    window.dispatchEvent(new CustomEvent("compare-updated"));
  };

  return (
    <button
      onClick={toggleCompare}
      className={`
        flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md border-2 transition-all
        ${isComparing 
          ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700" 
          : "bg-white/90 border-white/40 text-slate-800 hover:bg-white hover:border-slate-300"
        }
      `}
      title={isComparing ? `Remove ${productName} from comparison` : `Add ${productName} to comparison`}
      aria-label={isComparing ? `Remove ${productName} from comparison` : `Add ${productName} to comparison`}
    >
      {isComparing ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : <Plus className="h-3 w-3 sm:h-4 sm:w-4" />}
    </button>
  );
}