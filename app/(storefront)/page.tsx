import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CalendarCheck,
  CircuitBoard,
  Cog,
  Factory,
  GraduationCap,
  Headphones,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { company } from "@/data/company";
import { equipmentGroups } from "@/data/equipment";
import { ProductCard } from "@/components/storefront/product-card";
import { Reveal } from "@/components/storefront/reveal";
import { ProfileSectionHeader } from "@/components/profile/profile-ui";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "CLM Electronics Engineering Services | Semiconductor & Manufacturing Solutions",
  description:
    "CLM Electronics Engineering Services provides technical support, equipment services, maintenance, repair, spare parts sourcing, and engineering solutions for semiconductor and manufacturing industries.",
};

type FeaturedProduct = Prisma.ProductGetPayload<{
  include: { category: { select: { name: true } }; images: true };
}>;

const capabilityCards = [
  {
    icon: Wrench,
    title: "Technical Support",
    text: "Technical assessment, minor and major repair, and responsive technical support.",
  },
  {
    icon: CalendarCheck,
    title: "Preventive & Predictive Maintenance",
    text: "Scheduled maintenance programs and equipment support that sustain machine condition.",
  },
  {
    icon: Cog,
    title: "Equipment Support",
    text: "Technical services for semiconductor manufacturing equipment and sub-assemblies.",
  },
  {
    icon: Package,
    title: "Parts & Components",
    text: "Machine spare parts sourcing and installation according to customer requirements.",
  },
  {
    icon: CircuitBoard,
    title: "Board Repair",
    text: "Repair support for various electronic and equipment control boards.",
  },
  {
    icon: GraduationCap,
    title: "Technical Training",
    text: "Machine operation, setup, maintenance, calibration, and technical training.",
  },
];

const boardTypes = [
  "Main boards",
  "Driver boards",
  "Power supplies",
  "CPU boards",
  "Logic boards",
  "Servo / driver boards",
];

const whyClm = [
  {
    icon: ShieldCheck,
    title: "Quality Service",
    text: "Focus on quality products, support, and services in every engagement.",
  },
  {
    icon: Headphones,
    title: "Reliable Technical Support",
    text: "Responsive technical assistance and equipment support when it matters.",
  },
  {
    icon: Award,
    title: "After-Sales Support",
    text: "Continued, accountable support after service and installation.",
  },
  {
    icon: Factory,
    title: "Industry-Focused Expertise",
    text: "Experience focused on semiconductor and manufacturing equipment.",
  },
];

const profilePoints = [
  "Established January 10, 2023",
  "Semiconductor and manufacturing focus",
  "Technical and engineering services",
  "Quality and reliable service",
  "Long-term customer relationships",
  "Accountable after-sales support",
];

