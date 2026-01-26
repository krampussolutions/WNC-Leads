import Nav from "@/components/Nav";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { revalidatePath } from "next/cache";
import ReviewsSection from "./reviews";

export const dynamic = "force-dynamic";

/**
 * Normalize the incoming slug so URL encoding, whitespace, or casing
 * can't cause a false "not found".
 */
function normalizeSlug(input: string) {
  try {
    return decodeURIComponent(input || "").trim().toLowerCase();
  } catch {
    // If decodeURIComponent fails (malformed encoding), fall back safely.
    return (input || "").trim().toLowerCase();
  }
}

async function submitQuote(formData: FormData) {
  "use server";

  const slugRaw = String(formData.get("slug") || "");
  const slug = normalizeSlug(slugRaw);

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!slug || !name || !email || !message) return;

  const supabase = await createSupabaseServer();

  // Find listing by slug; only allow quote requests to published listings
  const { data: listing, error } = await supabase
    .from("listings")
    .select("id")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("[submitQuote] listing lookup error:", error);
    return;
  }
  if (!listing) return;

  const { error: insertErr } = await supabase.from("quote_requests").insert({
    listing_id: listing.id,
    requester_name: name,
    requester_email: email,
    requester_phone: phone || null,
    message,
  });

  if (insertErr) {
    console.error("[submitQuote] insert error:", insertErr);
    return;
  }

  revalidatePath(`/listing/${slug}`);
}

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = await createSupabaseServer();
  const slug = normalizeSlug(params.slug);

  // Optional debug mode: /listing/krampus-solutions?debug=1
  const debug =
    searchParams?.debug === "1" ||
    (Array.isArray(searchParams?.debug) && searchParams?.debug.includes("1"));

  // Primary listing query
  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  // Dev/server logs are the fastest way to see what's happening
  console.log("[ListingPage] slug param:", params.slug, "=> normalized:", slug);
  if (error) console.error("[ListingPage] listing query error:", error);

  // Sanity query (helps detect wrong env vars / wrong project / RLS)
  // Only run when debug=1 to avoid extra DB reads on every request.
  let sanity: any[] | null = null;
  let sanityErr: any = null;

  if (debug) {
    const s = await supabase
      .from("listings")
      .select("slug, business_name, is_published")
      .limit(5);

    sanity = s.data ?? null;
    sanityErr = s.error ?? null;

    if (sanityErr) console.error("[ListingPage] sanity error:", sanityErr);
    console.log("[ListingPage] sanity sample:", sanity);
  }

  // If Supabase returned an actual error (not "no rows"), show it (debug-safe)
  if (error) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-4xl px-6 py-12">
          <Card>
            <h1 className="text-xl font-semibold">Error loading listing</h1>
            <p className="mt-2 text-slate-300">
              The server hit an error when querying Supabase.
            </p>

            {debug ? (
              <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-200">
                {JSON.stringify(
                  {
                    normalizedSlug: slug,
                    error,
                    sanityErr,
                    sanity,
                  },
                  null,
                  2
                )}
              </pre>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                Add <code>?debug=1</code> to the URL to see diagnostics (admins only).
              </p>
            )}
          </Card>
        </main>
      </>
    );
  }

  // Not found (either unpublished or missing)
  if (!listing) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-4xl px-6 py-12">
          <Card>
            <h1 className="text-xl font-semibold">Listing not found</h1>
            <p className="mt-2 text-slate-300">This listing may be unpublished or removed.</p>

            {debug ? (
              <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-200">
                {JSON.stringify(
                  {
                    normalizedSlug: slug,
                    paramsSlug: params.slug,
                    sanityErr,
                    sanity,
                    hint:
                      "If sanity is empty or errors, your Vercel env vars likely point to the wrong Supabase project or RLS is blocking anon reads.",
                  },
                  null,
                  2
                )}
              </pre>
            ) : null}
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
                  {listing.county ? ` · ${listing.county} County` : ""}
                  {listing.service_area ? ` · ${listing.service_area}` : ""}
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

            {debug ? (
              <pre className="mt-6 whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-200">
                {JSON.stringify(
                  {
                    normalizedSlug: slug,
                    listingSlug: listing.slug,
                    is_published: listing.is_published,
                  },
                  null,
                  2
                )}
              </pre>
            ) : null}
          </Card>

          <Card>
            <h2 className="text-xl font-semibold">Request a quote</h2>
            <p className="mt-1 text-sm text-slate-300">
              Send a message to this business. Your request will appear in their dashboard.
            </p>

            <form action={submitQuote} className="mt-6 grid gap-4">
              <input type="hidden" name="slug" value={listing.slug} />

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
