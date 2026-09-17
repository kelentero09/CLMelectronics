"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";
import { categorySchema, firstIssueMessage } from "@/lib/validators";
import { FIXED_CATEGORIES } from "@/lib/catalog";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function fail(error: unknown, fallback = "Something went wrong. Please try again."): ActionResult {
  console.error("[categories action]", error);
  return { ok: false, error: fallback };
}

function revalidateCatalog() {
  updateTag("catalog-facets");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/categories");
  revalidatePath("/admin/categories");
}

function parseCategoryForm(form: FormData) {
  return {
    name: String(form.get("name") || "").trim(),
    slug: String(form.get("slug") || "").trim(),
    description: String(form.get("description") || "").trim() || null,
    image: String(form.get("image") || "").trim() || null,
    isActive: form.get("isActive") === "on",
    sortOrder: Number(form.get("sortOrder") || 0),
  };
}

export async function createCategory(form: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = categorySchema.safeParse(parseCategoryForm(form));
    if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };
    const category = await prisma.category.create({ data: parsed.data });
    revalidateCatalog();
    return { ok: true, id: category.id };
  } catch (e) {
    return fail(e, "Could not create category. The name or slug may already exist.");
  }
}

export async function updateCategory(id: string, form: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = categorySchema.safeParse(parseCategoryForm(form));
    if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "Category not found" };
    const coreSlugs: string[] = FIXED_CATEGORIES.map((c) => c.slug);
    if (coreSlugs.includes(existing.slug) && parsed.data.slug !== existing.slug) {
      return {
        ok: false,
        error: `This is a core category — renaming its slug (${existing.slug}) would break public URLs.`,
      };
    }
    await prisma.category.update({ where: { id }, data: parsed.data });
    revalidateCatalog();
    return { ok: true, id };
  } catch (e) {
    return fail(e, "Could not update category. The name or slug may already exist.");
  }
}

export async function toggleCategoryActive(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.category.update({ where: { id }, data: { isActive } });
    revalidateCatalog();
    return { ok: true, id };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const count = await prisma.product.count({ where: { categoryId: id, deletedAt: null } });
    if (count > 0) {
      return {
        ok: false,
        error: `Cannot delete — ${count} product(s) still use this category. Deactivate it instead.`,
      };
    }
    await prisma.category.delete({ where: { id } });
    revalidateCatalog();
    return { ok: true, id };
  } catch (e) {
    return fail(e);
  }
}
