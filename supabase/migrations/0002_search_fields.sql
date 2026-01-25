alter table public.listings
  add column if not exists county text,
  add column if not exists account_type public.account_type;

-- Backfill account_type from profiles where possible
update public.listings l
set account_type = p.account_type
from public.profiles p
where p.id = l.owner_id
  and l.account_type is null;

create index if not exists listings_city_idx on public.listings (city);
create index if not exists listings_county_idx on public.listings (county);
create index if not exists listings_category_idx on public.listings (category);
create index if not exists listings_account_type_idx on public.listings (account_type);
