-- Supabase Storage bucket for listing images

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- Public read for listing images (bucket is public)
drop policy if exists "Public read listing images" on storage.objects;
create policy "Public read listing images"
on storage.objects for select
using (bucket_id = 'listing-images');

-- Authenticated users can upload only into their own folder: {uid}/...
drop policy if exists "Users upload own listing images" on storage.objects;
create policy "Users upload own listing images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete only their own objects
drop policy if exists "Users delete own listing images" on storage.objects;
create policy "Users delete own listing images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
