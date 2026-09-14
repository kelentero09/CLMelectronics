/**
 * Supabase Storage for CLM product images. Bucket: product-images.
 * Uploads are converted to WebP server-side. Service-role usage is
 * server-only — never expose storage admin keys to the browser.
 */
import sharp from "sharp";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/auth";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, validateImageFile } from "@/lib/validators";

export const PRODUCT_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "product-images";
export const WEBP_QUALITY = 80;

export { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES };

export async function convertToWebP(input: Buffer | File): Promise<Buffer> {
  const buffer = input instanceof File ? Buffer.from(await input.arrayBuffer()) : input;
  return sharp(buffer).webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer();
}

export function getPublicImageUrl(path: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  const clean = path.replace(/^\/+/, "");
  return `${url}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${clean}`;
}

export function sanitizeFileName(originalName: string): string {
  const base = originalName.split("/").pop()?.split("\\").pop() ?? "image";
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_{2,}/g, "_");
  const dot = safe.lastIndexOf(".");
  const name = dot === -1 ? safe : safe.slice(0, dot).slice(0, 80) || "image";
  return `${name}.webp`;
}

/** Storage layout: product-images/clm/<productId>/<timestamp>-<rand>-<name>.webp */
export function generateImagePath(opts: { productId?: string; originalName: string }): string {
  const scope = opts.productId ? `clm/${opts.productId}` : "clm/general";
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${scope}/${ts}-${rand}-${sanitizeFileName(opts.originalName)}`;
}

export function assertValidImageFile(file: { type: string; size: number; name: string }) {
  const err = validateImageFile(file);
  if (err) throw new Error(err);
}

/** Upload as the logged-in admin (server client with cookies). */
export async function uploadProductImage(opts: { file: File; productId?: string; customPath?: string }) {
  assertValidImageFile({ type: opts.file.type, size: opts.file.size, name: opts.file.name });
  const webpBuffer = await convertToWebP(opts.file);
  const path =
    opts.customPath ?? generateImagePath({ productId: opts.productId, originalName: opts.file.name });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, webpBuffer, { upsert: false, contentType: "image/webp" });
  if (error) throw error;
  return { path: data.path, publicUrl: getPublicImageUrl(data.path) };
}

/** Delete by storage path (service role). DB delete must succeed even if this fails. */
export async function deleteProductImage(path: string) {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
  if (error) throw error;
}

export function storagePathFromUrl(url: string): string | null {
  const marker = `/${PRODUCT_IMAGES_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
