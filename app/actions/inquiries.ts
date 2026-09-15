"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";
import { inquiryStatusSchema } from "@/lib/validators";

export async function updateInquiryStatus(
  id: string,
  status: "NEW" | "CONTACTED" | "COMPLETED"
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const parsed = inquiryStatusSchema.safeParse(status);
    if (!parsed.success) return { ok: false, error: "Invalid status" };
    await prisma.inquiry.update({ where: { id }, data: { status: parsed.data } });
    revalidatePath("/admin/inquiries");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    console.error("[inquiries action]", e);
    return { ok: false, error: "Could not update inquiry status." };
  }
}
