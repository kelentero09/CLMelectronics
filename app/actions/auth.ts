"use server";

import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/auth";

export type AuthActionResult = { ok: true; message?: string } | { ok: false; error: string };

function isEmailRateLimitMessage(msg: string): boolean {
  return /rate limit|too many requests|over_email|email.*limit|429/i.test(msg);
}

function rateLimitMessage(): string {
  return "Email rate limit exceeded — Supabase’s built-in mailer allows ~3–4 emails/hour per address (≈30/hour per project). Wait 2–5 minutes and try again. For production, set up Custom SMTP in Supabase Dashboard → Auth → SMTP (see SUPABASE_SETUP.md §7) to lift this limit.";
}

function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    console.warn("[getSiteUrl] NEXT_PUBLIC_SITE_URL not set — recovery links will use localhost fallback");
  }
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

    const supabase = await createSupabaseServerClient();
    const siteUrl = getSiteUrl();
    const redirectTo = `${siteUrl}/auth/callback?next=/auth/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      if (isEmailRateLimitMessage(error.message)) return { ok: false, error: rateLimitMessage() };
      return { ok: false, error: error.message };
    }
    return { ok: true, message: "Password reset email sent — check your inbox." };
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
