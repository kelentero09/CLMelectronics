"use server";

import { prisma } from "@/lib/db";
import { inquirySchema, firstIssueMessage } from "@/lib/validators";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export type InquiryResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function submitInquiry(form: FormData): Promise<InquiryResult> {
  const str = (k: string, max = 2000) => String(form.get(k) ?? "").slice(0, max);
  const data = {
    productId: str("productId", 64) || null,
    name: str("name").trim(),
    email: str("email").trim(),
    phone: str("phone").trim() || null,
    company: str("company").trim() || null,
    message: str("message").trim(),
    website: str("website", 200) || null,
  };

  // Honeypot: silently accept spam without storing it.
  if (data.website) return { ok: true };

  const parsed = inquirySchema.safeParse(data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: firstIssueMessage(parsed.error), fieldErrors };
  }

  // 5 per minute and 20 per day per IP. Uses Redis when configured (see lib/rate-limit.ts).
  const ip = await getClientIp();
  const [minute, day] = await Promise.all([
    rateLimit("inquiry-min", ip, { limit: 5, windowSec: 60 }),
    rateLimit("inquiry-day", ip, { limit: 20, windowSec: 86_400 }),
  ]);
  if (!minute.ok || !day.ok) {
    return { ok: false, error: "Too many inquiries. Please wait a while and try again." };
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
