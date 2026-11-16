/**
 * Returns `next` only if it is a same-origin relative path; otherwise `fallback`.
 * Blocks protocol-relative (`//evil.com`), backslash tricks (`/\evil.com`),
 * userinfo tricks (`@evil.com`), absolute URLs and control characters.
 */
export function safeNext(next: string | null | undefined, fallback = "/admin"): string {
  if (!next || typeof next !== "string") return fallback;
  if (next.length > 512) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(next)) return fallback;
  try {
    const base = "http://internal.invalid";
    const url = new URL(next, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
