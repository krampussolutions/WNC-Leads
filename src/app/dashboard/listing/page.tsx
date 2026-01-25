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
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  const active = profile?.subscription_status === "active" || profile?.subscription_status === "trialing";

  async function saveListing(formData: FormData) {
    "use server";

    const business_name = String(formData.get("business_name") || "");
    const category = String(formData.get("category") || "");
    const city = String(formData.get("city") || "");
    const county = String(formData.get("county") || "");
    const state = String(formData.get("state") || "NC");
    const service_area = String(formData.get("service_area") || "");
    const account_type = String(formData.get("account_type") || "contractor");
    const headline = String(formData.get("headline") || "");
    const description = String(formData.get("description") || "");
    const phone = String(formData.get("phone") || "");
    const website = String(formData.get("website") || "");
    const email_public = String(formData.get("email_public") || "");
    const logo_url = String(formData.get("logo_url") || "");
    const cover_url = String(formData.get("cover_url") || "");
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

    const isActive = p?.subscription_status === "active" || p?.subscription_status === "trialing";
    const slug = slugify(business_name || "business");

    const payload: any = {
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
      is_published: publish && isActive,
    };

    if (publish && !isActive) payload.is_published = false;

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

    revalidatePath("/dashboard");
    revalidatePath("/browse");
    revalidatePath("/");
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
