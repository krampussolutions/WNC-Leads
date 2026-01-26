import Nav from "@/components/Nav";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { revalidatePath } from "next/cache";
import ReviewsSection from "./reviews";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

async function submitQuote(formData: FormData) {
  "use server";

  const listingKey = String(formData.get("listingKey") || "").trim(); // slug or id
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!listingKey || !name || !email || !message) return;

  const supabase = await createSupabaseServer();

  const base = supabase.from("listings").select("id, slug").limit(1);

  const { data: listing, error } = isUuid(listingKey)
    ? await base.eq("id", listingKey).eq("is_published", true).maybeSingle()
    : await base.eq("slug", listingKey).eq("is_published", true).maybeSingle();

  if (error) {
    console.error("submitQuote listing lookup error:", error);
    return;
  }
  if (!listing) return;

  const { error: insertError } = await supabase.from("quote_requests").insert({
    listing_id: listing.id,
    requester_name: name,
    requester_email: email,
    requester_phone: phone || null,
    message,
  });

  if (insertError) {
    console.error("submitQuote insert error:", insertError);
    return;
  }

  const canonical = listing.slug ? `/listing/${listing.slug}` : `/listing/${listing.id}`;
  revalidatePath(canonical);
}

export default async function ListingPage({ params }: { params: { slug: string } }) {
  const supabase = await createSupabaseServer();
  const value = decodeURIComponent((params?.slug ?? "")).trim();

  // If slug is empty, you are NOT on /listing/[slug]
  if (!value) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-4xl px-6 py-12">
          <Card>
            <h1 className="text-xl font-semibold">Listing not found</h1>
            <p className="mt-2 text-slate-300">Missing listing slug in URL.</p>
          </Card>
        </main>
      </>
    );
  }

  // Select explicit columns (avoid select("*") while you’re debugging RLS/visibility)
  const selectCols =
    "id,slug,business_name,category,city,county,state,service_area,headline,description,phone,website,email_public,account_type,logo_url,cover_url,is_published";

  const base = supabase.from("listings").select(selectCols).limit(1);

  const publishedRes = isUuid(value)
    ? await base.eq("id", value).eq("is_published", true).maybeSingle()
    : await base.eq("slug", value).eq("is_published", true).maybeSingle();

  const listing = publishedRes.data ?? null;
  const listingError = publishedRes.error ?? null;

  const diagRes =
    !listing
      ? isUuid(value)
        ? await supabase.from("listings").select("id,slug,is_published,business_name").eq("id", value).maybeSingle()
        : await supabase.from("listings").select("id,slug,is_published,business_name").eq("slug", value).maybeSingle()
      : null;

  if (!listing) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-4xl px-6 py-12">
          <Card>
            <h1 className="text-xl font-semibold">Listing not found</h1>
            <p className="mt-2 text-slate-300">This listing may be unpublished or removed.</p>

            {/* DEBUG PANEL */}
            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200">
              <div className="font-semibold text-slate-100">Debug</div>

              <div className="mt-2">
                <div>
                  <span className="text-slate-400">param:</span> {params?.slug ?? "(missing)"}
                </div>
                <div>
                  <span className="text-slate-400">decoded:</span> {value || "(empty)"}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-slate-400">Published query error:</div>
                <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(listingError, null, 2)}</pre>
              </div>

              <div className="mt-4">
                <div className="text-slate-400">Row exists (without is_published filter):</div>
                <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(diagRes?.data ?? null, null, 2)}</pre>
                <div className="text-slate-400 mt-2">Diag error:</div>
                <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(diagRes?.error ?? null, null, 2)}</pre>
              </div>
            </div>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-col gap-6">
          <Card>
            {listing.cover_url ? (
              <img
                src={listing.cover_url}
                alt=""
                className="mb-6 h-44 w-full rounded-xl border border-slate-800 object-cover"
              />
            ) : null}

            <div className="flex items-start gap-4">
              {listing.logo_url ? (
                <img
                  src={listing.logo_url}
                  alt=""
                  className="h-16 w-16 rounded-xl border border-slate-800 object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl border border-slate-800 bg-slate-950" />
              )}

              <div className="min-w-0">
                <h1 className="text-3xl font-semibold text-white">{listing.business_name}</h1>
                <div className="mt-2 text-slate-300">
                  {listing.category}
                  {listing.account_type ? ` · ${listing.account_type}` : ""}
                </div>
                <div className="mt-2 text-slate-400">
                  {listing.city}, {listing.state}
                  {listing.county ? ` · ${listing.county} County` : ""} · {listing.service_area}
                </div>
              </div>
            </div>

            {listing.headline ? <p className="mt-4 text-slate-200">{listing.headline}</p> : null}
            {listing.description ? (
              <p className="mt-4 whitespace-pre-wrap text-slate-300">{listing.description}</p>
            ) : null}

            <div className="mt-6 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
              {listing.phone ? (
                <div>
                  <span className="text-slate-400">Phone:</span> {listing.phone}
                </div>
              ) : null}
              {listing.website ? (
                <div>
                  <span className="text-slate-400">Website:</span>{" "}
                  <a href={listing.website} target="_blank" rel="noreferrer">
                    {listing.website}
                  </a>
                </div>
              ) : null}
              {listing.email_public ? (
                <div>
                  <span className="text-slate-400">Email:</span> {listing.email_public}
                </div>
              ) : null}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold">Request a quote</h2>
            <p className="mt-1 text-sm text-slate-300">
              Send a message to this business. Your request will appear in their dashboard.
            </p>

            <form action={submitQuote} className="mt-6 grid gap-4">
              <input type="hidden" name="listingKey" value={listing.slug || listing.id} />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-slate-300">Name</label>
                  <input
                    name="name"
                    required
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-300">Phone (optional)</label>
                <input
                  name="phone"
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">Message</label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                />
              </div>

              <div>
                <Button type="submit">Send request</Button>
              </div>
            </form>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold">Reviews</h2>
            <p className="mt-1 text-sm text-slate-300">Reviews are visible after approval.</p>
            <ReviewsSection slug={listing.slug} />
          </Card>
        </div>
      </main>
    </>
  );
}
