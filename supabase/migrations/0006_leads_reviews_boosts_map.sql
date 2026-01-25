-- Leads inbox improvements
alter table public.quote_requests
  add column if not exists status text not null default 'new' check (status in ('new','read','archived')),
  add column if not exists read_at timestamptz;

create index if not exists quote_requests_listing_status_idx on public.quote_requests (listing_id, status, created_at desc);

-- Listing geo fields (for map view)
alter table public.listings
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

create index if not exists listings_geo_idx on public.listings (latitude, longitude) where is_published = true;

-- Reviews (auth-only submit; public reads approved)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists reviews_listing_idx on public.reviews (listing_id, created_at desc);

alter table public.reviews enable row level security;

drop policy if exists "Public read approved reviews" on public.reviews;
create policy "Public read approved reviews"
on public.reviews for select
using (is_approved = true);

drop policy if exists "Users can create reviews" on public.reviews;
create policy "Users can create reviews"
on public.reviews for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can read own pending reviews" on public.reviews;
create policy "Users can read own pending reviews"
on public.reviews for select
to authenticated
using (user_id = auth.uid());

