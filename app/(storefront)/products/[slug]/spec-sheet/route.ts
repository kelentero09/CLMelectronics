import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import type { SpecSheetPayload } from "@/lib/pdf";
import { formatPdfDate } from "@/lib/pdf/utils";
import { getSiteContent } from "@/lib/site-content";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { slugSchema } from "@/lib/validators";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://clm-electronics.com").replace(/\/$/, "");

/** Only same-origin paths (/media uploads or /public files) are handed to the browser. */
function sameOriginImage(url: string | undefined | null): string | null {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return null;
  return url;
}

/**
 * GET /products/:slug/spec-sheet — data for the PDF spec sheet.
 * The PDF itself is rendered in the browser (components/storefront/product-detail/
 * download-spec-sheet.tsx) because react-pdf can't run on Cloudflare Workers.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ip = await getClientIp();
  const rl = await rateLimit("spec-sheet", ip, { limit: 30, windowSec: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const product = await prisma.product.findFirst({
    where: { slug, published: true, deletedAt: null },
    include: {
      category: { select: { name: true } },
      images: {
        orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
        take: 1,
        select: { url: true },
      },
    },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const specs = (Array.isArray(product.specifications) ? product.specifications : []) as {
    key: string;
    value: string;
  }[];
  const company = (await getSiteContent()).company;

  const data: SpecSheetPayload = {
    name: product.name,
    referenceCode: product.referenceCode,
    model: product.model,
    partNumber: product.partNumber,
    manufacturer: product.manufacturer,
    category: product.category?.name ?? null,
    condition: product.condition,
    availability: product.availability,
    shortDescription: product.shortDescription,
    description: product.description,
    specifications: specs,
    imageUrl: sameOriginImage(product.images[0]?.url),
    logoUrl: "/logo3.jpg",
    datasheetUrl: product.datasheetUrl && /^https?:\/\//i.test(product.datasheetUrl) ? product.datasheetUrl : null,
    updatedAt: formatPdfDate(product.updatedAt),
    generatedAt: formatPdfDate(new Date()),
    siteUrl: SITE_URL,
    productUrl: `${SITE_URL}/products/${product.slug}`,
    company: {
      name: company.name || "CLM Electronics Engineering Services",
      address: company.address,
      phones: company.phones,
      email: company.email,
    },
  };

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
