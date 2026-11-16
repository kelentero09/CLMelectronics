import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { productCardSelect, type ProductCardData } from "@/lib/catalog-queries";
import { ProductCard } from "@/components/storefront/product-card";
import { EmptyState } from "@/components/storefront/empty-state";
import { Reveal } from "@/components/storefront/reveal";
import { CatalogHeader } from "@/components/storefront/catalog-header";

// ISR: category pages are pre-rendered and cached for 5 minutes; admin
// product edits revalidate them, so repeat visits skip the database.
export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    return categories.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

type CategoryHeader = { id: string; name: string; description: string | null };

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
  let products: ProductCardData[] = [];
  try {
    category = await prisma.category.findFirst({
      where: { slug, isActive: true },
      select: { id: true, name: true, description: true },
    });
    if (category) {
      products = await prisma.product.findMany({
        where: { categoryId: category.id, published: true, deletedAt: null },
        select: productCardSelect,
        orderBy: { createdAt: "desc" },
        take: 24,
      });
    }
  } catch (e) {
    console.error("Category detail query failed", e);
  }
  if (!category) notFound();

  return (
    <>
    <CatalogHeader
      title={category.name}
      description={category.description ?? undefined}
      count={products.length}
      crumbs={[{ label: "Categories", href: "/categories" }, { label: category.name }]}
      action={{ href: `/products?category=${slug}`, label: "Search & filter this category" }}
    />
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {products.length === 0 ? (
        <div>
          <EmptyState title="No products yet" text={`There are currently no published products in ${category.name}.`} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i * 40, 200)} className="[&>*]:h-full">
              <ProductCard product={p} morph />
            </Reveal>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
