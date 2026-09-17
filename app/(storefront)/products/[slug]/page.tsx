import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AVAILABILITY_LABELS, CONDITION_LABELS } from "@/lib/catalog";
import { productCardSelect, type ProductCardData } from "@/lib/catalog-queries";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { InquiryForm } from "@/components/storefront/inquiry-form";
import { ProductCard } from "@/components/storefront/product-card";
import { Reveal } from "@/components/storefront/reveal";
import { Badge } from "@/components/ui/card";

// ISR: detail pages are cached for 5 minutes and pre-rendered at build
// time; admin edits revalidate them, so repeat visits skip the database.
export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      where: { published: true, deletedAt: null },
      select: { slug: true },
      take: 200,
    });
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

type DetailProduct = Prisma.ProductGetPayload<{
  include: { category: { select: { name: true; slug: true } }; images: true };
}>;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const product = await prisma.product.findFirst({
      where: { slug, published: true, deletedAt: null },
      select: { name: true, shortDescription: true, referenceCode: true },
    });
    if (!product) return { title: "Product not found" };
    return {
      title: product.name,
      description: product.shortDescription || `Inquire about ${product.name} (${product.referenceCode}) at CLM Electronics Engineering Services.`,
    };
  } catch {
    return { title: "Product" };
  }
}

type Spec = { key: string; value: string };

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product: DetailProduct | null = null;
  let related: ProductCardData[] = [];
  try {
    product = await prisma.product.findFirst({
      where: { slug, published: true, deletedAt: null },
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }] },
      },
    });
    if (product?.categoryId) {
      related = await prisma.product.findMany({
        where: { categoryId: product.categoryId, published: true, deletedAt: null, id: { not: product.id } },
        select: productCardSelect,
        take: 4,
      });
    }
  } catch (e) {
    console.error("Product detail query failed", e);
  }
  if (!product) notFound();

  const specs = (Array.isArray(product.specifications) ? product.specifications : []) as Spec[];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.referenceCode,
    mpn: product.partNumber || undefined,
    brand: product.manufacturer ? { "@type": "Brand", name: product.manufacturer } : undefined,
    description: product.shortDescription || product.name,
    url: `${siteUrl}/products/${product.slug}`,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
        <Link href="/products" className="hover:underline">Catalog</Link>
        {" / "}
        {product.category ? (
          <>
            <Link href={`/categories/${product.category.slug}`} className="hover:underline">
              {product.category.name}
            </Link>
            {" / "}
          </>
        ) : null}
        <span aria-current="page" className="font-semibold text-navy-900">{product.name}</span>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} referenceCode={product.referenceCode} />
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge className={product.availability === "IN_STOCK" ? "bg-emerald-600 text-white border-transparent" : "bg-slate-100 text-slate-700 border-slate-200"}>
              {AVAILABILITY_LABELS[product.availability] ?? product.availability}
            </Badge>
            {product.condition && (
              <Badge variant="outline">{CONDITION_LABELS[product.condition] ?? product.condition}</Badge>
            )}
            {product.featured && <Badge>Featured</Badge>}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-navy-900 sm:text-3xl">{product.name}</h1>
          {product.category && <p className="mt-1 text-sm font-semibold text-steel-600">{product.category.name}</p>}
          <dl className="mt-4 grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Reference code</dt><dd className="font-mono font-semibold">{product.referenceCode}</dd></div>
            {product.model && <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Model</dt><dd className="font-semibold">{product.model}</dd></div>}
            {product.partNumber && <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Part number</dt><dd className="font-semibold">{product.partNumber}</dd></div>}
            {product.manufacturer && <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Manufacturer</dt><dd className="font-semibold">{product.manufacturer}</dd></div>}
          </dl>
          {product.shortDescription && <p className="mt-4 font-medium text-slate-700">{product.shortDescription}</p>}
          {product.description && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{product.description}</p>}
          {product.datasheetUrl && (
            <a href={product.datasheetUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-slate-50">
              View Datasheet / Document
            </a>
          )}
        </div>
      </div>

      {specs.length > 0 && (
        <section aria-label="Specifications" className="mt-8">
          <h2 className="text-lg font-bold text-navy-900">Specifications</h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[480px] border-collapse bg-white text-sm">
              <tbody>
                {specs.map((s, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                    <th scope="row" className="w-1/3 px-4 py-2.5 text-left font-semibold text-navy-900">{s.key}</th>
                    <td className="px-4 py-2.5 text-slate-600">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Reveal className="mt-8 max-w-2xl">
      <section aria-label="Product inquiry">
        <InquiryForm productId={product.id} productLabel={`${product.name} (${product.referenceCode})`} />
      </section>
      </Reveal>

      {related.length > 0 && (
        <section aria-label="Related products" className="mt-10">
          <h2 className="text-lg font-bold text-navy-900">Related Products</h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i * 60, 240)} className="[&>*]:h-full">
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
