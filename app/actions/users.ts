"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";
import { createSupabaseServiceClient } from "@/lib/auth";
import { inviteUserSchema, firstIssueMessage } from "@/lib/validators";
import { sendMail, buildInviteHtml, buildRecoveryHtml, isEmailConfigured } from "@/lib/email";

export type UserActionResult = { ok: true; message?: string; inviteLink?: string } | { ok: false; error: string };

async function getSiteUrl(): Promise<string> {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const isLocalhostRaw = raw === "http://localhost:3000" || raw === "https://localhost:3000" || raw === "http://localhost:3000/" || raw === "https://localhost:3000/";
  // If user explicitly set a non-localhost URL, honor it (Vercel prod or Hostinger)
  if (raw && !isLocalhostRaw) return raw.replace(/\/$/, "");
  // In production/Vercel, localhost is wrong — try to infer real host
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    try {
      const { headers } = await import("next/headers");
      const h = await headers();
      const host = h.get("host");
      const proto = h.get("x-forwarded-proto") || "https";
      if (host && !host.includes("localhost")) {
        return `${proto}://${host}`.replace(/\/$/, "");
      }
    } catch {}
    const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
    if (vercelUrl) {
      const withProto = vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
      if (!withProto.includes("localhost")) return withProto.replace(/\/$/, "");
    }
    if (isLocalhostRaw) {
      console.warn(`[getSiteUrl] NEXT_PUBLIC_SITE_URL is localhost but running on Vercel — using Vercel host if available. Set NEXT_PUBLIC_SITE_URL to https://<your-vercel>.vercel.app in Vercel env and redeploy.`);
    }
  }
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

function isEmailRateLimitMessage(msg: string): boolean {
  return /rate limit|too many requests|over_email|email.*limit|429/i.test(msg);
}

function rateLimitMessage(): string {
  return "Supabase Auth rate limit hit (generating link). Wait a minute and try again — or use Node mailer (SMTP_HOST set) to bypass Supabase email limits.";
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
    const siteUrl = await getSiteUrl();
    const redirectTo = `${siteUrl}/auth/callback?next=/auth/update-password`;

    // Bypass Supabase's rate-limited mailer: generate link server-side and send via free Node mailer (Nodemailer)
    // If SMTP_* not set, we still generate the link and return it for manual copy (zero cost, no external service).
    const { data: linkData, error: genError } = await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo, data: name ? { name } : undefined },
    });

    if (genError) {
      // If invite link fails because user already exists, fall back to recovery link
      if (/already exists|already registered/i.test(genError.message)) {
        const { data: recData, error: recError } = await supabase.auth.admin.generateLink({
          type: "recovery",
          email,
          options: { redirectTo },
        });
        if (recError) {
          if (isEmailRateLimitMessage(recError.message)) return { ok: false, error: rateLimitMessage() };
          throw new Error(recError.message);
        }
        const actionLink = (recData as unknown as { properties?: { action_link?: string } })?.properties?.action_link || (recData as unknown as { action_link?: string })?.action_link;
        if (actionLink) {
          const html = buildRecoveryHtml(actionLink, email, siteUrl);
          const sent = await sendMail({ to: email, subject: "Reset your CLM Admin password", html });
          await prisma.user.upsert({
            where: { email },
            update: { name: name ?? undefined, isActive: true, invitedAt: new Date() },
            create: { email, name, role: "ADMIN", isActive: true, invitedAt: new Date() },
          });
          revalidatePath("/admin/users");
          if (!sent.ok && !isEmailConfigured()) {
            return { ok: true, message: "Recovery link generated (email not configured — copy link below).", inviteLink: actionLink };
          }
          if (!sent.ok) return { ok: false, error: sent.error };
          return { ok: true, message: "Recovery email sent via Node mailer." };
        }
        await prisma.user.upsert({
          where: { email },
          update: { name: name ?? undefined, isActive: true, invitedAt: new Date() },
          create: { email, name, role: "ADMIN", isActive: true, invitedAt: new Date() },
        });
        revalidatePath("/admin/users");
        return { ok: true, message: "User exists — recovery link generated." };
      }
      if (isEmailRateLimitMessage(genError.message)) return { ok: false, error: rateLimitMessage() };
      throw new Error(genError.message);
    }

    const actionLink = (linkData as unknown as { properties?: { action_link?: string } })?.properties?.action_link || (linkData as unknown as { action_link?: string })?.action_link;
    if (!actionLink) throw new Error("Failed to generate invite link");

    const html = buildInviteHtml(actionLink, email, siteUrl);
    const sent = await sendMail({ to: email, subject: "You’ve been invited to CLM Admin — set your password", html });

    await prisma.user.upsert({
      where: { email },
      update: { name: name ?? undefined, isActive: true, invitedAt: new Date() },
      create: { email, name, role: "ADMIN", isActive: true, invitedAt: new Date() },
    });

    console.log(`[users] ${currentUser.email} invited ${email} via Node mailer (configured=${isEmailConfigured()})`);
    revalidatePath("/admin/users");
    if (!sent.ok && !isEmailConfigured()) {
      return { ok: true, message: "Invite link generated (email not configured — copy link below). Set SMTP_* in .env to auto-send.", inviteLink: actionLink };
    }
    if (!sent.ok) return { ok: false, error: sent.error };
    return { ok: true, message: "Invite sent via Node mailer — no Supabase rate limit." };
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
    const siteUrl = await getSiteUrl();
    const redirectTo = `${siteUrl}/auth/callback?next=/auth/update-password`;

    // Bypass Supabase mailer: generate link + Node mailer
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo },
    });
    let actionLink: string | undefined;
    if (error) {
      if (isEmailRateLimitMessage(error.message)) return { ok: false, error: rateLimitMessage() };
      // fallback to recovery
      const { data: recData, error: recError } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });
      if (recError) {
        if (isEmailRateLimitMessage(recError.message)) return { ok: false, error: rateLimitMessage() };
        throw new Error(recError.message);
      }
      actionLink = (recData as unknown as { properties?: { action_link?: string } })?.properties?.action_link || (recData as unknown as { action_link?: string })?.action_link;
      if (actionLink) {
        const html = buildRecoveryHtml(actionLink, email, siteUrl);
        const sent = await sendMail({ to: email, subject: "Reset your CLM Admin password", html });
        await prisma.user.update({ where: { email }, data: { invitedAt: new Date() } });
        revalidatePath("/admin/users");
        if (!sent.ok && !isEmailConfigured()) return { ok: true, message: "Link generated (email not configured — copy below).", inviteLink: actionLink };
        if (!sent.ok) return { ok: false, error: sent.error };
        return { ok: true, message: "Invite resent via Node mailer." };
      }
    } else {
      actionLink = (data as unknown as { properties?: { action_link?: string } })?.properties?.action_link || (data as unknown as { action_link?: string })?.action_link;
      if (actionLink) {
        const html = buildInviteHtml(actionLink, email, siteUrl);
        const sent = await sendMail({ to: email, subject: "You’ve been invited to CLM Admin — set your password", html });
        await prisma.user.update({ where: { email }, data: { invitedAt: new Date() } });
        revalidatePath("/admin/users");
        if (!sent.ok && !isEmailConfigured()) return { ok: true, message: "Link generated (email not configured — copy below).", inviteLink: actionLink };
        if (!sent.ok) return { ok: false, error: sent.error };
        return { ok: true, message: "Invite resent via Node mailer." };
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
