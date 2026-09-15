import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/storefront/product-card";
import { EmptyState } from "@/components/storefront/empty-state";

export const dynamic = "force-dynamic";

type CategoryHeader = { id: string; name: string; description: string | null };
type RelatedCardProduct = Prisma.ProductGetPayload<{
  include: { category: { select: { name: true } }; images: true };
}>;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const category = await prisma.category.findFirst({
      where: { slug, isActive: true },
      select: { name: true, description: true },
    });
    if (!category) return { title: "Category not found" };
    return { title: category.name, description: category.description || `Browse ${category.name} products at CLM.` };
  } catch {
    return { title: "Category" };
  }
}

export default async function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let category: CategoryHeader | null = null;
  let products: RelatedCardProduct[] = [];
  try {
    category = await prisma.category.findFirst({
      where: { slug, isActive: true },
      select: { id: true, name: true, description: true },
    });
    if (category) {
      products = await prisma.product.findMany({
        where: { categoryId: category.id, published: true, deletedAt: null },
        include: {
          category: { select: { name: true } },
          images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }], take: 1 },
        },
        orderBy: { createdAt: "desc" },
        take: 24,
      });
    }
  } catch (e) {
    console.error("Category detail query failed", e);
  }
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
        <Link href="/" className="hover:underline">Catalog</Link>
        {" / "}
        <Link href="/categories" className="hover:underline">Categories</Link>
        {" / "}
        <span aria-current="page" className="font-semibold text-navy-900">{category.name}</span>
      </nav>
      <h1 className="mt-2 text-2xl font-bold uppercase tracking-tight text-navy-900 sm:text-3xl">{category.name}</h1>
      {category.description && <p className="mt-2 max-w-2xl text-sm text-slate-600">{category.description}</p>}
      <p className="mt-1 text-xs text-slate-500">{products.length} product{products.length === 1 ? "" : "s"}</p>
      {products.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No products yet" text={`There are currently no published products in ${category.name}.`} />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
