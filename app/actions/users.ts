"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";
import { createSupabaseServiceClient } from "@/lib/auth";
import { inviteUserSchema, firstIssueMessage } from "@/lib/validators";

export type UserActionResult = { ok: true; message?: string } | { ok: false; error: string };

function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  // Never fall back to SUPABASE_URL — that produces Supabase-branded links
  if (process.env.NODE_ENV === "production") {
    console.warn("[getSiteUrl] NEXT_PUBLIC_SITE_URL not set — invite links will use localhost fallback");
  }
  return "http://localhost:3000";
}

function isEmailRateLimitMessage(msg: string): boolean {
  return /rate limit|too many requests|over_email|email.*limit|429/i.test(msg);
}

function rateLimitMessage(): string {
  return "Email rate limit exceeded — Supabase’s built-in mailer allows ~3–4 emails/hour per address (≈30/hour per project). Wait 2–5 minutes and try again. For production, set up Custom SMTP in Supabase Dashboard → Auth → SMTP (see SUPABASE_SETUP.md §7) to lift this limit.";
}

function fail(error: unknown): UserActionResult {
  console.error("[users action]", error);
  const msg = error instanceof Error ? error.message : String(error);
  if (isEmailRateLimitMessage(msg)) return { ok: false, error: rateLimitMessage() };
  if (error instanceof Error && error.message && !/prisma|database|connect|supabase/i.test(error.message)) {
    return { ok: false, error: error.message };
  }
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

    // Prevent duplicate invite — but allow re-invite if inactive/disabled
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.isActive) {
      return { ok: false, error: "A user with this email already exists." };
    }

    const supabase = createSupabaseServiceClient();
    const siteUrl = getSiteUrl();
    const redirectTo = `${siteUrl}/auth/callback`;

    // Try Supabase invite — sends email with CLM-branded template (see supabase/email-templates/invite.html)
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: name ? { name } : undefined,
    });

    if (inviteError) {
      if (isEmailRateLimitMessage(inviteError.message)) {
        return { ok: false, error: rateLimitMessage() };
      }
      // If user already exists in Supabase Auth, fall back to generate recovery link
      if (/already exists|already registered/i.test(inviteError.message)) {
        const { error: linkError } = await supabase.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo },
        });
        if (linkError) {
          if (isEmailRateLimitMessage(linkError.message)) return { ok: false, error: rateLimitMessage() };
          throw new Error(linkError.message);
        }
        // Still upsert Prisma row if missing
        await prisma.user.upsert({
          where: { email },
          update: { name: name ?? undefined, isActive: true, invitedAt: new Date() },
          create: { email, name, role: "ADMIN", isActive: true, invitedAt: new Date() },
        });
        revalidatePath("/admin/users");
        return { ok: true, message: "User exists in Auth — recovery email sent." };
      }
      throw new Error(inviteError.message);
    }

    await prisma.user.upsert({
      where: { email },
      update: { name: name ?? undefined, isActive: true, invitedAt: new Date() },
      create: { email, name, role: "ADMIN", isActive: true, invitedAt: new Date() },
    });

    console.log(`[users] ${currentUser.email} invited ${email}`);
    revalidatePath("/admin/users");
    return { ok: true, message: "Invite sent — email will arrive shortly." };
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

    const supabase = createSupabaseServiceClient();
    const siteUrl = getSiteUrl();
    const redirectTo = `${siteUrl}/auth/callback`;

    const { error } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (error) {
      if (isEmailRateLimitMessage(error.message)) return { ok: false, error: rateLimitMessage() };
      // Fallback to recovery link
      const { error: linkError } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });
      if (linkError) {
        if (isEmailRateLimitMessage(linkError.message)) return { ok: false, error: rateLimitMessage() };
        throw new Error(linkError.message);
      }
    }

    await prisma.user.update({ where: { email }, data: { invitedAt: new Date() } });
    revalidatePath("/admin/users");
    return { ok: true, message: "Invite resent." };
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

    // Soft-disable + remove Prisma row only if never activated? We hard delete Prisma row
    // but also try to delete Supabase Auth user (best effort).
    await prisma.user.delete({ where: { id: userId } });

    try {
      const supabase = createSupabaseServiceClient();
      const { data } = await supabase.auth.admin.listUsers();
      const authUser = data.users.find((u) => u.email?.toLowerCase() === target.email.toLowerCase());
      if (authUser) await supabase.auth.admin.deleteUser(authUser.id);
    } catch (e) {
      console.warn("[users] Supabase Auth delete failed (DB row already deleted)", e);
    }

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
