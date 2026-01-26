import Nav from "@/components/Nav";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { revalidatePath } from "next/cache";
import ReviewsSection from "./reviews";

export const dynamic = "force-dynamic";

/** Normalize slug from URL */
function normalizeSlug(slug: string) {
  try {
    return decodeURIComponent(slug).trim().toLowerCase();
  } catch {
    return (slug || "").trim().toLowerCase();
  }
}

/** Handle quote form submission */
async function submitQuote(formData: FormData) {
  "use server";

  const slug = normalizeSlug(String(formData.get("slug") || ""));
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!slug || !name || !email || !message) return;

  const supabase = await createSupabaseServer();

  const { data: listing } = await supabase
    .from("listings")
    .select("id")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!listing) return;

  await supabase.from("quote_requests").insert({
    listing_id: listing.id,
    requester_name: name,
    requester_email: email,
    requester_phone: phone || null,
    message,
  });

  revalidatePath(`/listing/${slug}`);
}

export default async function ListingPage({ params }: { params: { slug: string } }) {
  const slug = normalizeSlug(params.slug);
  const supabase = await createSupabaseServer();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    return (
      <div style={{ color: "white", padding: 40 }}>
        <h1>Supabase error</h1>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  if (!listing) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-4xl px-6 py-12">
          <Card>
            <h1 className="text-xl font-semibold">Listing not found</h1>
            <p className="mt-2 text-slate-300">Slug: {slug}</p>
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

          {/* Header Card */}
          <Card>
            {listing.cover_url && (
              <img src={listing.cover_url} className="mb-6 h-44 w-full rounded-xl border border-slate-800 object-cover" />
            )}

            <div className="flex items-start gap-4">
              {listing.logo_url ? (
                <img src={listing.logo_url} className="h-16 w-16 rounded-xl border border-slate-800 object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-xl border border-slate-800 bg-slate-900" />
              )}

              <div>
                <h1 className="text-3xl font-semibold">{listing.business_name}</h1>
                <p className="text-slate-300">{listing.category} · {listing.account_type}</p>
                <p className="text-slate-400">
                  {listing.city}, {listing.state} · {listing.county} County
                </p>
              </div>
            </div>

            {listing.headline && <p className="mt-4 text-lg">{listing.headline}</p>}
            {listing.description && <p className="mt-4 text-slate-300 whitespace-pre-wrap">{listing.description}</p>}
          </Card>

          {/* Contact Info */}
          <Card>
            <h2 className="text-xl font-semibold">Contact</h2>
            <div className="mt-4 grid gap-2 text-slate-300">
              {listing.phone && <div>📞 {listing.phone}</div>}
              {listing.website && <div>🌐 <a href={listing.website} target="_blank">{listing.website}</a></div>}
              {listing.email_public && <div>✉️ {listing.email_public}</div>}
            </div>
          </Card>

          {/* Quote Form */}
          <Card>
            <h2 className="text-xl font-semibold">Request a Quote</h2>
            <form action={submitQuote} className="mt-4 grid gap-4">
              <input type="hidden" name="slug" value={listing.slug} />

              <input name="name" placeholder="Your name" required className="border bg-black p-2 rounded" />
              <input name="email" type="email" placeholder="Email" required className="border bg-black p-2 rounded" />
              <input name="phone" placeholder="Phone (optional)" className="border bg-black p-2 rounded" />
              <textarea name="message" rows={5} placeholder="Message" required className="border bg-black p-2 rounded" />

              <Button type="submit">Send request</Button>
            </form>
          </Card>

          {/* Reviews */}
          <Card>
            <h2 className="text-xl font-semibold">Reviews</h2>
            <ReviewsSection slug={listing.slug} />
          </Card>

        </div>
      </main>
    </>
  );
}
