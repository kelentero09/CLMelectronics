import Link from "next/link";
import { getCatalogFacets } from "@/lib/catalog-queries";
import { Card, CardContent } from "@/components/ui/card";
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
};

export default async function CategoriesPage() {
  const facets = await getCatalogFacets();
  const categories: CategoryCard[] = facets.categories;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Reveal>
      <h1 className="text-2xl font-bold uppercase tracking-tight text-navy-900 sm:text-3xl">Categories</h1>
      </Reveal>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => (
          <Reveal key={c.id} delay={Math.min(i * 60, 300)} className="[&>*]:h-full">
          <Link href={`/categories/${c.slug}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent>
                <h2 className="font-bold text-navy-900">{c.name}</h2>
                {c.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.description}</p>}
                <p className="mt-2 text-xs font-semibold text-steel-600">
                  {c._count.products} product{c._count.products === 1 ? "" : "s"} →
                </p>
              </CardContent>
              </Card>
            </Link>
          </Reveal>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-slate-500">Categories are not available yet.</p>
        )}
      </div>
    </div>
  );
}
