"use server";

import { prisma } from "@/lib/db";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/auth";
import { sendMail, buildRecoveryHtml, isEmailConfigured } from "@/lib/email";

export type AuthActionResult = { ok: true; message?: string; recoveryLink?: string } | { ok: false; error: string };

function isEmailRateLimitMessage(msg: string): boolean {
  return /rate limit|too many requests|over_email|email.*limit|429/i.test(msg);
}

function rateLimitMessage(): string {
  return "Supabase Auth rate limit hit (generating recovery link). Wait a minute and try again.";
}

async function getSiteUrl(): Promise<string> {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const isLocalhostRaw = raw === "http://localhost:3000" || raw === "https://localhost:3000" || raw === "http://localhost:3000/" || raw === "https://localhost:3000/";
  if (raw && !isLocalhostRaw) return raw.replace(/\/$/, "");
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

/**
 * Public password-reset — verifies the email belongs to an active admin
 * BEFORE asking Supabase to send an email. This prevents the confusing
 * "email sent" for unknown addresses and gives correct feedback.
 */
export async function requestPasswordReset(emailRaw: string): Promise<AuthActionResult> {
  const email = String(emailRaw ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  try {
    const appUser = await prisma.user.findUnique({ where: { email } });
    if (!appUser) {
      return { ok: false, error: "No admin account found with that email." };
    }
    if (appUser.isActive === false) {
      return { ok: false, error: "That account has been disabled. Contact an admin." };
    }

    const supabase = createSupabaseServiceClient();
    const siteUrl = await getSiteUrl();
    const redirectTo = `${siteUrl}/auth/callback?next=/auth/update-password`;

    // Bypass Supabase mailer: generate link + Node mailer (free, no Supabase quota)
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
    if (error) {
      if (isEmailRateLimitMessage(error.message)) return { ok: false, error: rateLimitMessage() };
      return { ok: false, error: error.message };
    }
    const actionLink = (data as unknown as { properties?: { action_link?: string } })?.properties?.action_link || (data as unknown as { action_link?: string })?.action_link;
    if (!actionLink) return { ok: false, error: "Failed to generate recovery link." };

    const html = buildRecoveryHtml(actionLink, email, siteUrl);
    const sent = await sendMail({ to: email, subject: "Reset your CLM Admin password", html });
    if (!sent.ok && !isEmailConfigured()) {
      // No SMTP — return link for manual copy (still bypasses Supabase mailer, zero cost)
      return { ok: true, message: "Recovery link generated (email not configured — copy link below). Set SMTP_* in .env to auto-send.", recoveryLink: actionLink };
    }
    if (!sent.ok) return { ok: false, error: sent.error };
    return { ok: true, message: "Password reset email sent via Node mailer — no Supabase rate limit." };
  } catch (e) {
    console.error("[requestPasswordReset]", e);
    return { ok: false, error: "Could not send reset email. Try again." };
  }
}

/**
 * Sets a new password for the currently authenticated recovery session.
 * Must be called after the user has clicked the email link and has a valid session.
 */
export async function updatePassword(newPassword: string): Promise<AuthActionResult> {
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (newPassword.length > 128) {
    return { ok: false, error: "Password is too long." };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Password updated. You can now sign in." };
  } catch (e) {
    console.error("[updatePassword]", e);
    return { ok: false, error: "Could not update password. Try again or request a new link." };
  }
}
