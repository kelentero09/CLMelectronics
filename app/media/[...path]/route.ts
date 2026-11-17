import { prisma } from "@/lib/db";
import { isValidMediaKey } from "@/lib/storage";

/**
 * GET /media/clm/... — serves uploaded images stored in D1 (`media_files`).
 * Keys are unique per upload and never overwritten, so responses are cached
 * as immutable by browsers and Cloudflare's edge.
 */
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.map((p) => decodeURIComponent(p)).join("/");
  if (!isValidMediaKey(key)) return new Response("Not found", { status: 404 });

  const etag = `"${key.length.toString(36)}-${encodeURIComponent(key).slice(-40)}"`;
  const headers = new Headers({
    etag,
    "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
  });
  if (request.headers.get("if-none-match") === etag) {
    const exists = await prisma.mediaFile.count({ where: { key } });
    if (exists) return new Response(null, { status: 304, headers });
  }

  const file = await prisma.mediaFile.findUnique({ where: { key }, select: { contentType: true, data: true } });
  if (!file) return new Response("Not found", { status: 404 });

  headers.set("content-type", file.contentType);
  headers.set("content-length", String(file.data.byteLength));
  return new Response(file.data as Uint8Array<ArrayBuffer>, { headers });
}
