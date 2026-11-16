import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, MapPin } from "lucide-react";
import { getSiteContent } from "@/lib/site-content";
import { ProfilePageHero, ProfileCard } from "@/components/profile/profile-ui";
import { CtaBanner, Eyebrow, Section } from "@/components/storefront/blocks";
import { Reveal } from "@/components/storefront/reveal";
import LegalDocuments from "@/components/profile/legal-documents";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ISR: cached HTML served instantly; admin edits revalidate this path.
export const revalidate = 3600;

export const metadata = {
  title: "About CLM",
  description:
    "CLM Electronics Engineering Services — established January 10, 2023 in Muntinlupa City, Philippines. Services and solutions for semiconductor and manufacturing industries.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const content = await getSiteContent();
  const company = content.company;

  const facts = [
    { icon: CalendarDays, label: "Established", value: company.established },
    { icon: Building2, label: "Industry", value: company.industry },
    { icon: MapPin, label: "Location", value: "Muntinlupa City, Philippines" },
  ].filter((f) => f.value);

  return (
    <>
      <ProfilePageHero
        eyebrow="About CLM"
        title={content.about.heroTitle}
        description={content.about.heroDescription}
        image="/images/team.webp"
      />

      <Section aria-label="Company overview">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <Reveal>
            <Eyebrow>Company overview</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">Who We Are</h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">{company.aboutIntro}</p>
            {company.afterSales && <p className="mt-4 text-pretty leading-relaxed text-slate-600">{company.afterSales}</p>}
            <dl className="mt-8 grid gap-3 sm:grid-cols-3">
              {facts.map((f) => (
                <div key={f.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <f.icon className="h-5 w-5 text-steel-600" aria-hidden />
                  <dt className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">{f.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-navy-900">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal variant="right" delay={100}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl shadow-navy-900/20">
              <Image
                src="/images/board-service.webp"
                alt="CLM technician repairing an equipment control board"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-2" aria-label="Mission and vision">
          <Reveal className="h-full">
            <ProfileCard eyebrow="What drives us" title="Our Mission">
              <p>{company.mission}</p>
            </ProfileCard>
          </Reveal>
          <Reveal delay={100} className="h-full">
            <ProfileCard eyebrow="Where we are going" title="Our Vision">
              <p>{company.vision}</p>
            </ProfileCard>
          </Reveal>
        </div>
      </Section>

      <Section tone="muted">
        <Reveal>
          <LegalDocuments description={content.about.legalDescription} />
        </Reveal>
      </Section>

      <CtaBanner
        title="Let's keep your equipment running"
        description="Talk to CLM about technical support, maintenance, board repair, or spare parts sourcing."
      >
        <Link href="/contact" className={cn(buttonVariants({ size: "lg", variant: "primary" }), "shadow-lg shadow-steel-500/25")}>
          Contact CLM <ArrowRight aria-hidden />
        </Link>
        <Link
          href="/services"
          className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-white/25 bg-white/5 text-white hover:bg-white hover:text-navy-900")}
        >
          Our services
        </Link>
      </CtaBanner>
    </>
  );
}
