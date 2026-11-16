import { headers } from "next/headers";

/**
 * Fixed-window rate limiter.
 *
 * - If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, counts are kept
 *   in Redis via the Upstash REST API (works across serverless instances).
 * - Otherwise falls back to a per-instance in-memory map (best effort; fine for
 *   a single long-running server and for local dev).
 */
type Result = { ok: boolean; remaining: number; retryAfterSec: number };

const memory = new Map<string, { count: number; resetAt: number }>();

async function upstashIncr(key: string, windowSec: number): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSec), "NX"],
      ]),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result?: number }>;
    return typeof data[0]?.result === "number" ? data[0].result : null;
  } catch {
    return null;
  }
}

export async function rateLimit(
  bucket: string,
  identifier: string,
  { limit, windowSec }: { limit: number; windowSec: number }
): Promise<Result> {
  const windowId = Math.floor(Date.now() / (windowSec * 1000));
  const key = `rl:${bucket}:${identifier}:${windowId}`;
  const retryAfterSec = windowSec - (Math.floor(Date.now() / 1000) % windowSec);

  const remote = await upstashIncr(key, windowSec);
  if (remote !== null) {
    return { ok: remote <= limit, remaining: Math.max(0, limit - remote), retryAfterSec };
  }

  const now = Date.now();
  // Opportunistic cleanup so the map can't grow without bound.
  if (memory.size > 5000) {
    for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
  }
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { ok: true, remaining: limit - 1, retryAfterSec };
  }
  entry.count += 1;
  return { ok: entry.count <= limit, remaining: Math.max(0, limit - entry.count), retryAfterSec };
}

/**
 * Client IP from headers set by the hosting platform. `x-real-ip` /
 * platform headers are set by the proxy and can't be spoofed by the client;
 * for `x-forwarded-for` we take the LAST hop (appended by our own proxy),
 * not the first (client-controlled).
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const direct =
    h.get("x-vercel-forwarded-for") || h.get("cf-connecting-ip") || h.get("x-real-ip");
  if (direct) return direct.split(",")[0].trim();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return "unknown";
}
