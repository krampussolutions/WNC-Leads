import Nav from "@/components/Nav";
import { createSupabaseServer } from "@/lib/supabase/server";
import MapClient from "./ui";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const supabase = await createSupabaseServer();
  const { data: listings } = await supabase
    .from("listings")
    .select("id,slug,business_name,category,city,state,latitude,longitude,logo_url,account_type")
    .eq("is_published", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(1000);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Map</h1>
        <p className="mt-2 text-slate-300">Listings with map pins (requires latitude/longitude on the listing).</p>
        <div className="mt-8">
          <MapClient listings={listings ?? []} />
        </div>
      </main>
    </>
  );
}
