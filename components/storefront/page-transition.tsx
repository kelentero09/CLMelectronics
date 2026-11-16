"use client";

import { ViewTransition, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Animates route changes with the View Transitions API (via React <ViewTransition>).
 * Keyed by pathname so a new page "enters" and the old one "exits"; query-string
 * changes on the same route (filters, pagination) don't replay the page animation.
 * Browsers without support simply navigate without animation.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} enter="page" exit="page" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
