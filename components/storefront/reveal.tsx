"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealVariant = "up" | "fade" | "left" | "right" | "scale";

const hiddenTransforms: Record<RevealVariant, string> = {
  up: "translate-y-8",
  fade: "",
  left: "-translate-x-8",
  right: "translate-x-8",
  scale: "scale-[0.97]",
};

export function Reveal({
  children,
  className,
  delay = 0,
  variant = "up",
}: {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms */
  delay?: number;
  variant?: RevealVariant;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // Threshold 0: any visible pixel reveals. A ratio threshold can never
      // be reached on very tall blocks (e.g. long tables), leaving them
      // stuck invisible until the user zooms out.
      { threshold: 0, rootMargin: "0px 0px -48px 0px" }
    );
    observer.observe(el);
    // Safety net: if the element is already within the viewport but the
    // observer never fires (edge cases, zoom quirks), reveal it anyway.
    // Below-fold content is untouched, so scroll animations still play.
    const fallback = window.setTimeout(() => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setVisible(true);
        observer.disconnect();
      }
    }, 2000);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        visible
          ? "translate-x-0 translate-y-0 scale-100 opacity-100"
          : cn("opacity-0", hiddenTransforms[variant]),
        className
      )}
    >
      {children}
    </div>
  );
}
