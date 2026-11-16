import type { ComponentType, ReactNode, SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/storefront/reveal";
import { cn } from "@/lib/utils";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

/** Page section with consistent vertical rhythm and an optional tone. */
export function Section({
  children,
  tone = "white",
  className,
  innerClassName,
  ...rest
}: {
  children: ReactNode;
  tone?: "white" | "muted" | "dark";
  className?: string;
  innerClassName?: string;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        tone === "muted" && "border-y border-slate-200/70 bg-slate-50",
        tone === "dark" && "relative isolate overflow-hidden bg-navy-950 text-slate-300",
        className
      )}
      {...rest}
    >
      {tone === "dark" && <DarkBackdrop />}
      <div className={cn("mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24", innerClassName)}>{children}</div>
    </section>
  );
}

/** Blueprint grid + soft brand glows used behind dark sections. */
export function DarkBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="blueprint-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-steel-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent-400/10 blur-3xl" />
    </div>
  );
}

/** Small uppercase label with an accent rule. */
export function Eyebrow({ children, dark = false, className }: { children: ReactNode; dark?: boolean; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] sm:text-sm",
        dark ? "text-accent-400" : "text-steel-600",
        className
      )}
    >
      <span aria-hidden className={cn("h-px w-6", dark ? "bg-accent-400" : "bg-steel-500")} />
      {children}
    </p>
  );
}

/** Section heading: eyebrow, title, description and an optional action on the right. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  dark = false,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  dark?: boolean;
  align?: "left" | "center";
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between"
      )}
    >
      <div className={cn("max-w-3xl", align === "center" && "mx-auto")}>
        {eyebrow && <Eyebrow dark={dark}>{eyebrow}</Eyebrow>}
        <h2
          className={cn(
            "mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl",
            dark ? "text-white" : "text-navy-900"
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={cn("mt-4 text-pretty text-base leading-relaxed sm:text-lg", dark ? "text-slate-300" : "text-slate-600")}>
            {description}
          </p>
        )}
      </div>
      {action && align === "left" && (
        <TextLink href={action.href} dark={dark} className="shrink-0">
          {action.label}
        </TextLink>
      )}
    </Reveal>
  );
}

/** Inline link with an arrow that nudges on hover. */
export function TextLink({
  href,
  children,
  dark = false,
  className,
}: {
  href: string;
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-1.5 text-sm font-semibold transition-colors",
        dark ? "text-accent-400 hover:text-white" : "text-steel-600 hover:text-navy-900",
        className
      )}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Page hero                                                           */
/* ------------------------------------------------------------------ */

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt = "",
  crumbs,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  /** Optional photo shown on the right, faded into the navy background. */
  image?: string;
  imageAlt?: string;
  crumbs?: { label: string; href?: string }[];
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950" aria-label="Page introduction">
      <DarkBackdrop />
      {image && (
        <div aria-hidden={!imageAlt} className="absolute inset-y-0 right-0 -z-10 hidden w-1/2 md:block">
          <Image src={image} alt={imageAlt} fill priority sizes="50vw" className="object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/70 to-navy-950/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 to-transparent" />
        </div>
      )}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} dark />}
        <div className={cn("max-w-2xl", crumbs && "mt-6")}>
          <Eyebrow dark>{eyebrow}</Eyebrow>
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
          {description && <p className="mt-5 text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">{description}</p>}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </section>
  );
}

export function Breadcrumbs({ items, dark = false }: { items: { label: string; href?: string }[]; dark?: boolean }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className={cn("flex flex-wrap items-center gap-1 text-xs font-medium", dark ? "text-slate-400" : "text-slate-500")}>
        <li>
          <Link href="/" className={cn("transition-colors", dark ? "hover:text-white" : "hover:text-navy-900")}>
            Home
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className={cn("transition-colors", dark ? "hover:text-white" : "hover:text-navy-900")}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className={dark ? "text-slate-200" : "text-navy-900"}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Cards & lists                                                       */
/* ------------------------------------------------------------------ */

/** Icon + title + text card. Becomes a link with hover lift when `href` is set. */
export function FeatureCard({
  icon: IconCmp,
  title,
  text,
  href,
  index,
  tone = "navy",
}: {
  icon: Icon;
  title: string;
  text?: string;
  href?: string;
  index?: number;
  tone?: "navy" | "soft";
}) {
  const body = (
    <>
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 motion-reduce:group-hover:scale-100",
            tone === "navy"
              ? "bg-gradient-to-br from-navy-800 to-navy-950 text-accent-400 shadow-md shadow-navy-900/20"
              : "bg-steel-500/10 text-steel-600"
          )}
        >
          <IconCmp className="h-5 w-5" aria-hidden />
        </div>
        {typeof index === "number" && (
          <span className="font-mono text-xs font-semibold text-slate-300">{String(index + 1).padStart(2, "0")}</span>
        )}
      </div>
      <h3 className="mt-5 text-lg font-bold text-navy-900">{title}</h3>
      {text && <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{text}</p>}
      {href && (
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-steel-600">
          Learn more
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
        </span>
      )}
    </>
  );
  const cls =
    "group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-[box-shadow,transform,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-steel-500/30 hover:shadow-xl hover:shadow-navy-900/5 motion-reduce:hover:translate-y-0 sm:p-7";
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <article className={cls}>{body}</article>
  );
}

