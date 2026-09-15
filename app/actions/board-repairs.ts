"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";
import { boardRepairSchema, firstIssueMessage } from "@/lib/validators";
import { uploadRepairImage, deleteProductImage, storagePathFromUrl } from "@/lib/storage";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function fail(error: unknown): ActionResult {
  console.error("[board-repairs action]", error);
  if (error instanceof Error && error.message && !/prisma|database|connect|supabase/i.test(error.message)) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Something went wrong. Please try again." };
}

function parseRepairForm(form: FormData) {
  return {
    station: String(form.get("station") || "").trim(),
    model: String(form.get("model") || "").trim(),
    boardDescription: String(form.get("boardDescription") || "").trim(),
    problem: String(form.get("problem") || "").trim(),
    repairRate: String(form.get("repairRate") || "95"),
    sortOrder: String(form.get("sortOrder") || "0"),
    isActive: form.get("isActive") === "on",
  };
}

function getPhoto(form: FormData): File | null {
  const f = form.get("photo");
  return f instanceof File && f.size > 0 ? f : null;
}

function revalidateAll() {
  revalidatePath("/board-repair");
  revalidatePath("/admin/repairs");
}

export async function createBoardRepair(form: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = boardRepairSchema.safeParse(parseRepairForm(form));
    if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

    let image: string | null = null;
    const photo = getPhoto(form);
    if (photo) {
      try {
        const { publicUrl } = await uploadRepairImage({ file: photo });
        image = publicUrl;
      } catch (e) {
        console.error("[board-repairs action] photo upload failed", e);
        return { ok: false, error: "Photo upload failed. Only JPEG, PNG, WebP, or AVIF up to 5 MB." };
      }
    }

    const key = `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    const row = await prisma.boardRepair.create({ data: { ...parsed.data, key, image } });
    revalidateAll();
    return { ok: true, id: row.id };
  } catch (e) {
    return fail(e);
  }
}

export async function updateBoardRepair(id: string, form: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = boardRepairSchema.safeParse(parseRepairForm(form));
    if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

    const existing = await prisma.boardRepair.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "Record not found" };

    let image = existing.image;
    const photo = getPhoto(form);
    const removePhoto = form.get("removePhoto") === "on";

    if (photo) {
      try {
        const { publicUrl } = await uploadRepairImage({ file: photo });
        image = publicUrl;
        await cleanupStorageUrl(existing.image);
      } catch (e) {
        console.error("[board-repairs action] photo upload failed", e);
        return { ok: false, error: "Photo upload failed. Only JPEG, PNG, WebP, or AVIF up to 5 MB." };
      }
    } else if (removePhoto && existing.image) {
      await cleanupStorageUrl(existing.image);
      image = null;
    }

    await prisma.boardRepair.update({ where: { id }, data: { ...parsed.data, image } });
    revalidateAll();
    return { ok: true, id };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteBoardRepair(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const existing = await prisma.boardRepair.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "Record not found" };

    await prisma.boardRepair.delete({ where: { id } });
    await cleanupStorageUrl(existing.image);
    revalidateAll();
    return { ok: true, id };
  } catch (e) {
    return fail(e);
  }
}

async function cleanupStorageUrl(url: string | null) {
  if (!url) return;
  const path = storagePathFromUrl(url);
  if (!path) return; // local /public file — nothing to clean in storage
  try {
    await deleteProductImage(path);
  } catch (e) {
    console.error("[board-repairs action] storage cleanup failed (DB already updated)", e);
  }
}
