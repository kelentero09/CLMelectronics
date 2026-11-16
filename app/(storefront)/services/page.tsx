import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CircuitBoard,
  Gauge,
  GraduationCap,
  Hammer,
  Package,
  Ruler,
  Settings2,
  Wrench,
} from "lucide-react";
import { getSiteContent } from "@/lib/site-content";
import { ProfilePageHero } from "@/components/profile/profile-ui";
import { CheckList, CtaBanner } from "@/components/storefront/blocks";
import { Reveal } from "@/components/storefront/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ISR: cached HTML served instantly; admin edits revalidate this path.
export const revalidate = 3600;

export const metadata = {
  title: "Services",
  description:
    "Repair, preventive and predictive maintenance, machine rebuild, baselining, calibration, training, spare parts sourcing, board repair, and wedge bonding consumables.",
  alternates: { canonical: "/services" },
};

const ICONS: Record<string, typeof Wrench> = {
  "technical-support": Wrench,
  "preventive-maintenance": CalendarCheck,
  rebuild: Hammer,
  baselining: Gauge,
  "parts-calibration": Ruler,
  training: GraduationCap,
  "spare-parts": Package,
  "board-repair": CircuitBoard,
  "wedge-bonding": Settings2,
};

export default async function ServicesPage() {
  const content = await getSiteContent();
  const serviceCategories = content.services.categories;
  const wedgeBrands = content.services.wedgeBrands;

  return (
    <>
      <ProfilePageHero
        eyebrow="Services"
        title={content.services.heroTitle}
        description={content.services.heroDescription}
        image="/images/board-service.webp"
      />

      {/* Phones/tablets: swipeable jump links (desktop uses the sticky side list). */}
      <nav aria-label="Jump to a service" className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <ol className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
          {serviceCategories.map((cat, i) => (
            <li key={cat.id} className="shrink-0">
              <a
                href={`#${cat.id}`}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-600 transition-colors active:bg-slate-100"
              >
                <span className="font-mono text-[11px] text-slate-400">{String(i + 1).padStart(2, "0")}</span>
                {cat.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-14">
          {/* In-page navigation */}
          <nav aria-label="Service areas" className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">On this page</p>
              <ol className="mt-4 space-y-1 border-l border-slate-200">
                {serviceCategories.map((cat, i) => (
                  <li key={cat.id}>
                    <a
                      href={`#${cat.id}`}
                      className="-ml-px flex gap-3 border-l-2 border-transparent py-1.5 pl-4 text-sm text-slate-600 transition-colors hover:border-steel-500 hover:text-navy-900"
                    >
                      <span className="font-mono text-xs text-slate-400">{String(i + 1).padStart(2, "0")}</span>
                      {cat.title}
                    </a>
                  </li>
                ))}
              </ol>
              <Link href="/contact" className={cn(buttonVariants({ variant: "primary" }), "mt-8 w-full")}>
                Request a service
              </Link>
            </div>
          </nav>

          <div className="space-y-4 sm:space-y-6">
            {serviceCategories.map((cat, i) => {
              const Icon = ICONS[cat.id] ?? Wrench;
              return (
                <Reveal key={cat.id}>
                  <section
                    id={cat.id}
                    aria-labelledby={`${cat.id}-title`}
                    className="scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-lg sm:p-8 lg:scroll-mt-24"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 text-accent-400 shadow-md shadow-navy-900/20">
                        <Icon className="h-5 w-5" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-semibold text-slate-400">{String(i + 1).padStart(2, "0")}</p>
                        <h2 id={`${cat.id}-title`} className="mt-0.5 text-balance text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
                          {cat.title}
                        </h2>
                        <p className="mt-2 text-pretty leading-relaxed text-slate-600">{cat.summary}</p>
                      </div>
                    </div>
                    <div className="mt-6 border-t border-slate-100 pt-6">
                      <CheckList items={cat.items} columns={2} />
                    </div>
                    {cat.id === "wedge-bonding" && wedgeBrands.length > 0 && (
                      <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                        Referenced brands: {wedgeBrands.join(" · ")}. Shown as serviced equipment, not an authorized distributorship.
                      </p>
                    )}
                    {cat.id === "board-repair" && (
                      <Link
                        href="/board-repair"
                        className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-steel-600 hover:text-navy-900"
                      >
                        View board repair capability
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                      </Link>
                    )}
                  </section>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>

      <CtaBanner
        title="Need support for your equipment?"
        description="Tell us about your machine, the issue, and your timeline. CLM will get back to you with a plan."
      >
        <Link href="/contact" className={cn(buttonVariants({ size: "lg", variant: "primary" }), "shadow-lg shadow-steel-500/25")}>
          Contact CLM <ArrowRight aria-hidden />
        </Link>
      </CtaBanner>
    </>
  );
}
