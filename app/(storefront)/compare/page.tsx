import Link from "next/link";
import type { Metadata } from "next";
import { GitCompareArrows } from "lucide-react";
import { prisma } from "@/lib/db";
import { ComparisonPageClient } from "@/components/storefront/comparison-page-client";
import { CatalogHeader } from "@/components/storefront/catalog-header";
import type { ComparisonProduct } from "@/components/storefront/comparison-table";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Compare Products",
  robots: { index: false, follow: true },
};

const MAX_COMPARE = 4;

async function getProductsByIds(ids: string[]): Promise<ComparisonProduct[]> {
  if (ids.length === 0) return [];
  try {
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, published: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        referenceCode: true,
        model: true,
        partNumber: true,
        manufacturer: true,
        shortDescription: true,
        condition: true,
        availability: true,
        specifications: true,
        category: { select: { name: true } },
        images: {
          orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
          take: 1,
          select: { url: true, alt: true },
        },
      },
    });
    // Keep the order the visitor picked them in (the query returns arbitrary order).
    const rank = new Map(ids.map((id, i) => [id, i]));
    return (products as ComparisonProduct[]).sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  } catch (error) {
    console.error("Failed to fetch comparison products:", error);
    return [];
  }
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const params = await searchParams;
  const urlIds = [...new Set((params.ids ?? "").split(",").map((s) => s.trim()))]
    .filter((s) => /^[A-Za-z0-9_-]{1,64}$/.test(s))
    .slice(0, MAX_COMPARE);

  const products = urlIds.length > 0 ? await getProductsByIds(urlIds) : [];

  return (
    <>
      <CatalogHeader
        title="Compare Products"
        description="Review up to four products side by side. Rows where the products differ are highlighted."
        count={products.length || undefined}
        crumbs={[{ label: "Products", href: "/products" }, { label: "Compare" }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {products.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border-2 border-dashed border-slate-200 px-6 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-steel-500/10 text-steel-600">
              <GitCompareArrows className="h-7 w-7" aria-hidden />
            </span>
            <h2 className="mt-5 text-xl font-bold text-navy-900">
              {urlIds.length > 0 ? "These products are no longer available" : "Nothing to compare yet"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Use the <span className="font-semibold text-navy-900">+</span> button on any product card to add up to{" "}
              {MAX_COMPARE} products, then open the comparison from the bar at the bottom of the screen.
            </p>
            <Link href="/products" className={buttonVariants({ className: "mt-6" })}>
              Browse products
            </Link>
          </div>
        ) : (
          <ComparisonPageClient products={products} />
        )}
      </div>
    </>
  );
}
