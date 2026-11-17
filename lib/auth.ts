/**
 * Authentication (Better Auth on Cloudflare D1).
 * - Credentials live in `accounts.password` (lib/password.ts), sessions in `sessions`.
 * - Public sign-up is disabled: admins are invited (app/actions/users.ts).
 * - Authorization (ADMIN role, isActive) is enforced in lib/authz.ts.
 */
import { cache } from "react";
import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getSiteUrl } from "@/lib/site-url";
import { buildRecoveryHtml, isEmailConfigured, sendMail } from "@/lib/email";

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET is not set.");
  }
  const siteUrl = getSiteUrl();

  return betterAuth({
    appName: "CLM Catalog Admin",
    baseURL: siteUrl,
    basePath: "/api/auth",
    secret: secret || "dev-only-insecure-secret-change-me-0123456789",
    // `prisma` resolves the current request's D1 client lazily (lib/db.ts).
    // D1 has no interactive transactions.
    database: prismaAdapter(prisma, { provider: "sqlite", transaction: false }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      password: { hash: hashPassword, verify: verifyPassword },
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      async sendResetPassword({ user, url }) {
        if (!isEmailConfigured() && process.env.NODE_ENV !== "production") {
          console.info(`[auth] SMTP not configured. Dev password-reset link for ${user.email}:\n${url}`);
        }
        const sent = await sendMail({
          to: user.email,
          subject: "Reset your CLM Admin password",
          html: buildRecoveryHtml(url, user.email, siteUrl),
        });
        if (!sent.ok) console.error("[auth] reset email not sent:", sent.error);
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // refresh expiry once a day
    },
    // Our own server actions add per-IP/per-email limits (lib/rate-limit.ts).
    rateLimit: { enabled: true, window: 60, max: 30 },
    advanced: {
      useSecureCookies: siteUrl.startsWith("https://"),
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"] },
    },
    trustedOrigins: [siteUrl],
    // Lets server actions set the session cookie.
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;
let instance: Auth | null = null;

/** Lazily created so a missing env var fails the request, not the build. */
export function getAuth(): Auth {
  instance ??= createAuth();
  return instance;
}

export type AuthUser = { id: string; email: string; name?: string | null };

/**
 * Signed-in user for the current request, or null.
 * Wrapped in React `cache()` so layout + page + components share one lookup.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session?.user?.email) return null;
    return { id: session.user.id, email: session.user.email, name: session.user.name };
  } catch {
    return null;
  }
});
