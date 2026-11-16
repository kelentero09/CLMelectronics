import { cache } from "react";
import type { Metadata } from "next";
import { FileText, MessageSquare } from "lucide-react";
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
import { DownloadSpecSheet } from "@/components/storefront/product-detail/download-spec-sheet";
import { Specifications } from "@/components/storefront/product-detail/specifications";
import { jsonLdString } from "@/lib/json-ld";
import { Breadcrumbs } from "@/components/storefront/blocks";

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

/** One query per request, shared by generateMetadata and the page (React cache). */
const getProduct = cache(async (slug: string): Promise<DetailProduct | null> => {
  return prisma.product.findFirst({
    where: { slug, published: true, deletedAt: null },
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }] },
    },
  });
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    if (!product) return { title: "Product not found", robots: { index: false } };
    const description =
      product.shortDescription ||
      `Inquire about ${product.name} (${product.referenceCode}) at CLM Electronics Engineering Services.`;
    const image = product.images[0]?.url;
    return {
      title: product.name,
      description,
      alternates: { canonical: `/products/${product.slug}` },
      openGraph: {
        title: product.name,
        description,
        type: "website",
        ...(image ? { images: [{ url: image, alt: product.images[0]?.alt || product.name }] } : {}),
      },
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
    product = await getProduct(slug);
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
    image: product.images.map((i) => i.url).slice(0, 5),
    category: product.category?.name,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Catalog", item: `${siteUrl}/products` },
      ...(product.category
        ? [{ "@type": "ListItem", position: 2, name: product.category.name, item: `${siteUrl}/categories/${product.category.slug}` }]
        : []),
      { "@type": "ListItem", position: product.category ? 3 : 2, name: product.name, item: `${siteUrl}/products/${product.slug}` },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Products", href: "/products" },
          ...(product.category ? [{ label: product.category.name, href: `/categories/${product.category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery productId={product.id} images={product.images} productName={product.name} referenceCode={product.referenceCode} />
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
          {product.category && <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-steel-600">{product.category.name}</p>}
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">{product.name}</h1>
          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 text-sm [&>div]:bg-white [&>div]:p-4 [&_dd]:mt-1 [&_dd]:text-navy-900">
            <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Reference code</dt><dd className="font-mono font-semibold">{product.referenceCode}</dd></div>
            {product.model && <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Model</dt><dd className="font-semibold">{product.model}</dd></div>}
            {product.partNumber && <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Part number</dt><dd className="font-semibold">{product.partNumber}</dd></div>}
            {product.manufacturer && <div><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Manufacturer</dt><dd className="font-semibold">{product.manufacturer}</dd></div>}
          </dl>
          {product.shortDescription && <p className="mt-6 text-lg font-medium leading-relaxed text-slate-700">{product.shortDescription}</p>}
          {product.description && <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">{product.description}</p>}
          {product.datasheetUrl && (
            <a href={product.datasheetUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-steel-600 underline-offset-4 hover:text-navy-900 hover:underline">
              <FileText className="h-4 w-4" aria-hidden /> View datasheet / document
            </a>
          )}
          <div className="mt-8 flex flex-wrap items-start gap-3 border-t border-slate-200 pt-6">
            <a href="#inquire" className="inline-flex h-11 items-center gap-2 rounded-md bg-steel-500 px-5 text-sm font-semibold text-white shadow-lg shadow-steel-500/25 transition-[background-color,transform] hover:bg-steel-600 active:scale-[0.98]">
              <MessageSquare className="h-4 w-4" aria-hidden /> Inquire about this product
            </a>
            <DownloadSpecSheet slug={product.slug} productName={product.name} />
          </div>
        </div>
      </div>

      <Specifications specs={specs} productName={product.name} referenceCode={product.referenceCode} />

      <Reveal className="mt-16 max-w-3xl">
      <section id="inquire" aria-label="Product inquiry" className="scroll-mt-24">
        <InquiryForm productId={product.id} productLabel={`${product.name} (${product.referenceCode})`} />
      </section>
      </Reveal>

      {related.length > 0 && (
        <section aria-label="Related products" className="mt-16 border-t border-slate-200 pt-12">
          <h2 className="text-2xl font-bold tracking-tight text-navy-900">Related Products</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i * 60, 240)} className="[&>*]:h-full">
                <ProductCard product={p} morph />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky call-to-action */}
      <div data-mobile-cta className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur animate-slide-up-in lg:hidden">
        <a href="#inquire" className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-steel-500 text-sm font-semibold text-white active:scale-[0.98]">
          <MessageSquare className="h-4 w-4" aria-hidden /> Inquire about this product
        </a>
      </div>
      <div className="h-16 lg:hidden" aria-hidden />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />
    </div>
  );
}
