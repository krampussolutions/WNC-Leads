import Nav from "@/components/Nav";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Card } from "@/components/Card";

export const dynamic = "force-dynamic";

function unslug(s: string) {
  return s.replaceAll("-", " ").replace(/\w/g, (m) => m.toUpperCase());
}

// Accepted place formats:
// - city-nc  (ex: robbinsville-nc)
// - graham-county-nc
function parsePlace(place: string) {
  const lower = place.toLowerCase();
  const isCounty = lower.includes("-county-");
  const state = lower.endsWith("-nc") ? "NC" : "NC";
  if (isCounty) {
    const name = lower.replace("-county-nc", "").replaceAll("-", " ");
    return { kind: "county" as const, name: unslug(name), state };
  }
  const name = lower.replace("-nc", "").replaceAll("-", " ");
  return { kind: "city" as const, name: unslug(name), state };
}

export default async function ContractorsPlacePage({ params }: { params: { place: string } }) {
  const p = parsePlace(params.place);
  const supabase = await createSupabaseServer();

  let query = supabase
    .from("listings")
    .select("id,slug,business_name,category,city,county,state,headline,logo_url")
    .eq("is_published", true)
    .eq("account_type", "contractor");

  if (p.kind === "county") query = query.ilike("county", p.name);
  else query = query.ilike("city", p.name);

  const { data: listings } = await query.order("created_at", { ascending: false }).limit(200);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-semibold">
          Contractors in {p.name}, {p.state}
        </h1>
        <p className="mt-2 text-slate-300">
          Browse local contractors. Need a quote? Open a listing and request one.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {(listings ?? []).map((l: any) => (
            <Link key={l.id} href={`/listing/${l.slug}`}>
              <Card>
                <div className="flex gap-4">
                  {l.logo_url ? (
                    <img src={l.logo_url} alt="" className="h-12 w-12 rounded-lg border border-slate-800 object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg border border-slate-800 bg-slate-950" />
                  )}
                  <div className="min-w-0">
                    <div className="text-lg font-semibold text-white">{l.business_name}</div>
                    <div className="mt-1 text-sm text-slate-300">{l.category}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {l.city}, {l.state}{l.county ? ` · ${l.county} County` : ""}
                    </div>
                    {l.headline ? <div className="mt-3 text-sm text-slate-200">{l.headline}</div> : null}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          {(!listings || listings.length === 0) && (
            <Card>
              <p className="text-slate-300">No contractor listings found for this area yet.</p>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