/** Checklist with brand check badges. */
export function CheckList({
  items,
  columns = 1,
  dark = false,
  className,
}: {
  items: string[];
  columns?: 1 | 2 | 3;
  dark?: boolean;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid gap-3",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span
            aria-hidden
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
              dark ? "bg-accent-400/15 text-accent-400" : "bg-steel-500/10 text-steel-600"
            )}
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <span className={cn("text-sm font-medium leading-relaxed sm:text-base", dark ? "text-slate-200" : "text-slate-700")}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Row of key figures. */
export function StatRow({ stats, dark = false }: { stats: { value: string; label: string }[]; dark?: boolean }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-3 divide-x rounded-2xl border",
        dark ? "divide-white/10 border-white/10 bg-white/[0.04] backdrop-blur" : "divide-slate-200 border-slate-200 bg-white"
      )}
    >
      {stats.map((s) => (
        <div key={s.label} className="px-3 py-4 text-center sm:px-6 sm:py-5">
          <dd className={cn("text-2xl font-bold tracking-tight sm:text-3xl", dark ? "text-white" : "text-navy-900")}>{s.value}</dd>
          <dt className={cn("mt-1 text-[11px] font-semibold uppercase tracking-wider sm:text-xs", dark ? "text-slate-400" : "text-slate-500")}>
            {s.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* Brands                                                              */
/* ------------------------------------------------------------------ */

export const SERVICED_BRANDS = [
  { name: "ASM", src: "/brands/asm.png", w: 315, h: 96 },
  { name: "Besi", src: "/brands/besi.png", w: 123, h: 96 },
  { name: "K&S / KNS", src: "/brands/kns.png", w: 110, h: 96 },
  { name: "ESEC", src: "/brands/esec.png", w: 389, h: 96 },
  { name: "Orthodyne", src: "/brands/orthodyne.png", w: 173, h: 96 },
  { name: "Keyence", src: "/brands/keyence.png", w: 283, h: 50 },
] as const;

/** Logo strip of serviced equipment brands (with a non-affiliation note). */
export function BrandStrip({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        Equipment platforms we service
      </p>
      <ul className="mt-6 grid grid-cols-3 items-center gap-x-6 gap-y-8 sm:grid-cols-6" aria-label="Serviced equipment brands">
        {SERVICED_BRANDS.map((b) => (
          <li key={b.name} className="flex justify-center">
            <Image
              src={b.src}
              alt={b.name}
              width={b.w}
              height={b.h}
              sizes="140px"
              className="h-8 w-auto max-w-[120px] object-contain opacity-60 grayscale transition-[filter,opacity] duration-300 hover:opacity-100 hover:grayscale-0 sm:h-10"
            />
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-[11px] text-slate-400">
        Trademarks belong to their respective owners. Shown as equipment CLM services, not an authorized distributorship.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CTA                                                                 */
/* ------------------------------------------------------------------ */

export function CtaBanner({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-12" aria-label="Call to action">
      <Reveal className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-3xl bg-navy-950 px-6 py-12 shadow-2xl shadow-navy-900/20 sm:px-12 sm:py-16">
        <DarkBackdrop />
        <div aria-hidden className="absolute -right-24 top-1/2 -z-10 h-80 w-80 -translate-y-1/2 rounded-full border border-white/5" />
        <div aria-hidden className="absolute -right-10 top-1/2 -z-10 h-52 w-52 -translate-y-1/2 rounded-full border border-white/5" />
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>
            {description && <p className="mt-4 text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">{description}</p>}
          </div>
          {children && <div className="flex flex-wrap gap-3">{children}</div>}
        </div>
      </Reveal>
    </section>
  );
}
