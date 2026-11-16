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
import { prisma } from "@/lib/db";
import { getSiteContent } from "@/lib/site-content";
import { productCardSelect, type ProductCardData } from "@/lib/catalog-queries";
import { ProductCard } from "@/components/storefront/product-card";
import { Reveal } from "@/components/storefront/reveal";
import {
  BrandStrip,
  CheckList,
  CtaBanner,
  Eyebrow,
  FeatureCard,
  Section,
  SectionHeader,
  StatRow,
  TextLink,
} from "@/components/storefront/blocks";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ISR: HTML is cached and served instantly; admin content/product edits
// revalidate this path, so updates appear immediately while repeat visits
// skip the database entirely.
export const revalidate = 300;

export const metadata = {
  title: "CLM Electronics Engineering Services | Semiconductor & Manufacturing Solutions",
  description:
    "CLM Electronics Engineering Services provides technical support, equipment services, maintenance, repair, spare parts sourcing, and engineering solutions for semiconductor and manufacturing industries.",
  alternates: { canonical: "/" },
};

const fallbackCapabilityCards = [
  { title: "Technical Support", text: "Technical assessment, minor and major repair, and responsive technical support." },
  { title: "Preventive & Predictive Maintenance", text: "Scheduled maintenance programs and equipment support that sustain machine condition." },
  { title: "Equipment Support", text: "Technical services for semiconductor manufacturing equipment and sub-assemblies." },
  { title: "Parts & Components", text: "Machine spare parts sourcing and installation according to customer requirements." },
  { title: "Board Repair", text: "Repair support for various electronic and equipment control boards." },
  { title: "Technical Training", text: "Machine operation, setup, maintenance, calibration, and technical training." },
];

const fallbackBoardTypes = ["Main boards", "Driver boards", "Power supplies", "CPU boards", "Logic boards", "Servo / driver boards"];

const fallbackWhyClm = [
  { title: "Quality Service", text: "Focus on quality products, support, and services in every engagement." },
  { title: "Reliable Technical Support", text: "Responsive technical assistance and equipment support when it matters." },
  { title: "After-Sales Support", text: "Continued, accountable support after service and installation." },
  { title: "Industry-Focused Expertise", text: "Experience focused on semiconductor and manufacturing equipment." },
];

const fallbackProfilePoints = [
  "Established January 10, 2023",
  "Semiconductor and manufacturing focus",
  "Technical and engineering services",
  "Quality and reliable service",
  "Long-term customer relationships",
  "Accountable after-sales support",
];

const capabilityIcons = [Wrench, CalendarCheck, Cog, Package, CircuitBoard, GraduationCap];
const whyIcons = [ShieldCheck, Headphones, Award, Factory];

