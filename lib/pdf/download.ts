"use client";

import type { SpecSheetData, SpecSheetPayload } from "./types";

/**
 * Loads a same-origin image and re-encodes it as a JPEG data URL on a white
 * background (react-pdf can't embed WebP). Returns null if it can't be decoded.
 */
async function toJpegDataUrl(url: string | null, maxPx: number): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const bitmap = await createImageBitmap(await res.blob());
    const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}

export class SpecSheetError extends Error {}

/** Fetches the spec-sheet data, renders the PDF in the browser and starts the download. */
export async function downloadSpecSheet(slug: string): Promise<void> {
  const res = await fetch(`/products/${encodeURIComponent(slug)}/spec-sheet`);
  if (res.status === 429) throw new SpecSheetError("Too many downloads. Please wait a minute and try again.");
  if (!res.ok) throw new SpecSheetError("Failed to generate spec sheet. Please try again.");
  const payload = (await res.json()) as SpecSheetPayload;

  const [image, logo, { generateSpecSheetPdf }] = await Promise.all([
    toJpegDataUrl(payload.imageUrl, 900),
    toJpegDataUrl(payload.logoUrl, 160),
    import("./spec-sheet"),
  ]);
  const data: SpecSheetData = { ...payload, image, logo };
  const blob = await generateSpecSheetPdf(data);

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}-spec-sheet.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
