// One-time migration: Supabase (Postgres + Auth + Storage) → Cloudflare D1.
//
//   pnpm migrate:supabase --local        # into the local D1 (.wrangler/state) to try it out
//   pnpm migrate:supabase                # into the real D1 database
//   add --reset to empty the D1 tables first (required if they already contain data)
//   add --skip-images to copy only the database rows
//   --images-only copies only the image files (no other tables are touched)
//
// Reads from .env:
//   DIRECT_URL (or SUPABASE_DB_URL)  Postgres connection string (port 5432)
//   NEXT_PUBLIC_SUPABASE_URL         https://<ref>.supabase.co (for downloading images)
//   SUPABASE_SECRET_KEY              only needed if the storage bucket is private
//
// What it does:
//   1. Copies every app table (users, categories, products, images, inquiries,
//      site content, board repairs) into D1 with the same ids.
//   2. Copies each admin's Supabase Auth password hash (bcrypt) into `accounts`,
//      so admins sign in with their current password (upgraded on first sign-in).
//   3. Downloads every image referenced from the Supabase bucket, stores it in
//      D1 (table media_files), and rewrites its URL to /media/<key>.
import "dotenv/config";
import pg from "pg";
import { connectD1, isLocal } from "./d1.mjs";

const args = new Set(process.argv.slice(2));
const LOCAL = isLocal();
const RESET = args.has("--reset");
const SKIP_IMAGES = args.has("--skip-images");
const IMAGES_ONLY = args.has("--images-only");

const PG_URL = process.env.SUPABASE_DB_URL || process.env.DIRECT_URL;
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "product-images";

if (!PG_URL) {
  console.error("Set DIRECT_URL (or SUPABASE_DB_URL) in .env to the Supabase Postgres connection string.");
  process.exit(1);
}

// D1 allows at most 100 bound parameters per statement, and rows of at most 2 MB.
const MAX_PARAMS = 100;
const MAX_IMAGE_ROW_BYTES = 1_900_000;

const log = (...m) => console.log(...m);

// ---------------------------------------------------------------- images
const publicPrefix = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/` : null;
/** supabase key → r2 key */
const imageKeys = new Map();

function r2KeyFor(supabaseKey) {
  const clean = decodeURIComponent(supabaseKey.split("?")[0]).replace(/^\/+/, "");
  const safe = clean.replace(/[^A-Za-z0-9._\/-]/g, "_").replace(/\/{2,}/g, "/").replace(/\.\.+/g, ".");
  return safe.startsWith("clm/") ? safe : `clm/legacy/${safe}`;
}

/** Rewrites Supabase storage URLs inside a string to /media/<key>. */
function rewriteUrls(value) {
  if (typeof value !== "string" || !publicPrefix || !value.includes(publicPrefix)) return value;
  return value.split(publicPrefix).map((part, i) => {
    if (i === 0) return part;
    const m = part.match(/^[^\s"'<>)]+/);
    const key = m ? m[0] : "";
    if (!key) return publicPrefix + part;
    const r2Key = r2KeyFor(key);
    imageKeys.set(key, r2Key);
    return `/media/${r2Key}${part.slice(key.length)}`;
  }).join("");
}

function rewriteJson(value) {
  if (value == null) return value;
  return JSON.parse(rewriteUrls(JSON.stringify(value)));
}

async function downloadImage(key) {
  const tries = [`${publicPrefix}${key}`];
  if (SECRET) tries.push(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`);
  for (const url of tries) {
    const res = await fetch(url, {
      headers: url.includes("/public/") ? {} : { Authorization: `Bearer ${SECRET}`, apikey: SECRET },
      signal: AbortSignal.timeout(30_000),
    });
    if (res.ok) {
      return { body: await res.arrayBuffer(), contentType: res.headers.get("content-type") || "image/webp" };
    }
  }
  return null;
}

