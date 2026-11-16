/**
 * Canonical public site URL used to build links in emails (invite / password reset).
 *
 * Security: never derived from request headers (Host / X-Forwarded-*), which an
 * attacker can control to poison reset links. Production requires
 * NEXT_PUBLIC_SITE_URL (or a Vercel-provided production URL).
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const isProd = process.env.NODE_ENV === "production";
  const isLocal = !!raw && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw);

  if (raw && (!isProd || !isLocal)) return raw;

  if (isProd) {
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (vercel) return (vercel.startsWith("http") ? vercel : `https://${vercel}`).replace(/\/$/, "");
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be set to the public https:// URL in production (used for email links)."
    );
  }
  return raw || "http://localhost:3000";
}
