/**
 * Browser-side image downscaling before upload. The server re-encodes every
 * image to a 600px WebP anyway, so sending 5 MB originals only wastes upload
 * time and lets us keep a small server-action body limit.
 * Falls back to the original file if the browser can't decode it.
 */
export async function downscaleImage(file: File, maxDim = 1600, quality = 0.85): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp", lastModified: Date.now() });
  } catch {
    return file;
  }
}

/** Replaces every File under `field` in the FormData with a downscaled copy. */
export async function downscaleFormImages(form: FormData, field: string): Promise<void> {
  const files = form.getAll(field).filter((v): v is File => v instanceof File && v.size > 0);
  if (files.length === 0) return;
  const scaled = await Promise.all(files.map((f) => downscaleImage(f)));
  form.delete(field);
  for (const f of scaled) form.append(field, f);
}
