import Nav from "@/components/Nav";
import { createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { Card } from "@/components/Card";

export const dynamic = "force-dynamic";

export default async function CityContractorPage({ params }: { params: { slug: string } }) {
  const supabase = await createSupabaseServer();
  const city = params.slug.replace(/-/g, " ");

  const { data: listings } = await supabase
    .from("listings")
    .select("slug,business_name,category")
    .eq("is_published", true)
    .ilike("city", `%${city}%`);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Contractors in {city}</h1>
        <p className="mt-2 text-slate-300">Top local contractors near {city}, NC.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(listings ?? []).map((l: any) => (
            <Link key={l.slug} href={`/listing/${l.slug}`}>
              <Card>
                <div className="text-lg font-semibold">{l.business_name}</div>
                <div className="text-sm text-slate-300">{l.category}</div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
