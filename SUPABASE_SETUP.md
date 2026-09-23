# SUPABASE_SETUP.md — connecting the CLM catalog to its own backend

Do these steps **once**, in order. The catalog uses a **dedicated Supabase project** —
never reuse the SureParts project (separate database, auth users, and storage).

## 1. Create the Supabase project

1. Go to https://supabase.com/dashboard → New project (name it e.g. `clm-catalog`).
2. Save the database password.

## 2. Collect credentials

Project Settings → API + Database:

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publishable key
- `SUPABASE_SECRET_KEY` — secret key (server only, never in the browser)
- `DATABASE_URL` — pooled connection string (port **6543**, add `?pgbouncer=true&connection_limit=1`)
- `DIRECT_URL` — direct connection string (port **5432**)

Copy `catalog/.env.example` to `catalog/.env` and fill in all five values.

## 3. Create the storage bucket

SQL Editor → run:

```sql
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
```

Then make uploads admin-only but reads public (Storage → Policies, or SQL):

```sql
create policy "Public read" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "Service role full access" on storage.objects
  for all using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');
```

(Note: the service-role key bypasses RLS; the policies above govern anon/authenticated access.)

## 4. Run the migration + seed

```bash
cd catalog
pnpm dlx prisma@6.19.3 migrate deploy
pnpm seed
```

Expected: 5 categories, admin user `admin@clm.local`, 6 `[SAMPLE]` products.

## 5. Create the admin Auth account

Authentication → Users → Add user → email `admin@clm.local`, set a strong password
(sign the user in at least once / confirm the email so login works).

The seed created the matching Prisma `users` row with role ADMIN; login links the
two by email.

## 6. Verify

```bash
pnpm build
pnpm start
```

- `/` shows the 6 SAMPLE products with category pills.
- `/admin` (after login) shows counts; add/edit/publish a product; upload an image.
- Submit a test inquiry from a product page → appears in `/admin/inquiries` → mark COMPLETED.

## 7. Email — Node mailer (bypasses Supabase rate limits, 100% free option)

**Default behavior (no SMTP env, 100% free, zero external service):**
- The app **no longer uses Supabase’s mailer** for invites/resets. Instead `app/actions/users.ts:inviteUser` and `app/actions/auth.ts:requestPasswordReset` call `supabase.auth.admin.generateLink()` (no email) + send via free Node `lib/email.ts` (`nodemailer`).
- If `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` are **not set**, the action still succeeds but shows the **invite/recovery link in the UI to copy** (`components/dashboard/users-manager.tsx:142` amber box, `app/(storefront)/login/page.tsx:118` for resets). You can paste the link to the user via Messenger/email manually. Supabase email quota is never hit → no “rate limit exceeded”.
- The link is `{{SITE_URL}}/auth/callback → /auth/update-password` and is CLM-branded via `supabase/email-templates/*.html` reused inline in `lib/email.ts:buildInviteHtml`.

**Option B — Auto-send via Node (free, same bypass, but automatic):**
Add to `.env` (all free Node deps, no Supabase SMTP needed):
```ini
# Gmail example (free, app password): https://myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="CLM Electronics <you@gmail.com>"
# Or Resend free tier (3k/month):
# SMTP_HOST=smtp.resend.com  SMTP_PORT=587  SMTP_USER=resend  SMTP_PASS=re_xxx
```
Restart `pnpm dev`. Now `lib/email.ts:getTransporter` sends via Nodemailer directly — still bypasses Supabase’s `~3-4/hour` limit; limit is now your provider’s (Gmail 500/day, Resend 100/day free, etc.).

**Legacy Supabase mailer (only if you still want Supabase to send):**
If you prefer Supabase to send, set `USE_SUPABASE_MAILER=true` and the old flow applies, but you will hit rate limits. For Node mailer branding the same HTML is reused inline, so no dashboard template paste is needed. If you *do* use Supabase mailer, brand it:
- A) Set Site URL & redirects: Authentication → URL Configuration: `Site URL` = prod URL, `Additional Redirect URLs` = `http://localhost:3000/auth/callback, https://yourdomain.com/auth/callback`
- B) Authentication → Email Templates → paste `supabase/email-templates/*.html`
- C) Optional Custom SMTP in Supabase dashboard (same SMTP as above but configured there).

Verify: invite at `/admin/users` → if no SMTP, amber box with copy link appears; if SMTP set, `Invite sent via Node mailer — no Supabase rate limit` toast and email arrives from your `SMTP_FROM`.

## 8. Before launch

- Replace or delete ALL `[SAMPLE]` products with CLM-approved content.
- Set `NEXT_PUBLIC_SITE_URL` to the production URL (required so invite/reset links point to your domain, not localhost).
- Run the §20 forbidden-terms grep (see spec) and confirm zero commerce hits.
