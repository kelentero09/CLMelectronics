import Link from "next/link";
import { ArrowRight, BadgeCheck, ExternalLink } from "lucide-react";
import { getSiteContent } from "@/lib/site-content";
import { getManufacturerCounts } from "@/lib/catalog-queries";
import { CtaBanner, PageHero } from "@/components/storefront/blocks";
import { Reveal } from "@/components/storefront/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ISR: cached HTML served instantly; admin edits revalidate this path.
export const revalidate = 3600;

export const metadata = {
  title: "Brands",
  description: "Partner brands whose equipment, spare parts and consumables are available through CLM Electronics Engineering Services.",
  alternates: { canonical: "/brands" },
};

export default async function BrandsPage() {
  const [content, counts] = await Promise.all([getSiteContent(), getManufacturerCounts()]);
  const brands = content.brands.partners;

  return (
    <>
      <PageHero
        eyebrow="Brands"
        title={content.brands.heroTitle}
        description={content.brands.heroDescription}
        crumbs={[{ label: "Brands" }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        {brands.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Partner brands will be listed here soon.
          </p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {brands.map((b, i) => {
              const count = b.manufacturer ? counts[b.manufacturer] ?? 0 : 0;
              return (
                <Reveal key={b.id} delay={i * 60} className="h-full">
                  <article
                    id={b.id}
                    aria-label={b.name}
                    className="flex h-full scroll-mt-24 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {b.logo ? (
                        // Uploaded logos are small WebP files served from /media, so no optimizer is needed.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.logo} alt={`${b.name} logo`} loading="lazy" className="h-12 w-auto max-w-[200px] object-contain" />
                      ) : (
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-steel-600">Brand</p>
                      )}
                      {b.authorized && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          <BadgeCheck className="h-4 w-4" aria-hidden />
                          Authorized Dealer
                        </span>
                      )}
                    </div>
                    <h2 className="mt-4 text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">{b.name}</h2>
                    {b.description && <p className="mt-2 text-sm leading-relaxed text-slate-600">{b.description}</p>}
                    {b.lines.length > 0 && (
                      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Product lines">
                        {b.lines.map((l) => (
                          <li key={l} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-navy-900">
                            {l}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-6">
                      {count > 0 ? (
                        <Link
                          href={`/products?manufacturer=${encodeURIComponent(b.manufacturer)}`}
                          className={cn(buttonVariants({ size: "sm" }))}
                        >
                          View {count} product{count === 1 ? "" : "s"} <ArrowRight aria-hidden />
                        </Link>
                      ) : (
                        <Link href="/contact" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
                          Inquire about this brand <ArrowRight aria-hidden />
                        </Link>
                      )}
                      {b.website && (
                        <a
                          href={b.website}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-steel-600 hover:text-navy-900"
                        >
                          Brand website <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </a>
                      )}
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      <CtaBanner
        title="Looking for a specific item?"
        description="Send us the brand, model or part number and CLM will confirm details and availability."
      >
        <Link href="/contact" className={cn(buttonVariants({ size: "lg", variant: "primary" }), "shadow-lg shadow-steel-500/25")}>
          Contact CLM <ArrowRight aria-hidden />
        </Link>
      </CtaBanner>
    </>
  );
}