/** Copies every collected image (imageKeys) from Supabase Storage into D1 (media_files). */
async function copyImages(prisma) {
  if (imageKeys.size === 0) return log("No Supabase images referenced.");
  log(`Copying ${imageKeys.size} images into D1…`);
  let copied = 0;
  const missing = [];
  for (const [key, r2Key] of imageKeys) {
    const file = await downloadImage(key);
    if (!file) {
      missing.push(key);
      continue;
    }
    const data = new Uint8Array(file.body);
    if (data.byteLength > MAX_IMAGE_ROW_BYTES) {
      missing.push(`${key} (too large for D1: ${data.byteLength} bytes)`);
      continue;
    }
    await prisma.mediaFile.upsert({
      where: { key: r2Key },
      create: { key: r2Key, contentType: file.contentType, size: data.byteLength, data },
      update: { contentType: file.contentType, size: data.byteLength, data },
    });
    copied++;
    log(`  ✓ /media/${r2Key}`);
  }
  log(`  images copied: ${copied}/${imageKeys.size}`);
  if (missing.length) log(`  ! ${missing.length} could not be downloaded:\n    ${missing.join("\n    ")}`);
}

// ---------------------------------------------------------------- helpers
async function insertMany(delegate, rows, label) {
  if (rows.length === 0) return log(`  ${label}: 0 rows`);
  const cols = Object.keys(rows[0]).length;
  const size = Math.max(1, Math.floor(MAX_PARAMS / cols));
  for (let i = 0; i < rows.length; i += size) {
    await delegate.createMany({ data: rows.slice(i, i + size) });
  }
  log(`  ${label}: ${rows.length} rows`);
}

const pick = (row, keys) => Object.fromEntries(keys.map((k) => [k, row[k] ?? null]));

