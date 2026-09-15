# CLM Catalog — B2B Product Catalog + Admin Dashboard

Standalone Next.js 16 app for **CLM Electronics Engineering Services**. Information and
inquiry only — **no prices, no cart, no checkout, no payments, anywhere.**

## Quick start (after Supabase is connected — see SUPABASE_SETUP.md)

```bash
pnpm install
pnpm build
pnpm start
# dev:
pnpm dev
```

## Content & data

- `prisma/schema.prisma` — Category, Product, ProductImage, Inquiry, User. No monetary columns by design.
- `prisma/migrations/0001_init/migration.sql` — initial migration (apply with `prisma migrate deploy`).
- `prisma/seed.ts` — upserts the 5 fixed categories + ADMIN user + `[SAMPLE]` demo products.
- `lib/catalog.ts` — fixed categories, availability/condition labels, limits.

## Key routes

| Route | Surface |
|---|---|
| `/` | Homepage = products listing (search, category pills, filters, sort, pagination) |
| `/products/[slug]` | Product detail + gallery + specs + inquiry form + related |
| `/categories`, `/categories/[slug]` | Category browsing |
| `/about`, `/services`, `/contact` | Company pages (contact has the general inquiry form) |
| `/login` | Admin sign-in (Supabase Auth, email/password) |
| `/admin` | Dashboard (counts, recent products) |
| `/admin/products`, `/new`, `/[id]/edit` | Product CRUD, publish toggle, soft delete/restore, images |
| `/admin/categories` | Category CRUD (core slugs guarded) |
| `/admin/inquiries` | Inquiry inbox, NEW → CONTACTED → COMPLETED |

## Conventions

- Public queries: only `published: true` + `deletedAt: null`. No exceptions.
- All admin pages/actions go through `requireAdmin()` (Supabase session + Prisma role).
- Images: JPEG/PNG/WebP/AVIF ≤ 5 MB, max 10/product, converted to WebP via sharp, stored in the `product-images` Supabase bucket.
- Inquiry forms: honeypot + ≤5/min/IP rate limit.
- Before launch: replace/remove ALL `[SAMPLE]` products with CLM-approved content.
