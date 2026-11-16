import Link from "next/link";
import { ArrowRight, Boxes, Cog, FlaskConical, Layers, Package, ShieldCheck } from "lucide-react";
import { getCatalogFacets } from "@/lib/catalog-queries";
import { PageHero } from "@/components/storefront/blocks";
import { Reveal } from "@/components/storefront/reveal";

// Static + ISR: facets are pre-cached for 5 minutes, so this page builds
// and serves without any live aggregation.
export const revalidate = 3600;

type CategoryCard = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { products: number };
};

export const metadata = {
  title: "Categories",
  description: "Browse CLM product categories: equipment, spare parts, manufacturing consumables, ESD materials, and office supplies.",
  alternates: { canonical: "/categories" },
};

const ICONS: Record<string, typeof Cog> = {
  equipment: Cog,
  "spare-parts": Package,
  "manufacturing-consumables": FlaskConical,
  "esd-materials": ShieldCheck,
  "office-supplies": Layers,
};

export default async function CategoriesPage() {
  const facets = await getCatalogFacets();
  const categories: CategoryCard[] = facets.categories;
  const total = categories.reduce((n, c) => n + c._count.products, 0);

  return (
    <>
      <PageHero
        eyebrow="Catalog"
        title="Product Categories"
        description="Equipment, spare parts, consumables and materials for semiconductor and manufacturing operations. Information and inquiry only."
        crumbs={[{ label: "Categories" }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        {categories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Categories are not available yet.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => {
              const Icon = ICONS[c.slug] ?? Boxes;
              return (
                <Reveal key={c.id} delay={i * 60} className="[&>*]:h-full">
                  <Link
                    href={`/categories/${c.slug}`}
                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-1 hover:border-steel-500/30 hover:shadow-xl motion-reduce:hover:translate-y-0"
                  >
                    <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-steel-500/5 transition-transform duration-500 group-hover:scale-150" />
                    <div className="flex items-start justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 text-accent-400 shadow-md shadow-navy-900/20">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tabular-nums text-slate-600">
                        {c._count.products} product{c._count.products === 1 ? "" : "s"}
                      </span>
                    </div>
                    <h2 className="mt-6 text-xl font-bold tracking-tight text-navy-900">{c.name}</h2>
                    {c.description && <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">{c.description}</p>}
                    <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-steel-600">
                      View products
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
            <Reveal delay={categories.length * 60} className="[&>*]:h-full">
              <Link
                href="/products"
                className="group flex flex-col justify-between rounded-3xl bg-navy-950 p-7 text-white shadow-sm transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:hover:translate-y-0"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-400">Full catalog</p>
                  <h2 className="mt-3 text-xl font-bold tracking-tight">Browse all {total} products</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">Search by name, reference code, model or part number.</p>
                </div>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-400">
                  View all products
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </Reveal>
          </div>
        )}
      </div>
    </>
  );
}
