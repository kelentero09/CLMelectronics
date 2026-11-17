import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { dbErrorSummary } from "./site-content";

/**
 * Lean select for product cards. Cards only show the primary image plus a
 * handful of text fields — fetching full rows (description Text,
 * specifications JSON, datasheet URL, ALL images) for every card was the
 * biggest payload cost on listing pages.
 */
export const productCardSelect = {
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
  category: { select: { name: true } },
  images: {
    orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
    take: 1,
    select: { url: true, alt: true },
  },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export interface CatalogFacets {
  categories: { id: string; name: string; slug: string; description: string | null; _count: { products: number } }[];
  manufacturers: string[];
}

/**
 * Filter metadata for the catalog sidebar/tabs. Categories with live counts
 * plus the distinct-manufacturer scan ran on EVERY products visit — now
 * cached for 5 minutes. Admin product/category edits bust the
 * `catalog-facets` tag via updateTag, so changes still appear immediately.
 * Falls back to empty lists if the DB is unreachable — the fallback is
 * applied outside the cache so an outage is never cached.
 */
const getCachedCatalogFacets = unstable_cache(
  async (): Promise<CatalogFacets> => {
    const [cats, mfgs] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          _count: { select: { products: { where: { published: true, deletedAt: null } } } },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.product.findMany({
        where: { published: true, deletedAt: null, manufacturer: { not: null } },
        select: { manufacturer: true },
        distinct: ["manufacturer"],
        orderBy: { manufacturer: "asc" },
        take: 100,
      }),
    ]);
    return {
      categories: cats,
      manufacturers: mfgs.map((m) => m.manufacturer).filter((m): m is string => !!m),
    };
  },
  ["catalog-facets"],
  { revalidate: 300, tags: ["catalog-facets"] }
);

export async function getCatalogFacets(): Promise<CatalogFacets> {
  try {
    return await getCachedCatalogFacets();
  } catch (e) {
    console.warn(`[catalog] Database unreachable, using empty facets: ${dbErrorSummary(e)}`);
    return { categories: [], manufacturers: [] };
  }
}

export type CatalogFilters = {
  q: string;
  categoryId: string | null;
  manufacturer: string;
  condition: string;
  availability: string;
  page: number;
  pageSize: number;
};

/**
 * One page of catalog cards + total count, cached for 5 minutes per unique
 * filter combination. Shares the `catalog-facets` tag that every product /
 * category mutation already busts via updateTag, so edits appear immediately.
 */
export const getCatalogPage = unstable_cache(
  async (f: CatalogFilters): Promise<{ products: ProductCardData[]; total: number }> => {
    const where: Prisma.ProductWhereInput = { published: true, deletedAt: null };
    if (f.categoryId) where.categoryId = f.categoryId;
    if (f.condition) where.condition = f.condition as Prisma.ProductWhereInput["condition"];
    if (f.availability) where.availability = f.availability as Prisma.ProductWhereInput["availability"];
    if (f.manufacturer) where.manufacturer = f.manufacturer;
    if (f.q) {
      // Short, indexed columns only; `description` (unindexed Text) is excluded on purpose.
      where.OR = [
        { name: { contains: f.q } },
        { referenceCode: { contains: f.q } },
        { model: { contains: f.q } },
        { partNumber: { contains: f.q } },
        { manufacturer: { contains: f.q } },
      ];
    }
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: productCardSelect,
        orderBy: { createdAt: "desc" },
        skip: (f.page - 1) * f.pageSize,
        take: f.pageSize,
      }),
      prisma.product.count({ where }),
    ]);
    return { products, total };
  },
  ["catalog-page"],
  { revalidate: 300, tags: ["catalog-facets"] }
);
