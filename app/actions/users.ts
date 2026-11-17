"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";
import { unstable_rethrow } from "next/navigation";
import { generateToken, hashToken } from "@/lib/tokens";
import { getSiteUrl } from "@/lib/site-url";
import { inviteUserSchema, firstIssueMessage } from "@/lib/validators";
import { sendMail, buildInviteHtml, isEmailConfigured } from "@/lib/email";

export type UserActionResult = { ok: true; message?: string; inviteLink?: string } | { ok: false; error: string };

function fail(error: unknown): UserActionResult {
  unstable_rethrow(error);
  console.error("[users action]", error);
  const msg = error instanceof Error ? error.message : String(error);
  if (msg && !/prisma|database|connect|d1_|sqlite/i.test(msg)) return { ok: false, error: msg };
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function inviteUser(formData: FormData): Promise<UserActionResult> {
  try {
    const { appUser: currentUser } = await requireAdmin();

    const raw = {
      email: String(formData.get("email") || ""),
      name: String(formData.get("name") || "") || null,
    };
    const parsed = inviteUserSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: firstIssueMessage(parsed.error) };
    const email = parsed.data.email;
    const name = parsed.data.name?.trim() || null;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.isActive) {
      return { ok: false, error: "A user with this email already exists." };
    }

    const siteUrl = getSiteUrl();
    // One-time invite token; only its sha256 is stored.
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.upsert({
      where: { email },
      update: { name: name ?? undefined, isActive: true, invitedAt: new Date(), inviteAccepted: false, inviteToken: tokenHash, inviteTokenExpiresAt: expiresAt },
      create: { email, name, role: "ADMIN", isActive: true, invitedAt: new Date(), inviteAccepted: false, inviteToken: tokenHash, inviteTokenExpiresAt: expiresAt },
    });

    const inviteLink = `${siteUrl}/auth/accept-invite?token=${token}`;
    const html = buildInviteHtml(inviteLink, email, siteUrl);
    const sent = await sendMail({ to: email, subject: "You’ve been invited to CLM Admin — set your password", html });

    console.log(`[users] ${currentUser.email} invited ${email} (email configured=${isEmailConfigured()})`);
    revalidatePath("/admin/users");
    if (!sent.ok && !isEmailConfigured()) {
      return { ok: true, message: "Invite link generated (email not configured — copy link below). Set the SMTP_* settings to send it automatically.", inviteLink };
    }
    if (!sent.ok) return { ok: false, error: sent.error };
    return { ok: true, message: "Invite sent by email." };
  } catch (e) {
    return fail(e);
  }
}

export async function resendInvite(emailRaw: string): Promise<UserActionResult> {
  try {
    await requireAdmin();
    const email = String(emailRaw).trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Invalid email" };

    const appUser = await prisma.user.findUnique({ where: { email } });
    if (!appUser) return { ok: false, error: "User not found" };
    if (!appUser.isActive) return { ok: false, error: "User is disabled — enable first." };

    const siteUrl = getSiteUrl();
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.user.update({ where: { email }, data: { invitedAt: new Date(), inviteAccepted: false, inviteToken: tokenHash, inviteTokenExpiresAt: expiresAt } });

    const inviteLink = `${siteUrl}/auth/accept-invite?token=${token}`;
    const html = buildInviteHtml(inviteLink, email, siteUrl);
    const sent = await sendMail({ to: email, subject: "You’ve been invited to CLM Admin — set your password", html });
    revalidatePath("/admin/users");
    if (!sent.ok && !isEmailConfigured()) return { ok: true, message: "Invite link generated (email not configured — copy below).", inviteLink };
    if (!sent.ok) return { ok: false, error: sent.error };
    return { ok: true, message: "Invite resent by email." };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleUserActive(userId: string, isActive: boolean): Promise<UserActionResult> {
  try {
    const { appUser: currentUser } = await requireAdmin();
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return { ok: false, error: "User not found" };
    if (target.email.toLowerCase() === currentUser.email.toLowerCase()) {
      return { ok: false, error: "You cannot disable your own account." };
    }
    if (!isActive) {
      const activeCount = await prisma.user.count({ where: { isActive: true } });
      if (activeCount <= 1) return { ok: false, error: "Cannot disable the last active admin." };
    }
    await prisma.user.update({ where: { id: userId }, data: { isActive } });
    // Disabling signs the user out everywhere.
    if (!isActive) await prisma.session.deleteMany({ where: { userId } });
    revalidatePath("/admin/users");
    return { ok: true, message: isActive ? "User enabled." : "User disabled." };
  } catch (e) {
    return fail(e);
  }
}

export async function removeUser(userId: string): Promise<UserActionResult> {
  try {
    const { appUser: currentUser } = await requireAdmin();
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return { ok: false, error: "User not found" };
    if (target.email.toLowerCase() === currentUser.email.toLowerCase()) {
      return { ok: false, error: "You cannot remove your own account." };
    }
    const activeCount = await prisma.user.count({ where: { isActive: true } });
    if (target.isActive && activeCount <= 1) {
      return { ok: false, error: "Cannot remove the last active admin." };
    }

    // Sessions and the credential account are removed by ON DELETE CASCADE.
    await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/admin/users");
    return { ok: true, message: "User removed." };
  } catch (e) {
    return fail(e);
  }
}

export async function listUsers() {
  await requireAdmin();
  return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
}
