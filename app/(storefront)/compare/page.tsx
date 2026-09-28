import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ComparisonPageClient } from "@/components/storefront/comparison-page-client";

const COMPARE_STORAGE_KEY = "clm_compare_products";

type ComparisonProduct = {
  id: string;
  name: string;
  slug: string;
  referenceCode: string;
  model?: string | null;
  partNumber?: string | null;
  manufacturer?: string | null;
  shortDescription?: string | null;
  condition?: string | null;
  availability: string;
  specifications?: { key: string; value: string }[] | null;
  images: { url: string; alt: string | null }[];
};

async function getProductsByIds(ids: string[]): Promise<ComparisonProduct[]> {
  if (ids.length === 0) return [];

  try {
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        published: true,
        deletedAt: null,
      },
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
        images: {
          orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
          take: 1,
          select: { url: true, alt: true },
        },
      },
    });

    return products as ComparisonProduct[];
  } catch (error) {
    console.error("Failed to fetch comparison products:", error);
    return [];
  }
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const params = await searchParams;
  const urlIds = params.ids?.split(",").filter(Boolean) || [];

  let products: ComparisonProduct[] = [];

  // Priority 1: Use URL parameters if provided
  if (urlIds.length > 0) {
    products = await getProductsByIds(urlIds);
  } else {
    // Priority 2: Fall back to localStorage (client-side only)
    // This is handled by client component redirect
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-navy-900 mb-4">Product Comparison</h1>
        <p className="text-slate-600 mb-6">
          Please select products to compare from the catalog.
        </p>
        <a
          href="/products"
          className="inline-block px-6 py-3 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-colors"
        >
          Browse Products
        </a>
      </div>
    );
  }

  // Handle case where no valid products were found
  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-navy-900 mb-4">Product Comparison</h1>
        <p className="text-slate-600 mb-6">
          No valid products found for comparison. Please select different products.
        </p>
        <a
          href="/products"
          className="inline-block px-6 py-3 bg-navy-900 text-white rounded-lg hover:bg-navy-800 transition-colors"
        >
          Browse Products
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Product Comparison</h1>
        <p className="text-slate-600">
          Comparing {products.length} product{products.length !== 1 ? "s" : ""}
        </p>
      </div>

      <ComparisonPageClient products={products} />
    </div>
  );
}