import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { prisma } from "@/lib/db";
import { AVAILABILITY_LABELS, CONDITION_LABELS, PAGE_SIZE } from "@/lib/catalog";
import { getCatalogFacets, getCatalogPage, type ProductCardData } from "@/lib/catalog-queries";
import { AVAILABILITY_VALUES, CONDITION_VALUES, catalogParamsSchema } from "@/lib/validators";
import { ProductCard } from "@/components/storefront/product-card";
import { CategoryTabs } from "@/components/storefront/category-tabs";
import { EmptyState } from "@/components/storefront/empty-state";
import { Reveal } from "@/components/storefront/reveal";
import { Input } from "@/components/ui/form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Dynamic (reads searchParams), but each filter combination's page + count is
// served from a 5-minute tagged cache (lib/catalog-queries.ts) and busted on
// any admin product/category change.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Products",
  description:
    "Browse CLM Electronics Engineering Services products: equipment, spare parts, manufacturing consumables, ESD materials, and office supplies. Information and inquiry only.",
  alternates: { canonical: "/products" },
};

type SearchParams = Record<string, string | string[] | undefined>;

function buildLink(base: Record<string, string>, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  const merged = { ...base, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v);
  }
  const s = params.toString();
  return s ? `/products?${s}` : "/products";
}

type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
};

const CONDITIONS = CONDITION_VALUES;
const AVAILABILITIES = AVAILABILITY_VALUES;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const sp = catalogParamsSchema.parse({
    q: first(raw.q),
    category: first(raw.category),
    manufacturer: first(raw.manufacturer),
    condition: first(raw.condition),
    availability: first(raw.availability),
    page: first(raw.page),
  });
  const { q, condition, availability, page } = sp;
  const categoryParam = sp.category;
  const manufacturerParam = sp.manufacturer;

  let products: ProductCardData[] = [];
  let total = 0;
  let categories: CategoryWithCount[] = [];
  let manufacturers: string[] = [];
  let dbOnline = true;
  let categoryMissing = false;
  let categoryId: string | null = null;

  if (categoryParam) {
    try {
      const cat = await prisma.category.findFirst({
        where: { OR: [{ slug: categoryParam }, { id: categoryParam }] },
        select: { id: true },
      });
      if (!cat) categoryMissing = true;
      else categoryId = cat.id;
    } catch (e) {
      console.error("Category lookup failed", e);
      dbOnline = false;
    }
  }

  if (categoryMissing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <EmptyState title="Category not found" text="The category you are looking for does not exist." />
      </div>
    );
  }

  if (dbOnline) {
    try {
      const [pageData, facets] = await Promise.all([
        getCatalogPage({
          q,
          categoryId,
          manufacturer: manufacturerParam,
          condition,
          availability,
          page,
          pageSize: PAGE_SIZE,
        }),
        getCatalogFacets(),
      ]);
      products = pageData.products;
      total = pageData.total;
      categories = facets.categories;
      manufacturers = facets.manufacturers;
    } catch (e) {
      console.error("Catalog query failed", e);
      dbOnline = false;
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const base: Record<string, string> = {};
  if (q) base.q = q;
  if (categoryParam) base.category = categoryParam;
  if (manufacturerParam) base.manufacturer = manufacturerParam;
  if (condition) base.condition = condition;
  if (availability) base.availability = availability;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-navy-900 sm:text-3xl">
          Products{" "}
          {total > 0 && (
            <span className="ml-2 rounded-full bg-navy-900/10 px-2.5 py-0.5 align-middle text-xs font-bold text-navy-900">
              {total}
            </span>
          )}
        </h1>
        {q && (
          <p className="text-sm text-slate-500">
            Results for <span className="font-semibold text-navy-900">“{q}”</span>
          </p>
        )}
      </div>

      {/* Category tabs — single scrollable line with side arrows */}
      <CategoryTabs
        links={[
          {
            key: "all",
            label: "All",
            href: buildLink(base, { category: undefined, page: undefined }),
            active: !categoryParam,
          },
          ...categories.map((c) => ({
            key: c.id,
            label: c.name,
            href: buildLink(base, { category: c.slug, page: undefined }),
            active: categoryParam === c.slug,
            count: c._count.products,
          })),
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden self-start lg:sticky lg:top-[76px] lg:block">
          <FilterPanel
            base={base}
            manufacturerParam={manufacturerParam}
            manufacturers={manufacturers}
            condition={condition}
            availability={availability}
          />
        </aside>

        <div className="min-w-0 space-y-4">
          {/* Single horizontal line: filter (leftmost) + search bar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Filter leftmost (mobile only, desktop uses sidebar) */}
            <details className="relative shrink-0 lg:hidden">
              <summary
                aria-label="Toggle filters"
                className="relative flex cursor-pointer list-none items-center rounded border border-slate-300 bg-white p-2.5 text-navy-900 hover:border-navy-900 [&::-webkit-details-marker]:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                {(manufacturerParam || condition || availability) && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-navy-900 px-1 text-[11px] font-bold text-white">
                    {[manufacturerParam, condition, availability].filter(Boolean).length}
                  </span>
                )}
              </summary>
              <div className="absolute left-0 top-full z-30 mt-2 w-[280px] max-w-[80vw] shadow-lg">
                <FilterPanel
                  base={base}
                  manufacturerParam={manufacturerParam}
                  manufacturers={manufacturers}
                  condition={condition}
                  availability={availability}
                />
              </div>
            </details>
            <form action="/products" method="get" className="flex min-w-0 flex-1 gap-1.5 sm:gap-2" role="search">
              {categoryParam && <input type="hidden" name="category" value={categoryParam} />}
              {manufacturerParam && <input type="hidden" name="manufacturer" value={manufacturerParam} />}
              {condition && <input type="hidden" name="condition" value={condition} />}
              {availability && <input type="hidden" name="availability" value={availability} />}
              <Input name="q" defaultValue={q} placeholder="Search products…" aria-label="Search products" className="min-w-0 flex-1" />
              <Button type="submit" aria-label="Search" className="shrink-0 px-3 sm:px-4">
                <Search className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Search</span>
              </Button>
            </form>
          </div>

          {(q || manufacturerParam || condition || availability) && (
            <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {total} result{total === 1 ? "" : "s"}
              </span>
              {[
                q && { key: "q", label: `“${q}”` },
                manufacturerParam && { key: "manufacturer", label: manufacturerParam },
                condition && { key: "condition", label: CONDITION_LABELS[condition] ?? condition },
                availability && { key: "availability", label: AVAILABILITY_LABELS[availability] ?? availability },
              ]
                .filter((c): c is { key: string; label: string } => !!c)
                .map((c) => (
                  <Link
                    key={c.key}
                    href={buildLink(base, { [c.key]: undefined, page: undefined })}
                    className="group inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-navy-900 transition-colors hover:border-navy-900 hover:bg-slate-50"
                    aria-label={`Remove filter ${c.label}`}
                  >
                    {c.label}
                    <X className="h-3 w-3 text-slate-500 transition-colors group-hover:text-navy-900" aria-hidden="true" />
                  </Link>
                ))}
              <Link href={categoryParam ? buildLink({}, { category: categoryParam }) : "/products"} className="text-xs font-semibold text-steel-600 hover:underline">
                Clear all
              </Link>
            </div>
          )}

          {!dbOnline ? (
            <EmptyState
              title="Catalog unavailable"
              text="The product database is not connected yet. Please check back later or contact CLM directly."
            />
          ) : products.length === 0 ? (
            <EmptyState
              title={q ? "No matches found" : "No products yet"}
              text="Try clearing filters or searching a different reference code, model, or part number."
            />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-3">
              {products.map((p, i) => (
                <Reveal key={p.id} delay={Math.min(i * 40, 200)} className="[&>*]:h-full">
                  <ProductCard product={p} morph />
                </Reveal>
              ))}
            </div>
          )}

          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            baseUrl="/products" 
            searchParams={{ 
              q, 
              category: categoryParam, 
              manufacturer: manufacturerParam, 
              condition, 
              availability 
            }}
            variant="storefront"
          />
        </div>
      </div>
    </div>
  );
}

