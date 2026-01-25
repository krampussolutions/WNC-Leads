-- WNC Leads schema (Auth email/password) + listings + quote requests + Stripe subscription state
-- Run in Supabase SQL editor (Project -> SQL -> New query)

-- Extensions
create extension if not exists "pgcrypto";

-- Enum for account type
do $$ begin
  if not exists (select 1 from pg_type where typname = 'account_type') then
    create type public.account_type as enum ('contractor', 'realtor');
  end if;
end $$;

-- Profiles table: 1:1 with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  account_type public.account_type not null default 'contractor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Stripe fields
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text not null default 'inactive',
  current_period_end timestamptz
);

create index if not exists profiles_stripe_customer_idx on public.profiles (stripe_customer_id);
create index if not exists profiles_sub_status_idx on public.profiles (subscription_status);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Create profile on user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, account_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'account_type')::public.account_type, 'contractor')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        account_type = excluded.account_type;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Listings
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  business_name text not null,
  category text not null,
  city text not null,
  state text not null default 'NC',
  service_area text not null,
  headline text,
  description text,
  phone text,
  website text,
  email_public text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_owner_idx on public.listings (owner_id);
create index if not exists listings_published_idx on public.listings (is_published);

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

-- Quote requests
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  requester_name text not null,
  requester_email text not null,
  requester_phone text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists quote_listing_idx on public.quote_requests (listing_id);
create index if not exists quote_created_idx on public.quote_requests (created_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.quote_requests enable row level security;

-- Profiles policies: user can view/update self
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Listings policies:
-- Public can read published listings
drop policy if exists "listings_public_read_published" on public.listings;
create policy "listings_public_read_published"
on public.listings for select
using (is_published = true);

-- Owner can read their own listing (published or not)
drop policy if exists "listings_owner_read" on public.listings;
create policy "listings_owner_read"
on public.listings for select
using (auth.uid() = owner_id);

-- Owner can insert/update/delete their listing
drop policy if exists "listings_owner_insert" on public.listings;
create policy "listings_owner_insert"
on public.listings for insert
with check (auth.uid() = owner_id);

drop policy if exists "listings_owner_update" on public.listings;
create policy "listings_owner_update"
on public.listings for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "listings_owner_delete" on public.listings;
create policy "listings_owner_delete"
on public.listings for delete
using (auth.uid() = owner_id);

-- Quote requests policies:
-- Anyone can insert a quote request (public lead form)
drop policy if exists "quotes_public_insert" on public.quote_requests;
create policy "quotes_public_insert"
on public.quote_requests for insert
with check (true);

-- Owner can read quote requests for their listings
drop policy if exists "quotes_owner_read" on public.quote_requests;
create policy "quotes_owner_read"
on public.quote_requests for select
using (
  exists (
    select 1 from public.listings l
    where l.id = quote_requests.listing_id
      and l.owner_id = auth.uid()
  )
);

-- Owner can update status on quote requests for their listings
drop policy if exists "quotes_owner_update" on public.quote_requests;
create policy "quotes_owner_update"
on public.quote_requests for update
using (
  exists (
    select 1 from public.listings l
    where l.id = quote_requests.listing_id
      and l.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.listings l
    where l.id = quote_requests.listing_id
      and l.owner_id = auth.uid()
  )
);

-- Optional: allow owner to delete quote requests for their listings
drop policy if exists "quotes_owner_delete" on public.quote_requests;
create policy "quotes_owner_delete"
on public.quote_requests for delete
using (
  exists (
    select 1 from public.listings l
    where l.id = quote_requests.listing_id
      and l.owner_id = auth.uid()
  )
);

-- Helpful view: active subscribers (optional)
create or replace view public.active_subscribers as
select id, email, full_name, account_type, subscription_status, current_period_end
from public.profiles
where subscription_status in ('active','trialing');

grant select on public.active_subscribers to anon, authenticated;
