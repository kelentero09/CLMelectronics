"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";
import { productSchema, firstIssueMessage } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { uploadProductImage, deleteProductImage, storagePathFromUrl } from "@/lib/storage";
import { MAX_IMAGES_PER_PRODUCT } from "@/lib/catalog";

export type ActionResult = { ok: true; id?: string; slug?: string } | { ok: false; error: string };

function fail(error: unknown): ActionResult {
  console.error("[products action]", error);
  if (error instanceof Error && error.message && !/prisma|database|connect|supabase/i.test(error.message)) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Something went wrong. Please try again." };
}

function parseProductForm(form: FormData) {
  const rawSpecs = String(form.get("specifications") || "[]");
  let specifications: unknown = [];
  try {
    specifications = JSON.parse(rawSpecs);
  } catch {
    specifications = [];
  }
  const categoryId = String(form.get("categoryId") || "").trim();
  const datasheetUrl = String(form.get("datasheetUrl") || "").trim();
  const condition = String(form.get("condition") || "").trim();
  return {
    name: String(form.get("name") || "").trim(),
    slug: String(form.get("slug") || "").trim() || slugify(String(form.get("name") || "")),
    referenceCode: String(form.get("referenceCode") || "").trim(),
    categoryId: categoryId || null,
    model: String(form.get("model") || "").trim() || null,
    partNumber: String(form.get("partNumber") || "").trim() || null,
    manufacturer: String(form.get("manufacturer") || "").trim() || null,
    shortDescription: String(form.get("shortDescription") || "").trim() || null,
    description: String(form.get("description") || "").trim() || null,
    specifications,
    datasheetUrl: datasheetUrl || null,
    condition: condition || null,
    availability: String(form.get("availability") || "IN_STOCK"),
    published: form.get("published") === "on",
    featured: form.get("featured") === "on",
  };
}

function collectFiles(form: FormData): File[] {
  return form
    .getAll("images")
    .filter((v): v is File => v instanceof File && v.size > 0)
    .slice(0, MAX_IMAGES_PER_PRODUCT);
}

/** Bust the cached catalog facets + listing pages after any catalog change. */
function revalidateCatalog(slug?: string) {
  updateTag("catalog-facets");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/categories");
  if (slug) revalidatePath(`/products/${slug}`);
  revalidatePath("/admin/products");
}

export async function createProduct(form: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = productSchema.safeParse(parseProductForm(form));
    if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

    const product = await prisma.product.create({ data: { ...parsed.data, specifications: parsed.data.specifications ?? undefined } });

    const files = collectFiles(form);
    for (let i = 0; i < files.length; i++) {
      try {
        const { publicUrl } = await uploadProductImage({ file: files[i], productId: product.id });
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: publicUrl,
            alt: product.name,
            position: i,
            isPrimary: i === 0,
          },
        });
      } catch (e) {
        console.error("[products action] image upload failed", e);
      }
    }

    revalidateCatalog();
    return { ok: true, id: product.id, slug: product.slug };
  } catch (e) {
    return fail(e);
  }
}

export async function updateProduct(id: string, form: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = productSchema.safeParse(parseProductForm(form));
    if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!existing || existing.deletedAt) return { ok: false, error: "Product not found" };

    const product = await prisma.product.update({
      where: { id },
      data: { ...parsed.data, specifications: parsed.data.specifications ?? undefined },
    });

    const slotsLeft = Math.max(0, MAX_IMAGES_PER_PRODUCT - existing.images.length);
    const files = collectFiles(form).slice(0, slotsLeft);
    const basePosition = existing.images.length;
    for (let i = 0; i < files.length; i++) {
      try {
        const { publicUrl } = await uploadProductImage({ file: files[i], productId: product.id });
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: publicUrl,
            alt: product.name,
            position: basePosition + i,
            isPrimary: existing.images.length === 0 && i === 0,
          },
        });
      } catch (e) {
        console.error("[products action] image upload failed", e);
      }
    }

    revalidateCatalog(product.slug);
    return { ok: true, id: product.id, slug: product.slug };
  } catch (e) {
    return fail(e);
  }
}

export async function togglePublish(id: string, published: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    const product = await prisma.product.update({
      where: { id },
      data: { published },
      select: { id: true, slug: true },
    });
    revalidateCatalog(product.slug);
    return { ok: true, id: product.id };
  } catch (e) {
    return fail(e);
  }
}

export async function softDeleteProduct(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const product = await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), published: false },
      select: { id: true, slug: true },
    });
    revalidateCatalog(product.slug);
    return { ok: true, id: product.id };
  } catch (e) {
    return fail(e);
  }
}

export async function restoreProduct(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.product.update({ where: { id }, data: { deletedAt: null } });
    revalidateCatalog();
    return { ok: true, id };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteImage(imageId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
      include: { product: { select: { id: true, slug: true } } },
    });
    if (!image) return { ok: false, error: "Image not found" };

    await prisma.productImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const next = await prisma.productImage.findFirst({
        where: { productId: image.productId },
        orderBy: { position: "asc" },
      });
      if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }

    const path = storagePathFromUrl(image.url);
    if (path) {
      try {
        await deleteProductImage(path);
      } catch (e) {
        console.error("[products action] storage cleanup failed (DB row already deleted)", e);
      }
    }

    revalidateCatalog(image.product.slug);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setPrimaryImage(imageId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
      include: { product: { select: { slug: true } } },
    });
    if (!image) return { ok: false, error: "Image not found" };

    await prisma.$transaction([
      prisma.productImage.updateMany({ where: { productId: image.productId }, data: { isPrimary: false } }),
      prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
    ]);

    revalidateCatalog(image.product.slug);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
