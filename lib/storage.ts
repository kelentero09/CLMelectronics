/**
 * Product / board-repair images, stored in D1 (table `media_files`).
 *
 * Served by app/media/[...path]/route.ts, so a stored image URL looks like
 * /media/clm/<productId>/<file>.webp.
 *
 * Uploads are re-encoded to a 600px WebP with the Cloudflare Images binding
 * (IMAGES) when available; otherwise the browser-downscaled WebP from
 * lib/client-image.ts is stored as-is. D1 rows are limited to 2 MB.
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { prisma } from "@/lib/db";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, validateImageFile } from "@/lib/validators";
import { MEDIA_PREFIX } from "@/lib/media";

export { MEDIA_PREFIX };
export const WEBP_QUALITY = 70;
const MAX_DIMENSION = 600;
/** Stay under D1's 2 MB row limit. */
export const MAX_STORED_IMAGE_BYTES = 1_900_000;

export { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES };

/** Resizes + converts to WebP. Returns the original bytes if conversion isn't available. */
async function toWebP(file: File): Promise<{ body: Uint8Array; contentType: string }> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (env.IMAGES) {
      const result = await env.IMAGES.input(file.stream())
        .transform({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "scale-down" })
        .output({ format: "image/webp", quality: WEBP_QUALITY });
      return { body: new Uint8Array(await result.response().arrayBuffer()), contentType: "image/webp" };
    }
  } catch (e) {
    console.warn("[storage] Images binding transform failed, storing original:", e instanceof Error ? e.message : e);
  }
  return { body: new Uint8Array(await file.arrayBuffer()), contentType: file.type };
}

export function getPublicImageUrl(key: string): string {
  return `${MEDIA_PREFIX}${key.replace(/^\/+/, "")}`;
}

function extensionFor(contentType: string): string {
  if (contentType === "image/png") return "png";
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/avif") return "avif";
  return "webp";
}

export function sanitizeFileName(originalName: string, ext = "webp"): string {
  const base = originalName.split("/").pop()?.split("\\").pop() ?? "image";
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_{2,}/g, "_");
  const dot = safe.lastIndexOf(".");
  const name = dot === -1 ? safe : safe.slice(0, dot).slice(0, 80) || "image";
  return `${name}.${ext}`;
}

function uniquePrefix(): string {
  const rand = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  return `${Date.now()}-${rand}`;
}

export function assertValidImageFile(file: { type: string; size: number; name: string }) {
  const err = validateImageFile(file);
  if (err) throw new Error(err);
}

async function putImage(scope: string, file: File) {
  assertValidImageFile({ type: file.type, size: file.size, name: file.name });
  const { body, contentType } = await toWebP(file);
  if (body.byteLength > MAX_STORED_IMAGE_BYTES) {
    throw new Error("Image is too large after compression (max 1.9 MB). Use a smaller image.");
  }
  const key = `${scope}/${uniquePrefix()}-${sanitizeFileName(file.name, extensionFor(contentType))}`;
  await prisma.mediaFile.create({
    data: { key, contentType, size: body.byteLength, data: body as Uint8Array<ArrayBuffer> },
  });
  return { path: key, publicUrl: getPublicImageUrl(key) };
}

/** Key layout: clm/<productId>/<timestamp>-<rand>-<name>.webp */
export async function uploadProductImage(opts: { file: File; productId?: string }) {
  return putImage(opts.productId ? `clm/${opts.productId}` : "clm/general", opts.file);
}

/** Board-repair photo: clm/repairs/<timestamp>-<rand>-<name>.webp */
export async function uploadRepairImage(opts: { file: File }) {
  return putImage("clm/repairs", opts.file);
}

/** Brand logo: clm/brands/<timestamp>-<rand>-<name>.webp */
export async function uploadBrandImage(opts: { file: File }) {
  return putImage("clm/brands", opts.file);
}

/** Delete by key. The owning DB row must be deleted even if this fails. */
export async function deleteProductImage(key: string) {
  await prisma.mediaFile.deleteMany({ where: { key } });
}

/** Image key for a /media/... URL, or null for /public files and other URLs. */
export function storagePathFromUrl(url: string): string | null {
  if (!url.startsWith(MEDIA_PREFIX)) return null;
  const key = url.slice(MEDIA_PREFIX.length).split("?")[0];
  return isValidMediaKey(key) ? key : null;
}

/** Keys we create: clm/... with safe characters only (no "..", no leading slash). */
export function isValidMediaKey(key: string): boolean {
  return /^clm\/[A-Za-z0-9._\/-]{1,300}$/.test(key) && !key.includes("..") && !key.includes("//");
}
