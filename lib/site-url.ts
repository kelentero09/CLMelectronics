/**
 * Canonical public site URL used to build links in emails (invite / password reset)
 * and as the Better Auth base URL.
 *
 * Security: never derived from request headers (Host / X-Forwarded-*), which an
 * attacker can control to poison reset links. Production requires
 * NEXT_PUBLIC_SITE_URL (set in wrangler.jsonc `vars`).
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (raw) return raw;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL must be set to the public https:// URL in production (used for email links).");
  }
  return "http://localhost:3000";
}
