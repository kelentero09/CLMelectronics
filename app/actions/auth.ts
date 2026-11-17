"use server";

import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { prisma } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { hashPassword, needsRehash } from "@/lib/password";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export type AuthActionResult = { ok: true; message?: string } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENERIC_RESET_MESSAGE =
  "If an active admin account exists for that email, a password reset link has been sent.";

/**
 * Email + password sign-in. Sets the session cookie on success.
 * Disabled accounts are refused before a session is created.
 */
export async function signIn(emailRaw: string, passwordRaw: string): Promise<AuthActionResult> {
  const email = String(emailRaw ?? "").trim().toLowerCase();
  const password = String(passwordRaw ?? "");
  if (!EMAIL_RE.test(email) || email.length > 254 || !password || password.length > 128) {
    return { ok: false, error: "Incorrect email or password." };
  }

  const ip = await getClientIp();
  const [byIp, byEmail] = await Promise.all([
    rateLimit("sign-in-ip", ip, { limit: 20, windowSec: 15 * 60 }),
    rateLimit("sign-in-email", email, { limit: 10, windowSec: 15 * 60 }),
  ]);
  if (!byIp.ok || !byEmail.ok) {
    return { ok: false, error: "Too many sign-in attempts. Please wait a few minutes and try again." };
  }

  try {
    const appUser = await prisma.user.findUnique({ where: { email }, select: { id: true, isActive: true } });
    if (appUser && !appUser.isActive) {
      return { ok: false, error: "That account has been disabled. Contact an admin." };
    }

    await getAuth().api.signInEmail({ body: { email, password }, headers: await headers() });

    // Upgrade legacy (Supabase bcrypt) hashes now that we know the password.
    if (appUser) {
      const account = await prisma.account.findFirst({
        where: { userId: appUser.id, providerId: "credential" },
        select: { id: true, password: true },
      });
      if (account && needsRehash(account.password)) {
        await prisma.account.update({ where: { id: account.id }, data: { password: await hashPassword(password) } });
      }
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof APIError) {
      return { ok: false, error: "Incorrect email or password." };
    }
    console.error("[signIn]", e);
    return { ok: false, error: "Sign-in is unavailable right now. Please try again." };
  }
}

export async function signOut(): Promise<AuthActionResult> {
  try {
    await getAuth().api.signOut({ headers: await headers() });
  } catch (e) {
    console.warn("[signOut]", e instanceof Error ? e.message : e);
  }
  return { ok: true };
}

/**
 * Public password-reset request.
 * Security:
 * - Always returns the same message, so it cannot be used to discover admin emails.
 * - Rate limited per IP and per email.
 * - The reset link is only emailed (or logged on the server in development),
 *   never returned to the browser.
 */
export async function requestPasswordReset(emailRaw: string): Promise<AuthActionResult> {
  const email = String(emailRaw ?? "").trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
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
    const appUser = await prisma.user.findUnique({ where: { email }, select: { isActive: true } });
    if (!appUser || !appUser.isActive) return { ok: true, message: GENERIC_RESET_MESSAGE };

    // Better Auth emails a link to /api/auth/reset-password/:token, which
    // redirects to /auth/update-password?token=... (see lib/auth.ts).
    await getAuth().api.requestPasswordReset({
      body: { email, redirectTo: "/auth/update-password" },
      headers: await headers(),
    });
    return { ok: true, message: GENERIC_RESET_MESSAGE };
  } catch (e) {
    console.error("[requestPasswordReset]", e);
    return { ok: false, error: "Could not process the request. Try again later." };
  }
}

/** Sets a new password using the token from the reset email. */
export async function resetPassword(tokenRaw: string, newPassword: string): Promise<AuthActionResult> {
  const token = String(tokenRaw ?? "").trim();
  if (!token || token.length > 256) return { ok: false, error: "Your reset link is invalid. Request a new one." };
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (newPassword.length > 128) return { ok: false, error: "Password is too long." };

  const ip = await getClientIp();
  const rl = await rateLimit("pw-reset-submit", ip, { limit: 10, windowSec: 15 * 60 });
  if (!rl.ok) return { ok: false, error: "Too many attempts. Please wait and try again." };

  try {
    await getAuth().api.resetPassword({ body: { token, newPassword }, headers: await headers() });
    return { ok: true, message: "Password updated. You can now sign in." };
  } catch (e) {
    if (e instanceof APIError) {
      return { ok: false, error: "Your reset link has expired or was already used. Request a new one." };
    }
    console.error("[resetPassword]", e);
    return { ok: false, error: "Could not update password. Try again or request a new link." };
  }
}
