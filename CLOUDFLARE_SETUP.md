# Cloudflare setup (D1 only, free)

The CLM catalog runs on **Cloudflare Workers** via [OpenNext](https://opennext.js.org/cloudflare)
and stores everything in one **D1** database — no R2, KV or other paid products:

| Piece | Where | Binding (wrangler.jsonc) |
|---|---|---|
| App data (Prisma): products, categories, inquiries, CMS content… | D1 `clm` | `DB` |
| Login (Better Auth): users, password hashes, sessions | D1 `clm` | `DB` |
| Uploaded images (table `media_files`), served at `/media/...` | D1 `clm` | `DB` |
| Upload resizing + `next/image` optimization (optional) | Cloudflare Images (free 5,000/month) | `IMAGES` |

**Wrangler** is Cloudflare's command-line tool (installed with the project; run it as
`pnpm wrangler ...`). It creates and manages the D1 database and deploys the site.

---

## 1. Database (done)

The D1 database `clm` (id `9307c9e7-d49c-4385-b33f-40e3811d492e`) exists, has the
tables (`pnpm db:migrate`), and contains the data and images copied from Supabase.

To set it up from scratch on another account:

```bash
pnpm wrangler login
pnpm wrangler d1 create clm              # put the printed id into wrangler.jsonc
pnpm db:migrate                          # create the tables
pnpm migrate:supabase                    # copy data + images from Supabase (while it exists)
```

## 2. Secrets (production)

```bash
pnpm wrangler secret put BETTER_AUTH_SECRET   # long random string (see .env.example)
pnpm wrangler secret put SMTP_HOST            # e.g. smtp.gmail.com
pnpm wrangler secret put SMTP_PORT            # 465 recommended
pnpm wrangler secret put SMTP_USER
pnpm wrangler secret put SMTP_PASS            # Gmail: an App Password
pnpm wrangler secret put SMTP_FROM
pnpm wrangler secret put SMTP_SECURE          # "true" for port 465
```

For local development the same names go in `.env` (see `.env.example`).

## 3. Deploy

Set `vars.NEXT_PUBLIC_SITE_URL` in wrangler.jsonc to the public URL, then:

```bash
pnpm deploy          # opennextjs-cloudflare build + deploy
```

`pnpm preview` runs the production build locally in the Workers runtime first.
The build reads the real D1 data, so be logged in (`pnpm wrangler login`).

> **Building on Windows:** the OpenNext bundling step creates symlinks, which Windows
> only allows with **Developer Mode** on (Settings → System → For developers →
> Developer Mode), otherwise it fails with `EPERM: operation not permitted, symlink`.
> Alternatives: run the build from WSL, or let Cloudflare build it — Workers →
> clmelectronics → Settings → Builds → connect the Git repo, build command
> `pnpm exec opennextjs-cloudflare build`, deploy command `pnpm exec opennextjs-cloudflare deploy`.
> `pnpm dev` works on Windows either way.

> **Workers Free plan:** the built app is ~2.9 MB compressed; the Free plan allows 3 MB.
> Keep it under the limit: the PDF library is swapped for a stub on the server
> (`turbopack.resolveAlias` in next.config.ts), nodemailer is only loaded in local dev
> (lib/email.ts), and Prisma uses the small `engineType = "client"` engine.
> Check the size before deploying with `pnpm wrangler deploy --dry-run` after a build.
> The Free plan also limits each request to 10 ms of CPU time; if pages fail with
> error 1102, the Paid plan ($5/month) raises that.

## 4. After it works

- Remove the Supabase values from `.env` and delete the Supabase project when you're ready.
- Optional: add a custom domain (Workers → clmelectronics → Settings → Domains), then
  update `NEXT_PUBLIC_SITE_URL` and redeploy.

---

## Day-to-day

| Task | Command |
|---|---|
| Dev against the real D1 | `pnpm dev` |
| Dev offline against a local copy | `pnpm db:migrate:local` once, then `pnpm dev:local` |
| Change the schema | edit `prisma/schema.prisma` → `pnpm db:migration <name>` → `pnpm db:migrate:local` → `pnpm db:migrate` |
| Seed categories / sample data | `pnpm seed --local` or `pnpm seed` |
| Database console | `pnpm wrangler d1 execute clm --remote --command "SELECT count(*) FROM products"` |
| Backups | D1 Time Travel restores any point in the last 30 days (7 on Free): `pnpm wrangler d1 time-travel restore clm --timestamp=<ISO>` |

## Notes

- **Images in D1:** uploads are resized to ~600px WebP (tens of KB each) and stored as
  rows in `media_files`; the D1 free plan includes 5 GB. Each row is limited to 2 MB.
- **No page cache:** pages render from D1 on each request (no R2/KV cache), so admin
  edits appear immediately.
- **D1 transactions:** D1 has no interactive transactions; Prisma `$transaction([...])`
  runs the queries one after another. The few places that use it only reorder images.
- **Search** is case-insensitive for English letters (SQLite `LIKE`).
- **PDF spec sheets** are generated in the visitor's browser (the PDF library can't run
  on Workers); `/products/<slug>/spec-sheet` returns the data as JSON.
- **Email** is sent over SMTP from the Worker (`worker-mailer`). Port 465 (TLS) is the
  most reliable. Without SMTP, invites show a copyable link.
