import Nav from "@/components/Nav";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Card } from "@/components/Card";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createSupabaseServer();
  const { data: listings } = await supabase
    .from("listings")
    .select("id,business_name,is_featured,is_published")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Admin Panel</h1>
        <p className="mt-2 text-slate-300">Feature/unfeature listings.</p>

        <div className="mt-6 grid gap-4">
          {(listings ?? []).map((l) => (
            <Card key={l.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{l.business_name}</div>
                  <div className="text-sm text-slate-400">
                    {l.is_published ? "Published" : "Draft"} · {l.is_featured ? "Featured" : "Not featured"}
                  </div>
                </div>

                <form action="/api/admin/feature" method="post" className="flex items-center gap-2">
                  <input type="hidden" name="listing_id" value={l.id} />
                  <input type="hidden" name="featured" value={(!l.is_featured).toString()} />
                  <button
                    className={
                      l.is_featured
                        ? "rounded-md bg-rose-600 px-3 py-1.5 text-sm text-white hover:bg-rose-500"
                        : "rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500"
                    }
                  >
                    {l.is_featured ? "Unfeature" : "Feature"}
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
