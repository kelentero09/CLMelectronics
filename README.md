# CLM Catalog — B2B Product Catalog + Admin Dashboard

Next.js 16 app on **Cloudflare Workers** (OpenNext) with a **Cloudflare D1** database, for **CLM Electronics Engineering Services**. Information and
inquiry only — **no prices, no cart, no checkout, no payments, anywhere.**

## Quick start (first-time setup: CLOUDFLARE_SETUP.md)

```bash
pnpm install
pnpm dev            # next dev against the real D1 (needs `pnpm wrangler login`)
pnpm dev:local      # next dev against a local D1 copy in .wrangler/state (offline)
pnpm preview        # production build running locally in the Workers runtime
pnpm deploy         # build + deploy to Cloudflare
```

## Content & data

- `prisma/schema.prisma` — Category, Product, ProductImage, Inquiry, User (+ Better Auth Session/Account/Verification). SQLite on Cloudflare D1. No monetary columns by design.
- `migrations/*.sql` — D1 migrations. New ones: `pnpm db:migration <name>`, apply with `pnpm db:migrate:local` / `pnpm db:migrate`.
- `prisma/seed.ts` — upserts the 5 fixed categories + ADMIN user + `[SAMPLE]` demo products (`pnpm seed --local` or `pnpm seed`).
- `lib/catalog.ts` — fixed categories, availability/condition labels, limits.

## Key routes

| Route | Surface |
|---|---|
| `/` | Homepage = products listing (search, category pills, filters, sort, pagination) |
| `/products/[slug]` | Product detail + gallery + specs + inquiry form + related |
| `/categories`, `/categories/[slug]` | Category browsing |
| `/about`, `/services`, `/contact` | Company pages (contact has the general inquiry form) |
| `/login` | Admin sign-in (Better Auth, email/password) |
| `/admin` | Dashboard (counts, recent products) |
| `/admin/products`, `/new`, `/[id]/edit` | Product CRUD, publish toggle, soft delete/restore, images |
| `/admin/categories` | Category CRUD (core slugs guarded) |
| `/admin/inquiries` | Inquiry inbox, NEW → CONTACTED → COMPLETED |

## Conventions

- Public queries: only `published: true` + `deletedAt: null`. No exceptions.
- All admin pages/actions go through `requireAdmin()` (Better Auth session + ADMIN role).
- Images: JPEG/PNG/WebP/AVIF ≤ 5 MB, max 10/product, resized to 600px WebP by the Cloudflare Images binding, stored in D1 (`media_files`) and served from `/media/...`.
- Inquiry forms: honeypot + ≤5/min/IP rate limit.
- Before launch: replace/remove ALL `[SAMPLE]` products with CLM-approved content.
