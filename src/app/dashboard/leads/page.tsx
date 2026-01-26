"use client";

import Nav from "@/components/Nav";
import { requireUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Card } from "@/components/Card";
import LeadsClient from "./ui";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServer();

  const { data: listing } = await supabase
    .from("listings")
    .select("id,business_name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!listing) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-4xl px-6 py-12">
          <Card>
            <h1 className="text-xl font-semibold">No listing yet</h1>
            <p className="mt-2 text-slate-300">Create your listing first, then your quote requests will appear here.</p>
          </Card>
        </main>
      </>
    );
  }

  const { data: leads } = await supabase
    .from("quote_requests")
    .select("id,requester_name,requester_email,requester_phone,message,status,created_at,read_at")
    .eq("listing_id", listing.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Leads</h1>
        <p className="mt-2 text-slate-300">Incoming quote requests for {listing.business_name}.</p>
        <div className="mt-8">
          <LeadsClient initialLeads={leads ?? []} />
        </div>
      </main>
    </>
  );
}
