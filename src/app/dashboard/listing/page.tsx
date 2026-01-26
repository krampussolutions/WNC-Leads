// src/app/dashboard/listing/page.tsx
import Nav from "@/components/Nav";
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

export default async function ListingEditorPage() {
  const user = await requireUser();
  const profile = await getProfile();

  const supabase = await createSupabaseServer();

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (listingError) {
    // Optional: if you want to fail hard instead
    console.error("listing fetch error:", listingError);
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

    // checkbox sends "on" when checked
    const publish = String(formData.get("publish") || "") === "on";

    const supabase = await createSupabaseServer();
    const { data: auth, error: authErr } = await supabase.auth.getUser();

    if (authErr) {
      console.error("auth.getUser error:", authErr);
      redirect("/login");
    }
    if (!auth.user) redirect("/login");

    const owner_id = auth.user.id;

    // Double-check subscription on the server (do not trust client)
    const { data: p, error: profErr } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", owner_id)
      .maybeSingle();

    if (profErr) {
      console.error("profile lookup error:", profErr);
    }

    const isActive =
      p?.subscription_status === "active" ||
      p?.subscription_status === "trialing";

    const slug = slugify(business_name || "business");

    // Build payload
    const payload = {
      owner_id,
      slug,
      business_name,
      category,
      city,
      county: county || null,
      state,
      service_area,
      account_type: account_type || "contractor",
      headline,
      description,
      phone: phone || null,
      website: website || null,
      email_public: email_public || null,
      logo_url: logo_url || null,
      cover_url: cover_url || null,
      // Only allow publish if active
      is_published: publish && isActive,
    } as const;

    // Upsert by owner_id (your RLS already enforces owner_id = auth.uid())
    const { data: existing, error: existingErr } = await supabase
      .from("listings")
      .select("id")
      .eq("owner_id", owner_id)
      .maybeSingle();

    if (existingErr) {
      console.error("existing listing lookup error:", existingErr);
    }

    if (existing?.id) {
      const { error: updErr } = await supabase
        .from("listings")
        .update(payload)
        .eq("id", existing.id);

      if (updErr) console.error("listing update error:", updErr);
    } else {
      const { error: insErr } = await supabase
        .from("listings")
        .insert(payload);

      if (insErr) console.error("listing insert error:", insErr);
    }

    // Revalidate the pages that may render listings
    revalidatePath("/dashboard");
    revalidatePath("/browse");
    revalidatePath("/");
    // Also revalidate the public listing path if we have a slug
    revalidatePath(`/listing/${slug}`);

    redirect("/dashboard");
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold">My listing</h1>
        <p className="mt-2 text-slate-300">
          Create your business page. Publishing requires an active subscription.
        </p>

        <ListingFormClient action={saveListing} listing={listing} active={!!active} />
      </main>
    </>
  );
}
