-- CLM catalog storage setup (run once via `prisma db execute --file`).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read" on storage.objects;
create policy "Public read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "Service role full access" on storage.objects;
create policy "Service role full access" on storage.objects
  for all using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');
