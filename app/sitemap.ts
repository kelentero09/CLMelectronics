import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = ["", "/categories", "/about", "/services", "/equipment", "/board-repair", "/contact"].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: new Date(),
  }));
  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { published: true, deletedAt: null },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...staticPages,
      ...products.map((p) => ({ url: `${BASE}/products/${p.slug}`, lastModified: p.updatedAt })),
      ...categories.map((c) => ({ url: `${BASE}/categories/${c.slug}`, lastModified: c.updatedAt })),
    ];
  } catch {
    return staticPages;
  }
}