export default async function CompanyProfileHomePage() {
  let featured: FeaturedProduct[] = [];
  try {
    featured = await prisma.product.findMany({
      where: { published: true, deletedAt: null },
      include: {
        category: { select: { name: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }], take: 1 },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 4,
    });
  } catch (e) {
    console.error("Homepage featured products query failed", e);
  }

  return (
    <div className="overflow-x-clip">
      {/* 1. HERO */}
      <section className="blueprint-grid bg-navy-950" aria-label="CLM introduction">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_auto] lg:gap-14 lg:py-28">
          <Reveal variant="left" className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-accent-400 sm:text-sm">
              Established January 10, 2023 · Muntinlupa City
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              CLM Electronics Engineering Services
            </h1>
            <p className="mt-4 text-lg font-semibold text-slate-200 sm:text-2xl">
              Technical Solutions for Semiconductor &amp; Manufacturing Industries
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              {company.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/services" className={cn(buttonVariants({ size: "lg" }), "bg-steel-500 hover:bg-steel-600")}>
                Explore Our Services <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-white/40 bg-white/10 text-white hover:bg-white hover:text-navy-900")}
              >
                Contact CLM
              </Link>
            </div>
          </Reveal>
          <Reveal variant="right" delay={120} className="mx-auto w-full max-w-xs shrink-0 sm:max-w-sm lg:mx-0 lg:max-w-md">
            <Image
              src="/hero.jpg"
              alt="Semiconductor engineer operating wire bonding equipment"
              width={480}
              height={480}
              className="h-auto w-full rounded-xl border border-white/10 object-contain shadow-2xl"
              priority
            />
          </Reveal>
        </div>
      </section>

      {/* 2. COMPANY PROFILE */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16" aria-label="Company profile">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <Reveal variant="left" className="min-w-0">
            <ProfileSectionHeader
              eyebrow="Company Profile"
              eyebrowClassName="text-sm font-bold uppercase tracking-[0.2em] text-steel-600 sm:text-base"
              title="Who CLM Is"
              description="CLM Electronics Engineering Services was established on January 10, 2023 to provide services and solutions for semiconductor and manufacturing industries. CLM builds long-term, trusted business relationships with customers through responsive, quality, and reliable technical services."
            />
            <ul className="mt-6 grid gap-2 sm:grid-cols-2" aria-label="Company highlights">
              {profilePoints.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-navy-900"
                >
                  <span aria-hidden="true" className="mt-0.5 font-bold text-steel-600">✓</span>
                  {point}
                </li>
              ))}
            </ul>
            <Link href="/about" className="mt-5 inline-block text-sm font-semibold text-steel-600 hover:underline">
              Learn more about CLM →
            </Link>
          </Reveal>
          <Reveal variant="right" delay={120} className="mx-auto w-full max-w-md min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-navy-950 shadow-sm lg:justify-self-end">
            <Image
              src="/who-clm.jpg"
              alt="CLM engineer performing board-level technical work"
              width={880}
              height={880}
              className="h-auto w-full object-contain"
              loading="lazy"
            />
            <div className="border-t border-white/10 px-5 py-4">
              <p className="text-sm font-bold text-white">{company.name}</p>
              <p className="mt-1 text-sm text-slate-300">{company.address}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. MISSION & VISION */}
      <section className="border-y border-slate-200 bg-slate-50" aria-label="Mission and vision">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 md:grid-cols-2">
          <Reveal className="h-full">
          <article className="h-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xl font-bold uppercase tracking-[0.15em] text-steel-600 sm:text-2xl">Mission</p>
            <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
              To establish total customer satisfaction through quality products, support, and services
              by providing the best and most effective quality solutions and accountable
              after-sales/service support.
            </p>
          </article>
          </Reveal>
          <Reveal delay={120} className="h-full">
          <article className="h-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xl font-bold uppercase tracking-[0.15em] text-steel-600 sm:text-2xl">Vision</p>
            <p className="mt-3 text-base leading-relaxed text-slate-700 sm:text-lg">
              We envision being one of the best suppliers in terms of sales and technical support
              services, known for quality and timely services.
            </p>
          </article>
          </Reveal>
        </div>
      </section>

      {/* 4. WHAT CLM DOES */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16" aria-label="What CLM does">
        <Reveal>
        <ProfileSectionHeader
          eyebrow="Capabilities"
          eyebrowClassName="text-sm font-bold uppercase tracking-[0.2em] text-steel-600 sm:text-base"
          title="What CLM Does"
          description="A high-level overview of CLM's capabilities. See the Services page for full details."
        />
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilityCards.map((c, i) => (
            <Reveal key={c.title} delay={Math.min(i * 80, 400)} className="h-full">
            <article className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-navy-900 text-white">
                <c.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-bold text-navy-900">{c.title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{c.text}</p>
            </article>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-8 text-center">
          <Link href="/services" className={buttonVariants({ size: "lg" })}>
            View All Services <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </section>

      {/* 5. EQUIPMENT EXPERTISE */}
      <section className="blueprint-grid bg-navy-950" aria-label="Equipment expertise">
        <Reveal className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent-400 sm:text-base">Equipment</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Semiconductor Equipment Expertise</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate-300">
            CLM services semiconductor manufacturing equipment across these major categories.
            Detailed machine models remain on the Equipment page.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Equipment categories">
            {equipmentGroups.map((g) => (
              <li
                key={g.id}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
              >
                {g.brand}
              </li>
            ))}
          </ul>
          <Link
            href="/equipment"
            className={cn(buttonVariants({ size: "lg" }), "mt-8 bg-steel-500 hover:bg-steel-600")}
          >
            Explore Equipment <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </section>

      {/* 6. BOARD REPAIR SUMMARY */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16" aria-label="Board repair services">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <Reveal variant="left" className="min-w-0">
            <ProfileSectionHeader
              eyebrow="Board repair"
              eyebrowClassName="text-sm font-bold uppercase tracking-[0.2em] text-steel-600 sm:text-base"
              title="Board Repair Services"
              description="CLM provides board repair capabilities for equipment-related electronic boards, based on technical capability and available resources."
            />
            <ul className="mt-5 grid grid-cols-2 gap-2" aria-label="Supported board types">
              {boardTypes.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm font-medium text-navy-900">
                  <span aria-hidden="true" className="font-bold text-steel-600">✓</span> {b}
                </li>
              ))}
            </ul>
            <Link
              href="/board-repair"
              className={cn(buttonVariants({ variant: "outline" }), "mt-6")}
            >
              View Board Repair Capabilities <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>
          <Reveal variant="right" delay={120} className="flex min-w-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-10">
            <CircuitBoard className="h-24 w-24 text-navy-900" strokeWidth={1.25} aria-hidden="true" />
          </Reveal>
        </div>
      </section>

      {/* 7. PRODUCTS SUMMARY */}
      <section className="border-y border-slate-200 bg-slate-50" aria-label="Products and technical solutions">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <Reveal>
          <ProfileSectionHeader
            eyebrow="Products"
            eyebrowClassName="text-sm font-bold uppercase tracking-[0.2em] text-steel-600 sm:text-base"
            title="Products & Technical Solutions"
            description="A small selection from the CLM catalog — equipment, spare parts, and technical items. Information and inquiry only."
          />
          </Reveal>
          {featured.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
              {featured.map((p, i) => (
                <Reveal key={p.id} delay={Math.min(i * 80, 320)} className="[&>*]:h-full">
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal className="mt-6">
            <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
              Product highlights are currently unavailable. Browse the full catalog for equipment,
              spare parts, consumables, and materials.
            </p>
            </Reveal>
          )}
          <Reveal className="mt-8 text-center">
            <Link href="/products" className={buttonVariants({ size: "lg" })}>
              View Products <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* 8. WHY CLM */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16" aria-label="Why CLM">
        <Reveal>
        <ProfileSectionHeader
          eyebrow="Why CLM"
          eyebrowClassName="text-sm font-bold uppercase tracking-[0.2em] text-steel-600 sm:text-base"
          title="A Dependable Engineering Partner"
          description="What customers can expect when working with CLM Electronics Engineering Services."
        />
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {whyClm.map((w, i) => (
            <Reveal key={w.title} delay={Math.min(i * 80, 320)} className="h-full">
            <article className="h-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-steel-500/10 text-steel-600">
                <w.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-bold text-navy-900">{w.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{w.text}</p>
            </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 9. CTA */}
      <section className="blueprint-grid bg-navy-950" aria-label="Contact call to action">
        <Reveal className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <h2 className="mx-auto max-w-2xl text-2xl font-bold text-white sm:text-3xl">
            Looking for Reliable Technical &amp; Engineering Support?
          </h2>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-slate-300">
            Tell us about your equipment or service need — CLM responds with quality, reliable
            technical support and accountable after-sales service.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className={cn(buttonVariants({ size: "lg" }), "bg-steel-500 hover:bg-steel-600")}>
              Contact CLM <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/services"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-white/40 bg-white/10 text-white hover:bg-white hover:text-navy-900")}
            >
              Explore Our Services
            </Link>
          </div>
        </Reveal>
      </section>

      {/* 10. CONTACT SUMMARY */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16" aria-label="Company contact information">
        <Reveal className="grid gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-navy-900 sm:text-2xl">{company.name}</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-steel-600" aria-hidden="true" />
                <span>{company.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-steel-600" aria-hidden="true" />
                <span>09979269559 · 88384882</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-steel-600" aria-hidden="true" />
                <a href="mailto:er.canlas23@gmail.com" className="break-all underline hover:text-navy-900">
                  er.canlas23@gmail.com
                </a>
              </li>
            </ul>
          </div>
          <Link href="/contact" className={cn(buttonVariants({ size: "lg" }), "w-full lg:w-auto")}>
            Get in Touch <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
