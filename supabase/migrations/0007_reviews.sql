create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade,
  reviewer_name text not null,
  rating int check (rating >= 1 and rating <= 5),
  message text,
  created_at timestamptz default now()
);

create policy "Public read reviews"
on public.reviews for select
using (true);

create policy "Public insert reviews"
on public.reviews for insert
with check (true);