export default async function CompanyProfileHomePage() {
  const content = await getSiteContent();
  const company = content.company;

  const capabilityCards = (content.home.capabilityCards.length > 0 ? content.home.capabilityCards : fallbackCapabilityCards).map(
    (c, i) => ({ ...c, icon: capabilityIcons[i % capabilityIcons.length] })
  );
  const whyClm = (content.home.whyCards.length > 0 ? content.home.whyCards : fallbackWhyClm).map((w, i) => ({
    ...w,
    icon: whyIcons[i % whyIcons.length],
  }));
  const profilePoints = content.home.profilePoints.length > 0 ? content.home.profilePoints : fallbackProfilePoints;
  const boardTypes = content.home.boardTypes.length > 0 ? content.home.boardTypes : fallbackBoardTypes;

  const establishedYear = company.established.match(/\d{4}/)?.[0];
  const stats = [
    establishedYear && { value: establishedYear, label: "Established" },
    content.equipment.groups.length > 0 && { value: String(content.equipment.groups.length), label: "Equipment lines" },
    content.services.categories.length > 0 && { value: String(content.services.categories.length), label: "Service areas" },
  ].filter((s): s is { value: string; label: string } => !!s);

  let featured: ProductCardData[] = [];
  try {
    featured = await prisma.product.findMany({
      where: { published: true, deletedAt: null },
      select: productCardSelect,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 4,
    });
  } catch (e) {
    console.error("Homepage featured products query failed", e);
  }

  const primaryPhone = company.phones[0];

  return (
    <div className="overflow-x-clip">
      {/* 1. HERO: full-bleed lab photo faded into navy */}
      <section className="relative isolate overflow-hidden bg-navy-950" aria-label="CLM introduction">
        <Image
          src="/images/hero-lab.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-right opacity-70"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-950/20" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-950 via-transparent to-navy-950/40" />
        <div aria-hidden className="blueprint-grid absolute inset-0 -z-10 opacity-60 [mask-image:linear-gradient(to_right,black,transparent_70%)]" />

        <div className="mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24 lg:pb-24 lg:pt-32">
          <div className="max-w-2xl animate-fade-up">
            {content.home.heroBadge && (
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-accent-400 backdrop-blur sm:px-4 sm:text-xs sm:tracking-[0.18em]">
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-400" />
                </span>
                {content.home.heroBadge}
              </p>
            )}
            <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {content.home.heroTitle}
            </h1>
            {content.home.heroSubtitle && (
              <p className="mt-5 text-balance text-lg font-semibold text-accent-400 sm:text-2xl">{content.home.heroSubtitle}</p>
            )}
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">{company.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/services" className={cn(buttonVariants({ size: "lg", variant: "primary" }), "shadow-lg shadow-steel-500/25")}>
                Explore Our Services <ArrowRight aria-hidden />
              </Link>
              <Link
                href="/products"
                className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-white/25 bg-white/5 text-white backdrop-blur hover:bg-white hover:text-navy-900")}
              >
                Browse Products
              </Link>
            </div>
          </div>

          {stats.length > 0 && (
            <div className="mt-14 max-w-xl animate-fade-up [animation-delay:150ms]">
              <StatRow stats={stats} dark />
            </div>
          )}
        </div>
      </section>

      {/* 2. BRANDS */}
      <section className="border-b border-slate-200/70 bg-white" aria-label="Equipment brands">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <Reveal>
            <BrandStrip />
          </Reveal>
        </div>
      </section>

      {/* 3. CAPABILITIES */}
      <Section aria-label="What CLM does">
        <SectionHeader
          eyebrow="Capabilities"
          title="What CLM Does"
          description={content.home.capabilitiesDescription}
          action={{ href: "/services", label: "View all services" }}
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilityCards.map((c, i) => (
            <Reveal key={c.title} delay={i * 60} className="h-full">
              <FeatureCard icon={c.icon} title={c.title} text={c.text} index={i} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 4. FEATURED PRODUCTS */}
      <Section tone="muted" aria-label="Products and technical solutions">
        <SectionHeader
          eyebrow="Products"
          title="Products & Technical Solutions"
          description={content.home.productsDescription}
          action={{ href: "/products", label: "View all products" }}
        />
        {featured.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={i * 60} className="[&>*]:h-full">
                <ProductCard product={p} morph />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
            Product highlights are currently unavailable. Browse the full catalog for equipment, spare parts, consumables, and materials.
          </p>
        )}
      </Section>

      {/* 5. COMPANY PROFILE: photo + story + mission/vision */}
      <Section aria-label="Company profile">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal variant="left" className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-2xl shadow-navy-900/20 sm:aspect-[5/4] lg:aspect-[4/5]">
              <Image
                src="/images/team.webp"
                alt="CLM engineer inspecting a wire bonder under a microscope"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent" />
            </div>
            {establishedYear && (
              <div className="absolute -bottom-6 left-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xl sm:left-auto sm:right-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Serving industry since</p>
                <p className="text-3xl font-bold tracking-tight text-navy-900">{establishedYear}</p>
              </div>
            )}
          </Reveal>
          <div>
            <Reveal>
              <Eyebrow>Company profile</Eyebrow>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">Who CLM Is</h2>
              {content.home.profileDescription && (
                <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">{content.home.profileDescription}</p>
              )}
            </Reveal>
            <Reveal delay={80}>
              <CheckList items={profilePoints} columns={2} className="mt-8" />
            </Reveal>
            <Reveal delay={120} className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Mission", text: company.mission },
                { label: "Vision", text: company.vision },
              ]
                .filter((m) => m.text)
                .map((m) => (
                  <article key={m.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-steel-600">{m.label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{m.text}</p>
                  </article>
                ))}
            </Reveal>
            <Reveal delay={160} className="mt-8">
              <TextLink href="/about">Learn more about CLM</TextLink>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* 6. EQUIPMENT + BOARD REPAIR (dark) */}
      <Section tone="dark" aria-label="Equipment expertise and board repair">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <Eyebrow dark>Equipment</Eyebrow>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Semiconductor Equipment Expertise
            </h2>
            {content.home.equipmentDescription && (
              <p className="mt-4 text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">{content.home.equipmentDescription}</p>
            )}
            <ul className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Equipment categories">
              {content.equipment.groups.map((g) => (
                <li
                  key={g.id}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:border-accent-400/40 hover:bg-white/[0.07]"
                >
                  <p className="text-sm font-bold text-white">{g.brand}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{g.label}</p>
                </li>
              ))}
            </ul>
            <TextLink href="/equipment" dark className="mt-8">
              Explore equipment expertise
            </TextLink>
          </Reveal>

          <Reveal delay={100} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
            <div className="relative aspect-[16/9]">
              <Image
                src="/images/board-service.webp"
                alt="Technician repairing a control board at an electronics workbench"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/20 to-transparent" />
            </div>
            <div className="p-6 sm:p-8">
              <Eyebrow dark>Board repair</Eyebrow>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-white">Board Repair Services</h3>
              {content.home.boardDescription && (
                <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">{content.home.boardDescription}</p>
              )}
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Board types">
                {boardTypes.map((b) => (
                  <li key={b} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                    {b}
                  </li>
                ))}
              </ul>
              <TextLink href="/board-repair" dark className="mt-6">
                View board repair capability
              </TextLink>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 7. WHY CLM */}
      <Section aria-label="Why CLM">
        <SectionHeader eyebrow="Why CLM" title="A Dependable Engineering Partner" description={content.home.whyDescription} align="center" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {whyClm.map((w, i) => (
            <Reveal key={w.title} delay={i * 60} className="h-full">
              <FeatureCard icon={w.icon} title={w.title} text={w.text} tone="soft" />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 8. CTA + CONTACT */}
      <CtaBanner title={content.home.ctaTitle} description={content.home.ctaDescription}>
        <Link href="/contact" className={cn(buttonVariants({ size: "lg", variant: "primary" }), "shadow-lg shadow-steel-500/25")}>
          Contact CLM <ArrowRight aria-hidden />
        </Link>
        {primaryPhone && (
          <a
            href={`tel:${primaryPhone.replace(/[^\d+]/g, "")}`}
            className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-white/25 bg-white/5 text-white hover:bg-white hover:text-navy-900")}
          >
            <Phone aria-hidden /> {primaryPhone}
          </a>
        )}
      </CtaBanner>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6" aria-label="Company contact information">
        <Reveal className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: MapPin, label: "Visit", value: company.address },
            { icon: Phone, label: "Call", value: company.phonesDisplay, href: primaryPhone ? `tel:${primaryPhone.replace(/[^\d+]/g, "")}` : undefined },
            { icon: Mail, label: "Email", value: company.email, href: `mailto:${company.email}` },
          ]
            .filter((c) => c.value)
            .map((c) => {
              const inner = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-steel-500/10 text-steel-600">
                    <c.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">{c.label}</span>
                    <span className="mt-0.5 block break-words text-sm font-medium text-navy-900">{c.value}</span>
                  </span>
                </>
              );
              const cls = "flex h-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-[border-color,box-shadow] duration-200";
              return c.href ? (
                <a key={c.label} href={c.href} className={cn(cls, "hover:border-steel-500/40 hover:shadow-md")}>
                  {inner}
                </a>
              ) : (
                <div key={c.label} className={cls}>
                  {inner}
                </div>
              );
            })}
        </Reveal>
      </section>
    </div>
  );
}
