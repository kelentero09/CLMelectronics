import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { generateSpecSheetPdf, type PdfImageData, type SpecSheetData } from "@/lib/pdf";
import { formatPdfDate } from "@/lib/pdf/utils";
import { getSiteContent } from "@/lib/site-content";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { slugSchema } from "@/lib/validators";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://clm-electronics.com").replace(/\/$/, "");
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Converts any supported raster (incl. WebP, which react-pdf can't embed) to JPEG on white. */
async function toPdfImage(input: Buffer, maxPx: number): Promise<PdfImageData | null> {
  try {
    const data = await sharp(input, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: maxPx, height: maxPx, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 85 })
      .toBuffer();
    return { data, format: "jpg" };
  } catch {
    return null;
  }
}

/**
 * Loads a product image for the PDF. Only our Supabase storage host or files
 * under /public are allowed, so a stored URL can't make the server fetch arbitrary hosts.
 */
async function loadImage(url: string | undefined | null): Promise<PdfImageData | null> {
  if (!url) return null;
  try {
    if (url.startsWith("/") && !url.startsWith("//")) {
      const publicDir = path.join(process.cwd(), "public");
      const file = path.normalize(path.join(publicDir, decodeURIComponent(url.split("?")[0])));
      if (!file.startsWith(publicDir)) return null;
      return toPdfImage(await readFile(file), 900);
    }
    const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const target = new URL(url);
    if (!supabase || target.protocol !== "https:" || target.host !== new URL(supabase).host) return null;
    const res = await fetch(target, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const len = Number(res.headers.get("content-length") || 0);
    if (len > MAX_IMAGE_BYTES) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_IMAGE_BYTES) return null;
    return toPdfImage(buf, 900);
  } catch {
    return null;
  }
}

let logoCache: Promise<PdfImageData | null> | null = null;
function loadLogo() {
  logoCache ??= readFile(path.join(process.cwd(), "public", "logo3.jpg"))
    .then((b) => toPdfImage(b, 160))
    .catch(() => null);
  return logoCache;
}

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
        select: { url: true },
      },
    },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const specs = (Array.isArray(product.specifications) ? product.specifications : []) as {
    key: string;
    value: string;
  }[];

  const [content, image, logo] = await Promise.all([
    getSiteContent(),
    loadImage(product.images[0]?.url),
    loadLogo(),
  ]);
  const company = content.company;

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
    image,
    logo,
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
