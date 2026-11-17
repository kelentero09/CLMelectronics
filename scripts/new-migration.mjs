// `pnpm db:migration <name>` — after editing prisma/schema.prisma, writes the SQL
// needed to bring the database up to date as migrations/NNNN_<name>.sql.
// Compares the schema against the local D1 database, so run
// `pnpm db:migrate:local` first to make sure it has every existing migration.
// Then apply with `pnpm db:migrate:local` / `pnpm db:migrate`.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");

const name = (process.argv[2] || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
if (!name) {
  console.error("Usage: pnpm db:migration <name>   e.g. pnpm db:migration add_product_weight");
  process.exit(1);
}

const dir = "migrations";
const nums = readdirSync(dir)
  .map((f) => Number(f.split("_")[0]))
  .filter((n) => Number.isInteger(n));
const next = String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, "0");
const file = join(dir, `${next}_${name}.sql`);

// The local D1 sqlite file wrangler uses (largest one = the app database).
const d1Dir = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";
const candidates = existsSync(d1Dir)
  ? readdirSync(d1Dir).filter((f) => f.endsWith(".sqlite")).map((f) => join(d1Dir, f))
  : [];
candidates.sort((a, b) => statSync(b).size - statSync(a).size);
const localDb = candidates[0];
if (!localDb) {
  console.error("No local D1 database found. Run `pnpm db:migrate:local` first.");
  process.exit(1);
}

const sql = execFileSync(
  process.execPath,
  [
    prismaCli,
    "migrate", "diff",
    "--from-url", `file:${localDb.replace(/\\/g, "/")}`,
    "--to-schema-datamodel", "prisma/schema.prisma",
    "--script",
  ],
  { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }
);
if (!sql.trim() || /empty migration/i.test(sql)) {
  console.log("Schema and local database already match — no migration written.");
  process.exit(0);
}
writeFileSync(file, sql);
console.log(`Wrote ${file}. Review it, then run: pnpm db:migrate:local && pnpm db:migrate`);
