"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { compareHref, useCompareIds } from "@/lib/compare-store";

const noopSubscribe = () => () => {};

/**
 * On /compare without ?ids=, load the visitor's saved selection (localStorage)
 * so the "Compare" tab always opens the current comparison.
 * Renders children (the empty state) only when nothing is saved.
 */
export function CompareFromStorage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const ids = useCompareIds();
  // false during SSR/hydration, true once running in the browser.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    if (hydrated && ids.length > 0) router.replace(compareHref(ids));
  }, [hydrated, ids, router]);

  if (!hydrated || ids.length > 0) {
    return (
      <p className="py-16 text-center text-sm text-slate-500" role="status">
        Loading your comparison…
      </p>
    );
  }
  return <>{children}</>;
}
