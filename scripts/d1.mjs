// Shared helper for Node scripts (seed, Supabase migration): connects to the
// D1 database from wrangler.jsonc through
// wrangler's platform proxy.
//
//   --local  → wrangler env "local" (.wrangler/state), no Cloudflare login needed
//   default  → the real (remote) D1 database; requires `wrangler login`
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { getPlatformProxy } from "wrangler";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

export function isLocal(argv = process.argv) {
  return argv.includes("--local");
}

/** wrangler.jsonc without comments (line comments only at line start, block comments). */
function readWranglerConfig() {
  const raw = readFileSync("wrangler.jsonc", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  return JSON.parse(raw);
}

/**
 * Writes a minimal config with only the D1 binding, so a remote session
 * doesn't need every resource in wrangler.jsonc.
 */
function scriptConfig({ local }) {
  const full = readWranglerConfig();
  const source = local ? { ...full, ...full.env?.local } : full;
  const db = source.d1_databases.find((d) => d.binding === "DB");
  const config = {
    name: `${full.name}-scripts`,
    compatibility_date: full.compatibility_date,
    compatibility_flags: full.compatibility_flags,
    d1_databases: [{ ...db, remote: !local }],
  };
  mkdirSync(".wrangler", { recursive: true });
  const path = ".wrangler/scripts-config.json";
  writeFileSync(path, JSON.stringify(config, null, 2));
  return path;
}

export async function connectD1({ local = isLocal() } = {}) {
  const proxy = await getPlatformProxy({
    configPath: scriptConfig({ local }),
    remoteBindings: !local,
    envFiles: [],
    // Share local data with `wrangler d1 ... --local` and `pnpm dev:local`.
    persist: { path: ".wrangler/state/v3" },
  });
  const { env } = proxy;
  if (!env.DB) throw new Error("D1 binding `DB` not found in wrangler.jsonc");
  const prisma = new PrismaClient({ adapter: new PrismaD1(env.DB) });
  return {
    env,
    prisma,
    target: local ? "local D1 (.wrangler/state)" : `remote D1 database (${readWranglerConfig().d1_databases[0].database_name})`,
    async dispose() {
      await prisma.$disconnect().catch(() => {});
      await proxy.dispose();
    },
  };
}
