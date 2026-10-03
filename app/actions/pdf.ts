"use server";

import { prisma } from "@/lib/db";
import { AVAILABILITY_LABELS, CONDITION_LABELS } from "@/lib/catalog";
import { generateSpecSheetPdf, SpecSheetData } from "@/lib/pdf";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://clm-electronics.com";

export async function generateSpecSheet(productId: string): Promise<Uint8Array> {
  const product = await prisma.product.findFirst({
    where: { id: productId, published: true, deletedAt: null },
    include: {
      category: { select: { name: true } },
      images: {
        orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
        take: 1,
        select: { url: true, alt: true },
      },
    },
  });

  if (!product) {
    throw new Error("Product not found or not published");
  }

  const specs = (Array.isArray(product.specifications) ? product.specifications : []) as { key: string; value: string }[];

  const pdfData: SpecSheetData = {
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
    generatedAt: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    siteUrl: SITE_URL,
  };

  return generateSpecSheetPdf(pdfData);
}