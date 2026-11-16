"use server";

import { prisma } from "@/lib/db";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/auth";
import { sendMail, buildRecoveryHtml, isEmailConfigured } from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export type AuthActionResult = { ok: true; message?: string } | { ok: false; error: string };

const GENERIC_RESET_MESSAGE =
  "If an active admin account exists for that email, a password reset link has been sent.";

/**
 * Public password-reset.
 * Security:
 * - Always returns the same message, so it cannot be used to discover admin emails.
 * - Rate limited per IP and per email.
 * - The recovery link is NEVER returned to the browser (that would allow account
 *   takeover by anyone who knows an admin email). Without SMTP it is only logged
 *   on the server in development.
 */
export async function requestPasswordReset(emailRaw: string): Promise<AuthActionResult> {
  const email = String(emailRaw ?? "").trim().toLowerCase();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const ip = await getClientIp();
  const [byIp, byEmail] = await Promise.all([
    rateLimit("pw-reset-ip", ip, { limit: 5, windowSec: 15 * 60 }),
    rateLimit("pw-reset-email", email, { limit: 3, windowSec: 60 * 60 }),
  ]);
  if (!byIp.ok || !byEmail.ok) {
    return { ok: false, error: "Too many reset requests. Please try again later." };
  }

  try {
    const appUser = await prisma.user.findUnique({ where: { email } });
    if (!appUser || appUser.isActive === false) {
      return { ok: true, message: GENERIC_RESET_MESSAGE };
    }

    const supabase = createSupabaseServiceClient();
    const siteUrl = getSiteUrl();
    const redirectTo = `${siteUrl}/auth/callback?next=/auth/update-password`;

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
    if (error) {
      console.error("[requestPasswordReset] generateLink", error.message);
      return { ok: true, message: GENERIC_RESET_MESSAGE };
    }
    const actionLink = data?.properties?.action_link;
    if (!actionLink) return { ok: true, message: GENERIC_RESET_MESSAGE };

    if (!isEmailConfigured()) {
      if (process.env.NODE_ENV !== "production") {
        console.info(`[requestPasswordReset] SMTP not configured. Dev recovery link for ${email}:\n${actionLink}`);
      } else {
        console.error("[requestPasswordReset] SMTP not configured; reset email not sent.");
      }
      return { ok: true, message: GENERIC_RESET_MESSAGE };
    }

    const html = buildRecoveryHtml(actionLink, email, siteUrl);
    const sent = await sendMail({ to: email, subject: "Reset your CLM Admin password", html });
    if (!sent.ok) console.error("[requestPasswordReset] sendMail", sent.error);
    return { ok: true, message: GENERIC_RESET_MESSAGE };
  } catch (e) {
    console.error("[requestPasswordReset]", e);
    return { ok: false, error: "Could not process the request. Try again later." };
  }
}

/**
 * Sets a new password for the currently authenticated recovery session.
 * Must be called after the user has clicked the email link and has a valid session.
 */
export async function updatePassword(newPassword: string): Promise<AuthActionResult> {
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (newPassword.length > 128) {
    return { ok: false, error: "Password is too long." };
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { ok: false, error: "Your reset link has expired. Request a new one." };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      if (/same|different from the old/i.test(error.message)) {
        return { ok: false, error: "New password must be different from the old one." };
      }
      if (/weak|pwned|leaked/i.test(error.message)) {
        return { ok: false, error: "That password is too weak or has appeared in a data breach. Choose another." };
      }
      console.error("[updatePassword]", error.message);
      return { ok: false, error: "Could not update password. Request a new link and try again." };
    }
    return { ok: true, message: "Password updated. You can now sign in." };
  } catch (e) {
    console.error("[updatePassword]", e);
    return { ok: false, error: "Could not update password. Try again or request a new link." };
  }
}
