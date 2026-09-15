"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { inquirySchema, firstIssueMessage } from "@/lib/validators";

/** Simple in-memory rate limit: max 5 inquiry submissions per minute per IP. */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_HITS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > MAX_HITS;
}

export async function submitInquiry(
  form: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const data = {
    productId: String(form.get("productId") || "") || null,
    name: String(form.get("name") || "").trim(),
    email: String(form.get("email") || "").trim(),
    phone: String(form.get("phone") || "").trim() || null,
    company: String(form.get("company") || "").trim() || null,
    message: String(form.get("message") || "").trim(),
    website: String(form.get("website") || "") || null,
  };

  // Honeypot: silently accept spam without storing it.
  if (data.website) return { ok: true };

  const parsed = inquirySchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return { ok: false, error: "Too many inquiries. Please wait a minute and try again." };
  }

  try {
    let productRef: string | null = null;
    if (parsed.data.productId) {
      const product = await prisma.product.findFirst({
        where: { id: parsed.data.productId, published: true, deletedAt: null },
        select: { name: true, referenceCode: true },
      });
      if (product) productRef = `${product.name} (${product.referenceCode})`;
    }
    await prisma.inquiry.create({
      data: {
        productId: productRef ? parsed.data.productId : null,
        productRef,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        company: parsed.data.company,
        message: parsed.data.message,
      },
    });
    return { ok: true };
  } catch (e) {
    console.error("[public inquiry]", e);
    return { ok: false, error: "Could not send your inquiry right now. Please try again later." };
  }
}
