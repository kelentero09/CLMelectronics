"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { findUserByInviteToken } from "@/lib/invites";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export type AcceptInviteResult = { ok: true; signedIn: boolean } | { ok: false; error: string };

/**
 * Completes an admin invite: stores the chosen password as the user's
 * credential account, clears the one-time token and signs the user in.
 */
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

    const passwordHash = await hashPassword(pw);
    const existing = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
      select: { id: true },
    });
    if (existing) {
      await prisma.account.update({ where: { id: existing.id }, data: { password: passwordHash } });
    } else {
      await prisma.account.create({
        data: { userId: user.id, accountId: user.id, providerId: "credential", password: passwordHash },
      });
    }

    // One-time link: clear the token, mark accepted, and drop any older sessions.
    await prisma.user.update({
      where: { id: user.id },
      data: { inviteToken: null, inviteTokenExpiresAt: null, inviteAccepted: true, emailVerified: true },
    });
    await prisma.session.deleteMany({ where: { userId: user.id } });

    let signedIn = false;
    try {
      await getAuth().api.signInEmail({ body: { email: user.email, password: pw }, headers: await headers() });
      signedIn = true;
    } catch (e) {
      console.warn("[acceptInvite] auto sign-in failed", e instanceof Error ? e.message : e);
    }
    return { ok: true, signedIn };
  } catch (e) {
    console.error("[acceptInvite]", e);
    return { ok: false, error: "Could not set password. Please try again." };
  }
}
