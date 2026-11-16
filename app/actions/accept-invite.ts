"use server";

import { prisma } from "@/lib/db";
import { createSupabaseServiceClient, findAuthUserByEmail } from "@/lib/auth";
import { findUserByInviteToken } from "@/lib/invites";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export type AcceptInviteResult = { ok: true } | { ok: false; error: string };

function passwordError(message: string): string {
  return /weak|pwned|leaked/i.test(message)
    ? "That password is too weak or has appeared in a data breach. Choose another."
    : "Could not set password. Please try again.";
}

export async function acceptInvite(token: string, password: string): Promise<AcceptInviteResult> {
  const t = String(token || "").trim();
  const pw = String(password || "");
  if (!t) return { ok: false, error: "Missing token." };
  if (pw.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (pw.length > 128) return { ok: false, error: "Password is too long." };

  const ip = await getClientIp();
  const rl = await rateLimit("accept-invite", ip, { limit: 10, windowSec: 15 * 60 });
  if (!rl.ok) return { ok: false, error: "Too many attempts. Please wait and try again." };

  try {
    const user = await findUserByInviteToken(t);
    if (!user) return { ok: false, error: "Invite not found or already used." };
    if (!user.isActive) return { ok: false, error: "Account is disabled." };
    if (user.inviteTokenExpiresAt && user.inviteTokenExpiresAt < new Date()) {
      return { ok: false, error: "Invite expired. Ask an admin to resend it." };
    }

    const supabase = createSupabaseServiceClient();
    const existing = await findAuthUserByEmail(user.email);

    if (existing) {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: pw,
        email_confirm: true,
        user_metadata: user.name ? { name: user.name } : undefined,
      });
      if (error) {
        console.error("[acceptInvite] update", error.message);
        return { ok: false, error: passwordError(error.message) };
      }
    } else {
      const { error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: pw,
        email_confirm: true,
        user_metadata: user.name ? { name: user.name } : undefined,
      });
      if (error) {
        console.error("[acceptInvite] create", error.message);
        return { ok: false, error: passwordError(error.message) };
      }
    }

    // Clear token so the link is one-time, and mark as accepted.
    await prisma.user.update({
      where: { id: user.id },
      data: { inviteToken: null, inviteTokenExpiresAt: null, inviteAccepted: true },
    });

    return { ok: true };
  } catch (e) {
    console.error("[acceptInvite]", e);
    return { ok: false, error: "Could not set password. Please try again." };
  }
}