// ---------------------------------------------------------------- main
async function main() {
  log(`Source: Supabase Postgres (${new URL(PG_URL).host})`);
  const pgClient = new pg.Client({ connectionString: PG_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 30_000 });
  await pgClient.connect();
  const q = async (sql) => (await pgClient.query(sql)).rows;

  // One pg client runs one query at a time.
  const queries = [
    () => q(`SELECT * FROM public.users ORDER BY "createdAt"`),
    () => q(`SELECT lower(email) AS email, encrypted_password FROM auth.users WHERE email IS NOT NULL`).catch((e) => {
      console.warn(`  ! Could not read auth.users (${e.message}). Admins will need a password reset.`);
      return [];
    }),
    () => q(`SELECT * FROM public.categories ORDER BY "sortOrder"`),
    () => q(`SELECT * FROM public.products ORDER BY "createdAt"`),
    () => q(`SELECT * FROM public.product_images ORDER BY "createdAt"`),
    () => q(`SELECT * FROM public.inquiries ORDER BY "createdAt"`),
    () => q(`SELECT * FROM public.site_contents ORDER BY "group", "sortOrder"`),
    () => q(`SELECT * FROM public.board_repairs ORDER BY "sortOrder"`),
  ];
  const results = [];
  for (const run of queries) results.push(await run());
  const [users, authUsers, categories, products, images, inquiries, siteContents, repairs] = results;
  await pgClient.end();
  log(
    `Read: ${users.length} users, ${categories.length} categories, ${products.length} products, ` +
      `${images.length} images, ${inquiries.length} inquiries, ${siteContents.length} site content rows, ${repairs.length} board repairs`
  );

  if (IMAGES_ONLY) {
    // Collect the image keys exactly as the data migration rewrote them.
    for (const c of categories) rewriteUrls(c.image);
    for (const p of products) { rewriteJson(p.specifications); rewriteUrls(p.datasheetUrl); }
    for (const i of images) rewriteUrls(i.url);
    for (const c of siteContents) { rewriteUrls(c.value ?? ""); rewriteJson(c.data); }
    for (const r of repairs) rewriteUrls(r.image);
    const { prisma, target, dispose } = await connectD1({ local: LOCAL });
    log(`Target: ${target}`);
    try {
      await copyImages(prisma);
    } finally {
      await dispose();
    }
    return;
  }

  const { prisma, target, dispose } = await connectD1({ local: LOCAL });
  log(`Target: ${target}`);
  try {
    const existing = await prisma.product.count() + await prisma.user.count() + await prisma.siteContent.count();
    if (existing > 0 && !RESET) {
      throw new Error("Target D1 already has data. Re-run with --reset to replace it.");
    }
    if (RESET) {
      log("Clearing target tables…");
      for (const model of ["mediaFile", "verification", "session", "account", "inquiry", "productImage", "product", "category", "boardRepair", "siteContent", "user"]) {
        await prisma[model].deleteMany();
      }
    }

    const hashByEmail = new Map(authUsers.filter((u) => u.encrypted_password).map((u) => [u.email, u.encrypted_password]));

    log("Writing D1…");
    await insertMany(
      prisma.user,
      users.map((u) => ({
        ...pick(u, ["id", "email", "name", "role", "isActive", "invitedAt", "inviteAccepted", "inviteToken", "inviteTokenExpiresAt", "createdAt", "updatedAt"]),
        email: String(u.email).toLowerCase(),
        emailVerified: hashByEmail.has(String(u.email).toLowerCase()),
      })),
      "users"
    );
    const accounts = users
      .filter((u) => hashByEmail.has(String(u.email).toLowerCase()))
      .map((u) => ({ userId: u.id, accountId: u.id, providerId: "credential", password: hashByEmail.get(String(u.email).toLowerCase()) }));
    await insertMany(prisma.account, accounts, "accounts (imported passwords)");

    await insertMany(
      prisma.category,
      categories.map((c) => ({
        ...pick(c, ["id", "name", "slug", "description", "isActive", "sortOrder", "createdAt", "updatedAt"]),
        image: rewriteUrls(c.image),
      })),
      "categories"
    );
    await insertMany(
      prisma.product,
      products.map((p) => ({
        ...pick(p, ["id", "name", "slug", "referenceCode", "categoryId", "model", "partNumber", "manufacturer", "shortDescription", "description", "condition", "availability", "published", "featured", "createdAt", "updatedAt", "deletedAt"]),
        specifications: rewriteJson(p.specifications) ?? undefined,
        datasheetUrl: rewriteUrls(p.datasheetUrl),
      })),
      "products"
    );
    await insertMany(
      prisma.productImage,
      images.map((i) => ({ ...pick(i, ["id", "productId", "alt", "position", "isPrimary", "createdAt"]), url: rewriteUrls(i.url) })),
      "product images"
    );
    await insertMany(
      prisma.inquiry,
      inquiries.map((i) => pick(i, ["id", "productId", "productRef", "name", "email", "phone", "company", "message", "status", "createdAt"])),
      "inquiries"
    );
    await insertMany(
      prisma.siteContent,
      siteContents.map((c) => ({
        ...pick(c, ["id", "key", "group", "label", "description", "sortOrder", "updatedAt"]),
        value: rewriteUrls(c.value ?? ""),
        data: rewriteJson(c.data) ?? undefined,
      })),
      "site content"
    );
    await insertMany(
      prisma.boardRepair,
      repairs.map((r) => ({
        ...pick(r, ["id", "key", "station", "model", "boardDescription", "problem", "repairRate", "sortOrder", "isActive", "createdAt", "updatedAt"]),
        image: rewriteUrls(r.image),
      })),
      "board repairs"
    );

    if (SKIP_IMAGES) {
      log(`Skipped images (${imageKeys.size} referenced).`);
    } else {
      await copyImages(prisma);
    }

    // Verify
    const counts = {
      users: [users.length, await prisma.user.count()],
      categories: [categories.length, await prisma.category.count()],
      products: [products.length, await prisma.product.count()],
      product_images: [images.length, await prisma.productImage.count()],
      inquiries: [inquiries.length, await prisma.inquiry.count()],
      site_contents: [siteContents.length, await prisma.siteContent.count()],
      board_repairs: [repairs.length, await prisma.boardRepair.count()],
    };
    log("\nVerification (Supabase → D1):");
    let ok = true;
    for (const [table, [from, to]] of Object.entries(counts)) {
      const match = from === to;
      ok &&= match;
      log(`  ${match ? "✓" : "✗"} ${table.padEnd(15)} ${from} → ${to}`);
    }
    log(ok ? "\nMigration complete." : "\nRow counts differ — check the output above.");
    if (accounts.length < users.length) {
      log(`Note: ${users.length - accounts.length} user(s) had no Supabase password (pending invites) — resend their invite.`);
    }
  } finally {
    await dispose();
  }
}

main().catch((e) => {
  console.error("\nMigration failed:", e.message || e);
  process.exit(1);
});
