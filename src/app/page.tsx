import Link from "next/link";
import Nav from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createSupabaseServer();
  const { data: featured } = await supabase
    .from("listings")
    .select("id,slug,business_name,category,city,state,headline,logo_url,account_type")
    .eq("is_published", true)
    .eq("is_featured", true)
    .limit(6);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Find trusted Contractors and Realtors in Western North Carolina
          </h1>
          <p className="mt-4 text-slate-300">
            Browse listings for free. Business owners can subscribe for $10/month to publish a listing and receive quote requests.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/browse"><Button>Browse listings</Button></Link>
            <Link href="/pricing"><Button variant="secondary">List your business</Button></Link>
          </div>
        </div>

        {featured && featured.length > 0 ? (
          <div className="mt-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Featured</h2>
                <p className="mt-2 text-slate-300">Highlighted businesses in Western North Carolina.</p>
              </div>
              <Link href="/browse" className="text-sm">See all →</Link>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {featured.map((l: any) => (
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
                        <div className="mt-1 text-sm text-slate-300">{l.category}{l.account_type ? ` · ${l.account_type}` : ""}</div>
                        <div className="mt-1 text-sm text-slate-400">{l.city}, {l.state}</div>
                        {l.headline ? <div className="mt-3 text-sm text-slate-200">{l.headline}</div> : null}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <Card>
            <h3 className="text-lg font-semibold">Public Directory</h3>
            <p className="mt-2 text-sm text-slate-300">Anyone can search and view listings and request quotes.</p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold">$10/mo Subscription</h3>
            <p className="mt-2 text-sm text-slate-300">Simple Stripe billing. Contractors and realtors can cancel anytime.</p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold">Lead Inbox</h3>
            <p className="mt-2 text-sm text-slate-300">Quote requests are stored in your dashboard, tied to your listing.</p>
          </Card>
        </div>
      </main>
    </>
  );
}
