import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/dashboard/product-form";
import { ProductImagesManager } from "@/components/dashboard/product-images-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit Product" };

type EditableProduct = Prisma.ProductGetPayload<{ include: { images: true } }>;

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product: EditableProduct | null = null;
  let categories: { id: string; name: string }[] = [];
  try {
    const [p, cats] = await Promise.all([
      prisma.product.findUnique({
        where: { id },
        include: { images: { orderBy: { position: "asc" } } },
      }),
      prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);
    product = p;
    categories = cats;
  } catch (e) {
    console.error("Edit product query failed", e);
  }
  if (!product) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold text-navy-900">Edit Product</h1>
      <p className="mt-1 font-mono text-xs text-slate-500">{product.referenceCode} · {product.slug}</p>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
        <ProductForm
          mode="edit"
          productId={product.id}
          categories={categories}
          existingImageCount={product.images.length}
          initial={{
            name: product.name,
            slug: product.slug,
            referenceCode: product.referenceCode,
            categoryId: product.categoryId ?? "",
            model: product.model ?? "",
            partNumber: product.partNumber ?? "",
            manufacturer: product.manufacturer ?? "",
            shortDescription: product.shortDescription ?? "",
            description: product.description ?? "",
            specifications: Array.isArray(product.specifications)
              ? (product.specifications as { key: string; value: string }[]).filter(
                  (s) => s && typeof s.key === "string" && typeof s.value === "string"
                )
              : [],
            datasheetUrl: product.datasheetUrl ?? "",
            condition: product.condition ?? "",
            availability: product.availability,
            published: product.published,
            featured: product.featured,
          }}
        />
      </div>
      <h2 className="mt-8 text-sm font-bold uppercase tracking-wider text-slate-500">
        Existing images ({product.images.length})
      </h2>
      <div className="mt-2">
        <ProductImagesManager images={product.images} />
      </div>
    </div>
  );
}
