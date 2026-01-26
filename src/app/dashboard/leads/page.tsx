import Nav from "@/components/Nav";
import { Card } from "@/components/Card";
import { requireActiveUser } from "@/lib/auth";
import LeadsClient from "./ui";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const { supabase, user } = await requireActiveUser();

  // Fetch leads for ALL listings owned by this user
  const { data: leads } = await supabase
    .from("quote_requests")
    .select("id,requester_name,requester_email,requester_phone,message,status,created_at,read_at,listing_id")
    .order("created_at", { ascending: false });

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Card>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="mt-2 text-slate-300">Your incoming quote requests.</p>
        </Card>

        <div className="mt-6">
          <LeadsClient initialLeads={(leads ?? []) as any} userId={user.id} />
        </div>
      </main>
    </>
  );
}
