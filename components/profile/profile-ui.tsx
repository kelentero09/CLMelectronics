import type { ReactNode } from "react";
import { Reveal } from "@/components/storefront/reveal";

export function ProfileSectionHeader({
  eyebrow,
  title,
  description,
  eyebrowClassName = "text-xs font-bold uppercase tracking-[0.2em] text-steel-600",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  eyebrowClassName?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow && (
        <p className={eyebrowClassName}>{eyebrow}</p>
      )}
      <h2 className="mt-2 text-2xl font-bold text-navy-900 sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 leading-relaxed text-slate-600">{description}</p>}
    </div>
  );
}

export function ProfileCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <h3 className="text-lg font-bold text-navy-900">{title}</h3>
      <div className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{children}</div>
    </article>
  );
}

export function ProfilePageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="blueprint-grid bg-navy-950" aria-label="Page introduction">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-400">{eyebrow}</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold text-white sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-300">{description}</p>
        </Reveal>
      </div>
    </section>
  );
}
