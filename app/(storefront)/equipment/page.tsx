import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { getSiteContent } from "@/lib/site-content";
import { ProfilePageHero } from "@/components/profile/profile-ui";
import { BrandStrip, CtaBanner, Section, SectionHeader } from "@/components/storefront/blocks";
import { Reveal } from "@/components/storefront/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ISR: cached HTML served instantly; admin edits revalidate this path.
export const revalidate = 3600;

export const metadata = {
  title: "Equipment Expertise",
  description:
    "ASM, K&S/KNS, ESEC, dicing/saw, and aluminum wedge bonding equipment CLM has experience servicing, plus spare parts sourcing capability.",
  alternates: { canonical: "/equipment" },
};

export default async function EquipmentPage() {
  const content = await getSiteContent();
  const equipmentGroups = content.equipment.groups;
  const partsSourcing = content.equipment.partsSourcing;

  return (
    <>
      <ProfilePageHero
        eyebrow="Equipment"
        title={content.equipment.heroTitle}
        description={content.equipment.heroDescription}
        image="/images/hero-lab.webp"
      />

      <section className="border-b border-slate-200/70 bg-white" aria-label="Equipment brands">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <Reveal>
            <BrandStrip />
          </Reveal>
        </div>
      </section>

      <Section aria-label="Equipment by category">
        <SectionHeader eyebrow="Platforms" title="Equipment We Support" />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {equipmentGroups.map((g, i) => (
            <Reveal key={g.id} delay={i * 60} className="h-full">
              <article
                className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1 hover:border-steel-500/30 hover:shadow-xl motion-reduce:hover:translate-y-0 sm:p-8"
                aria-label={`${g.brand} ${g.label}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-steel-600">{g.brand}</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                    {g.models.length} model{g.models.length === 1 ? "" : "s"}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">{g.label}</h2>
                {g.description && <p className="mt-2 text-sm leading-relaxed text-slate-600">{g.description}</p>}
                <ul className="mt-6 flex flex-wrap gap-2" aria-label="Models">
                  {g.models.map((m) => (
                    <li
                      key={m}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs font-semibold text-navy-900 transition-colors group-hover:border-steel-500/20"
                    >
                      {m}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
        {content.equipment.partsNote && (
          <Reveal className="mt-8">
            <p className="flex gap-3 rounded-2xl border border-steel-500/20 bg-steel-500/5 p-5 text-sm leading-relaxed text-slate-700">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-steel-600" aria-hidden />
              {content.equipment.partsNote}
            </p>
          </Reveal>
        )}
      </Section>

      <Section tone="muted" aria-label="Parts sourcing">
        <SectionHeader
          eyebrow="Parts sourcing"
          title="Spare Parts Sourcing Capability"
          description={content.equipment.partsDescription}
          action={{ href: "/products?category=spare-parts", label: "Browse spare parts" }}
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {partsSourcing.map((g, i) => (
            <Reveal key={g.brand} delay={i * 60} className="h-full">
              <article className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-label={`${g.brand} parts`}>
                <h3 className="text-lg font-bold text-navy-900">{g.brand}</h3>
                <ul className="mt-4 divide-y divide-slate-100 text-sm text-slate-600">
                  {g.models.map((m) => (
                    <li key={m} className="py-2 first:pt-0 last:pb-0">
                      {m}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBanner
        title="Don't see your machine listed?"
        description="CLM supports a wide range of semiconductor and manufacturing equipment. Send us the model and the issue."
      >
        <Link href="/contact" className={cn(buttonVariants({ size: "lg", variant: "primary" }), "shadow-lg shadow-steel-500/25")}>
          Ask CLM <ArrowRight aria-hidden />
        </Link>
      </CtaBanner>
    </>
  );
}
