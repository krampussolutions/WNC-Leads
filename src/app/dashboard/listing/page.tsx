import Nav from "@/components/Nav";
import { Card } from "@/components/Card";
import { requireUser, getProfile } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import ListingFormClient from "./ListingFormClient";

export const dynamic = "force-dynamic";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export default async function DashboardListingPage() {
  const user = await requireUser();
  const profile = await getProfile();

  const supabase = await createSupabaseServer();

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (listingError) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <Card>
            <h1 className="text-xl font-semibold text-white">Error loading listing</h1>
            <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-300">
              {JSON.stringify(listingError, null, 2)}
            </pre>
          </Card>
        </main>
      </>
    );
  }

  const active =
    profile?.subscription_status === "active" ||
    profile?.subscription_status === "trialing";

  async function saveListing(formData: FormData) {
    "use server";

    const business_name = String(formData.get("business_name") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const city = String(formData.get("city") || "").trim();
    const county = String(formData.get("county") || "").trim();
    const state = String(formData.get("state") || "NC").trim();
    const service_area = String(formData.get("service_area") || "").trim();
    const account_type = String(formData.get("account_type") || "contractor").trim();
    const headline = String(formData.get("headline") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const website = String(formData.get("website") || "").trim();
    const email_public = String(formData.get("email_public") || "").trim();
    const logo_url = String(formData.get("logo_url") || "").trim();
    const cover_url = String(formData.get("cover_url") || "").trim();
    const publish = String(formData.get("publish") || "") === "on";

    const supabase = await createSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect("/login");

    const owner_id = auth.user.id;

    const { data: p } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", owner_id)
      .maybeSingle();

    const isActive =
      p?.subscription_status === "active" ||
      p?.subscription_status === "trialing";

    const newSlug = slugify(business_name || "business");

    const payload: any = {
      owner_id,
      slug: newSlug,
      business_name,
      category,
      city,
      county: county || null,
      state,
      service_area,
      account_type: (account_type || "contractor") as any,
      headline: headline || null,
      description: description || null,
      phone: phone || null,
      website: website || null,
      email_public: email_public || null,
      logo_url: logo_url || null,
      cover_url: cover_url || null,
      is_published: publish && isActive,
    };

    // If they checked publish but are not active, force unpublished
    if (publish && !isActive) payload.is_published = false;

    // If slug changed, revalidate the old public path too
    const oldSlug = (listing?.slug ?? "").trim();

    const { data: existing } = await supabase
      .from("listings")
      .select("id")
      .eq("owner_id", owner_id)
      .maybeSingle();

    if (existing?.id) {
      await supabase.from("listings").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("listings").insert(payload);
    }

    // Revalidate pages that show listings
    revalidatePath("/dashboard/listing");
    revalidatePath("/browse");
    revalidatePath("/");
    revalidatePath(`/listing/${newSlug}`);
    if (oldSlug && oldSlug !== newSlug) revalidatePath(`/listing/${oldSlug}`);

    // Stay on editor (so it doesn't look like it "disappeared")
    redirect("/dashboard/listing");
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Card>
          <h1 className="text-3xl font-semibold text-white">My listing</h1>
          <p className="mt-2 text-slate-300">
            Create your business page. Publishing requires an active subscription.
          </p>
        </Card>

        <div className="mt-6">
          <ListingFormClient action={saveListing} listing={listing} active={!!active} />
        </div>
      </main>
    </>
  );
}