function FilterPanel({
  base,
  manufacturerParam,
  manufacturers,
  condition,
  availability,
}: {
  base: Record<string, string>;
  manufacturerParam: string;
  manufacturers: string[];
  condition: string;
  availability: string;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-navy-900">Manufacturer</p>
        <div className="mt-1 max-h-40 space-y-1 overflow-y-auto pr-1">
          <Link href={buildLink(base, { manufacturer: undefined, page: undefined })} className={cn("block rounded px-2 py-1 text-sm", !manufacturerParam ? "bg-slate-100 font-semibold" : "hover:bg-slate-50")}>All</Link>
          {manufacturers.map((m) => (
            <Link key={m} href={buildLink(base, { manufacturer: m, page: undefined })} className={cn("block truncate rounded px-2 py-1 text-sm", manufacturerParam === m ? "bg-navy-900 text-white" : "hover:bg-slate-50")}>{m}</Link>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-navy-900">Condition</p>
        <div className="mt-1 flex flex-wrap gap-1">
          <Link href={buildLink(base, { condition: undefined, page: undefined })} className={cn("rounded border px-2 py-1 text-xs", !condition ? "border-navy-900 bg-navy-900 text-white" : "hover:bg-slate-50")}>Any</Link>
          {CONDITIONS.map((c) => (
            <Link key={c} href={buildLink(base, { condition: c, page: undefined })} className={cn("rounded border px-2 py-1 text-xs", condition === c ? "border-navy-900 bg-navy-900 text-white" : "hover:bg-slate-50")} aria-current={condition === c ? "true" : undefined}>{CONDITION_LABELS[c] ?? c}</Link>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-navy-900">Availability</p>
        <div className="mt-1 flex flex-wrap gap-1">
          <Link href={buildLink(base, { availability: undefined, page: undefined })} className={cn("rounded border px-2 py-1 text-xs", !availability ? "border-navy-900 bg-navy-900 text-white" : "hover:bg-slate-50")}>Any</Link>
          {AVAILABILITIES.map((a) => (
            <Link key={a} href={buildLink(base, { availability: a, page: undefined })} className={cn("rounded border px-2 py-1 text-xs", availability === a ? "border-navy-900 bg-navy-900 text-white" : "hover:bg-slate-50")} aria-current={availability === a ? "true" : undefined}>{AVAILABILITY_LABELS[a] ?? a}</Link>
          ))}
        </div>
      </div>
      <Link href="/products" className={buttonVariants({ variant: "outline", size: "sm", className: "w-full" })}>Clear all filters</Link>
    </div>
  );
}
