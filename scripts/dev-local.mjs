// `pnpm dev:local` — next dev against the local-only bindings (wrangler env "local"):
// a local D1 database and R2 bucket in .wrangler/state instead of the real ones.
// First run: `pnpm db:migrate:local` (and optionally `pnpm migrate:supabase --local`).
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_DEV_WRANGLER_ENV: "local",
    NEXT_PUBLIC_SITE_URL: process.env.LOCAL_SITE_URL || "http://localhost:3000",
  },
});
child.on("exit", (code) => process.exit(code ?? 0));
