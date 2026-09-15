import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PAGE_SIZE } from "@/lib/catalog";
import { ProductCard } from "@/components/storefront/product-card";
import { CategoryTabs } from "@/components/storefront/category-tabs";
import { EmptyState } from "@/components/storefront/empty-state";
import { Input } from "@/components/ui/form";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Product Catalog",
  description:
    "Browse CLM Electronics Engineering Services products: equipment, spare parts, manufacturing consumables, ESD materials, and office supplies. Information and inquiry only.",
};

type SearchParams = {
  q?: string;
  category?: string;
  manufacturer?: string;
  condition?: string;
  availability?: string;
  page?: string;
};

function buildLink(base: Record<string, string>, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  const merged = { ...base, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v);
  }
  const s = params.toString();
  return s ? `/?${s}` : "/";
}

type CatalogProduct = Prisma.ProductGetPayload<{
  include: { category: { select: { name: true } }; images: true };
}>;

type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
};

const CONDITIONS = ["NEW", "USED", "REFURBISHED", "SURPLUS", "FOR_PARTS"];
const AVAILABILITIES = ["IN_STOCK", "LOW_STOCK", "RESERVED", "SOLD", "UNAVAILABLE"];

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const categoryParam = sp.category ?? "";
  const manufacturerParam = sp.manufacturer ?? "";
  const condition = sp.condition ?? "";
  const availability = sp.availability ?? "";
  const page = Math.max(1, Number(sp.page || 1) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const where: Record<string, unknown> = { published: true, deletedAt: null };
  if (condition) where.condition = condition;
  if (availability) where.availability = availability;
  if (manufacturerParam) where.manufacturer = manufacturerParam;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { referenceCode: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { partNumber: { contains: q, mode: "insensitive" } },
      { manufacturer: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy: Record<string, string> = { createdAt: "desc" };

  let products: CatalogProduct[] = [];
  let total = 0;
  let categories: CategoryWithCount[] = [];
  let manufacturers: string[] = [];
  let dbOnline = true;
  let categoryMissing = false;

  if (categoryParam) {
    try {
      const cat = await prisma.category.findFirst({
        where: { OR: [{ slug: categoryParam }, { id: categoryParam }] },
        select: { id: true },
      });
      if (!cat) {
        categoryMissing = true;
      } else {
        (where as Record<string, unknown>).categoryId = cat.id;
      }
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

  try {
    const [p, t, cats, mfgs] = await Promise.all([
      prisma.product.findMany({
        where: where as never,
        include: {
          category: { select: { name: true } },
          images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }] },
        },
        orderBy: orderBy as never,
        skip,
        take: PAGE_SIZE,
      }),
      prisma.product.count({ where: where as never }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, _count: { select: { products: { where: { published: true, deletedAt: null } } } } },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.product.findMany({
        where: { published: true, deletedAt: null, manufacturer: { not: null } },
        select: { manufacturer: true },
        distinct: ["manufacturer"],
        orderBy: { manufacturer: "asc" },
        take: 100,
      }),
    ]);
    products = p;
    total = t;
    categories = cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, _count: { products: c._count.products } }));
    manufacturers = mfgs.map((m) => m.manufacturer).filter((m): m is string => !!m);
  } catch (e) {
    console.error("Catalog query failed", e);
    dbOnline = false;
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
            <form action="/" method="get" className="flex min-w-0 flex-1 gap-1.5 sm:gap-2" role="search">
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
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-center gap-2 pt-4">
              <Link
                href={buildLink(base, { page: String(Math.max(1, page - 1)) })}
                aria-disabled={page <= 1}
                className={buttonVariants({ variant: "outline", size: "sm", className: page <= 1 ? "pointer-events-none opacity-50" : "" })}
              >
                Prev
              </Link>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <Link
                href={buildLink(base, { page: String(Math.min(totalPages, page + 1)) })}
                aria-disabled={page >= totalPages}
                className={buttonVariants({ variant: "outline", size: "sm", className: page >= totalPages ? "pointer-events-none opacity-50" : "" })}
              >
                Next
              </Link>
            </nav>
          )}
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
            <Link key={c} href={buildLink(base, { condition: c, page: undefined })} className={cn("rounded border px-2 py-1 text-xs", condition === c ? "border-navy-900 bg-navy-900 text-white" : "hover:bg-slate-50")}>{c}</Link>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-navy-900">Availability</p>
        <div className="mt-1 flex flex-wrap gap-1">
          <Link href={buildLink(base, { availability: undefined, page: undefined })} className={cn("rounded border px-2 py-1 text-xs", !availability ? "border-navy-900 bg-navy-900 text-white" : "hover:bg-slate-50")}>Any</Link>
          {AVAILABILITIES.map((a) => (
            <Link key={a} href={buildLink(base, { availability: a, page: undefined })} className={cn("rounded border px-2 py-1 text-xs", availability === a ? "border-navy-900 bg-navy-900 text-white" : "hover:bg-slate-50")}>{a.replace("_", " ")}</Link>
          ))}
        </div>
      </div>
      <Link href="/" className={buttonVariants({ variant: "outline", size: "sm", className: "w-full" })}>Clear all filters</Link>
    </div>
  );
}
