import type { ReactNode } from "react";
import { Eyebrow, PageHero } from "@/components/storefront/blocks";

export function ProfileSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  /** @deprecated styling is now shared; kept for compatibility. */
  eyebrowClassName?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">{description}</p>}
    </div>
  );
}

export function ProfileCard({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:hover:translate-y-0 sm:p-8">
      {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.18em] text-steel-600">{eyebrow}</p>}
      <h3 className="mt-1 text-xl font-bold text-navy-900">{title}</h3>
      <div className="mt-3 flex-1 text-base leading-relaxed text-slate-600">{children}</div>
    </article>
  );
}

export function ProfilePageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  crumbs,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  crumbs?: { label: string; href?: string }[];
  children?: ReactNode;
}) {
  return (
    <PageHero
      eyebrow={eyebrow}
      title={title}
      description={description}
      image={image}
      imageAlt={imageAlt}
      crumbs={crumbs ?? [{ label: eyebrow }]}
    >
      {children}
    </PageHero>
  );
}
