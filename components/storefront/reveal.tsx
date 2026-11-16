"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealVariant = "up" | "fade" | "left" | "right" | "scale";

const hiddenTransforms: Record<RevealVariant, string> = {
  up: "translate-y-3",
  fade: "",
  left: "-translate-x-3",
  right: "translate-x-3",
  scale: "scale-[0.98]",
};

/**
 * Scroll-reveal wrapper.
 *
 * Content is VISIBLE in the server HTML (good LCP, works without JS). After
 * hydration, only blocks that start below the fold are hidden and then
 * animated in when scrolled into view, so nothing on screen ever flashes.
 * Respects prefers-reduced-motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = "up",
}: {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms (capped at 200ms) */
  delay?: number;
  variant?: RevealVariant;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"static" | "hidden" | "shown">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return; // already on screen: leave as-is

    setState("hidden");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setState("shown");
          observer.disconnect();
        }
      },
      // Threshold 0: any visible pixel reveals (ratio thresholds never fire on very tall blocks).
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animate = state !== "static";
  return (
    <div
      ref={ref}
      style={animate && delay > 0 ? { transitionDelay: `${Math.min(delay, 200)}ms` } : undefined}
      className={cn(
        animate && "transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        state === "hidden" && cn("opacity-0", hiddenTransforms[variant]),
        className
      )}
    >
      {children}
    </div>
  );
}
