import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { generateSpecSheetPdf, type SpecSheetData } from "@/lib/pdf";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { slugSchema } from "@/lib/validators";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://clm-electronics.com";

/**
 * GET /products/:slug/spec-sheet — PDF spec sheet.
 * Served as a cacheable GET (CDN caches for a day, revalidates in background),
 * rate limited per IP on cache misses because PDF rendering is CPU-heavy.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ip = await getClientIp();
  const rl = await rateLimit("spec-sheet", ip, { limit: 20, windowSec: 60 });
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
        select: { url: true, alt: true },
      },
    },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const specs = (Array.isArray(product.specifications) ? product.specifications : []) as {
    key: string;
    value: string;
  }[];

  const data: SpecSheetData = {
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
    primaryImage: product.images[0] ?? null,
    datasheetUrl: product.datasheetUrl,
    generatedAt: product.updatedAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    siteUrl: SITE_URL,
  };

  try {
    const pdf = await generateSpecSheetPdf(data);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${slug}-spec-sheet.pdf"`,
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error("[spec-sheet]", e);
    return NextResponse.json({ error: "Could not generate spec sheet" }, { status: 500 });
  }
}
