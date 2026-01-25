# WNC Leads (Next.js + Supabase + Stripe + Vercel)

Contractor + Realtor directory for Western North Carolina.

## Stack
- Next.js (App Router)
- Tailwind CSS
- Supabase (Auth email+password, Postgres, RLS)
- Stripe (subscriptions + billing portal for cancellation)
- GitHub + Vercel (deploy)

## Important security note
Do **not** commit real secrets (Supabase service role key, Stripe webhook secret, Stripe secret key) to GitHub.
If you pasted secrets into chat, rotate them in Supabase/Stripe now and use new keys.

## Quick start

### 1) Create `.env.local`
Copy `.env.example` to `.env.local` and fill values.

### 2) Install + run
```bash
npm install
npm run dev
```

### 3) Supabase SQL
Run these in Supabase SQL editor **in order**:

- `supabase/migrations/0001_init.sql`
- `supabase/migrations/0002_search_fields.sql`
- `supabase/migrations/0003_storage.sql` (Storage bucket + policies)
- `supabase/migrations/0004_listing_images.sql`
- `supabase/migrations/0005_featured.sql`

### 4) Stripe

- Create a $10/mo recurring Price in Stripe
- Set `STRIPE_PRICE_ID` to that price id
- Set webhook endpoint in Stripe to:
  - `https://YOUR_DOMAIN/api/stripe/webhook` (production)
  - `http://localhost:3000/api/stripe/webhook` (local via Stripe CLI)
- Events to send:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### 5) Contractor flow
- Sign up
- Create listing in `/dashboard/listing`
- Subscribe at `/pricing`
- Manage/cancel via `/account` (Stripe Billing Portal)

### 6) Public flow
- Browse listings at `/browse`
- Open listing and request a quote → stored in DB and visible to owner

## Deploy on Vercel
Add environment variables from `.env.example` in Vercel Project Settings.

## Quote email notifications (optional)
Recommended approach: Supabase **Database Webhook** on `public.quote_requests` INSERT → call:

- URL: `https://YOUR_DOMAIN/api/quotes/notify`
- Header: `x-webhook-secret: <QUOTES_WEBHOOK_SECRET>`

If `RESEND_API_KEY` is set, the endpoint will email the listing owner.

## Admin featured listings

Admin endpoint:
- `POST /api/admin/feature`
- Headers:
  - `x-admin-secret: <ADMIN_SECRET>`
- Body:
```json
{
  "listing_id": "uuid",
  "featured": true
}
```

Admin UI:
- `/admin`
- Uses the same endpoint internally
- Protected by `ADMIN_SECRET` (env var)

This allows you to feature/unfeature listings without touching the database manually.


## Map view
Map pins appear on `/map` only for listings with `latitude` and `longitude` populated.
