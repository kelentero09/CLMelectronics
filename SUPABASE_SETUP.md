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

## 7. Email branding (make invites say CLM, not Supabase Auth)

New admin invites and password resets send email via Supabase Auth. By default the envelope is
`Supabase Auth <noreply@mail.supabase.io>` and the body says “Supabase”. Make it CLM-branded:

**A. Set Site URL & redirects** — Authentication → URL Configuration:

- `Site URL` = your production URL (e.g. `https://clm.yourdomain.com`) — for local dev `http://localhost:3000`
- `Additional Redirect URLs` = `http://localhost:3000/auth/callback, https://clm.yourdomain.com/auth/callback, https://clm.yourdomain.com/auth/update-password`
- Save.

**B. Brand the templates** — Authentication → Email Templates (or run the script):

Manual (30 seconds):
1. Open `supabase/email-templates/invite.html` in this repo (same for `recovery.html`, `confirm.html`, `magiclink.html`).
2. Dashboard → Authentication → Email Templates → click each template → set **Subject** as noted in the HTML comment at the top of the file → paste the **entire HTML file** into **Message body** → Save.

Automated (requires a Supabase Personal Access Token at https://supabase.com/dashboard/account/tokens):
```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx SUPABASE_PROJECT_REF=wzodnqlugamddmotlrty node scripts/apply-email-templates.mjs
# without a token it prints the manual steps above
```

What this changes:
- Invite: subject `You’ve been invited to CLM Admin — set your password`, body shows CLM navy header, company address/phones, button `Accept Invite & Set Password` linked to `{{ .ConfirmationURL }}`.
- Recovery: subject `Reset your CLM Admin password`, same branding, button `Reset Password`.
- No code change needed — `app/actions/users.ts:inviteUser` and `app/actions/auth.ts:requestPasswordReset` already use `redirectTo = {{SITE_URL}}/auth/callback` so the button lands on CLM.

**C. Sender name / custom SMTP (optional but recommended for production)** — to change the `From:` line from `noreply@mail.supabase.io`:

- Authentication → SMTP Settings → enable **Custom SMTP** (e.g. Resend, SendGrid, AWS SES).
- Set `Sender name: CLM Electronics` and `Sender email: noreply@clm-electronics.com` (must be a verified domain in your SMTP provider).
- Save. Without custom SMTP the body is still fully CLM-branded; only the envelope sender remains `@mail.supabase.io` (Supabase default).

Verify: invite a test user at `/admin/users` → email should arrive with CLM header, navy `#0B1D33` bar, footer `#9 Bayabas St…`, and no mention of “Supabase Auth” in subject/body. Sender name will be `CLM Electronics` once SMTP is set.

## 8. Before launch

- Replace or delete ALL `[SAMPLE]` products with CLM-approved content.
- Set `NEXT_PUBLIC_SITE_URL` to the production URL (required so invite/reset links point to your domain, not localhost).
- Run the §20 forbidden-terms grep (see spec) and confirm zero commerce hits.
