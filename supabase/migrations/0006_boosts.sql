create table if not exists public.boosts (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade,
  boost_type text not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table public.listings
  add column if not exists boost_until timestamptz;

create policy "Owner can read boosts"
on public.boosts for select
using (
  listing_id in (select id from public.listings where owner_id = auth.uid())
);
