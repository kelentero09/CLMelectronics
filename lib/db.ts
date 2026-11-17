/**
 * Prisma on Cloudflare D1.
 *
 * The D1 database is a Worker binding (`env.DB`), so there is no connection
 * string: the client has to be created from the binding of the current
 * request. `prisma` below is a lazy proxy that does this, so callers keep
 * writing `prisma.product.findMany(...)` as before.
 *
 * - Requests (Workers, and `next dev` via initOpenNextCloudflareForDev):
 *   the context is available synchronously; one client per request.
 * - `next build` prerendering: only the async context exists, so model calls
 *   resolve the binding first (wrangler's platform proxy).
 *
 * D1 has no interactive transactions. `$transaction([...])` batches still run,
 * but sequentially and without atomicity.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const LOG: ("warn" | "error")[] = process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"];

function createClient(db: D1Database): PrismaClient {
  return new PrismaClient({ adapter: new PrismaD1(db), log: LOG });
}

/** One client per request: I/O objects must not be shared across Worker requests. */
const perRequest = new WeakMap<object, PrismaClient>();

function syncClient(): PrismaClient | null {
  let context: ReturnType<typeof getCloudflareContext>;
  try {
    context = getCloudflareContext();
  } catch {
    return null;
  }
  if (!context.env.DB) throw new Error("D1 binding `DB` is missing — check wrangler.jsonc.");
  const key: object = context.ctx ?? context.env;
  let client = perRequest.get(key);
  if (!client) {
    client = createClient(context.env.DB);
    perRequest.set(key, client);
  }
  return client;
}

let buildClient: Promise<PrismaClient> | null = null;
function asyncClient(): Promise<PrismaClient> {
  buildClient ??= getCloudflareContext({ async: true }).then(({ env }) => {
    if (!env.DB) throw new Error("D1 binding `DB` is missing — check wrangler.jsonc.");
    return createClient(env.DB);
  });
  return buildClient;
}

/** Returns the Prisma client for the current request (or build step). */
export async function getPrisma(): Promise<PrismaClient> {
  return syncClient() ?? asyncClient();
}

type AnyFn = (...args: unknown[]) => unknown;

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = syncClient();
    if (client) {
      const value = Reflect.get(client, prop, client);
      return typeof value === "function" ? (value as AnyFn).bind(client) : value;
    }
    // Build time: model delegates only (e.g. prisma.product.findMany).
    return new Proxy(
      {},
      {
        get(_m, method) {
          return (...args: unknown[]) =>
            asyncClient().then((c) => {
              const delegate = Reflect.get(c, prop) as Record<PropertyKey, AnyFn>;
              return delegate[method](...args);
            });
        },
      }
    );
  },
});

export default prisma;
