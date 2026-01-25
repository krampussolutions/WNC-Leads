alter table public.listings
  add column if not exists is_featured boolean not null default false;

create index if not exists listings_featured_idx on public.listings (is_featured) where is_published = true;
