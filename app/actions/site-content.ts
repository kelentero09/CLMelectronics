"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";
import { firstIssueMessage } from "@/lib/validators";

export type ActionResult = { ok: true } | { ok: false; error: string };

const textEntrySchema = z.object({
  key: z.string().min(1).max(120),
  value: z.string().max(20000),
});

const cardSchema = z.object({ title: z.string().min(1).max(120), text: z.string().max(1000) });
const serviceCategorySchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  summary: z.string().max(2000),
  items: z.array(z.string().min(1).max(300)).max(60),
});
const equipmentGroupSchema = z.object({
  id: z.string().min(1).max(80),
  brand: z.string().min(1).max(120),
  label: z.string().min(1).max(200),
  description: z.string().max(2000),
  models: z.array(z.string().min(1).max(120)).max(60),
});
const partsGroupSchema = z.object({
  brand: z.string().min(1).max(120),
  models: z.array(z.string().min(1).max(120)).max(60),
});

/** Keys allowed to carry structured JSON + their validators. */
const JSON_KEYS: Record<string, z.ZodTypeAny> = {
  "home.capability_cards": z.array(cardSchema).max(24),
  "home.why_cards": z.array(cardSchema).max(24),
  "services.categories": z.array(serviceCategorySchema).max(30),
  "equipment.groups": z.array(equipmentGroupSchema).max(30),
  "equipment.parts_sourcing": z.array(partsGroupSchema).max(30),
};

/** Keys edited as one-per-line textareas — value + data (string[]) stay in sync. */
const LIST_KEYS = new Set([
  "company.phones",
  "home.profile_points",
  "home.board_types",
  "services.wedge_brands",
]);

function fail(error: unknown): ActionResult {
  console.error("[site-content action]", error);
  if (error instanceof Error && error.message && !/prisma|database|connect|supabase/i.test(error.message)) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Something went wrong. Please try again." };
}

function revalidateAll() {
  // Immediate cache-tag expiration inside the Server Action (Next 16),
  // plus path revalidation so ISR pages rebuild on next visit.
  updateTag("site-content");
  for (const p of ["/", "/about", "/services", "/equipment", "/contact", "/board-repair", "/admin/content"]) {
    revalidatePath(p);
  }
}

function toLines(value: string): string[] {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Save a plain-text entry (input / textarea). */
export async function updateSiteContent(form: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = textEntrySchema.safeParse({
      key: String(form.get("key") || ""),
      value: String(form.get("value") ?? ""),
    });
    if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

    const existing = await prisma.siteContent.findUnique({ where: { key: parsed.data.key } });
    if (!existing) return { ok: false, error: "Content entry not found. Run the seed to restore it." };

    const data = LIST_KEYS.has(parsed.data.key) ? toLines(parsed.data.value) : undefined;
    await prisma.siteContent.update({
      where: { key: parsed.data.key },
      data: data === undefined ? { value: parsed.data.value } : { value: parsed.data.value, data },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

function parseJsonField(form: FormData, field: string): unknown {
  const raw = String(form.get(field) || "[]");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid data submitted. Please try again.");
  }
}

/** Save a structured JSON entry (cards, services, equipment). */
export async function updateSiteContentJson(key: string, form: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const schema = JSON_KEYS[key];
    if (!schema) return { ok: false, error: "This entry cannot be saved as structured data." };
    const parsed = schema.safeParse(parseJsonField(form, "data"));
    if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

    const existing = await prisma.siteContent.findUnique({ where: { key } });
    if (!existing) return { ok: false, error: "Content entry not found. Run the seed to restore it." };

    // Keep a readable `value` alongside JSON for simple entries (cards as
    // “Title | Text” lines, others as joined titles) so exports stay legible.
    let value = existing.value;
    if (key === "home.capability_cards" || key === "home.why_cards") {
      value = (parsed.data as { title: string; text: string }[]).map((c) => `${c.title} | ${c.text}`).join("\n");
    } else if (key === "services.categories") {
      value = (parsed.data as { title: string }[]).map((c) => c.title).join("\n");
    } else if (key === "equipment.groups") {
      value = (parsed.data as { brand: string; label: string }[]).map((g) => `${g.brand} — ${g.label}`).join("\n");
    } else if (key === "equipment.parts_sourcing") {
      value = (parsed.data as { brand: string }[]).map((g) => g.brand).join("\n");
    }

    await prisma.siteContent.update({ where: { key }, data: { value, data: parsed.data as never } });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
