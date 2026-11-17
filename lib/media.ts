/** Client-safe helpers for uploaded images stored in D1 and served at /media/... (see lib/storage.ts). */
export const MEDIA_PREFIX = "/media/";

/**
 * True for uploaded images. These are already 600px WebP and are served by a
 * route (not a static asset), which the Cloudflare image optimizer can't fetch,
 * so <Image> must render them with `unoptimized`.
 */
export function isMediaUrl(src: unknown): boolean {
  return typeof src === "string" && src.startsWith(MEDIA_PREFIX);
}
