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

## 7. Before launch

- Replace or delete ALL `[SAMPLE]` products with CLM-approved content.
- Set `NEXT_PUBLIC_SITE_URL` to the production URL.
- Run the §20 forbidden-terms grep (see spec) and confirm zero commerce hits.
